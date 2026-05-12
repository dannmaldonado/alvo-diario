/**
 * Editais Service — CRUD + topic progress (gamified checklist)
 */

import { apiClient } from '@/services/api';
import type { Edital, CreateEditalInput, UpdateEditalInput } from '@/types';

export const EditaisService = {
  /** List all editais for the current user */
  getAll: (): Promise<Edital[]> =>
    apiClient.get<Edital[]>('/api/editais'),

  /** Get a single edital by ID */
  getById: (id: string): Promise<Edital> =>
    apiClient.get<Edital>(`/api/editais/${id}`),

  /** Create new edital (with AI-generated verticalizado materias) */
  create: (data: CreateEditalInput): Promise<Edital> =>
    apiClient.post<Edital>('/api/editais', data),

  /** Update edital metadata or materias */
  update: (id: string, data: UpdateEditalInput): Promise<Edital> =>
    apiClient.patch<Edital>(`/api/editais/${id}`, data),

  /** Delete edital */
  delete: (id: string): Promise<{ ok: boolean }> =>
    apiClient.delete<{ ok: boolean }>(`/api/editais/${id}`),

  /**
   * Toggle a topic's estudado state in the checklist.
   * Uses index-based addressing (materiaIdx, topicoIdx).
   */
  marcarTopico: (
    id: string,
    materiaIdx: number,
    topicoIdx: number,
    estudado: boolean
  ): Promise<{ materia_idx: number; topico_idx: number; estudado: boolean }> =>
    apiClient.patch(`/api/editais/${id}/topico`, {
      materia_idx: materiaIdx,
      topico_idx: topicoIdx,
      estudado,
    }),
};
