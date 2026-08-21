-- revoke ... from public does not remove Supabase's own default grants: new
-- functions in the public schema are granted EXECUTE to anon and authenticated
-- explicitly, and those entries survive. anon has to be named.
--
-- apply_onboarding already refuses an anonymous caller (auth.uid() is null),
-- so this is defence in depth rather than a hole being closed.
--
-- The remaining advisor warning — that `authenticated` may execute
-- apply_onboarding — is intentional and must stay: it is the only path by
-- which a signed-in player can be given a starting rating.

revoke execute on function public.apply_onboarding(jsonb, uuid, text) from anon;
