import { useQuery } from '@tanstack/react-query';

import type { FeedMatch, HomeSummary, Mover } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function useHomeSummary(enabled: boolean) {
  return useQuery({
    queryKey: ['home', 'summary'],
    enabled,
    queryFn: async (): Promise<HomeSummary | null> => {
      const { data, error } = await supabase.rpc('home_summary');
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

export function useMovers(days: number) {
  return useQuery({
    queryKey: ['home', 'movers', days],
    queryFn: async (): Promise<Mover[]> => {
      const { data, error } = await supabase.rpc('rating_movers', { p_days: days, p_limit: 5 });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFeed() {
  return useQuery({
    queryKey: ['home', 'feed'],
    queryFn: async (): Promise<FeedMatch[]> => {
      const { data, error } = await supabase.rpc('recent_matches', { p_limit: 8 });
      if (error) throw error;
      return data ?? [];
    },
  });
}
