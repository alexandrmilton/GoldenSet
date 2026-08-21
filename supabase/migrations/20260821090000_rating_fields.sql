-- Rating fields, per docs/RATING.md.
--
-- Replaces the placeholder level columns from the first migration. The old
-- level_value was a self-declared NTRP number; the rating is now a computed
-- GS Points value with the level derived from it, plus the seed fields that
-- keep the starting rating visible forever.

create type public.rating_status as enum
  ('seed', 'provisional', 'established', 'confirmed', 'dormant');

create type public.seed_method as enum
  ('questionnaire', 'anchor', 'external_rating', 'coach');

create type public.external_rating_kind as enum ('ntrp', 'utr', 'wtn');

alter table public.profiles
  add column rating_status public.rating_status not null default 'seed',
  add column level numeric(2, 1),
  add column reliability smallint not null default 0,
  add column seed_points integer,
  add column seed_level numeric(2, 1),
  add column seed_method public.seed_method,
  add column seed_at timestamptz,
  add column district text,
  add column balls_preference text,
  add column external_rating_kind public.external_rating_kind,
  add column external_rating_value numeric(4, 1),
  add column external_verified_at timestamptz;

comment on column public.profiles.seed_points is
  'The rating handed out by the questionnaire. Never changes — the profile shows it next to the current rating so a seeded number can never be mistaken for an earned one.';

comment on column public.profiles.level is
  'Derived band, 1.5-7.0. Cached from points for filtering; points remain the source of truth.';

-- Carry over whatever the placeholder onboarding collected, using the NTRP
-- mapping from docs/RATING.md §3.
update public.profiles
   set seed_points = case
         when level_value >= 5.5 then 2300
         when level_value >= 5.0 then 2100
         when level_value >= 4.5 then 1900
         when level_value >= 4.0 then 1750
         when level_value >= 3.5 then 1600
         when level_value >= 3.0 then 1450
         when level_value >= 2.5 then 1300
         when level_value >= 2.0 then 1150
         else 1050
       end,
       seed_level = level_value,
       seed_method = 'questionnaire',
       seed_at = coalesce(updated_at, now())
 where level_value is not null;

update public.profiles
   set points = seed_points,
       level = seed_level
 where seed_points is not null;

alter table public.profiles
  drop column level_value,
  drop column level_scale,
  drop column level_source;

drop type public.level_scale;
drop type public.level_source;

alter table public.profiles
  add constraint level_in_range check (level is null or level between 1.0 and 7.0),
  add constraint seed_level_in_range check (seed_level is null or seed_level between 1.0 and 7.0),
  add constraint reliability_in_range check (reliability between 0 and 100),
  -- Seeding above 5.0 is impossible by design: that level is only earned.
  add constraint seed_points_capped check (seed_points is null or seed_points <= 2100);

create index profiles_level_idx on public.profiles (level);
create index profiles_city_level_idx on public.profiles (city, level);

-- The answers themselves, not just the total. If the weights ever change we
-- can recompute every seed; with only a score stored, we could not.
create table public.onboarding_answers (
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  step         smallint not null,
  answer_key   text not null,
  answer_value text not null,
  score        smallint not null default 0,
  created_at   timestamptz not null default now(),
  primary key (profile_id, step, answer_key)
);

alter table public.onboarding_answers enable row level security;

create policy "a user reads only their own answers"
  on public.onboarding_answers for select
  to authenticated
  using (auth.uid() = profile_id);

-- Answers are written by the seeding function, never straight from the client:
-- otherwise the score could be posted independently of the rating it produced.

-- The rating columns the client must never move. The seeding function opens a
-- transaction-local gate; PostgREST cannot set a GUC, so a client cannot.
create or replace function public.protect_server_owned_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role'
     and coalesce(current_setting('app.rating_write', true), 'off') <> 'on' then
    new.points := old.points;
    new.matches_played := old.matches_played;
    new.rating_status := old.rating_status;
    new.level := old.level;
    new.reliability := old.reliability;
    new.seed_points := old.seed_points;
    new.seed_level := old.seed_level;
    new.seed_method := old.seed_method;
    new.seed_at := old.seed_at;
    new.external_verified_at := old.external_verified_at;
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_server_owned_columns() from public;
