-- Player search, per docs/MODULES.md §2.
--
-- One function rather than a composed client query: the balls filter joins
-- user_equipment, the court filter joins player_courts, and "closest to my
-- level" needs the caller's own level. Expressing that through PostgREST
-- filters from the app would be three round trips and a fragile string.
--
-- SECURITY INVOKER: row level security still applies, and profiles are readable
-- by any signed-in user, which is exactly the visibility this needs.

create or replace function public.search_players(
  p_search    text default null,
  p_city      text default null,
  p_level_min numeric default null,
  p_level_max numeric default null,
  p_age_min   integer default null,
  p_age_max   integer default null,
  p_gender    text default null,
  p_hand      public.playing_hand default null,
  p_statuses  public.rating_status[] default null,
  p_balls_id  uuid default null,
  p_court_id  uuid default null,
  p_weekday   smallint default null,
  p_sort      text default 'level',
  p_limit     integer default 30,
  p_offset    integer default 0
)
returns table (
  id             uuid,
  username       text,
  full_name      text,
  avatar_url     text,
  city           text,
  district       text,
  birth_year     smallint,
  gender         text,
  hand           public.playing_hand,
  points         integer,
  level          numeric,
  rating_status  public.rating_status,
  reliability    smallint,
  matches_played integer,
  last_active_at timestamptz,
  balls_label    text,
  racquet_label  text
)
language sql
stable
set search_path = ''
as $$
  with me as (
    select p.level as my_level from public.profiles p where p.id = auth.uid()
  )
  select p.id, p.username, p.full_name, p.avatar_url, p.city, p.district,
         p.birth_year, p.gender, p.hand,
         p.points, p.level, p.rating_status, p.reliability,
         p.matches_played, p.last_active_at,
         balls.label as balls_label,
         racquet.label as racquet_label
    from public.profiles p
    cross join me
    left join lateral (
      select coalesce(c.brand || ' ' || c.model, e.custom_name) as label
        from public.user_equipment e
        left join public.equipment_catalog c on c.id = e.catalog_id
       where e.profile_id = p.id and e.kind = 'balls'
         and e.is_primary and e.retired_at is null
       limit 1
    ) balls on true
    left join lateral (
      select coalesce(c.brand || ' ' || c.model, e.custom_name) as label
        from public.user_equipment e
        left join public.equipment_catalog c on c.id = e.catalog_id
       where e.profile_id = p.id and e.kind = 'racquet'
         and e.is_primary and e.retired_at is null
       limit 1
    ) racquet on true
   where p.id <> auth.uid()
     and p.seed_at is not null
     and (p_search is null or p.username ilike '%' || p_search || '%'
          or p.full_name ilike '%' || p_search || '%')
     and (p_city is null or p.city = p_city)
     and (p_level_min is null or p.level >= p_level_min)
     and (p_level_max is null or p.level <= p_level_max)
     -- Age from birth year is a year out for anyone with a birthday still to
     -- come, which is close enough for a filter and avoids storing birth dates.
     and (p_age_min is null or p.birth_year is null
          or extract(year from now())::int - p.birth_year >= p_age_min)
     and (p_age_max is null or p.birth_year is null
          or extract(year from now())::int - p.birth_year <= p_age_max)
     and (p_gender is null or p.gender = p_gender)
     and (p_hand is null or p.hand = p_hand)
     and (p_statuses is null or p.rating_status = any(p_statuses))
     and (p_balls_id is null or exists (
           select 1 from public.user_equipment e
            where e.profile_id = p.id and e.kind = 'balls'
              and e.catalog_id = p_balls_id and e.retired_at is null))
     and (p_court_id is null or exists (
           select 1 from public.player_courts pc
            where pc.profile_id = p.id and pc.court_id = p_court_id
              and pc.kind = 'sparring'))
     and (p_weekday is null or exists (
           select 1 from public.player_availability a
            where a.profile_id = p.id and a.weekday = p_weekday))
   order by
     case when p_sort = 'level' then abs(coalesce(p.level, 0) - coalesce(me.my_level, 0)) end asc,
     case when p_sort = 'points' then p.points end desc,
     case when p_sort = 'active' then p.last_active_at end desc,
     p.username asc
   limit least(coalesce(p_limit, 30), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function public.search_players(
  text, text, numeric, numeric, integer, integer, text, public.playing_hand,
  public.rating_status[], uuid, uuid, smallint, text, integer, integer
) from public, anon;

grant execute on function public.search_players(
  text, text, numeric, numeric, integer, integer, text, public.playing_hand,
  public.rating_status[], uuid, uuid, smallint, text, integer, integer
) to authenticated;

-- The cities that actually have players, for the location filter.
create or replace function public.player_cities()
returns table (city text, players bigint)
language sql
stable
set search_path = ''
as $$
  select p.city, count(*)::bigint
    from public.profiles p
   where p.city is not null and p.seed_at is not null
   group by p.city
   order by count(*) desc, p.city;
$$;

revoke execute on function public.player_cities() from public, anon;
grant execute on function public.player_cities() to authenticated;
