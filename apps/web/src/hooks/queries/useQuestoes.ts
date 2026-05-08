/**
 * TanStack Query hooks for AI-generated Questions (Questoes)
 * Covers question generation, review queue, accuracy analytics, and response submission
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuestoesService } from '@/services/questoes.service';
import type { GerarQuestoesInput, ResponderQuestaoInput } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const questaoKeys = {
  all: ['questoes'] as const,
  revisao: () => [...questaoKeys.all, 'revisao'] as const,
  analytics: () => [...questaoKeys.all, 'analytics'] as const,
};

/** Generate questions via Claude AI and store them in DB */
export function useGerarQuestoes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: GerarQuestoesInput) => QuestoesService.gerar(params),
    onSuccess: () => {
      // Refresh revision count in case new questions have next_review today
      queryClient.invalidateQueries({ queryKey: questaoKeys.revisao() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao gerar questões. Tente novamente.');
    },
  });
}

/** Questions due for spaced repetition review today */
export function useQuestoesRevisao() {
  const { currentUser } = useAuth();
  return useQuery({
    queryKey: questaoKeys.revisao(),
    queryFn: () => QuestoesService.getRevisao(),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/** Accuracy stats by subject (all-time, not period-filtered) */
export function useQuestoesAnalytics() {
  const { currentUser } = useAuth();
  return useQuery({
    queryKey: questaoKeys.analytics(),
    queryFn: () => QuestoesService.getAnalytics(),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/** Submit a response to a question — updates SM-2 scheduling on backend */
export function useResponderQuestao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questaoId, data }: { questaoId: string; data: ResponderQuestaoInput }) =>
      QuestoesService.responder(questaoId, data),
    onSuccess: () => {
      // Refresh revision queue and accuracy analytics after each response
      queryClient.invalidateQueries({ queryKey: questaoKeys.revisao() });
      queryClient.invalidateQueries({ queryKey: questaoKeys.analytics() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar resposta.');
    },
  });
}
