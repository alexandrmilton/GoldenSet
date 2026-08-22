-- Chats, per docs/MODULES.md §8.
--
-- Five kinds of conversation, one table. A direct chat, a match chat and a
-- tournament announcement board differ in who is inside them, not in what a
-- message is — three separate subsystems would have been three times the work
-- and three places to fix the same bug.

create type public.thread_kind as enum ('direct', 'match', 'tournament', 'club', 'global');

create table public.threads (
  id         uuid primary key default gen_random_uuid(),
  kind       public.thread_kind not null,
  -- The match, tournament or club this belongs to. Null for direct and global.
  ref_id     uuid,
  title      text,
  created_at timestamptz not null default now(),
  unique nulls not distinct (kind, ref_id)
);

create table public.thread_members (
  thread_id    uuid not null references public.threads (id) on delete cascade,
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  is_moderator boolean not null default false,
  last_read_at timestamptz not null default now(),
  muted        boolean not null default false,
  joined_at    timestamptz not null default now(),
  primary key (thread_id, profile_id)
);

create index thread_members_profile_idx on public.thread_members (profile_id);

create table public.messages (
  id             uuid primary key default gen_random_uuid(),
  thread_id      uuid not null references public.threads (id) on delete cascade,
  author_id      uuid not null references public.profiles (id) on delete cascade,
  body           text not null,
  attachment_url text,
  reply_to       uuid references public.messages (id) on delete set null,
  created_at     timestamptz not null default now(),
  -- Soft delete: moderation has to be able to show that something was removed
  -- rather than silently rewriting a conversation.
  deleted_at     timestamptz,
  deleted_by     uuid references public.profiles (id) on delete set null,

  constraint body_not_empty check (deleted_at is not null or length(btrim(body)) > 0),
  constraint body_length check (length(body) <= 2000)
);

create index messages_thread_idx on public.messages (thread_id, created_at desc);

-- Blocking and reporting are not optional extras: an app carrying user content
-- does not pass App Store review without them.
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint not_yourself check (blocker_id <> blocked_id)
);

create type public.report_target as enum ('message', 'profile', 'match');
create type public.report_status as enum ('open', 'actioned', 'dismissed');

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id   uuid not null,
  reason      text not null,
  status      public.report_status not null default 'open',
  handled_by  uuid references public.profiles (id) on delete set null,
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index reports_open_idx on public.reports (status, created_at desc);

alter table public.threads enable row level security;
alter table public.thread_members enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

/**
 * Is the caller in this thread?
 *
 * SECURITY DEFINER for the same reason as has_role: a policy on thread_members
 * that reads thread_members would recurse. It answers only about the caller.
 */
create or replace function public.in_thread(p_thread uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.thread_members m
     where m.thread_id = p_thread and m.profile_id = auth.uid()
  ) or exists (
    -- The global room is open to everyone signed in.
    select 1 from public.threads t where t.id = p_thread and t.kind = 'global'
  );
$$;

revoke execute on function public.in_thread(uuid) from public, anon;
grant execute on function public.in_thread(uuid) to authenticated;

create policy "a member reads their threads"
  on public.threads for select to authenticated
  using (kind = 'global' or public.in_thread(id));

create policy "a member reads the roster"
  on public.thread_members for select to authenticated
  using (public.in_thread(thread_id));

create policy "a user manages their own membership"
  on public.thread_members for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "a member reads the messages"
  on public.messages for select to authenticated
  using (public.in_thread(thread_id));

-- Replaced below by a version that calls direct_thread_blocked(). The inline
-- subquery could not see the block at all: blocks is itself behind RLS.
create policy "a member writes as themselves"
  on public.messages for insert to authenticated
  with check (author_id = auth.uid() and public.in_thread(thread_id));

create policy "an author or a moderator removes a message"
  on public.messages for update to authenticated
  using (author_id = auth.uid() or public.is_admin() or public.has_role('moderator'))
  with check (author_id = auth.uid() or public.is_admin() or public.has_role('moderator'));

create policy "a user manages their own blocks"
  on public.blocks for all to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

create policy "a user files their own reports"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

create policy "reporters and moderators read reports"
  on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin() or public.has_role('moderator'));

create policy "moderators handle reports"
  on public.reports for update to authenticated
  using (public.is_admin() or public.has_role('moderator'))
  with check (public.is_admin() or public.has_role('moderator'));

-- The one room everybody is in.
insert into public.threads (kind, ref_id, title) values ('global', null, 'Golden Set');

/** The direct thread with someone, created on first use. */
create or replace function public.direct_thread(p_other uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_other = auth.uid() then
    raise exception 'cannot message yourself' using errcode = '22023';
  end if;

  select t.id into v_id
    from public.threads t
    join public.thread_members a on a.thread_id = t.id and a.profile_id = auth.uid()
    join public.thread_members b on b.thread_id = t.id and b.profile_id = p_other
   where t.kind = 'direct'
   limit 1;

  if v_id is not null then
    return v_id;
  end if;

  insert into public.threads (kind) values ('direct') returning id into v_id;
  insert into public.thread_members (thread_id, profile_id)
  values (v_id, auth.uid()), (v_id, p_other);

  return v_id;
end;
$$;

revoke execute on function public.direct_thread(uuid) from public, anon;
grant execute on function public.direct_thread(uuid) to authenticated;

/**
 * Accepting a challenge opens the match chat.
 *
 * Two players who have agreed to play need somewhere to sort out the court and
 * the time, and making them find each other in direct messages first is a step
 * that adds nothing.
 */
create or replace function public.on_game_accepted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_thread uuid;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    insert into public.threads (kind, ref_id) values ('match', new.id)
    on conflict do nothing
    returning id into v_thread;

    if v_thread is null then
      select id into v_thread from public.threads
       where kind = 'match' and ref_id = new.id;
    end if;

    insert into public.thread_members (thread_id, profile_id)
    values (v_thread, new.created_by), (v_thread, new.opponent_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger games_open_chat
  after update on public.games
  for each row execute function public.on_game_accepted();

revoke execute on function public.on_game_accepted() from public, anon, authenticated;

/** Unread counts for the chat list. */
create or replace function public.unread_threads()
returns table (thread_id uuid, unread integer)
language sql
stable
set search_path = ''
as $$
  select m.thread_id, count(msg.id)::integer
    from public.thread_members m
    left join public.messages msg
      on msg.thread_id = m.thread_id
     and msg.created_at > m.last_read_at
     and msg.author_id <> auth.uid()
     and msg.deleted_at is null
   where m.profile_id = auth.uid()
   group by m.thread_id;
$$;

revoke execute on function public.unread_threads() from public, anon;
grant execute on function public.unread_threads() to authenticated;

/**
 * Is either side of this direct thread blocking the caller?
 *
 * SECURITY DEFINER because the insert policy cannot get this answer otherwise:
 * RLS on blocks only shows a row to the person who created it, so a policy
 * evaluating as the blocked user saw nothing and let the message through. The
 * definer reads blocks without RLS and returns one boolean, which reveals
 * nothing about who blocked whom.
 */
create or replace function public.direct_thread_blocked(p_thread uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.threads t
      join public.thread_members other
        on other.thread_id = t.id and other.profile_id <> auth.uid()
      join public.blocks b
        on (b.blocker_id = other.profile_id and b.blocked_id = auth.uid())
        or (b.blocker_id = auth.uid() and b.blocked_id = other.profile_id)
     where t.id = p_thread and t.kind = 'direct'
  );
$$;

revoke execute on function public.direct_thread_blocked(uuid) from public, anon;
grant execute on function public.direct_thread_blocked(uuid) to authenticated;

drop policy "a member writes as themselves" on public.messages;

create policy "a member writes as themselves"
  on public.messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.in_thread(thread_id)
    and not public.direct_thread_blocked(thread_id)
  );

-- The chat updates live, so the table has to be in the realtime publication.
alter publication supabase_realtime add table public.messages;

-- propagate_bracket is only called from other definer functions, so it does not
-- need to be reachable over REST at all.
revoke execute on function public.propagate_bracket(uuid) from authenticated;
