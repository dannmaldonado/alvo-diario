/**
 * TanStack Query hooks for Sessoes (Study Sessions) operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SessoesService } from '@/services/sessoes.service';
import { CreateSessaoInput, UpdateSessaoInput } from '@/types';
import { toast } from 'sonner';
import { cronogramaKeys } from './useCronogramas';
import { metaKeys } from './useMetas';
import { userKeys } from './useUser';

export const sessaoKeys = {
  all: ['sessoes'] as const,
  byDate: (date: string) => [...sessaoKeys.all, 'date', date] as const,
  byDateRange: (userId: string, start: string, end: string) =>
    [...sessaoKeys.all, 'range', userId, start, end] as const,
  byUser: (userId: string) => [...sessaoKeys.all, 'user', userId] as const,
  detail: (id: string) => [...sessaoKeys.all, 'detail', id] as const,
};

export function useSessoesByDate(date: string) {
  return useQuery({
    queryKey: sessaoKeys.byDate(date),
    queryFn: () => SessoesService.getByDate(date),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSessoesByDateRange(
  userId: string | undefined,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: sessaoKeys.byDateRange(userId ?? '', startDate, endDate),
    queryFn: () => SessoesService.getByDateRange(userId!, startDate, endDate),
    enabled: !!userId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSessao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSessaoInput) => SessoesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessaoKeys.all });
      queryClient.invalidateQueries({ queryKey: metaKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: cronogramaKeys.all });
      toast.success('Sessao salva com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar sessao.');
    },
  });
}

export function useUpdateSessao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessaoInput }) =>
      SessoesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessaoKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar sessao.');
    },
  });
}

export function useTodaySessions(userId: string | undefined) {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: [...sessaoKeys.byDate(today), 'user', userId ?? ''],
    queryFn: () => SessoesService.getByDate(today),
    enabled: !!userId,
    staleTime: 30 * 1000, // short -- reflects saves quickly
  });
}

export function useDeleteSessao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SessoesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessaoKeys.all });
      queryClient.invalidateQueries({ queryKey: metaKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Sessao removida.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover sessao.');
    },
  });
}
