-- Equipment, per docs/MODULES.md §1 and §9.
--
-- A shared catalogue plus what each player actually owns. The catalogue is what
-- makes racquet statistics possible later ("players at 4.0 mostly play a Blade,
-- average tension 23 kg") — free text alone could never be aggregated.
--
-- But the catalogue must not become a wall: a player whose racquet is not
-- listed enters it by hand, and strings, tension, weight and grip are all
-- optional. Plenty of amateurs genuinely do not know what is strung in their
-- racquet, and refusing to let them past that question loses them at signup.

create type public.equipment_kind as enum ('racquet', 'string', 'balls', 'shoes');

create table public.equipment_catalog (
  id        uuid primary key default gen_random_uuid(),
  kind      public.equipment_kind not null,
  brand     text not null,
  model     text not null,
  year      smallint,
  specs     jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  unique (kind, brand, model)
);

alter table public.equipment_catalog enable row level security;

create policy "the catalogue is readable by anyone signed in"
  on public.equipment_catalog for select
  to authenticated
  using (true);

create table public.user_equipment (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  kind         public.equipment_kind not null,
  catalog_id   uuid references public.equipment_catalog (id),
  custom_name  text,
  is_primary   boolean not null default false,
  string_model text,
  tension_kg   numeric(3, 1),
  weight_g     smallint,
  grip_size    text,
  since        date,
  retired_at   date,
  created_at   timestamptz not null default now(),

  -- Either it is in the catalogue or the player named it themselves.
  constraint identified check (catalog_id is not null or custom_name is not null),
  constraint tension_sane check (tension_kg is null or tension_kg between 8 and 35),
  constraint weight_sane check (weight_g is null or weight_g between 200 and 400)
);

-- One current racquet, one current ball choice, and so on.
create unique index user_equipment_one_primary
  on public.user_equipment (profile_id, kind)
  where is_primary and retired_at is null;

create index user_equipment_profile_idx on public.user_equipment (profile_id);
create index user_equipment_catalog_idx on public.user_equipment (catalog_id);

alter table public.user_equipment enable row level security;

-- Profiles are public, and so is the gear on them: seeing what someone plays
-- with is part of deciding whether to challenge them.
create policy "equipment is readable by anyone signed in"
  on public.user_equipment for select
  to authenticated
  using (true);

create policy "a user manages only their own equipment"
  on public.user_equipment for all
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- balls_preference was added a migration ago and never used: the ball a player
-- prefers now lives here as equipment, and the ball for one game is a property
-- of that game, not of the profile.
alter table public.profiles drop column balls_preference;

insert into public.equipment_catalog (kind, brand, model, specs) values
  ('racquet', 'Wilson',      'Blade 98',          '{"head_size":98}'),
  ('racquet', 'Wilson',      'Pro Staff 97',      '{"head_size":97}'),
  ('racquet', 'Wilson',      'Clash 100',         '{"head_size":100}'),
  ('racquet', 'Wilson',      'Ultra 100',         '{"head_size":100}'),
  ('racquet', 'Wilson',      'Burn 100',          '{"head_size":100}'),
  ('racquet', 'Babolat',     'Pure Aero',         '{"head_size":100}'),
  ('racquet', 'Babolat',     'Pure Drive',        '{"head_size":100}'),
  ('racquet', 'Babolat',     'Pure Strike 98',    '{"head_size":98}'),
  ('racquet', 'Babolat',     'Boost A',           '{"head_size":102}'),
  ('racquet', 'Head',        'Speed MP',          '{"head_size":100}'),
  ('racquet', 'Head',        'Radical MP',        '{"head_size":98}'),
  ('racquet', 'Head',        'Prestige MP',       '{"head_size":98}'),
  ('racquet', 'Head',        'Extreme MP',        '{"head_size":100}'),
  ('racquet', 'Head',        'Boom MP',           '{"head_size":100}'),
  ('racquet', 'Yonex',       'EZONE 98',          '{"head_size":98}'),
  ('racquet', 'Yonex',       'EZONE 100',         '{"head_size":100}'),
  ('racquet', 'Yonex',       'VCORE 98',          '{"head_size":98}'),
  ('racquet', 'Yonex',       'Percept 97',        '{"head_size":97}'),
  ('racquet', 'Tecnifibre',  'TFight 300',        '{"head_size":98}'),
  ('racquet', 'Tecnifibre',  'TFlash 300',        '{"head_size":100}'),
  ('racquet', 'Prince',      'Phantom 100',       '{"head_size":100}'),
  ('racquet', 'Prince',      'Textreme Tour 100', '{"head_size":100}'),
  ('racquet', 'Dunlop',      'FX 500',            '{"head_size":100}'),
  ('racquet', 'Dunlop',      'CX 200',            '{"head_size":98}'),
  ('racquet', 'Solinco',     'Whiteout 98',       '{"head_size":98}'),
  ('racquet', 'Volkl',       'V-Cell 8',          '{"head_size":100}'),
  ('string',  'Luxilon',     'ALU Power',         '{"type":"polyester"}'),
  ('string',  'Babolat',     'RPM Blast',         '{"type":"polyester"}'),
  ('string',  'Solinco',     'Hyper-G',           '{"type":"polyester"}'),
  ('string',  'Head',        'Lynx Tour',         '{"type":"polyester"}'),
  ('string',  'Wilson',      'NXT',               '{"type":"multifilament"}'),
  ('string',  'Technifibre', 'X-One Biphase',     '{"type":"multifilament"}'),
  ('string',  'Babolat',     'Synthetic Gun',     '{"type":"synthetic"}'),
  ('balls',   'Wilson',      'US Open',           '{}'),
  ('balls',   'Wilson',      'Roland Garros',     '{}'),
  ('balls',   'Head',        'Tour',              '{}'),
  ('balls',   'Head',        'Championship',      '{}'),
  ('balls',   'Babolat',     'Gold Championship', '{}'),
  ('balls',   'Dunlop',      'Fort All Court',    '{}'),
  ('balls',   'Slazenger',   'Wimbledon',         '{}'),
  ('balls',   'Tretorn',     'Serie+',            '{}');
