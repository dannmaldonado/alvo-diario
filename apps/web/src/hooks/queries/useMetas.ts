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
