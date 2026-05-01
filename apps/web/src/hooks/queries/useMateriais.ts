/**
 * TanStack Query hooks for Materiais (Study Resources) operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MateriaisService } from '@/services/materiais.service';
import { CreateMaterialInput, UpdateMaterialInput } from '@/types';
import { toast } from 'sonner';

export const materialKeys = {
  all: ['materiais'] as const,
  detail: (id: string) => [...materialKeys.all, 'detail', id] as const,
};

export function useMateriais(userId: string | undefined) {
  return useQuery({
    queryKey: materialKeys.all,
    queryFn: () => MateriaisService.getAll(),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaterialInput) => MateriaisService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.all });
      toast.success('Material adicionado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao adicionar material.');
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaterialInput }) =>
      MateriaisService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.all });
      toast.success('Material atualizado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar material.');
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => MateriaisService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.all });
      toast.success('Material removido.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover material.');
    },
  });
}
