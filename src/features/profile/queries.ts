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
 * Only the columns a player owns. points, matches_played and level_source are
 * deliberately absent — the database reverts them anyway (see the profiles
 * migration), and leaving them out keeps that rule visible in the code.
 */
export type EditableProfile = Pick<
  ProfileUpdate,
  'username' | 'full_name' | 'city' | 'region' | 'level_scale' | 'level_value' | 'hand' | 'bio' | 'avatar_url'
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

/** A profile still carrying its generated username has not been set up yet. */
export function needsOnboarding(profile: Profile | undefined) {
  if (!profile) return false;
  return profile.username.startsWith('player_') || profile.level_value === null;
}
