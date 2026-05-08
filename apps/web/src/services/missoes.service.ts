/**
 * Missoes Service — Daily mission API client
 */

import { apiClient } from '@/services/api';
import type { Missao } from '@/types';

export const MissoesService = {
  /** Get (or auto-generate) today's missions */
  getToday: (): Promise<Missao[]> =>
    apiClient.get<Missao[]>('/api/missoes'),

  /** Mark a mission as completed */
  concluir: (id: string): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>(`/api/missoes/${id}/concluir`, {}),

  /** Skip a mission */
  ignorar: (id: string): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>(`/api/missoes/${id}/ignorar`, {}),
};
