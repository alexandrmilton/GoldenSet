-- Off-by-one in the seeding cap.
--
-- docs/RATING.md caps a questionnaire-only seed at level 4.0, but 1900 is where
-- the 4.5 band opens, so the cap was landing one band too high. A player who
-- answered everything at maximum was being seeded at 4.5.
--
-- Only the one line changes; the rest of apply_onboarding is unchanged.

create or replace function public.apply_onboarding(
  answers        jsonb,
  anchor_id      uuid default null,
  anchor_outcome text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid          uuid := auth.uid();
  already      timestamptz;
  total        integer;
  base_points  integer;
  seed         integer;
  method       public.seed_method := 'questionnaire';
  anchor_pts   integer;
  adjust       integer;
  result       public.profiles;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select seed_at into already from public.profiles where id = uid;
  if already is not null then
    raise exception 'onboarding already completed' using errcode = '23505';
  end if;

  insert into public.onboarding_answers (profile_id, step, answer_key, answer_value, score)
  select uid,
         (a->>'step')::smallint,
         a->>'key',
         a->>'value',
         coalesce(o.score, 0)
    from jsonb_array_elements(answers) as a
    left join public.onboarding_options o
      on o.step = (a->>'step')::smallint
     and o.answer_key = a->>'key'
     and o.answer_value = a->>'value'
  on conflict (profile_id, step, answer_key) do update
     set answer_value = excluded.answer_value,
         score = excluded.score;

  select coalesce(sum(score), 0) into total
    from public.onboarding_answers where profile_id = uid;

  base_points := 1000 + total * 9;

  if anchor_id is not null then
    select points into anchor_pts
      from public.profiles
     where id = anchor_id
       and rating_status in ('established', 'confirmed');

    if anchor_pts is not null then
      adjust := case anchor_outcome
                  when 'i_win'    then 120
                  when 'they_win' then -120
                  else 0
                end;
      seed := round(0.65 * (anchor_pts + adjust) + 0.35 * base_points);
      method := 'anchor';
    end if;
  end if;

  seed := coalesce(seed, base_points);
  seed := least(seed, case when method = 'anchor' then 2100 else 1899 end);
  seed := greatest(seed, 1000);

  perform set_config('app.rating_write', 'on', true);

  update public.profiles
     set points        = seed,
         level         = public.points_to_level(seed),
         seed_points   = seed,
         seed_level    = public.points_to_level(seed),
         seed_method   = method,
         seed_at       = now(),
         rating_status = 'seed'
   where id = uid
  returning * into result;

  perform set_config('app.rating_write', 'off', true);

  return result;
end;
$$;

revoke execute on function public.apply_onboarding(jsonb, uuid, text) from public;
grant execute on function public.apply_onboarding(jsonb, uuid, text) to authenticated;
