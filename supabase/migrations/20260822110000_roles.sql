-- Roles and public access, per docs/MODULES.md §10a.
--
-- The web console needs to know who may do what. Without this it would have to
-- run on the service role key from a browser, which is not a design but a hole.

create type public.app_role as enum ('admin', 'moderator', 'organiser', 'club_owner');

-- Clubs exist so that club_owner has something to own. Courts belong to one.
create table public.clubs (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  city       text not null,
  address    text,
  phone      text,
  created_at timestamptz not null default now()
);

alter table public.courts add column club_id uuid references public.clubs (id) on delete set null;

alter table public.clubs enable row level security;

create policy "clubs are readable by anyone"
  on public.clubs for select
  to anon, authenticated
  using (true);

create table public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role       public.app_role not null,
  -- Which club or tournament this applies to. Null means unscoped: an admin,
  -- or an organiser who may run events anywhere.
  scope_id   uuid,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles (id) on delete set null,

  constraint one_grant_per_scope unique nulls not distinct (profile_id, role, scope_id)
);

create index user_roles_profile_idx on public.user_roles (profile_id);

alter table public.user_roles enable row level security;

/**
 * Does the caller hold this role?
 *
 * SECURITY DEFINER on purpose. A policy on user_roles that selected from
 * user_roles would recurse forever; a definer function owned by the table owner
 * reads it without RLS and breaks the loop. It answers only about the caller,
 * so it cannot be used to enumerate anyone else's roles.
 */
create or replace function public.has_role(p_role public.app_role, p_scope uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
     where r.profile_id = auth.uid()
       and r.role = p_role
       and (r.scope_id is null or r.scope_id = p_scope)
  );
$$;

revoke execute on function public.has_role(public.app_role, uuid) from public, anon;
grant execute on function public.has_role(public.app_role, uuid) to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
     where r.profile_id = auth.uid() and r.role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "a user sees their own roles"
  on public.user_roles for select
  to authenticated
  using (profile_id = auth.uid() or public.is_admin());

create policy "only an admin grants roles"
  on public.user_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Moderators and admins may correct a profile: confirm a level, mark an
-- external rating verified, deal with an abusive username.
create policy "a moderator may correct any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin() or public.has_role('moderator'))
  with check (public.is_admin() or public.has_role('moderator'));

-- The rating columns stay protected even from moderators: the trigger only
-- opens for the transaction-local flag, which no client can set. Moderation
-- fixes text and status, never the number itself.

create policy "a moderator may settle a match"
  on public.matches for update
  to authenticated
  using (public.is_admin() or public.has_role('moderator'))
  with check (public.is_admin() or public.has_role('moderator'));

/**
 * Resolving a disputed result, per docs/RATING.md §5.
 *
 * Either the reported score stands and the rating is awarded, or the match is
 * voided — it keeps its place in history but never touches anyone's rating.
 */
create or replace function public.resolve_dispute(p_match_id uuid, p_uphold boolean)
returns public.matches
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.matches;
begin
  if not (public.is_admin() or public.has_role('moderator')) then
    raise exception 'not a moderator' using errcode = '42501';
  end if;

  if p_uphold then
    update public.matches set status = 'confirmed'
     where id = p_match_id and status = 'disputed'
    returning * into result;
    perform public.apply_match_rating(p_match_id);
  else
    update public.matches set status = 'void'
     where id = p_match_id and status = 'disputed'
    returning * into result;
  end if;

  return result;
end;
$$;

revoke execute on function public.resolve_dispute(uuid, boolean) from public, anon;
grant execute on function public.resolve_dispute(uuid, boolean) to authenticated;

-- Public read on courts: the court directory and the live queue page are meant
-- to work for someone who has never installed the app. Nothing personal lives
-- in this table.
create policy "courts are readable by anyone"
  on public.courts for select
  to anon
  using (is_active);
