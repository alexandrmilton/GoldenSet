import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { Message, ReportTarget, Thread } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export const chatKeys = {
  threads: ['chat', 'threads'] as const,
  messages: (threadId: string) => ['chat', 'messages', threadId] as const,
};

export type ThreadSummary = Thread & {
  unread: number;
  lastMessage: string | null;
  lastAt: string | null;
  otherId: string | null;
};

/** Every conversation this player can see, newest activity first. */
export function useThreads(profileId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.threads,
    enabled: Boolean(profileId),
    queryFn: async (): Promise<ThreadSummary[]> => {
      const [threads, unread, members] = await Promise.all([
        supabase.from('threads').select('*'),
        supabase.rpc('unread_threads'),
        supabase.from('thread_members').select('thread_id, profile_id'),
      ]);
      if (threads.error) throw threads.error;
      if (unread.error) throw unread.error;
      if (members.error) throw members.error;

      const unreadBy = new Map((unread.data ?? []).map((row) => [row.thread_id, row.unread]));

      const summaries = await Promise.all(
        (threads.data ?? []).map(async (thread) => {
          const { data: last } = await supabase
            .from('messages')
            .select('body, created_at')
            .eq('thread_id', thread.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const other = (members.data ?? []).find(
            (m) => m.thread_id === thread.id && m.profile_id !== profileId,
          );

          return {
            ...thread,
            unread: unreadBy.get(thread.id) ?? 0,
            lastMessage: last?.body ?? null,
            lastAt: last?.created_at ?? null,
            otherId: other?.profile_id ?? null,
          };
        }),
      );

      return summaries.sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''));
    },
  });
}

export function useMessages(threadId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.messages(threadId ?? ''),
    enabled: Boolean(threadId),
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId as string)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Live updates for an open thread.
 *
 * Without this the chat only moves when the screen is reopened, which for a
 * conversation is the difference between a chat and a message board.
 */
export function useMessageStream(threadId: string | undefined) {
  const client = useQueryClient();

  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        () => {
          client.invalidateQueries({ queryKey: chatKeys.messages(threadId) });
          client.invalidateQueries({ queryKey: chatKeys.threads });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, client]);
}

export function useSendMessage(profileId: string | undefined) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      const { error } = await supabase.from('messages').insert({
        thread_id: threadId,
        author_id: profileId as string,
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: chatKeys.messages(variables.threadId) });
      client.invalidateQueries({ queryKey: chatKeys.threads });
    },
  });
}

export function useOpenDirectThread() {
  return useMutation({
    mutationFn: async (otherId: string): Promise<string> => {
      const { data, error } = await supabase.rpc('direct_thread', { p_other: otherId });
      if (error) throw error;
      return data as string;
    },
  });
}

export function useMarkRead(profileId: string | undefined) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase
        .from('thread_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('profile_id', profileId as string);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: chatKeys.threads }),
  });
}

/** Moderation: both of these are required before the app can ship. */
export function useBlockPlayer(profileId: string | undefined) {
  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase
        .from('blocks')
        .insert({ blocker_id: profileId as string, blocked_id: blockedId });
      if (error) throw error;
    },
  });
}

export function useReport(profileId: string | undefined) {
  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      reason,
    }: {
      targetType: ReportTarget;
      targetId: string;
      reason: string;
    }) => {
      const { error } = await supabase.from('reports').insert({
        reporter_id: profileId as string,
        target_type: targetType,
        target_id: targetId,
        reason,
      });
      if (error) throw error;
    },
  });
}

export function useDeleteMessage(profileId: string | undefined) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, threadId }: { messageId: string; threadId: string }) => {
      // Soft delete: the row stays so moderation can show that something was
      // removed rather than silently rewriting the conversation.
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString(), deleted_by: profileId as string })
        .eq('id', messageId);
      if (error) throw error;
      return threadId;
    },
    onSuccess: (threadId) => {
      client.invalidateQueries({ queryKey: chatKeys.messages(threadId) });
    },
  });
}
