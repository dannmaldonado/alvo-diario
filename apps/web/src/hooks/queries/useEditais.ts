/**
 * TanStack Query hooks for Editais (gamified study checklists)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EditaisService } from '@/services/editais.service';
import type { CreateEditalInput, UpdateEditalInput } from '@/types';

export const editalKeys = {
  all: ['editais'] as const,
  lists: () => [...editalKeys.all, 'list'] as const,
  detail: (id: string) => [...editalKeys.all, 'detail', id] as const,
};

/** All editais for current user */
export function useEditaisList() {
  return useQuery({
    queryKey: editalKeys.lists(),
    queryFn: () => EditaisService.getAll(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/** Single edital by ID */
export function useEditalDetail(id: string | undefined) {
  return useQuery({
    queryKey: editalKeys.detail(id!),
    queryFn: () => EditaisService.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds (topic state changes frequently)
  });
}

/** Create new edital */
export function useCreateEdital() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEditalInput) => EditaisService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editalKeys.lists() });
    },
  });
}

/** Update edital metadata */
export function useUpdateEdital() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEditalInput }) =>
      EditaisService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: editalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: editalKeys.lists() });
    },
  });
}

/** Delete edital */
export function useDeleteEdital() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EditaisService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editalKeys.lists() });
    },
  });
}

/**
 * Toggle a topic's estudado state.
 * Uses optimistic update for instant feedback — reverts on error.
 */
export function useMarcarTopico(editalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      materiaIdx,
      topicoIdx,
      estudado,
    }: {
      materiaIdx: number;
      topicoIdx: number;
      estudado: boolean;
    }) => EditaisService.marcarTopico(editalId, materiaIdx, topicoIdx, estudado),

    // Optimistic update — instantly toggles the checkbox in the UI
    onMutate: async ({ materiaIdx, topicoIdx, estudado }) => {
      await queryClient.cancelQueries({ queryKey: editalKeys.detail(editalId) });
      const previous = queryClient.getQueryData(editalKeys.detail(editalId));

      queryClient.setQueryData(editalKeys.detail(editalId), (old: any) => {
        if (!old) return old;
        const materias = old.materias.map((m: any, mIdx: number) => {
          if (mIdx !== materiaIdx) return m;
          return {
            ...m,
            topicos: m.topicos.map((t: any, tIdx: number) =>
              tIdx === topicoIdx ? { ...t, estudado } : t
            ),
          };
        });
        return { ...old, materias };
      });

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      // Revert on error
      if (ctx?.previous) {
        queryClient.setQueryData(editalKeys.detail(editalId), ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: editalKeys.detail(editalId) });
      queryClient.invalidateQueries({ queryKey: editalKeys.lists() });
    },
  });
}
