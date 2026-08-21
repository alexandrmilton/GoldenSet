import { useQuery } from '@tanstack/react-query';

import type { PlayerSearchResult, PlayingHand, RatingStatus } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type SortKey = 'level' | 'points' | 'active';

/** What the filter sheet holds. Everything is optional; nothing set means everyone. */
export type PlayerFilterState = {
  search?: string;
  city?: string | null;
  levelMin?: number | null;
  levelMax?: number | null;
  ageMin?: number | null;
  ageMax?: number | null;
  gender?: string | null;
  hand?: PlayingHand | null;
  statuses?: RatingStatus[] | null;
  ballsId?: string | null;
  courtId?: string | null;
  weekday?: number | null;
  sort?: SortKey;
};

export const emptyFilters: PlayerFilterState = { sort: 'level' };

export function activeFilterCount(filters: PlayerFilterState) {
  const { search, sort, ...rest } = filters;
  return Object.values(rest).filter((value) =>
    Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined,
  ).length;
}

export function usePlayers(filters: PlayerFilterState) {
  return useQuery({
    queryKey: ['players', filters],
    queryFn: async (): Promise<PlayerSearchResult[]> => {
      const { data, error } = await supabase.rpc('search_players', {
        p_search: filters.search?.trim() || null,
        p_city: filters.city ?? null,
        p_level_min: filters.levelMin ?? null,
        p_level_max: filters.levelMax ?? null,
        p_age_min: filters.ageMin ?? null,
        p_age_max: filters.ageMax ?? null,
        p_gender: filters.gender ?? null,
        p_hand: filters.hand ?? null,
        p_statuses: filters.statuses?.length ? filters.statuses : null,
        p_balls_id: filters.ballsId ?? null,
        p_court_id: filters.courtId ?? null,
        p_weekday: filters.weekday ?? null,
        p_sort: filters.sort ?? 'level',
        p_limit: 50,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePlayerCities() {
  return useQuery({
    queryKey: ['players', 'cities'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('player_cities');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** A public profile, plus the gear shown on it. */
export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: ['player', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [profile, equipment] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id as string).maybeSingle(),
        supabase
          .from('user_equipment')
          .select('*, equipment_catalog(brand, model)')
          .eq('profile_id', id as string)
          .is('retired_at', null),
      ]);
      if (profile.error) throw profile.error;
      if (equipment.error) throw equipment.error;
      return { profile: profile.data, equipment: equipment.data ?? [] };
    },
  });
}

export function playerAge(birthYear: number | null) {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
}
