import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { OnboardingOption, Profile } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { profileKeys } from '@/features/profile/queries';

/** One question: a key, and the options the database recognises for it. */
export type Question = {
  step: number;
  key: string;
  values: string[];
};

/**
 * The questionnaire is read from the database rather than hardcoded here.
 * Scores live server-side (see the onboarding_scoring migration), and an option
 * the server does not know scores zero — so the two lists must not drift apart.
 * Reading them from the same place makes drift impossible.
 */
export function useQuestionnaire() {
  return useQuery({
    queryKey: ['onboarding', 'options'],
    staleTime: Infinity,
    queryFn: async (): Promise<Question[]> => {
      const { data, error } = await supabase
        .from('onboarding_options')
        .select('*')
        .order('step')
        .order('answer_key')
        .order('sort_order');
      if (error) throw error;

      const byQuestion = new Map<string, Question>();
      for (const row of data as OnboardingOption[]) {
        const id = `${row.step}:${row.answer_key}`;
        const question = byQuestion.get(id);
        if (question) {
          question.values.push(row.answer_value);
        } else {
          byQuestion.set(id, { step: row.step, key: row.answer_key, values: [row.answer_value] });
        }
      }
      return [...byQuestion.values()];
    },
  });
}

export type AnchorOutcome = 'i_win' | 'even' | 'they_win';

export type OnboardingSubmission = {
  /** answer_key -> answer_value */
  answers: Record<string, string>;
  questions: Question[];
  anchorId?: string | null;
  anchorOutcome?: AnchorOutcome | null;
};

/**
 * Hands the answers to the server, which scores them and decides the starting
 * rating. The client never computes a rating — it could just claim a better one.
 */
export function useApplyOnboarding() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ answers, questions, anchorId, anchorOutcome }: OnboardingSubmission) => {
      const payload = questions
        .filter((question) => answers[question.key])
        .map((question) => ({
          step: question.step,
          key: question.key,
          value: answers[question.key],
        }));

      const { data, error } = await supabase.rpc('apply_onboarding', {
        answers: payload,
        anchor_id: anchorId ?? undefined,
        anchor_outcome: anchorOutcome ?? undefined,
      });
      if (error) throw error;
      return data as unknown as Profile;
    },
    onSuccess: (profile) => {
      client.setQueryData(profileKeys.mine, profile);
    },
  });
}

/** Players who can serve as an anchor: already measured, not seeded. */
export function useAnchorCandidates(search: string) {
  return useQuery({
    queryKey: ['onboarding', 'anchors', search],
    enabled: search.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, city, points, level, rating_status')
        .in('rating_status', ['established', 'confirmed'])
        .ilike('username', `%${search.trim()}%`)
        .limit(8);
      if (error) throw error;
      return data;
    },
  });
}
