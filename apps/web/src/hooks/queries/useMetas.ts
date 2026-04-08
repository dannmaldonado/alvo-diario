/**
 * TanStack Query hooks for Metas (Daily Goals) operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MetasService } from '@/services/metas.service';
import { CreateMetaInput, UpdateMetaInput } from '@/types';
import { toast } from 'sonner';
import { cronogramaKeys } from './useCronogramas';

export const metaKeys = {
  all: ['metas'] as const,
  today: (userId: string) => [...metaKeys.all, 'today', userId] as const,
  byDate: (userId: string, date: string) =>
    [...metaKeys.all, 'date', userId, date] as const,
  byUser: (userId: string) => [...metaKeys.all, 'user', userId] as const,
};

export function useTodayMeta(userId: string | undefined) {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: metaKeys.today(userId ?? ''),
    queryFn: () => MetasService.getByDate(userId!, today),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 min -- changes during study
  });
}

export function useMetaByDate(userId: string | undefined, date: string) {
  return useQuery({
    queryKey: metaKeys.byDate(userId ?? '', date),
    queryFn: () => MetasService.getByDate(userId!, date),
    enabled: !!userId && !!date,
    staleTime: 60 * 1000,
  });
}

export function useCreateMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMetaInput) => MetasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metaKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar meta.');
    },
  });
}

export function useUpdateMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMetaInput }) =>
      MetasService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metaKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar meta.');
    },
  });
}

const RATING_MULTIPLIERS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0,
  2: 0.5,
  3: 1,
  4: 1.5,
  5: 2,
};

export function useUpdateMetaRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, avaliacao_diaria }: { id: string; avaliacao_diaria: 1 | 2 | 3 | 4 | 5 }) =>
      MetasService.update(id, { avaliacao_diaria }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: metaKeys.all });
      // Refetch user data to pick up updated streak_atual and pontos_totais from backend
      queryClient.invalidateQueries({ queryKey: ['user'] });
      const multiplier = RATING_MULTIPLIERS[variables.avaliacao_diaria];
      const multiplierText = multiplier > 1 ? ` (${multiplier}x bonus)` : multiplier < 1 ? ` (${multiplier}x)` : '';
      toast.success(`Avaliacao salva!${multiplierText}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar avaliacao.');
    },
  });
}

export function useUserMetas(userId: string | undefined) {
  return useQuery({
    queryKey: metaKeys.byUser(userId ?? ''),
    queryFn: () => MetasService.getByUser(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsertTodayMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: Omit<CreateMetaInput, 'data'>;
    }) => MetasService.upsertTodaysGoal(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metaKeys.all });
      queryClient.invalidateQueries({ queryKey: cronogramaKeys.all });
      toast.success('Meta atualizada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar meta.');
    },
  });
}
