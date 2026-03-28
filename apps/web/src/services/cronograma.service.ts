/**
 * Cronograma Service
 * Handles schedule/calendar CRUD operations
 */

import { apiCall, pb } from './api';
import {
  Cronograma,
  CreateCronogramaInput,
  UpdateCronogramaInput,
  PBListResponse,
} from '@/types';
import { NotFoundError } from '@/types';

export const CronogramaService = {
  /**
   * Get all schedules for current user
   */
  async getAll(userId: string): Promise<Cronograma[]> {
    return apiCall(
      async () => {
        const records = await pb.collection('cronogramas').getFullList({
          filter: `user_id = "${userId}"`,
          sort: '-created',
        });

        return records as unknown as Cronograma[];
      },
      'CronogramaService.getAll'
    );
  },

  /**
   * Get active schedule for current user (latest created)
   */
  async getActive(userId: string): Promise<Cronograma | null> {
    return apiCall(
      async () => {
        try {
          const record = await pb.collection('cronogramas').getFirstListItem(`user_id = "${userId}"`, {
            sort: '-created',
          });
          return record as unknown as Cronograma;
        } catch (err: any) {
          if (err.status === 404) return null;
          throw err;
        }
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
        const record = await pb.collection('cronogramas').getOne(id);
        if (!record) {
          throw new NotFoundError('Cronograma');
        }
        return record as unknown as Cronograma;
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
        const record = await pb.collection('cronogramas').create(data);
        return record as unknown as Cronograma;
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
        const record = await pb.collection('cronogramas').update(id, data);
        return record as unknown as Cronograma;
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
        await pb.collection('cronogramas').delete(id);
      },
      'CronogramaService.delete'
    );
  },

  /**
   * Get schedule with pagination
   */
  async getWithPagination(
    userId: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<PBListResponse<Cronograma>> {
    return apiCall(
      async () => {
        const response = await pb.collection('cronogramas').getList(page, perPage, {
          filter: `user_id = "${userId}"`,
          sort: '-created',
        });

        return response as unknown as PBListResponse<Cronograma>;
      },
      'CronogramaService.getWithPagination'
    );
  },
};
