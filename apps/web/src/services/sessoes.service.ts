/**
 * Sessões (Study Sessions) Service
 * Handles study session CRUD operations
 */

import { apiCall, apiClient } from './api';
import { Sessao, CreateSessaoInput, UpdateSessaoInput } from '@/types';
import { NotFoundError } from '@/types';

export const SessoesService = {
  /**
   * Get all sessions for a user
   */
  async getByUser(): Promise<Sessao[]> {
    return apiCall(
      async () => {
        const records = await apiClient.get<Sessao[]>('/api/sessoes');
        return records;
      },
      'SessoesService.getByUser'
    );
  },

  /**
   * Get sessions by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Sessao[]> {
    return apiCall(
      async () => {
        const records = await apiClient.get<Sessao[]>(
          `/api/sessoes?startDate=${startDate}&endDate=${endDate}`
        );
        return records;
      },
      'SessoesService.getByDateRange'
    );
  },

  /**
   * Get sessions by date
   */
  async getByDate(date: string): Promise<Sessao[]> {
    return apiCall(
      async () => {
        const records = await apiClient.get<Sessao[]>(`/api/sessoes?data=${date}`);
        return records;
      },
      'SessoesService.getByDate'
    );
  },

  /**
   * Get sessions by schedule
   */
  async getByCronograma(cronogramaId: string): Promise<Sessao[]> {
    return apiCall(
      async () => {
        const records = await apiClient.get<Sessao[]>('/api/sessoes');
        return records.filter(s => s.cronograma_id === cronogramaId);
      },
      'SessoesService.getByCronograma'
    );
  },

  /**
   * Get single session by ID
   */
  async getById(id: string): Promise<Sessao> {
    return apiCall(
      async () => {
        try {
          const record = await apiClient.get<Sessao>(`/api/sessoes/${id}`);
          return record;
        } catch (err: any) {
          throw new NotFoundError('Sessão');
        }
      },
      'SessoesService.getById'
    );
  },

  /**
   * Create new session
   */
  async create(data: CreateSessaoInput): Promise<Sessao> {
    return apiCall(
      async () => {
        const record = await apiClient.post<Sessao>('/api/sessoes', data);
        return record;
      },
      'SessoesService.create'
    );
  },

  /**
   * Update session
   */
  async update(id: string, data: UpdateSessaoInput): Promise<Sessao> {
    return apiCall(
      async () => {
        const record = await apiClient.patch<Sessao>(`/api/sessoes/${id}`, data);
        return record;
      },
      'SessoesService.update'
    );
  },

  /**
   * Delete session
   */
  async delete(id: string): Promise<void> {
    return apiCall(
      async () => {
        await apiClient.delete(`/api/sessoes/${id}`);
      },
      'SessoesService.delete'
    );
  },

  /**
   * Get total duration of sessions in a date range
   */
  async getTotalDuration(startDate: string, endDate: string): Promise<number> {
    return apiCall(
      async () => {
        const records = await apiClient.get<Sessao[]>(
          `/api/sessoes?startDate=${startDate}&endDate=${endDate}`
        );

        const total = records.reduce(
          (sum, session) => sum + (session.duracao_minutos || 0),
          0
        );

        return total;
      },
      'SessoesService.getTotalDuration'
    );
  }
};
