-- Profiles: one row per authenticated user.
--
-- Two independent scales live here (see docs/PLAN.md §5):
--   level_value  the player's standard of play (NTRP or UTR) — self-declared,
--                later confirmed by a coach or organiser
--   points       the league rating, Elo-based, written by the server only
--
-- Row Level Security is on from this first migration, per docs/PLAN.md §8.

create extension if not exists citext;

create type public.level_scale as enum ('ntrp', 'utr');
create type public.level_source as enum ('self', 'verified');
create type public.playing_hand as enum ('right', 'left');

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  username        citext not null unique,
  full_name       text,
  avatar_url      text,
  city            text,
  region          text,
  level_scale     public.level_scale not null default 'ntrp',
  level_value     numeric(3, 1),
  level_source    public.level_source not null default 'self',
  points          integer not null default 1200,
  matches_played  integer not null default 0,
  hand            public.playing_hand,
  gender          text,
  birth_year      smallint,
  bio             text,
  is_coach        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint username_shape check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint bio_length check (bio is null or char_length(bio) <= 300),
  constraint full_name_length check (full_name is null or char_length(full_name) <= 80),
  constraint birth_year_sane check (birth_year is null or birth_year between 1920 and 2020),
  constraint gender_known check (gender is null or gender in ('female', 'male', 'other')),
  constraint points_non_negative check (points >= 0),
  constraint matches_played_non_negative check (matches_played >= 0),
  -- NTRP runs 1.0–7.0 in half steps; UTR runs 1.0–16.5.
  constraint level_in_range check (
    level_value is null
    or (level_scale = 'ntrp' and level_value between 1.0 and 7.0)
    or (level_scale = 'utr' and level_value between 1.0 and 16.5)
  )
);

comment on column public.profiles.points is
  'League rating. Written only by the rating Edge Function — client updates to this column are silently ignored.';

create index profiles_points_idx on public.profiles (points desc);
create index profiles_city_idx on public.profiles (city);

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Server-owned columns. Reverting them is friendlier than raising: a client
-- that sends a whole profile object back still succeeds, it just cannot move
-- its own rating.
create or replace function public.protect_server_owned_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.points := old.points;
    new.matches_played := old.matches_played;
    new.level_source := old.level_source;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_server_owned
  before update on public.profiles
  for each row execute function public.protect_server_owned_columns();

-- Every new auth user gets a profile immediately, so the app never has to deal
-- with a signed-in user that has no row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'player_' || replace(substr(new.id::text, 1, 8), '-', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

-- The rating list and player search are the point of the app, so any signed-in
-- user may read any profile. Nothing sensitive lives in this table.
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "a user can insert only their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "a user can update only their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
