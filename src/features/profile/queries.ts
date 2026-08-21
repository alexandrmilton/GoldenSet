import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Profile, ProfileUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export const profileKeys = {
  mine: ['profile', 'me'] as const,
  byId: (id: string) => ['profile', id] as const,
};

async function fetchProfile(id: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.mine,
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
  });
}

/**
 * Only the columns a player owns. Every rating column is deliberately absent —
 * the database reverts them anyway (see the profiles migration), and leaving
 * them out keeps that rule visible in the code.
 */
export type EditableProfile = Pick<
  ProfileUpdate,
  | 'username'
  | 'full_name'
  | 'city'
  | 'district'
  | 'region'
  | 'hand'
  | 'bio'
  | 'avatar_url'
  | 'birth_year'
  | 'gender'
  | 'balls_preference'
>;

export function useUpdateMyProfile(userId: string | undefined) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (patch: EditableProfile) => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (profile) => {
      client.setQueryData(profileKeys.mine, profile);
    },
  });
}

/**
 * Setup is complete once the questionnaire has produced a starting rating.
 * seed_at is the marker because only the server can set it, so a client cannot
 * skip the questionnaire by writing a username of its own.
 */
export function needsOnboarding(profile: Profile | undefined) {
  if (!profile) return false;
  return profile.seed_at === null;
}
