-- The two calls the app makes: what a game is worth, and what it turned out to be.

/**
 * The pre-match forecast, docs/MODULES.md §3.
 *
 * Typical game shares stand in for the real ones, and everything else — K, the
 * weight, the clamp — is the same code that awards the rating afterwards. That
 * is the point: a forecast computed some other way would eventually disagree
 * with reality, and the number shown before the match is a promise.
 */
create or replace function public.forecast_game(
  p_opponent uuid,
  p_kind public.game_kind default 'rated'
)
returns table (scenario text, share numeric, delta_self integer, delta_opponent integer)
language sql
stable
set search_path = ''
as $$
  with me as (
    select points, matches_played from public.profiles where id = auth.uid()
  ),
  them as (
    select points, matches_played from public.profiles where id = p_opponent
  ),
  factors as (
    select me.points as my_points, them.points as their_points,
           public.gs_k_factor(me.matches_played, me.points) as my_k,
           public.gs_k_factor(them.matches_played, them.points) as their_k,
           public.gs_match_weight(
             p_kind, 'casual',
             public.gs_repeat_count(auth.uid(), p_opponent, now())
           ) as w
      from me, them
  ),
  scenarios(scenario, share) as (
    values ('win_2_0', 0.72), ('win_2_1', 0.58), ('lose_1_2', 0.42), ('lose_0_2', 0.28)
  )
  select s.scenario,
         s.share::numeric,
         public.gs_delta(f.my_points, f.their_points, s.share::numeric, f.my_k, f.w),
         public.gs_delta(f.their_points, f.my_points, (1 - s.share)::numeric, f.their_k, f.w)
    from scenarios s, factors f;
$$;

revoke execute on function public.forecast_game(uuid, public.game_kind) from public, anon;
grant execute on function public.forecast_game(uuid, public.game_kind) to authenticated;

/**
 * Reports a result. The reporter's own confirmation is recorded at the same
 * time — you do not need to confirm a score you just typed in — which leaves
 * the match waiting on the opponent alone.
 *
 * p_sets: [{"a": 6, "b": 4}, {"a": 3, "b": 6}, {"a": 7, "b": 5}]
 */
create or replace function public.report_match(
  p_opponent  uuid,
  p_sets      jsonb,
  p_kind      public.game_kind default 'rated',
  p_format    public.game_format default 'best_of_3',
  p_court_id  uuid default null,
  p_played_at timestamptz default now(),
  p_game_id   uuid default null
)
returns public.matches
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid      uuid := auth.uid();
  m        public.matches;
  sets_a   integer := 0;
  sets_b   integer := 0;
  s        jsonb;
  i        integer := 0;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if p_opponent = uid then
    raise exception 'cannot play yourself' using errcode = '22023';
  end if;
  if jsonb_array_length(p_sets) < 1 then
    raise exception 'a match needs at least one set' using errcode = '22023';
  end if;

  insert into public.matches (source, kind, format, court_id, played_at, reported_by)
  values ('casual', p_kind, p_format, p_court_id, p_played_at, uid)
  returning * into m;

  insert into public.match_players (match_id, profile_id, side)
  values (m.id, uid, 'a'), (m.id, p_opponent, 'b');

  for s in select * from jsonb_array_elements(p_sets) loop
    i := i + 1;
    insert into public.match_sets (match_id, set_no, games_a, games_b, tb_a, tb_b)
    values (m.id, i, (s->>'a')::smallint, (s->>'b')::smallint,
            (s->>'tb_a')::smallint, (s->>'tb_b')::smallint);
    if (s->>'a')::int > (s->>'b')::int then sets_a := sets_a + 1;
    elsif (s->>'b')::int > (s->>'a')::int then sets_b := sets_b + 1;
    end if;
  end loop;

  update public.matches
     set winner_id = case when sets_a > sets_b then uid
                          when sets_b > sets_a then p_opponent end
   where id = m.id
  returning * into m;

  update public.match_players
     set is_winner = (profile_id = m.winner_id)
   where match_id = m.id and m.winner_id is not null;

  if p_game_id is not null then
    update public.games
       set match_id = m.id, status = 'played'
     where id = p_game_id and (created_by = uid or opponent_id = uid);
  end if;

  insert into public.match_confirms (match_id, profile_id, decision)
  values (m.id, uid, 'confirmed');

  return m;
end;
$$;

revoke execute on function public.report_match(
  uuid, jsonb, public.game_kind, public.game_format, uuid, timestamptz, uuid
) from public, anon;
grant execute on function public.report_match(
  uuid, jsonb, public.game_kind, public.game_format, uuid, timestamptz, uuid
) to authenticated;

/**
 * docs/RATING.md §5: after 72 hours with no answer the result stands.
 *
 * Without this, not opening the app after a loss would freeze the opponent's
 * rating for good. Called on a schedule.
 */
create or replace function public.auto_confirm_stale_matches()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  settled integer := 0;
  target  uuid;
begin
  for target in
    select m.id from public.matches m
     where m.status = 'pending'
       and m.created_at < now() - interval '72 hours'
  loop
    insert into public.match_confirms (match_id, profile_id, decision)
    select target, mp.profile_id, 'confirmed'
      from public.match_players mp
     where mp.match_id = target
       and not exists (
         select 1 from public.match_confirms c
          where c.match_id = target and c.profile_id = mp.profile_id
       );
    settled := settled + 1;
  end loop;
  return settled;
end;
$$;

revoke execute on function public.auto_confirm_stale_matches() from public, anon, authenticated;
