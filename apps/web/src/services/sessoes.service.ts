/**
 * Sessões (Study Sessions) Service
 * Handles study session CRUD operations
 */

import { apiCall, pb } from './api';
import { Sessao, CreateSessaoInput, UpdateSessaoInput, PBListResponse } from '@/types';
import { NotFoundError } from '@/types';

export const SessoesService = {
  /**
   * Get all sessions for a user
   */
  async getByUser(userId: string): Promise<Sessao[]> {
    return apiCall(
      async () => {
        const records = await pb.collection('sessoes_estudo').getFullList({
          filter: `user_id = "${userId}"`,
          sort: '-data_sessao',
        });

        return records as unknown as Sessao[];
      },
      'SessoesService.getByUser'
    );
  },

  /**
   * Get sessions by date range
   */
  async getByDateRange(userId: string, startDate: string, endDate: string): Promise<Sessao[]> {
    return apiCall(
      async () => {
        const records = await pb.collection('sessoes_estudo').getFullList({
          filter: `user_id = "${userId}" && data_sessao >= "${startDate}" && data_sessao <= "${endDate}"`,
          sort: '-data_sessao',
        });

        return records as unknown as Sessao[];
      },
      'SessoesService.getByDateRange'
    );
  },

  /**
   * Get sessions by date
   */
  async getByDate(userId: string, date: string): Promise<Sessao[]> {
    return apiCall(
      async () => {
        const records = await pb.collection('sessoes_estudo').getFullList({
          filter: `user_id = "${userId}" && data_sessao = "${date}"`,
          sort: 'created',
        });

        return records as unknown as Sessao[];
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
        const records = await pb.collection('sessoes_estudo').getFullList({
          filter: `cronograma_id = "${cronogramaId}"`,
          sort: '-data_sessao',
        });

        return records as unknown as Sessao[];
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
        const record = await pb.collection('sessoes_estudo').getOne(id);
        if (!record) {
          throw new NotFoundError('Sessão');
        }
        return record as unknown as Sessao;
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
        const record = await pb.collection('sessoes_estudo').create(data);
        return record as unknown as Sessao;
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
        const record = await pb.collection('sessoes_estudo').update(id, data);
        return record as unknown as Sessao;
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
        await pb.collection('sessoes_estudo').delete(id);
      },
      'SessoesService.delete'
    );
  },

  /**
   * Get sessions with pagination
   */
  async getWithPagination(
    userId: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<PBListResponse<Sessao>> {
    return apiCall(
      async () => {
        const response = await pb.collection('sessoes_estudo').getList(page, perPage, {
          filter: `user_id = "${userId}"`,
          sort: '-data_sessao',
        });

        return response as unknown as PBListResponse<Sessao>;
      },
      'SessoesService.getWithPagination'
    );
  },

  /**
   * Get total duration of sessions in a date range
   */
  async getTotalDuration(userId: string, startDate: string, endDate: string): Promise<number> {
    return apiCall(
      async () => {
        const records = await pb.collection('sessoes_estudo').getFullList({
          filter: `user_id = "${userId}" && data_sessao >= "${startDate}" && data_sessao <= "${endDate}"`,
        });

        const total = records.reduce(
          (sum, session: any) => sum + (session.duracao_minutos || 0),
          0
        );

        return total;
      },
      'SessoesService.getTotalDuration'
    );
  },
};
