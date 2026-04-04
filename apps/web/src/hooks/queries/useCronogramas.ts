/**
 * TanStack Query hooks for Cronograma (Schedule) operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CronogramaService } from '@/services/cronograma.service';
import { CreateCronogramaInput, UpdateCronogramaInput } from '@/types';
import { toast } from 'sonner';

export const cronogramaKeys = {
  all: ['cronogramas'] as const,
  lists: () => [...cronogramaKeys.all, 'list'] as const,
  list: (userId: string) => [...cronogramaKeys.lists(), userId] as const,
  active: (userId: string) => [...cronogramaKeys.all, 'active', userId] as const,
  detail: (id: string) => [...cronogramaKeys.all, 'detail', id] as const,
};

export function useActiveCronograma(userId: string | undefined) {
  return useQuery({
    queryKey: cronogramaKeys.active(userId ?? ''),
    queryFn: () => CronogramaService.getActive(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useCronogramaById(id: string | undefined) {
  return useQuery({
    queryKey: cronogramaKeys.detail(id ?? ''),
    queryFn: () => CronogramaService.getById(id!),
    enabled: !!id,
  });
}

export function useCronogramaList(userId: string | undefined) {
  return useQuery({
    queryKey: cronogramaKeys.list(userId ?? ''),
    queryFn: () => CronogramaService.getAll(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCronograma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCronogramaInput) => CronogramaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cronogramaKeys.all });
      toast.success('Cronograma criado com sucesso!');
    },
  });
}

export function useUpdateCronograma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCronogramaInput }) =>
      CronogramaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cronogramaKeys.all });
      toast.success('Cronograma atualizado!');
    },
  });
}

export function useDeleteCronograma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CronogramaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cronogramaKeys.all });
      toast.success('Cronograma removido.');
    },
  });
}
