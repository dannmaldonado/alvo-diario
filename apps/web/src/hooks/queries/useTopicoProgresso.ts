/**
 * TanStack Query hooks for per-user topic progress (topico_progresso table)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ============================================================================
// TYPES
// ============================================================================

export interface TopicoProgressoRow {
  topico_nome: string;
  batida: number;
  concluido_em: string | null;
  questoes_total: number | null;
  questoes_acertos: number | null;
}

export interface TopicoProgressoResponse {
  batida_atual: number;
  topicos: TopicoProgressoRow[];
}

export interface PatchTopicoInput {
  edital_id: string;
  materia_nome: string;
  topico_nome: string;
  concluido: boolean;
  questoes_total?: number;
  questoes_acertos?: number;
}

export interface PatchTopicoResult {
  ok: boolean;
  nova_batida: boolean;
  batida?: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const topicoKeys = {
  all: ['topico-progresso'] as const,
  progresso: (editalId: string, materia: string) =>
    [...topicoKeys.all, editalId, materia] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/** Get progress for all topics of a matéria */
export function useTopicoProgresso(editalId: string | undefined, materia: string | undefined) {
  return useQuery<TopicoProgressoResponse>({
    queryKey: topicoKeys.progresso(editalId!, materia!),
    queryFn: () =>
      apiClient.get<TopicoProgressoResponse>(
        `/api/topicos/progresso?edital_id=${encodeURIComponent(editalId!)}&materia=${encodeURIComponent(materia!)}`
      ),
    enabled: !!editalId && !!materia,
    staleTime: 1000 * 30,
  });
}

/** Mark or unmark a topic as done, optionally recording question performance */
export function usePatchTopicoProgresso() {
  const queryClient = useQueryClient();

  return useMutation<PatchTopicoResult, Error, PatchTopicoInput>({
    mutationFn: (data) => apiClient.patch<PatchTopicoResult>('/api/topicos/progresso', data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: topicoKeys.progresso(variables.edital_id, variables.materia_nome),
      });
      // If a new batida started, invalidate edital detail too
      if (result.nova_batida) {
        queryClient.invalidateQueries({ queryKey: ['editais'] });
      }
    },
  });
}

/** Import edital from parsed CSV/XLS data */
export function useImportEdital() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      titulo: string;
      banca?: string;
      cargo?: string;
      concurso?: string;
      materias: Array<{
        nome: string;
        prioridade?: number;
        questoes?: number;
        topicos: Array<{ nome: string; ordem: number; questoes_prova?: number; horas_sugeridas?: number }>;
      }>;
    }) => apiClient.post('/api/editais/import', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editais'] });
    },
  });
}
