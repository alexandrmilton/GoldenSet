-- Bracket, results and ranking points.
--
-- Every local variable here is prefixed v_ on purpose. plpgsql resolves a bare
-- name to the column first and raises "column reference is ambiguous" the
-- moment a variable matches one — which is what round_id, slot_no, player_a and
-- player_b all did while this was being written.

/** Moves decided slots up the bracket. Safe to run repeatedly. */
create or replace function public.propagate_bracket(p_tournament uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row     record;
  v_round   uuid;
  v_slot    integer;
  v_changed integer;
  v_guard   integer := 0;
begin
  -- Two passes per sweep, and the sweep repeats while anything moves.
  --
  -- Placing a winner and deciding a bye in the same pass is wrong: the first
  -- feeder writes its player into the slot above, that slot then looks like one
  -- player with no opponent, and it gets called a bye before the second feeder
  -- arrives. That handed a semi-final to whoever was processed first. A bye is
  -- only decided once every feeding slot below is settled.
  loop
    v_guard := v_guard + 1;
    exit when v_guard > 10;
    v_changed := 0;

    for v_row in
      select sl.slot_no, sl.winner_id, r.round_no
        from public.tourn_slots sl
        join public.tourn_rounds r on r.id = sl.round_id
       where r.tournament_id = p_tournament and sl.winner_id is not null
       order by r.round_no, sl.slot_no
    loop
      select id into v_round from public.tourn_rounds
       where tournament_id = p_tournament and round_no = v_row.round_no + 1;
      continue when v_round is null;

      v_slot := ((v_row.slot_no - 1) / 2) + 1;

      if v_row.slot_no % 2 = 1 then
        update public.tourn_slots sl set player_a = v_row.winner_id
         where sl.round_id = v_round and sl.slot_no = v_slot
           and sl.player_a is distinct from v_row.winner_id;
      else
        update public.tourn_slots sl set player_b = v_row.winner_id
         where sl.round_id = v_round and sl.slot_no = v_slot
           and sl.player_b is distinct from v_row.winner_id;
      end if;

      if found then
        v_changed := v_changed + 1;
      end if;
    end loop;

    update public.tourn_slots sl
       set winner_id = coalesce(sl.player_a, sl.player_b)
      from public.tourn_rounds r
     where r.id = sl.round_id
       and r.tournament_id = p_tournament
       and sl.winner_id is null
       and (sl.player_a is null) <> (sl.player_b is null)
       and not exists (
         select 1
           from public.tourn_slots feeder
           join public.tourn_rounds fr on fr.id = feeder.round_id
          where fr.tournament_id = p_tournament
            and fr.round_no = r.round_no - 1
            and ((feeder.slot_no - 1) / 2) + 1 = sl.slot_no
            and feeder.winner_id is null
       );

    if found then
      v_changed := v_changed + 1;
    end if;

    exit when v_changed = 0;
  end loop;
end;
$$;

revoke execute on function public.propagate_bracket(uuid) from public, anon;
grant execute on function public.propagate_bracket(uuid) to authenticated;

/**
 * Builds a single-elimination bracket, seeded by GS Points at the moment of the
 * draw. A field that is not a power of two gets byes, resolved immediately
 * rather than left as empty matches nobody knows how to play.
 */
create or replace function public.generate_bracket(p_tournament uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_t        public.tournaments;
  v_entrants integer;
  v_size     integer := 2;
  v_rounds   integer;
  v_r        integer;
  v_round    uuid;
  v_slot     integer;
  v_first    uuid;
  v_order    integer[];
  v_next     integer[];
  v_seed     integer;
  v_pick_a   uuid;
  v_pick_b   uuid;
begin
  select * into v_t from public.tournaments where id = p_tournament;
  if v_t is null then
    raise exception 'no such tournament' using errcode = '42704';
  end if;
  if not (public.is_admin() or v_t.organizer_id = auth.uid()) then
    raise exception 'not the organiser' using errcode = '42501';
  end if;

  with ordered as (
    select e.profile_id,
           row_number() over (order by p.points desc, p.username) as n
      from public.tourn_entries e
      join public.profiles p on p.id = e.profile_id
     where e.tournament_id = p_tournament and e.status = 'confirmed'
  )
  update public.tourn_entries e
     set seed_no = ordered.n
    from ordered
   where e.tournament_id = p_tournament and e.profile_id = ordered.profile_id;

  select count(*) into v_entrants
    from public.tourn_entries
   where tournament_id = p_tournament and status = 'confirmed';

  if v_entrants < 2 then
    raise exception 'need at least two confirmed entries' using errcode = '22023';
  end if;

  while v_size < v_entrants loop
    v_size := v_size * 2;
  end loop;
  v_rounds := log(2, v_size)::integer;

  delete from public.tourn_rounds where tournament_id = p_tournament;

  for v_r in 1..v_rounds loop
    insert into public.tourn_rounds (tournament_id, round_no, name)
    values (
      p_tournament, v_r,
      case v_size / power(2, v_r)::integer
        when 1 then 'final'
        when 2 then 'semi'
        when 4 then 'quarter'
        when 8 then 'r16'
        when 16 then 'r32'
        else 'r' || (v_size / power(2, v_r - 1)::integer)::text
      end
    )
    returning id into v_round;

    if v_r = 1 then
      v_first := v_round;
    end if;

    for v_slot in 1..(v_size / power(2, v_r)::integer) loop
      insert into public.tourn_slots (round_id, slot_no) values (v_round, v_slot);
    end loop;
  end loop;

  -- Standard bracket order, built by repeatedly mirroring:
  -- 1,2 -> 1,4,2,3 -> 1,8,4,5,2,7,3,6.
  --
  -- Pairing seed 1 with seed N is not enough on its own: the pairs also have to
  -- be laid out so the top two seeds sit in opposite halves. Filling the slots
  -- in plain order put seeds 1 and 2 in the same semi-final.
  v_order := array[1];
  while array_length(v_order, 1) < v_size loop
    v_next := array[]::integer[];
    for v_seed in 1..array_length(v_order, 1) loop
      v_next := v_next
        || v_order[v_seed]
        || (array_length(v_order, 1) * 2 + 1 - v_order[v_seed]);
    end loop;
    v_order := v_next;
  end loop;

  for v_slot in 1..(v_size / 2) loop
    select profile_id into v_pick_a from public.tourn_entries
     where tournament_id = p_tournament and seed_no = v_order[v_slot * 2 - 1];
    select profile_id into v_pick_b from public.tourn_entries
     where tournament_id = p_tournament and seed_no = v_order[v_slot * 2];

    update public.tourn_slots sl
       set player_a = v_pick_a,
           player_b = v_pick_b,
           winner_id = case when v_pick_b is null then v_pick_a
                            when v_pick_a is null then v_pick_b end
     where sl.round_id = v_first and sl.slot_no = v_slot;
  end loop;

  update public.tournaments set status = 'running' where id = p_tournament;

  perform public.propagate_bracket(p_tournament);

  return v_size;
end;
$$;

revoke execute on function public.generate_bracket(uuid) from public, anon;
grant execute on function public.generate_bracket(uuid) to authenticated;

/**
 * The organiser enters a tournament result.
 *
 * Both sides are recorded as confirmed straight away: in a tournament the
 * organiser is the authority on the score, and waiting for two players to
 * confirm what the umpire already wrote down would stall the draw.
 */
create or replace function public.report_tournament_match(p_slot uuid, p_sets jsonb)
returns public.matches
language plpgsql
security definer
set search_path = ''
as $$
declare
  sl      public.tourn_slots;
  tour    public.tournaments;
  m       public.matches;
  sets_a  integer := 0;
  sets_b  integer := 0;
  s       jsonb;
  i       integer := 0;
begin
  select * into sl from public.tourn_slots where id = p_slot;
  select tt.* into tour
    from public.tournaments tt
    join public.tourn_rounds r on r.tournament_id = tt.id
   where r.id = sl.round_id;

  if not (public.is_admin() or tour.organizer_id = auth.uid()) then
    raise exception 'not the organiser' using errcode = '42501';
  end if;
  if sl.player_a is null or sl.player_b is null then
    raise exception 'the slot has no pairing yet' using errcode = '22023';
  end if;

  insert into public.matches (source, kind, format, played_at, reported_by, status)
  values ('tournament', 'rated', 'best_of_3', now(), auth.uid(), 'pending')
  returning * into m;

  insert into public.match_players (match_id, profile_id, side)
  values (m.id, sl.player_a, 'a'), (m.id, sl.player_b, 'b');

  for s in select * from jsonb_array_elements(p_sets) loop
    i := i + 1;
    insert into public.match_sets (match_id, set_no, games_a, games_b)
    values (m.id, i, (s->>'a')::smallint, (s->>'b')::smallint);
    if (s->>'a')::int > (s->>'b')::int then sets_a := sets_a + 1;
    elsif (s->>'b')::int > (s->>'a')::int then sets_b := sets_b + 1;
    end if;
  end loop;

  update public.matches
     set winner_id = case when sets_a > sets_b then sl.player_a else sl.player_b end,
         status = 'confirmed'
   where id = m.id
  returning * into m;

  update public.match_players set is_winner = (profile_id = m.winner_id)
   where match_id = m.id;

  insert into public.match_confirms (match_id, profile_id, decision)
  values (m.id, sl.player_a, 'confirmed'), (m.id, sl.player_b, 'confirmed')
  on conflict do nothing;

  perform public.apply_match_rating(m.id);

  update public.tourn_slots
     set match_id = m.id, winner_id = m.winner_id
   where id = p_slot;

  perform public.propagate_bracket(tour.id);

  return m;
end;
$$;

revoke execute on function public.report_tournament_match(uuid, jsonb) from public, anon;
grant execute on function public.report_tournament_match(uuid, jsonb) to authenticated;

/** How far each entrant got, as a code the points table understands. */
create or replace function public.tournament_results(p_tournament uuid)
returns table (profile_id uuid, round_code text)
language sql
stable
set search_path = ''
as $$
  with slots as (
    select r.round_no, r.name, sl.player_a, sl.player_b, sl.winner_id,
           max(r.round_no) over () as last_round
      from public.tourn_slots sl
      join public.tourn_rounds r on r.id = sl.round_id
     where r.tournament_id = p_tournament
  ),
  appearances as (
    select player_a as profile_id, round_no, name, last_round,
           (winner_id = player_a) as won
      from slots where player_a is not null
    union all
    select player_b, round_no, name, last_round, (winner_id = player_b)
      from slots where player_b is not null
  ),
  best as (
    select profile_id,
           max(round_no) as deepest,
           bool_or(won and round_no = last_round) as champion
      from appearances
     group by profile_id
  )
  select b.profile_id,
         case when b.champion then 'winner'
              else coalesce((select a.name from appearances a
                              where a.profile_id = b.profile_id and a.round_no = b.deepest
                              limit 1), 'entry')
         end
    from best b;
$$;

revoke execute on function public.tournament_results(uuid) from public, anon;
grant execute on function public.tournament_results(uuid) to authenticated;

/** Closes a tournament and awards the ranking points. */
create or replace function public.finish_tournament(p_tournament uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  t       public.tournaments;
  awarded integer;
  target  uuid;
begin
  select * into t from public.tournaments where id = p_tournament;
  if not (public.is_admin() or t.organizer_id = auth.uid()) then
    raise exception 'not the organiser' using errcode = '42501';
  end if;

  insert into public.tournament_points
    (profile_id, tournament_id, category, round_code, points, expires_at)
  select res.profile_id, p_tournament, t.category, res.round_code,
         coalesce(pt.points, 0),
         -- 52 weeks from the end of the event, as on tour.
         t.ends_at + interval '52 weeks'
    from public.tournament_results(p_tournament) res
    left join public.tournament_point_table pt
      on pt.category = t.category and pt.round_code = res.round_code
  on conflict (profile_id, tournament_id) do update
     set round_code = excluded.round_code,
         points = excluded.points,
         expires_at = excluded.expires_at;

  get diagnostics awarded = row_count;

  update public.tournaments set status = 'finished' where id = p_tournament;

  -- Playing this may have satisfied someone's duty.
  for target in select res.profile_id from public.tournament_results(p_tournament) res loop
    perform public.refresh_rating_status(target);
  end loop;

  return awarded;
end;
$$;

revoke execute on function public.finish_tournament(uuid) from public, anon;
grant execute on function public.finish_tournament(uuid) to authenticated;
