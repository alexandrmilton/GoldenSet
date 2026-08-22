import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  BallsMode,
  ForecastRow,
  GameFormat,
  GameKind,
  Match,
} from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { profileKeys } from '@/features/profile/queries';

export const gameKeys = {
  mine: ['games', 'mine'] as const,
  pending: ['matches', 'pending'] as const,
};

/**
 * What this game is worth, before it is played.
 *
 * Computed by the same database functions that award the rating afterwards, so
 * the numbers shown here are a promise the engine can keep.
 */
export function useForecast(opponentId: string | undefined, kind: GameKind) {
  return useQuery({
    queryKey: ['forecast', opponentId, kind],
    enabled: Boolean(opponentId),
    queryFn: async (): Promise<ForecastRow[]> => {
      const { data, error } = await supabase.rpc('forecast_game', {
        p_opponent: opponentId as string,
        p_kind: kind,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type ChallengeDraft = {
  opponentId: string;
  kind: GameKind;
  format: GameFormat;
  startsAt: Date;
  durationMin: number;
  courtNote?: string | null;
  ballsMode: BallsMode;
  ballsCatalogId?: string | null;
  message?: string | null;
  forecast: ForecastRow[];
};

export function useCreateChallenge(profileId: string | undefined) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (draft: ChallengeDraft) => {
      const { data, error } = await supabase
        .from('games')
        .insert({
          created_by: profileId as string,
          opponent_id: draft.opponentId,
          kind: draft.kind,
          format: draft.format,
          starts_at: draft.startsAt.toISOString(),
          duration_min: draft.durationMin,
          court_note: draft.courtNote ?? null,
          balls_mode: draft.ballsMode,
          balls_catalog_id: draft.ballsCatalogId ?? null,
          message: draft.message ?? null,
          // Frozen deliberately: ratings move, and both players were promised
          // these numbers when the challenge was sent.
          forecast: draft.forecast,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: gameKeys.mine }),
  });
}

/** Every game this player is part of, either side of the invitation. */
export function useMyGames(profileId: string | undefined) {
  return useQuery({
    queryKey: gameKeys.mine,
    enabled: Boolean(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRespondToChallenge() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameId, accept }: { gameId: string; accept: boolean }) => {
      const { error } = await supabase
        .from('games')
        .update({
          status: accept ? 'accepted' : 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', gameId);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: gameKeys.mine }),
  });
}

export type SetScore = { a: number; b: number };

export function useReportMatch(profileId?: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      opponentId: string;
      sets: SetScore[];
      kind: GameKind;
      format: GameFormat;
      gameId?: string | null;
    }): Promise<Match> => {
      const { data, error } = await supabase.rpc('report_match', {
        p_opponent: input.opponentId,
        p_sets: input.sets,
        p_kind: input.kind,
        p_format: input.format,
        p_game_id: input.gameId ?? undefined,
      });
      if (error) throw error;
      const match = data as unknown as Match;

      // Attach the racquet automatically rather than asking after every match.
      // Almost everyone plays with one, and a question per match would simply
      // get skipped — leaving the equipment statistics permanently empty.
      if (profileId) {
        const { data: racquet } = await supabase
          .from('user_equipment')
          .select('id')
          .eq('profile_id', profileId)
          .eq('kind', 'racquet')
          .eq('is_primary', true)
          .is('retired_at', null)
          .maybeSingle();

        if (racquet) {
          await supabase.from('match_equipment').insert({
            match_id: match.id,
            profile_id: profileId,
            equipment_id: racquet.id,
          });
        }
      }

      return match;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: gameKeys.mine });
      client.invalidateQueries({ queryKey: gameKeys.pending });
      client.invalidateQueries({ queryKey: profileKeys.mine });
      client.invalidateQueries({ queryKey: ['match-history'] });
      client.invalidateQueries({ queryKey: ['racquet-stats'] });
    },
  });
}

/** Matches reported by someone else that are waiting on this player's word. */
export function usePendingConfirmations(profileId: string | undefined) {
  return useQuery({
    queryKey: gameKeys.pending,
    enabled: Boolean(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*, match_sets(*), match_players(profile_id, side, is_winner)')
        .eq('status', 'pending')
        .neq('reported_by', profileId as string)
        .order('played_at', { ascending: false });
      if (error) throw error;
      // RLS lets any signed-in user read matches, so the participation filter
      // has to happen here rather than in the query.
      return (data ?? []).filter((match) =>
        match.match_players.some((player) => player.profile_id === profileId),
      );
    },
  });
}

export function useConfirmMatch(profileId: string | undefined) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      decision,
      note,
    }: {
      matchId: string;
      decision: 'confirmed' | 'disputed';
      note?: string;
    }) => {
      const { error } = await supabase.from('match_confirms').insert({
        match_id: matchId,
        profile_id: profileId as string,
        decision,
        note: note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: gameKeys.pending });
      client.invalidateQueries({ queryKey: profileKeys.mine });
    },
  });
}

/** This player's rating history, newest first. */
export function useRatingHistory(profileId: string | undefined) {
  return useQuery({
    queryKey: ['rating-history', profileId],
    enabled: Boolean(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rating_events')
        .select('*')
        .eq('profile_id', profileId as string)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}
