-- Sparring, per docs/MODULES.md §3.
--
-- Two layers, deliberately separate:
--   games   the arrangement — who challenged whom, where, when, on what terms
--   matches the result that the rating is computed from
--
-- A tournament match has no challenge behind it, and a challenge can be
-- declined without ever becoming a match. Folding them into one table would
-- make both cases awkward.

create type public.game_kind as enum ('rated', 'friendly');

create type public.game_format as enum ('best_of_3', 'pro_set_9', 'single_set', 'best_of_5');

create type public.balls_mode as enum ('mine', 'yours', 'agreed', 'catalog');

create type public.game_status as enum (
  'invited', 'accepted', 'declined', 'cancelled', 'expired', 'played'
);

create type public.match_source as enum ('casual', 'league', 'tournament');

create type public.match_status as enum ('pending', 'confirmed', 'disputed', 'void');

create table public.matches (
  id             uuid primary key default gen_random_uuid(),
  source         public.match_source not null default 'casual',
  kind           public.game_kind not null default 'rated',
  format         public.game_format not null default 'best_of_3',
  court_id       uuid references public.courts (id) on delete set null,
  played_at      timestamptz not null default now(),
  status         public.match_status not null default 'pending',
  reported_by    uuid not null references public.profiles (id) on delete cascade,
  winner_id      uuid references public.profiles (id) on delete set null,
  rated_at       timestamptz,
  created_at     timestamptz not null default now()
);

create index matches_played_at_idx on public.matches (played_at desc);

create table public.match_players (
  match_id   uuid not null references public.matches (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  side       char(1) not null check (side in ('a', 'b')),
  is_winner  boolean,
  primary key (match_id, profile_id)
);

create index match_players_profile_idx on public.match_players (profile_id);

create table public.match_sets (
  match_id uuid not null references public.matches (id) on delete cascade,
  set_no   smallint not null check (set_no between 1 and 5),
  games_a  smallint not null check (games_a between 0 and 20),
  games_b  smallint not null check (games_b between 0 and 20),
  tb_a     smallint,
  tb_b     smallint,
  primary key (match_id, set_no)
);

create type public.confirm_decision as enum ('confirmed', 'disputed');

create table public.match_confirms (
  match_id   uuid not null references public.matches (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  decision   public.confirm_decision not null,
  note       text,
  created_at timestamptz not null default now(),
  primary key (match_id, profile_id)
);

create table public.games (
  id               uuid primary key default gen_random_uuid(),
  kind             public.game_kind not null default 'rated',
  format           public.game_format not null default 'best_of_3',
  court_id         uuid references public.courts (id) on delete set null,
  court_note       text,
  starts_at        timestamptz not null,
  duration_min     smallint not null default 90,
  balls_mode       public.balls_mode not null default 'agreed',
  balls_catalog_id uuid references public.equipment_catalog (id) on delete set null,
  message          text,
  created_by       uuid not null references public.profiles (id) on delete cascade,
  opponent_id      uuid not null references public.profiles (id) on delete cascade,
  status           public.game_status not null default 'invited',
  -- Frozen at the moment of the challenge: both players were shown these
  -- numbers, and ratings may move before they play. Showing different ones
  -- afterwards would undermine the whole idea.
  forecast         jsonb,
  match_id         uuid references public.matches (id) on delete set null,
  created_at       timestamptz not null default now(),
  responded_at     timestamptz,

  constraint not_yourself check (created_by <> opponent_id),
  constraint sane_duration check (duration_min between 30 and 300)
);

create index games_opponent_idx on public.games (opponent_id, status);
create index games_creator_idx on public.games (created_by, status);
create index games_starts_at_idx on public.games (starts_at);

alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.match_sets enable row level security;
alter table public.match_confirms enable row level security;
alter table public.games enable row level security;

-- Results are public: the rating table is meaningless if the matches behind it
-- cannot be seen. Only participants may write.
create policy "matches are readable by anyone signed in"
  on public.matches for select to authenticated using (true);

create policy "match players are readable by anyone signed in"
  on public.match_players for select to authenticated using (true);

create policy "match sets are readable by anyone signed in"
  on public.match_sets for select to authenticated using (true);

create policy "confirmations are readable by anyone signed in"
  on public.match_confirms for select to authenticated using (true);

create policy "a participant confirms their own match"
  on public.match_confirms for insert to authenticated
  with check (
    auth.uid() = profile_id
    and exists (
      select 1 from public.match_players mp
       where mp.match_id = match_confirms.match_id and mp.profile_id = auth.uid()
    )
  );

create policy "a participant may change their own decision"
  on public.match_confirms for update to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Games are visible to the two players involved, and to nobody else: a
-- challenge is a private arrangement until it becomes a result.
create policy "games are readable by their two players"
  on public.games for select to authenticated
  using (auth.uid() = created_by or auth.uid() = opponent_id);

create policy "a user creates their own challenges"
  on public.games for insert to authenticated
  with check (auth.uid() = created_by);

create policy "both players may move a game along"
  on public.games for update to authenticated
  using (auth.uid() = created_by or auth.uid() = opponent_id)
  with check (auth.uid() = created_by or auth.uid() = opponent_id);
