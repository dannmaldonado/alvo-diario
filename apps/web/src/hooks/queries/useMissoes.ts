/**
 * useMissoes — React Query hooks for daily missions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { MissoesService } from '@/services/missoes.service';
import type { Missao } from '@/types';

export const missaoKeys = {
  all: ['missoes'] as const,
  today: () => [...missaoKeys.all, 'today'] as const,
};

/** Fetch today's missions (auto-generated on first call) */
export function useMissoesDoDia() {
  const { currentUser } = useAuth();
  return useQuery<Missao[]>({
    queryKey: missaoKeys.today(),
    queryFn: () => MissoesService.getToday(),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 min — missions don't change often
  });
}

/** Mark a mission as completed */
export function useConcluirMissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => MissoesService.concluir(id),
    onMutate: async (id) => {
      // Optimistic update: set status to 'concluida' immediately
      await queryClient.cancelQueries({ queryKey: missaoKeys.today() });
      const prev = queryClient.getQueryData<Missao[]>(missaoKeys.today());
      queryClient.setQueryData<Missao[]>(missaoKeys.today(), (old = []) =>
        old.map(m => m.id === id ? { ...m, status: 'concluida' } : m)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(missaoKeys.today(), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: missaoKeys.today() });
    },
  });
}

/** Skip a mission */
export function useIgnorarMissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => MissoesService.ignorar(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: missaoKeys.today() });
      const prev = queryClient.getQueryData<Missao[]>(missaoKeys.today());
      queryClient.setQueryData<Missao[]>(missaoKeys.today(), (old = []) =>
        old.map(m => m.id === id ? { ...m, status: 'ignorada' } : m)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(missaoKeys.today(), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: missaoKeys.today() });
    },
  });
}
