-- Statistics, per docs/MODULES.md §9.
--
-- The module that gives a reason to open the app between games, and the only
-- place the equipment catalogue pays off: which racquet a match was played with
-- is what turns "I own a Blade" into "I win 62% with the Blade".

create table public.match_equipment (
  match_id     uuid not null references public.matches (id) on delete cascade,
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  equipment_id uuid not null references public.user_equipment (id) on delete cascade,
  primary key (match_id, profile_id)
);

alter table public.match_equipment enable row level security;

create policy "match equipment is readable by anyone signed in"
  on public.match_equipment for select to authenticated using (true);

create policy "a user records only their own racquet"
  on public.match_equipment for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

/** Headline numbers for a profile. */
create or replace function public.player_stats(p_profile uuid)
returns table (
  matches          integer,
  wins             integer,
  losses           integer,
  win_pct          integer,
  rated_matches    integer,
  friendly_matches integer,
  current_streak   integer,
  best_win_name    text,
  best_win_points  integer
)
language sql
stable
set search_path = ''
as $$
  with played as (
    select m.id, m.played_at, m.kind, mp.is_winner,
           opp.profile_id as opponent_id
      from public.matches m
      join public.match_players mp on mp.match_id = m.id and mp.profile_id = p_profile
      join public.match_players opp on opp.match_id = m.id and opp.profile_id <> p_profile
     where m.status = 'confirmed'
  ),
  streak as (
    -- Consecutive wins counted back from the most recent match: the run stops
    -- at the first loss, so a single defeat resets it.
    select count(*)::integer as value
      from (
        select is_winner,
               sum(case when is_winner then 0 else 1 end)
                 over (order by played_at desc rows between unbounded preceding and current row) as losses_so_far
          from played
      ) t
     where is_winner and losses_so_far = 0
  ),
  best as (
    select p.username, p.points
      from played
      join public.profiles p on p.id = played.opponent_id
     where played.is_winner
     order by p.points desc
     limit 1
  )
  select count(*)::integer,
         count(*) filter (where is_winner)::integer,
         count(*) filter (where not is_winner)::integer,
         case when count(*) = 0 then 0
              else round(100.0 * count(*) filter (where is_winner) / count(*))::integer end,
         count(*) filter (where kind = 'rated')::integer,
         count(*) filter (where kind = 'friendly')::integer,
         (select value from streak),
         (select username from best),
         (select points from best)
    from played;
$$;

revoke execute on function public.player_stats(uuid) from public, anon;
grant execute on function public.player_stats(uuid) to authenticated;

/** The rating over time, with the seeded value as the first point. */
create or replace function public.rating_series(p_profile uuid)
returns table (at timestamptz, points integer, is_seed boolean)
language sql
stable
set search_path = ''
as $$
  select p.seed_at, p.seed_points, true
    from public.profiles p
   where p.id = p_profile and p.seed_at is not null and p.seed_points is not null
  union all
  select e.created_at, e.points_after, false
    from public.rating_events e
   where e.profile_id = p_profile
   order by 1;
$$;

revoke execute on function public.rating_series(uuid) from public, anon;
grant execute on function public.rating_series(uuid) to authenticated;

/** Match history with everything needed to show a row. */
create or replace function public.match_history(p_profile uuid, p_limit integer default 30)
returns table (
  match_id      uuid,
  played_at     timestamptz,
  kind          public.game_kind,
  won           boolean,
  opponent_id   uuid,
  opponent_name text,
  score         text,
  delta         integer,
  racquet_label text,
  court_name    text,
  surface       public.court_surface
)
language sql
stable
set search_path = ''
as $$
  select m.id, m.played_at, m.kind, mp.is_winner,
         opp.profile_id, p.username,
         (select string_agg(s.games_a || ':' || s.games_b, ' ' order by s.set_no)
            from public.match_sets s where s.match_id = m.id),
         (select e.delta from public.rating_events e
           where e.match_id = m.id and e.profile_id = p_profile),
         (select coalesce(c.brand || ' ' || c.model, ue.custom_name)
            from public.match_equipment me
            join public.user_equipment ue on ue.id = me.equipment_id
            left join public.equipment_catalog c on c.id = ue.catalog_id
           where me.match_id = m.id and me.profile_id = p_profile),
         co.name, co.surface
    from public.matches m
    join public.match_players mp on mp.match_id = m.id and mp.profile_id = p_profile
    join public.match_players opp on opp.match_id = m.id and opp.profile_id <> p_profile
    join public.profiles p on p.id = opp.profile_id
    left join public.courts co on co.id = m.court_id
   where m.status = 'confirmed'
   order by m.played_at desc
   limit least(coalesce(p_limit, 30), 100);
$$;

revoke execute on function public.match_history(uuid, integer) from public, anon;
grant execute on function public.match_history(uuid, integer) to authenticated;

/** Head to head against one opponent. */
create or replace function public.head_to_head(p_profile uuid, p_opponent uuid)
returns table (played integer, won integer, lost integer)
language sql
stable
set search_path = ''
as $$
  select count(*)::integer,
         count(*) filter (where mp.is_winner)::integer,
         count(*) filter (where not mp.is_winner)::integer
    from public.matches m
    join public.match_players mp on mp.match_id = m.id and mp.profile_id = p_profile
    join public.match_players opp on opp.match_id = m.id and opp.profile_id = p_opponent
   where m.status = 'confirmed';
$$;

revoke execute on function public.head_to_head(uuid, uuid) from public, anon;
grant execute on function public.head_to_head(uuid, uuid) to authenticated;

/**
 * Per racquet. This is the thing no other tennis app has, and it only works
 * because the racquet came from a catalogue rather than a text field.
 */
create or replace function public.racquet_stats(p_profile uuid)
returns table (
  equipment_id uuid,
  label        text,
  matches      integer,
  wins         integer,
  win_pct      integer,
  avg_delta    numeric
)
language sql
stable
set search_path = ''
as $$
  select ue.id,
         coalesce(c.brand || ' ' || c.model, ue.custom_name),
         count(*)::integer,
         count(*) filter (where mp.is_winner)::integer,
         case when count(*) = 0 then 0
              else round(100.0 * count(*) filter (where mp.is_winner) / count(*))::integer end,
         round(avg(coalesce(e.delta, 0)), 1)
    from public.match_equipment me
    join public.user_equipment ue on ue.id = me.equipment_id
    left join public.equipment_catalog c on c.id = ue.catalog_id
    join public.matches m on m.id = me.match_id and m.status = 'confirmed'
    join public.match_players mp on mp.match_id = m.id and mp.profile_id = me.profile_id
    left join public.rating_events e on e.match_id = m.id and e.profile_id = me.profile_id
   where me.profile_id = p_profile
   group by ue.id, c.brand, c.model, ue.custom_name
   order by count(*) desc;
$$;

revoke execute on function public.racquet_stats(uuid) from public, anon;
grant execute on function public.racquet_stats(uuid) to authenticated;
