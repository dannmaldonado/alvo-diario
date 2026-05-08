/**
 * TanStack Query hooks for AI-generated Questions (Questoes)
 * Covers question generation, review queue, accuracy analytics, and response submission
 *
 * ⚠️ TEMPORARILY DISABLED: Backend questoes routes are offline during debugging.
 * All hooks return safe empty/no-op states so consuming components render without errors.
 * Re-enable by restoring the real implementations below once backend is stable.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GerarQuestoesInput, Questao, ResponderQuestaoInput } from '@/types';

export const questaoKeys = {
  all: ['questoes'] as const,
  revisao: () => [...questaoKeys.all, 'revisao'] as const,
  analytics: () => [...questaoKeys.all, 'analytics'] as const,
};

/** Generate questions via Claude AI — DISABLED while backend is offline */
export function useGerarQuestoes() {
  return useMutation({
    mutationFn: async (_params: GerarQuestoesInput): Promise<Questao[]> => {
      // Backend questoes routes are temporarily disabled.
      return [];
    },
  });
}

/** Questions due for spaced repetition review today — DISABLED while backend is offline */
export function useQuestoesRevisao() {
  return useQuery({
    queryKey: questaoKeys.revisao(),
    queryFn: async (): Promise<Questao[]> => [],
    staleTime: Infinity, // never refetch while disabled
    enabled: false,      // do not run the query
  });
}

/** Accuracy stats by subject — DISABLED while backend is offline */
export function useQuestoesAnalytics() {
  return useQuery({
    queryKey: questaoKeys.analytics(),
    queryFn: async () => [],
    staleTime: Infinity,
    enabled: false,
  });
}

/** Submit a response to a question — DISABLED while backend is offline */
export function useResponderQuestao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_args: { questaoId: string; data: ResponderQuestaoInput }) => {
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questaoKeys.revisao() });
      queryClient.invalidateQueries({ queryKey: questaoKeys.analytics() });
    },
  });
}
