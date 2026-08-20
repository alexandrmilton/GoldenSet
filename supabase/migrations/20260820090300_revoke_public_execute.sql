-- Revoking EXECUTE from anon and authenticated was not enough: Postgres grants
-- EXECUTE on new functions to PUBLIC by default, and both roles inherit it
-- from there. The ACL entry to remove is the one written as `=X/postgres`.
--
-- Triggers still fire: trigger execution checks the TRIGGER privilege on the
-- table, not EXECUTE on the function.

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.protect_server_owned_columns() from public;
revoke execute on function public.touch_updated_at() from public;
