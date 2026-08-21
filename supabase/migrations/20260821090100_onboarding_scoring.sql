-- The seeding questionnaire, per docs/RATING.md §3.
--
-- Scores live in the database, not in the app: if the client sent its own
-- scores, anyone could post a perfect 100 and seed themselves at the cap.
-- The app sends only which option was chosen.
--
-- Labels are not here either — they belong to src/i18n/locales/*.json, because
-- the app has to show them in two languages. The database owns keys and weights.

create table public.onboarding_options (
  step         smallint not null,
  answer_key   text not null,
  answer_value text not null,
  score        smallint not null,
  sort_order   smallint not null default 0,
  primary key (step, answer_key, answer_value)
);

alter table public.onboarding_options enable row level security;

create policy "the questionnaire is readable by anyone signed in"
  on public.onboarding_options for select
  to authenticated
  using (true);

insert into public.onboarding_options (step, answer_key, answer_value, score, sort_order) values
  -- 1. Years playing (0-20)
  (1, 'years', 'never',      0, 1),
  (1, 'years', 'under_1',    4, 2),
  (1, 'years', '1_3',        9, 3),
  (1, 'years', '3_7',       14, 4),
  (1, 'years', 'over_7',    20, 5),
  -- 2. How often now (0-15)
  (2, 'frequency', 'rarely',      0, 1),
  (2, 'frequency', 'monthly',     5, 2),
  (2, 'frequency', 'weekly',     10, 3),
  (2, 'frequency', 'often',      15, 4),
  -- 3. Coaching (0-20)
  (3, 'coaching', 'none',         0, 1),
  (3, 'coaching', 'few_lessons',  5, 2),
  (3, 'coaching', 'regular',     12, 3),
  (3, 'coaching', 'academy',     20, 4),
  -- 4. Competitive experience (0-25) — the heaviest block
  (4, 'competition', 'none',       0, 1),
  (4, 'competition', 'friends',    6, 2),
  (4, 'competition', 'league',    14, 3),
  (4, 'competition', 'tournaments',20, 4),
  (4, 'competition', 'podium',    25, 5),
  -- 5. Technique, four questions of 0-5 — deliberately the lightest block
  (5, 'serve',     'weak',    0, 1),
  (5, 'serve',     'basic',   2, 2),
  (5, 'serve',     'solid',   4, 3),
  (5, 'serve',     'strong',  5, 4),
  (5, 'baseline',  'weak',    0, 1),
  (5, 'baseline',  'basic',   2, 2),
  (5, 'baseline',  'solid',   4, 3),
  (5, 'baseline',  'strong',  5, 4),
  (5, 'direction', 'weak',    0, 1),
  (5, 'direction', 'basic',   2, 2),
  (5, 'direction', 'solid',   4, 3),
  (5, 'direction', 'strong',  5, 4),
  (5, 'volley',    'weak',    0, 1),
  (5, 'volley',    'basic',   2, 2),
  (5, 'volley',    'solid',   4, 3),
  (5, 'volley',    'strong',  5, 4);

-- GS Points -> GS Level, docs/RATING.md §4.
create or replace function public.points_to_level(p integer)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when p is null    then null
    when p < 1150     then 1.5
    when p < 1300     then 2.0
    when p < 1450     then 2.5
    when p < 1600     then 3.0
    when p < 1750     then 3.5
    when p < 1900     then 4.0
    when p < 2100     then 4.5
    when p < 2300     then 5.0
    when p < 2500     then 5.5
    when p < 2700     then 6.0
    when p < 2900     then 6.5
    else 7.0
  end::numeric;
$$;

-- Turns a completed questionnaire into a starting rating. The only path that
-- may write the rating columns from a signed-in session, and it works once.
create or replace function public.apply_onboarding(
  answers        jsonb,                 -- [{"step":1,"key":"years","value":"3_7"}, ...]
  anchor_id      uuid default null,
  anchor_outcome text default null      -- 'i_win' | 'even' | 'they_win'
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

  -- Score from the server-side table, ignoring anything the client claims.
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

  -- An anchor to a real, already-measured player beats any self-assessment.
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

  -- Seeding is capped: 4.0 on the questionnaire alone, 5.0 with an anchor.
  -- One player seeded at 6.0 would distort everyone he then plays.
  -- 1899, not 1900: the 4.5 band opens at 1900, so 1900 would already be one
  -- band above the documented questionnaire cap of 4.0.
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

revoke execute on function public.points_to_level(integer) from public;
grant execute on function public.points_to_level(integer) to authenticated;
