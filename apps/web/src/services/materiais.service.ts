/**
 * Materiais (Study Resources) Service
 * Handles CRUD for study materials linked to study sessions.
 */

import { apiCall, apiClient } from './api';
import { Material, CreateMaterialInput, UpdateMaterialInput } from '@/types';

export const MateriaisService = {
  async getAll(): Promise<Material[]> {
    return apiCall(
      async () => apiClient.get<Material[]>('/api/materiais'),
      'MateriaisService.getAll'
    );
  },

  async create(data: CreateMaterialInput): Promise<Material> {
    return apiCall(
      async () => apiClient.post<Material>('/api/materiais', data),
      'MateriaisService.create'
    );
  },

  async update(id: string, data: UpdateMaterialInput): Promise<Material> {
    return apiCall(
      async () => apiClient.patch<Material>(`/api/materiais/${id}`, data),
      'MateriaisService.update'
    );
  },

  async delete(id: string): Promise<void> {
    return apiCall(
      async () => apiClient.delete(`/api/materiais/${id}`),
      'MateriaisService.delete'
    );
  },
};
