-- The duty that keeps a high rating confirmed, per docs/RATING.md §6.3.
--
-- Missing it costs the tick and nothing else: no points are taken, the player
-- stays in the rating table and in search, and nothing in the app is withheld.
-- The tick asserts "this level was tested in a tournament this year", and its
-- absence is a missing assertion rather than a punishment.

create or replace function public.tournament_duty(p_profile uuid)
returns table (
  required   integer,
  played     integer,
  fulfilled  boolean,
  reductions integer
)
language sql
stable
set search_path = ''
as $$
  with me as (
    select level, birth_year, matches_played from public.profiles where id = p_profile
  ),
  base as (
    select case
             when me.level is null then 0
             when me.level < 4.0 then 0
             when me.level < 5.0 then 2
             when me.level < 6.0 then 3
             else 4
           end as required,
           -- Modelled on the ATP reductions for age and service.
           least(2,
             (case when me.birth_year is not null
                    and extract(year from now())::int - me.birth_year >= 45
                   then 1 else 0 end)
             + (case when me.matches_played >= 200 then 1 else 0 end)
           ) as cut
      from me
  ),
  counted as (
    select count(*)::integer as played
      from public.tournament_points tp
     where tp.profile_id = p_profile
       and tp.awarded_at > now() - interval '12 months'
  )
  select case when base.required = 0 then 0
              else greatest(1, base.required - base.cut) end,
         counted.played,
         case when base.required = 0 then true
              else counted.played >= greatest(1, base.required - base.cut) end,
         case when base.required = 0 then 0 else base.cut end
    from base, counted;
$$;

revoke execute on function public.tournament_duty(uuid) from public, anon;
grant execute on function public.tournament_duty(uuid) to authenticated;

/**
 * Moves a player between established and confirmed as their duty is met or
 * lapses. Never touches points — only the assertion attached to them.
 */
create or replace function public.refresh_rating_status(p_profile uuid)
returns public.rating_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Not `current`/`next`: plpgsql reads `return next` as RETURN NEXT and
  -- refuses it in a scalar function.
  current_status public.rating_status;
  new_status     public.rating_status;
  duty           record;
begin
  select rating_status into current_status from public.profiles where id = p_profile;
  if current_status not in ('established', 'confirmed') then
    return current_status;
  end if;

  select * into duty from public.tournament_duty(p_profile);

  -- Below 4.0 there is no duty, so there is nothing for a tick to assert and
  -- the player simply stays established.
  if duty.required = 0 then
    new_status := 'established';
  elsif duty.fulfilled then
    new_status := 'confirmed';
  else
    new_status := 'established';
  end if;

  if new_status <> current_status then
    perform set_config('app.rating_write', 'on', true);
    update public.profiles set rating_status = new_status where id = p_profile;
    perform set_config('app.rating_write', 'off', true);
  end if;

  return new_status;
end;
$$;

revoke execute on function public.refresh_rating_status(uuid) from public, anon, authenticated;

/** For the nightly job: everyone whose duty may have lapsed. */
create or replace function public.refresh_all_rating_statuses()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  touched integer := 0;
  target  uuid;
begin
  for target in
    select id from public.profiles where rating_status in ('established', 'confirmed')
  loop
    perform public.refresh_rating_status(target);
    touched := touched + 1;
  end loop;
  return touched;
end;
$$;

revoke execute on function public.refresh_all_rating_statuses() from public, anon, authenticated;

/** Live ranking points: only what has not expired. */
create or replace function public.ranking_points(p_profile uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(points), 0)::integer
    from public.tournament_points
   where profile_id = p_profile and expires_at > now();
$$;

revoke execute on function public.ranking_points(uuid) from public, anon;
grant execute on function public.ranking_points(uuid) to authenticated;
