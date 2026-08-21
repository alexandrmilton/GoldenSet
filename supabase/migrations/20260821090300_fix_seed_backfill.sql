-- The backfill in 20260821090000 did not take.
--
-- protect_server_owned_columns fires for every update that is not service_role
-- — including a migration running as postgres — so it quietly reverted
-- profiles.points while letting profiles.level through. Result: points 1200
-- against seed_points 1450 and level 3.0, which disagree.
--
-- That the trigger blocked a migration is the trigger working correctly. The
-- fix is to go through the same gate the seeding function uses.

select set_config('app.rating_write', 'on', true);

update public.profiles
   set points = seed_points,
       level  = public.points_to_level(seed_points)
 where seed_points is not null
   and points is distinct from seed_points;

select set_config('app.rating_write', 'off', true);
