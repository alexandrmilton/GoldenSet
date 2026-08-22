-- The rating engine, implementing docs/RATING.md §5 and §7.
--
-- It lives in the database rather than in an Edge Function so that there is
-- exactly one implementation: the pre-match forecast and the post-match award
-- call the same functions with the same arguments, and cannot drift apart. A
-- forecast that disagreed with the award would destroy trust in the rating
-- faster than any other bug in this app.

create type public.rating_event_kind as enum ('match', 'tournament', 'recalculation', 'decay');

create table public.rating_events (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  match_id       uuid references public.matches (id) on delete set null,
  kind           public.rating_event_kind not null default 'match',
  points_before  integer not null,
  points_after   integer not null,
  delta          integer not null,
  k_factor       smallint,
  weight         numeric(3, 2),
  expected_share numeric(5, 4),
  actual_share   numeric(5, 4),
  created_at     timestamptz not null default now()
);

create index rating_events_profile_idx on public.rating_events (profile_id, created_at desc);
create index rating_events_match_idx on public.rating_events (match_id);

alter table public.rating_events enable row level security;

-- Public: "why did I gain 24?" has to be answerable, and by the opponent too.
create policy "rating history is readable by anyone signed in"
  on public.rating_events for select to authenticated using (true);

-- docs/RATING.md §5: high K early is what corrects a wrong questionnaire.
create or replace function public.gs_k_factor(p_matches integer, p_points integer)
returns integer language sql immutable set search_path = '' as $$
  select case
    when p_points >= 2200 then 16
    when p_matches < 5    then 64
    when p_matches < 15   then 40
    when p_matches < 40   then 28
    else 20
  end;
$$;

-- docs/RATING.md §5. p_repeats counts earlier meetings in the last 30 days:
-- the fourth and beyond barely move anything, so two friends cannot farm.
create or replace function public.gs_match_weight(
  p_kind public.game_kind,
  p_source public.match_source,
  p_repeats integer
)
returns numeric language sql immutable set search_path = '' as $$
  select case
    when p_kind = 'friendly' then 0
    when p_repeats >= 3 then 0.4
    when p_source = 'tournament' then 1.25
    else 1.0
  end::numeric;
$$;

create or replace function public.gs_delta(
  p_points_self integer,
  p_points_opp  integer,
  p_share       numeric,
  p_k           integer,
  p_weight      numeric
)
returns integer language sql immutable set search_path = '' as $$
  select greatest(-60, least(60, round(
    p_k * p_weight * (p_share - (1 / (1 + power(10, (p_points_opp - p_points_self) / 400.0))))
  )::integer));
$$;

create or replace function public.gs_expected_share(p_points_self integer, p_points_opp integer)
returns numeric language sql immutable set search_path = '' as $$
  select round((1 / (1 + power(10, (p_points_opp - p_points_self) / 400.0)))::numeric, 4);
$$;

-- How many times these two have already met recently.
create or replace function public.gs_repeat_count(p_a uuid, p_b uuid, p_before timestamptz)
returns integer language sql stable set search_path = '' as $$
  select count(*)::integer
    from public.matches m
    join public.match_players pa on pa.match_id = m.id and pa.profile_id = p_a
    join public.match_players pb on pb.match_id = m.id and pb.profile_id = p_b
   where m.status = 'confirmed'
     and m.kind = 'rated'
     and m.played_at < p_before
     and m.played_at > p_before - interval '30 days';
$$;

-- docs/RATING.md §7: twelve fresh full-weight matches is 100%, older ones decay
-- with a six-month half-life.
create or replace function public.gs_reliability(p_profile uuid)
returns smallint language sql stable set search_path = '' as $$
  select least(100, round(100 * coalesce(sum(
           e.weight * power(0.5, extract(epoch from (now() - m.played_at)) / (86400 * 182.5))
         ), 0) / 12))::smallint
    from public.rating_events e
    join public.matches m on m.id = e.match_id
   where e.profile_id = p_profile
     and e.kind = 'match'
     and m.played_at > now() - interval '12 months';
$$;

/**
 * Awards the rating for a confirmed match. Idempotent: a match that already has
 * rated_at set is left alone, so a repeated trigger cannot pay out twice.
 */
create or replace function public.apply_match_rating(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  m         public.matches;
  a_id      uuid;
  b_id      uuid;
  games_a   integer;
  games_b   integer;
  share_a   numeric;
  pts_a     integer;
  pts_b     integer;
  played_a  integer;
  played_b  integer;
  k_a       integer;
  k_b       integer;
  repeats   integer;
  w         numeric;
  d_a       integer;
  d_b       integer;
begin
  select * into m from public.matches where id = p_match_id for update;
  if m is null or m.status <> 'confirmed' or m.rated_at is not null then
    return;
  end if;

  select profile_id into a_id from public.match_players where match_id = p_match_id and side = 'a';
  select profile_id into b_id from public.match_players where match_id = p_match_id and side = 'b';

  select coalesce(sum(s.games_a), 0), coalesce(sum(s.games_b), 0)
    into games_a, games_b
    from public.match_sets s where s.match_id = p_match_id;

  if games_a + games_b = 0 then
    return;
  end if;

  select points, matches_played into pts_a, played_a from public.profiles where id = a_id;
  select points, matches_played into pts_b, played_b from public.profiles where id = b_id;

  repeats := public.gs_repeat_count(a_id, b_id, m.played_at);
  w := public.gs_match_weight(m.kind, m.source, repeats);
  share_a := games_a::numeric / (games_a + games_b);
  k_a := public.gs_k_factor(played_a, pts_a);
  k_b := public.gs_k_factor(played_b, pts_b);
  d_a := public.gs_delta(pts_a, pts_b, share_a, k_a, w);
  d_b := public.gs_delta(pts_b, pts_a, 1 - share_a, k_b, w);

  insert into public.rating_events
    (profile_id, match_id, kind, points_before, points_after, delta, k_factor, weight,
     expected_share, actual_share)
  values
    (a_id, p_match_id, 'match', pts_a, pts_a + d_a, d_a, k_a, w,
     public.gs_expected_share(pts_a, pts_b), round(share_a, 4)),
    (b_id, p_match_id, 'match', pts_b, pts_b + d_b, d_b, k_b, w,
     public.gs_expected_share(pts_b, pts_a), round(1 - share_a, 4));

  perform set_config('app.rating_write', 'on', true);

  update public.profiles p
     set points = p.points + case when p.id = a_id then d_a else d_b end,
         level = public.points_to_level(p.points + case when p.id = a_id then d_a else d_b end),
         matches_played = p.matches_played + case when m.kind = 'rated' then 1 else 0 end,
         last_active_at = greatest(p.last_active_at, m.played_at)
   where p.id in (a_id, b_id);

  -- Reliability and status depend on the events just written, so they come
  -- second rather than in the same statement.
  update public.profiles p
     set reliability = public.gs_reliability(p.id),
         rating_status = case
           when p.rating_status in ('established', 'confirmed') then p.rating_status
           when p.matches_played >= 5 and public.gs_reliability(p.id) >= 50 then 'established'
           when p.matches_played >= 1 then 'provisional'
           else p.rating_status
         end
   where p.id in (a_id, b_id);

  perform set_config('app.rating_write', 'off', true);

  update public.matches set rated_at = now() where id = p_match_id;
end;
$$;

revoke execute on function public.apply_match_rating(uuid) from public, anon, authenticated;

/**
 * Confirming a result. A match becomes confirmed once every player has said so,
 * and the rating is awarded in the same transaction.
 */
create or replace function public.settle_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  total     integer;
  agreed    integer;
  disputed  integer;
begin
  select count(*) into total from public.match_players where match_id = p_match_id;
  select count(*) filter (where decision = 'confirmed'),
         count(*) filter (where decision = 'disputed')
    into agreed, disputed
    from public.match_confirms where match_id = p_match_id;

  if disputed > 0 then
    update public.matches set status = 'disputed' where id = p_match_id and status = 'pending';
    return;
  end if;

  if agreed >= total then
    update public.matches set status = 'confirmed' where id = p_match_id and status = 'pending';
    perform public.apply_match_rating(p_match_id);
  end if;
end;
$$;

revoke execute on function public.settle_match(uuid) from public, anon, authenticated;

create or replace function public.on_match_confirm()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.settle_match(new.match_id);
  return new;
end;
$$;

create trigger match_confirms_settle
  after insert or update on public.match_confirms
  for each row execute function public.on_match_confirm();

revoke execute on function public.on_match_confirm() from public, anon, authenticated;
