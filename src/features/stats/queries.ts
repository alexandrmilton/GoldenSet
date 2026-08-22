import { useQuery } from '@tanstack/react-query';

import type { HistoryRow, PlayerStats, RacquetStat, RatingPoint } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function usePlayerStats(profileId: string | undefined) {
  return useQuery({
    queryKey: ['stats', profileId],
    enabled: Boolean(profileId),
    queryFn: async (): Promise<PlayerStats | null> => {
      const { data, error } = await supabase.rpc('player_stats', { p_profile: profileId as string });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

export function useRatingSeries(profileId: string | undefined) {
  return useQuery({
    queryKey: ['rating-series', profileId],
    enabled: Boolean(profileId),
    queryFn: async (): Promise<RatingPoint[]> => {
      const { data, error } = await supabase.rpc('rating_series', {
        p_profile: profileId as string,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMatchHistory(profileId: string | undefined, limit = 30) {
  return useQuery({
    queryKey: ['match-history', profileId, limit],
    enabled: Boolean(profileId),
    queryFn: async (): Promise<HistoryRow[]> => {
      const { data, error } = await supabase.rpc('match_history', {
        p_profile: profileId as string,
        p_limit: limit,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useHeadToHead(profileId: string | undefined, opponentId: string | undefined) {
  return useQuery({
    queryKey: ['head-to-head', profileId, opponentId],
    enabled: Boolean(profileId && opponentId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('head_to_head', {
        p_profile: profileId as string,
        p_opponent: opponentId as string,
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

export function useRacquetStats(profileId: string | undefined) {
  return useQuery({
    queryKey: ['racquet-stats', profileId],
    enabled: Boolean(profileId),
    queryFn: async (): Promise<RacquetStat[]> => {
      const { data, error } = await supabase.rpc('racquet_stats', {
        p_profile: profileId as string,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}
