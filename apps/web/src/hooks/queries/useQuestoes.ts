/**
 * TanStack Query hooks for AI-generated Questions (Questoes)
 * Covers question generation, review queue, accuracy analytics, and response submission
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QuestoesService } from '@/services/questoes.service';
import type { GerarQuestoesInput, Questao, ResponderQuestaoInput, AccuracyByMateria } from '@/types';

export const questaoKeys = {
  all: ['questoes'] as const,
  revisao: () => [...questaoKeys.all, 'revisao'] as const,
  analytics: () => [...questaoKeys.all, 'analytics'] as const,
};

/** Generate questions via Claude AI and store them */
export function useGerarQuestoes() {
  return useMutation({
    mutationFn: (params: GerarQuestoesInput): Promise<Questao[]> =>
      QuestoesService.gerar(params),
  });
}

/** Questions due for spaced repetition review today */
export function useQuestoesRevisao() {
  return useQuery({
    queryKey: questaoKeys.revisao(),
    queryFn: (): Promise<Questao[]> => QuestoesService.getRevisao(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/** Accuracy stats by subject (all-time) */
export function useQuestoesAnalytics() {
  return useQuery({
    queryKey: questaoKeys.analytics(),
    queryFn: (): Promise<AccuracyByMateria[]> => QuestoesService.getAnalytics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/** Submit a response to a question (updates SM-2) */
export function useResponderQuestao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questaoId, data }: { questaoId: string; data: ResponderQuestaoInput }) =>
      QuestoesService.responder(questaoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questaoKeys.revisao() });
      queryClient.invalidateQueries({ queryKey: questaoKeys.analytics() });
    },
    // Suppress global error toast — save failures are non-blocking in quiz/review UI
    onError: () => {},
  });
}
