import { apiClient } from '@/services/api';
import type { QuestaoExterna, CreateQuestaoExternaInput } from '@/types';

export const QuestoesExternasService = {
  getAll: (): Promise<QuestaoExterna[]> =>
    apiClient.get('/api/questoes-externas'),

  create: (data: CreateQuestaoExternaInput): Promise<QuestaoExterna> =>
    apiClient.post('/api/questoes-externas', data),

  delete: (id: string): Promise<{ success: boolean }> =>
    apiClient.delete(`/api/questoes-externas/${id}`),
};
