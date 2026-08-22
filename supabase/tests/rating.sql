-- Rating engine checks, against the tables in docs/RATING.md §5.
--
-- Run against the project and read the verdict column:
--   psql "$DATABASE_URL" -f supabase/tests/rating.sql
-- or paste into the Supabase SQL editor. Every row must say ok.
--
-- These are the pure functions — the ones the forecast and the award both call.
-- If a number here changes, the rating changed, and docs/RATING.md has to change
-- with it.

with expected(name, got, want) as (
  values
    -- K factor
    ('K, 2 matches played',              public.gs_k_factor(2, 1500),  64),
    ('K, 10 matches played',             public.gs_k_factor(10, 1500), 40),
    ('K, 30 matches played',             public.gs_k_factor(30, 1500), 28),
    ('K, 80 matches played',             public.gs_k_factor(80, 1500), 20),
    ('K, rating over 2200 overrides',    public.gs_k_factor(2, 2300),  16),

    -- Match weight (x100 to stay in integers)
    ('weight, friendly is zero',         (public.gs_match_weight('friendly','casual',0)*100)::int, 0),
    ('weight, ordinary rated match',     (public.gs_match_weight('rated','casual',0)*100)::int, 100),
    ('weight, tournament',               (public.gs_match_weight('rated','tournament',0)*100)::int, 125),
    ('weight, 4th meeting in 30 days',   (public.gs_match_weight('rated','casual',3)*100)::int, 40),
    ('weight, farming beats the bonus',  (public.gs_match_weight('rated','tournament',5)*100)::int, 40),

    -- Delta. Expected share against an equal opponent is 0.5, so a 6-0 6-0
    -- (share 1.0) at K=40 pays exactly half of K.
    ('equal opponents, whitewash win',   public.gs_delta(1500,1500,1.0,40,1.0), 20),
    ('equal opponents, even split',      public.gs_delta(1500,1500,0.5,40,1.0), 0),
    -- 400 points ahead means an expected share of 1/11 = 0.0909, so taking 72%
    -- of the games is worth 40 * (0.72 - 0.0909) = 25.2.
    ('beating someone 400 above',        public.gs_delta(1500,1900,0.72,40,1.0), 25),
    ('losing to someone 400 below',      public.gs_delta(1900,1500,0.28,40,1.0), -25),
    -- A close loss to a much stronger player is worth points, on purpose:
    -- the rating measures how well you played, not who won.
    ('close loss to a stronger player',  public.gs_delta(1500,1900,0.45,40,1.0), 14),
    ('clamp holds at +60',               public.gs_delta(1000,2900,1.0,64,1.25), 60),
    ('clamp holds at -60',               public.gs_delta(2900,1000,0.0,64,1.25), -60),
    ('zero weight zeroes the delta',     public.gs_delta(1500,1900,1.0,64,0.0), 0),

    -- Expected share (x10000)
    ('expected share, equal',            (public.gs_expected_share(1500,1500)*10000)::int, 5000),
    ('expected share, 400 behind',       (public.gs_expected_share(1500,1900)*10000)::int, 909),
    ('expected share, 400 ahead',        (public.gs_expected_share(1900,1500)*10000)::int, 9091),

    -- Level bands, docs/RATING.md §4
    ('level band, 1449 is 2.5',          (public.points_to_level(1449)*10)::int, 25),
    ('level band, 1450 is 3.0',          (public.points_to_level(1450)*10)::int, 30),
    ('level band, 1899 is 4.0',          (public.points_to_level(1899)*10)::int, 40),
    ('level band, 1900 is 4.5',          (public.points_to_level(1900)*10)::int, 45),
    ('level band, 2900 is 7.0',          (public.points_to_level(2900)*10)::int, 70)
)
select name, got, want, case when got = want then 'ok' else 'MISMATCH' end as verdict
  from expected
 order by case when got = want then 1 else 0 end, name;
