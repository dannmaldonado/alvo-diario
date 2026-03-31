/**
 * Cronograma Service
 * Handles schedule/calendar CRUD operations
 */

import { apiCall, apiClient } from './api';
import {
  Cronograma,
  CreateCronogramaInput,
  UpdateCronogramaInput,
} from '@/types';
import { NotFoundError } from '@/types';

export const CronogramaService = {
  /**
   * Get all schedules for current user
   */
  async getAll(): Promise<Cronograma[]> {
    return apiCall(
      async () => {
        const records = await apiClient.get<Cronograma[]>('/api/cronogramas');
        return records;
      },
      'CronogramaService.getAll'
    );
  },

  /**
   * Get active schedule for current user (latest created)
   */
  async getActive(): Promise<Cronograma | null> {
    return apiCall(
      async () => {
        const records = await apiClient.get<Cronograma[]>('/api/cronogramas');
        return records.length > 0 ? records[0] : null;
      },
      'CronogramaService.getActive'
    );
  },

  /**
   * Get schedule by ID
   */
  async getById(id: string): Promise<Cronograma> {
    return apiCall(
      async () => {
        try {
          const record = await apiClient.get<Cronograma>(`/api/cronogramas/${id}`);
          return record;
        } catch (err: any) {
          throw new NotFoundError('Cronograma');
        }
      },
      'CronogramaService.getById'
    );
  },

  /**
   * Create new schedule
   */
  async create(data: CreateCronogramaInput): Promise<Cronograma> {
    return apiCall(
      async () => {
        const record = await apiClient.post<Cronograma>('/api/cronogramas', data);
        return record;
      },
      'CronogramaService.create'
    );
  },

  /**
   * Update existing schedule
   */
  async update(id: string, data: UpdateCronogramaInput): Promise<Cronograma> {
    return apiCall(
      async () => {
        const record = await apiClient.patch<Cronograma>(`/api/cronogramas/${id}`, data);
        return record;
      },
      'CronogramaService.update'
    );
  },

  /**
   * Delete schedule
   */
  async delete(id: string): Promise<void> {
    return apiCall(
      async () => {
        await apiClient.delete(`/api/cronogramas/${id}`);
      },
      'CronogramaService.delete'
    );
  }
};
