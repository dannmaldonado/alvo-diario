/**
 * Metas (Daily Goals) Service
 * Handles daily goal CRUD operations
 */

import { apiCall, apiClient } from './api';
import { Meta, CreateMetaInput, UpdateMetaInput } from '@/types';
import { NotFoundError } from '@/types';

export const MetasService = {
  /**
   * Get all goals for a user
   */
  async getByUser(): Promise<Meta[]> {
    return apiCall(
      async () => {
        const records = await apiClient.get<Meta[]>('/api/metas');
        return records;
      },
      'MetasService.getByUser'
    );
  },

  /**
   * Get goal by date
   */
  async getByDate(date: string): Promise<Meta | null> {
    return apiCall(
      async () => {
        const record = await apiClient.get<Meta | null>(`/api/metas/by-date/${date}`);
        return record;
      },
      'MetasService.getByDate'
    );
  },

  /**
   * Get goals in date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Meta[]> {
    return apiCall(
      async () => {
        const records = await apiClient.get<Meta[]>('/api/metas');
        return records.filter(
          m => m.data >= startDate && m.data <= endDate
        );
      },
      'MetasService.getByDateRange'
    );
  },

  /**
   * Get single goal by ID
   */
  async getById(id: string): Promise<Meta> {
    return apiCall(
      async () => {
        try {
          const record = await apiClient.get<Meta>(`/api/metas/${id}`);
          return record;
        } catch (err: any) {
          throw new NotFoundError('Meta');
        }
      },
      'MetasService.getById'
    );
  },

  /**
   * Create new goal
   */
  async create(data: CreateMetaInput): Promise<Meta> {
    return apiCall(
      async () => {
        const record = await apiClient.post<Meta>('/api/metas', data);
        return record;
      },
      'MetasService.create'
    );
  },

  /**
   * Update goal
   */
  async update(id: string, data: UpdateMetaInput): Promise<Meta> {
    return apiCall(
      async () => {
        const record = await apiClient.patch<Meta>(`/api/metas/${id}`, data);
        return record;
      },
      'MetasService.update'
    );
  },

  /**
   * Delete goal
   */
  async delete(id: string): Promise<void> {
    return apiCall(
      async () => {
        await apiClient.delete(`/api/metas/${id}`);
      },
      'MetasService.delete'
    );
  },

  /**
   * Get today's goal
   */
  async getTodaysGoal(): Promise<Meta | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDate(today);
  },

  /**
   * Create or update today's goal
   */
  async upsertTodaysGoal(data: Omit<CreateMetaInput, 'data'>): Promise<Meta> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getByDate(today);

    if (existing) {
      return this.update(existing.id, data);
    } else {
      return this.create({ ...data, data: today } as CreateMetaInput);
    }
  }
};
