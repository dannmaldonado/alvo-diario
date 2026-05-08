import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QuestoesExternasService } from '@/services/questoes-externas.service';
import type { CreateQuestaoExternaInput } from '@/types';

const KEY = ['questoes-externas'] as const;

export function useQuestoesExternas() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => QuestoesExternasService.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateQuestaoExterna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuestaoExternaInput) => QuestoesExternasService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteQuestaoExterna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => QuestoesExternasService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
