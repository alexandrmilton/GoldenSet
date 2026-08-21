-- Courts and player preferences, per docs/MODULES.md §1 and §5.
--
-- Courts start life as a directory: a name, a surface and a phone number. The
-- booking machinery comes much later (Phase 12) and depends on deals with clubs
-- rather than on code, so nothing here assumes it.

create type public.court_surface as enum ('clay', 'hard', 'carpet', 'grass', 'artificial');

create table public.courts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  city          text not null,
  district      text,
  address       text,
  surface       public.court_surface not null default 'hard',
  indoor        boolean not null default false,
  lights        boolean not null default false,
  phone         text,
  price_hint    text,
  latitude      numeric(9, 6),
  longitude     numeric(9, 6),
  is_active     boolean not null default true,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index courts_city_idx on public.courts (city);

alter table public.courts enable row level security;

create policy "courts are readable by anyone signed in"
  on public.courts for select
  to authenticated
  using (true);

-- Any player may add a court that is missing; editing stays with moderators
-- until there is a club account to own it.
create policy "a signed-in user can add a court"
  on public.courts for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Two different things, deliberately not one flag: the court a player likes,
-- and the court they are willing to be challenged at.
create type public.player_court_kind as enum ('favourite', 'sparring');

create table public.player_courts (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  court_id   uuid not null references public.courts (id) on delete cascade,
  kind       public.player_court_kind not null,
  note       text,
  created_at timestamptz not null default now(),
  primary key (profile_id, court_id, kind)
);

create index player_courts_court_idx on public.player_courts (court_id, kind);

alter table public.player_courts enable row level security;

create policy "player courts are readable by anyone signed in"
  on public.player_courts for select
  to authenticated
  using (true);

create policy "a user manages only their own courts"
  on public.player_courts for all
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create table public.player_availability (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  -- 1 = Monday, matching ISO 8601 rather than JavaScript's Sunday-first count.
  weekday    smallint not null check (weekday between 1 and 7),
  time_from  time not null,
  time_to    time not null,
  primary key (profile_id, weekday, time_from),
  constraint window_ordered check (time_to > time_from)
);

alter table public.player_availability enable row level security;

create policy "availability is readable by anyone signed in"
  on public.player_availability for select
  to authenticated
  using (true);

create policy "a user manages only their own availability"
  on public.player_availability for all
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Sorting the player list by "most active" needs something to sort by, and
-- matches_played alone cannot tell a player who stopped a year ago from one who
-- played yesterday.
alter table public.profiles
  add column last_active_at timestamptz not null default now();

create index profiles_last_active_idx on public.profiles (last_active_at desc);
