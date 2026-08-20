-- Two findings from the Supabase security advisor, both worth acting on.
--
-- 1. citext was installed into the public schema — and it was never needed.
--    The username_shape constraint already forces lowercase, so plain text
--    with an ordinary unique constraint gives case-insensitive uniqueness for
--    free, and the extension can go.
--
-- 2. The trigger functions were reachable as REST endpoints
--    (/rest/v1/rpc/handle_new_user). Triggers do not need EXECUTE granted to
--    the calling role, so revoking it costs nothing and closes the endpoint.

-- The constraint has to go first: its regex operator is citext's, so the
-- extension cannot be dropped while the constraint still references it.
alter table public.profiles drop constraint username_shape;

alter table public.profiles
  alter column username type text using username::text;

alter table public.profiles
  add constraint username_shape check (username ~ '^[a-z0-9_]{3,20}$');

drop extension if exists citext;

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.protect_server_owned_columns() from anon, authenticated;
revoke execute on function public.touch_updated_at() from anon, authenticated;
