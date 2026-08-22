-- The home feed, per docs/MODULES.md §4.
--
-- Three calls rather than the app assembling this from half a dozen queries:
-- the standing, who moved most recently, and what the community has been
-- playing. All SECURITY INVOKER, so row level security still applies.

/** My standing: where I am, and how the last week went. */
create or replace function public.home_summary()
returns table (
  points        integer,
  level         numeric,
  rating_status public.rating_status,
  reliability   smallint,
  delta_week    integer,
  city_rank     integer,
  city_total    integer
)
language sql
stable
set search_path = ''
as $$
  with me as (
    select p.* from public.profiles p where p.id = auth.uid()
  ),
  week as (
    select coalesce(sum(e.delta), 0)::integer as delta
      from public.rating_events e
     where e.profile_id = auth.uid()
       and e.created_at > now() - interval '7 days'
  ),
  ranked as (
    select p.id,
           rank() over (order by p.points desc)::integer as position,
           count(*) over ()::integer as total
      from public.profiles p, me
     where p.city is not distinct from me.city
       and p.seed_at is not null
  )
  select me.points, me.level, me.rating_status, me.reliability,
         week.delta, ranked.position, ranked.total
    from me, week
    left join ranked on ranked.id = auth.uid();
$$;

revoke execute on function public.home_summary() from public, anon;
grant execute on function public.home_summary() to authenticated;

/**
 * Who gained the most lately.
 *
 * Deliberately not a table of absolute points: that one motivates the ten
 * people already in it, and a 3.0 player looks at it once and never again.
 * Anyone can reach a movers table from any level by winning a few matches in
 * their own range — see docs/MODULES.md §4.
 */
create or replace function public.rating_movers(p_days integer default 7, p_limit integer default 5)
returns table (
  profile_id uuid,
  username   text,
  avatar_url text,
  city       text,
  level      numeric,
  points     integer,
  gained     integer
)
language sql
stable
set search_path = ''
as $$
  select p.id, p.username, p.avatar_url, p.city, p.level, p.points,
         sum(e.delta)::integer as gained
    from public.rating_events e
    join public.profiles p on p.id = e.profile_id
   where e.created_at > now() - make_interval(days => greatest(p_days, 1))
     and e.kind = 'match'
   group by p.id, p.username, p.avatar_url, p.city, p.level, p.points
  having sum(e.delta) > 0
   order by sum(e.delta) desc
   limit least(coalesce(p_limit, 5), 25);
$$;

revoke execute on function public.rating_movers(integer, integer) from public, anon;
grant execute on function public.rating_movers(integer, integer) to authenticated;

/** What the community has been playing, newest first. */
create or replace function public.recent_matches(p_limit integer default 10)
returns table (
  match_id     uuid,
  played_at    timestamptz,
  kind         public.game_kind,
  winner_id    uuid,
  winner_name  text,
  loser_id     uuid,
  loser_name   text,
  score        text,
  winner_delta integer
)
language sql
stable
set search_path = ''
as $$
  select m.id,
         m.played_at,
         m.kind,
         w.id, w.username,
         l.id, l.username,
         (select string_agg(s.games_a || ':' || s.games_b, ' ' order by s.set_no)
            from public.match_sets s where s.match_id = m.id),
         (select e.delta from public.rating_events e
           where e.match_id = m.id and e.profile_id = w.id)
    from public.matches m
    join public.match_players wp on wp.match_id = m.id and wp.is_winner
    join public.profiles w on w.id = wp.profile_id
    join public.match_players lp on lp.match_id = m.id and lp.profile_id <> wp.profile_id
    join public.profiles l on l.id = lp.profile_id
   where m.status = 'confirmed'
   order by m.played_at desc
   limit least(coalesce(p_limit, 10), 50);
$$;

revoke execute on function public.recent_matches(integer) from public, anon;
grant execute on function public.recent_matches(integer) to authenticated;
