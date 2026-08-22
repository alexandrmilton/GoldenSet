-- Tournaments, per docs/RATING.md §6 and docs/MODULES.md §6.
--
-- Two things live here that must not be confused: tournament matches feed the
-- ordinary rating engine, while ranking points are a separate 52-week rolling
-- table in the ATP mould. Strength and season results are different questions.

create type public.tournament_category as enum
  ('gs_100', 'gs_250', 'gs_500', 'gs_1000', 'gs_finals');

create type public.tournament_format as enum
  ('single_elim', 'round_robin', 'groups_playoff');

create type public.tournament_status as enum
  ('draft', 'open', 'closed', 'running', 'finished', 'cancelled');

create type public.entry_status as enum ('pending', 'confirmed', 'withdrawn', 'rejected');

create table public.tournaments (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  club_id      uuid references public.clubs (id) on delete set null,
  city         text not null,
  category     public.tournament_category not null default 'gs_100',
  format       public.tournament_format not null default 'single_elim',
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  entry_fee    numeric(8, 2),
  currency     text not null default 'UAH',
  max_players  smallint not null default 16,
  level_min    numeric(2, 1),
  level_max    numeric(2, 1),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  status       public.tournament_status not null default 'draft',
  cover_url    text,
  created_at   timestamptz not null default now(),

  constraint dates_ordered check (ends_at >= starts_at),
  constraint field_size check (max_players between 2 and 128)
);

create index tournaments_starts_idx on public.tournaments (starts_at);
create index tournaments_city_idx on public.tournaments (city);

create table public.tourn_entries (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  seed_no       smallint,
  status        public.entry_status not null default 'pending',
  created_at    timestamptz not null default now(),
  primary key (tournament_id, profile_id)
);

create table public.tourn_rounds (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  round_no      smallint not null,
  name          text not null,
  unique (tournament_id, round_no)
);

create table public.tourn_slots (
  id        uuid primary key default gen_random_uuid(),
  round_id  uuid not null references public.tourn_rounds (id) on delete cascade,
  slot_no   smallint not null,
  player_a  uuid references public.profiles (id) on delete set null,
  player_b  uuid references public.profiles (id) on delete set null,
  match_id  uuid references public.matches (id) on delete set null,
  winner_id uuid references public.profiles (id) on delete set null,
  unique (round_id, slot_no)
);

-- Ranking points by category and how far a player got, from docs/RATING.md §6.2.
create table public.tournament_point_table (
  category   public.tournament_category not null,
  round_code text not null,
  points     smallint not null,
  primary key (category, round_code)
);

insert into public.tournament_point_table (category, round_code, points) values
  ('gs_100','winner',100), ('gs_100','final',60), ('gs_100','semi',35),
  ('gs_100','quarter',18), ('gs_100','r16',9), ('gs_100','entry',5),
  ('gs_250','winner',250), ('gs_250','final',150), ('gs_250','semi',90),
  ('gs_250','quarter',45), ('gs_250','r16',22), ('gs_250','entry',10),
  ('gs_500','winner',500), ('gs_500','final',300), ('gs_500','semi',180),
  ('gs_500','quarter',90), ('gs_500','r16',45), ('gs_500','entry',20),
  ('gs_1000','winner',1000), ('gs_1000','final',600), ('gs_1000','semi',360),
  ('gs_1000','quarter',180), ('gs_1000','r16',90), ('gs_1000','entry',40),
  ('gs_finals','winner',1500), ('gs_finals','final',900), ('gs_finals','semi',400),
  ('gs_finals','quarter',300), ('gs_finals','r16',200), ('gs_finals','entry',200);

create table public.tournament_points (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  category      public.tournament_category not null,
  round_code    text not null,
  points        smallint not null,
  awarded_at    timestamptz not null default now(),
  -- Points do not get taken away; they simply stop counting after a year,
  -- exactly as they do on tour.
  expires_at    timestamptz not null,
  unique (profile_id, tournament_id)
);

create index tournament_points_profile_idx on public.tournament_points (profile_id, expires_at);

alter table public.tournaments enable row level security;
alter table public.tourn_entries enable row level security;
alter table public.tourn_rounds enable row level security;
alter table public.tourn_slots enable row level security;
alter table public.tournament_points enable row level security;
alter table public.tournament_point_table enable row level security;

-- Public: a bracket link has to open for someone who never installed the app.
create policy "tournaments are readable by anyone"
  on public.tournaments for select to anon, authenticated
  using (status <> 'draft');

create policy "rounds are readable by anyone"
  on public.tourn_rounds for select to anon, authenticated using (true);

create policy "slots are readable by anyone"
  on public.tourn_slots for select to anon, authenticated using (true);

create policy "entries are readable by anyone signed in"
  on public.tourn_entries for select to authenticated using (true);

create policy "ranking points are readable by anyone signed in"
  on public.tournament_points for select to authenticated using (true);

create policy "the points table is readable by anyone signed in"
  on public.tournament_point_table for select to authenticated using (true);

create policy "an organiser creates tournaments"
  on public.tournaments for insert to authenticated
  with check (
    organizer_id = auth.uid()
    and (public.has_role('organiser') or public.is_admin())
  );

create policy "an organiser edits their own tournament"
  on public.tournaments for update to authenticated
  using (organizer_id = auth.uid() or public.is_admin())
  with check (organizer_id = auth.uid() or public.is_admin());

create policy "a player enters a tournament themselves"
  on public.tourn_entries for insert to authenticated
  with check (profile_id = auth.uid());

create policy "a player withdraws, an organiser decides"
  on public.tourn_entries for update to authenticated
  using (
    profile_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.tournaments t
       where t.id = tourn_entries.tournament_id and t.organizer_id = auth.uid()
    )
  )
  with check (true);

create policy "an organiser builds the bracket"
  on public.tourn_rounds for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.tournaments t
       where t.id = tourn_rounds.tournament_id and t.organizer_id = auth.uid()
    )
  )
  with check (true);

create policy "an organiser fills the slots"
  on public.tourn_slots for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.tourn_rounds r
       join public.tournaments t on t.id = r.tournament_id
      where r.id = tourn_slots.round_id and t.organizer_id = auth.uid()
    )
  )
  with check (true);
