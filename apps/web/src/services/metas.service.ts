/**
 * Metas (Daily Goals) Service
 * Handles daily goal CRUD operations
 */

import { apiCall, pb } from './api';
import { Meta, CreateMetaInput, UpdateMetaInput, PBListResponse } from '@/types';
import { NotFoundError } from '@/types';

export const MetasService = {
  /**
   * Get all goals for a user
   */
  async getByUser(userId: string): Promise<Meta[]> {
    return apiCall(
      async () => {
        const records = await pb.collection('metas_diarias').getFullList({
          filter: `user_id = "${userId}"`,
          sort: '-data',
        });

        return records as unknown as Meta[];
      },
      'MetasService.getByUser'
    );
  },

  /**
   * Get goal by date
   */
  async getByDate(userId: string, date: string): Promise<Meta | null> {
    return apiCall(
      async () => {
        const records = await pb.collection('metas_diarias').getFullList({
          filter: `user_id = "${userId}" && data = "${date}"`,
        });

        return records.length > 0 ? (records[0] as unknown as Meta) : null;
      },
      'MetasService.getByDate'
    );
  },

  /**
   * Get goals in date range
   */
  async getByDateRange(userId: string, startDate: string, endDate: string): Promise<Meta[]> {
    return apiCall(
      async () => {
        const records = await pb.collection('metas_diarias').getFullList({
          filter: `user_id = "${userId}" && data >= "${startDate}" && data <= "${endDate}"`,
          sort: '-data',
        });

        return records as unknown as Meta[];
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
        const record = await pb.collection('metas_diarias').getOne(id);
        if (!record) {
          throw new NotFoundError('Meta');
        }
        return record as unknown as Meta;
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
        const record = await pb.collection('metas_diarias').create(data);
        return record as unknown as Meta;
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
        const record = await pb.collection('metas_diarias').update(id, data);
        return record as unknown as Meta;
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
        await pb.collection('metas_diarias').delete(id);
      },
      'MetasService.delete'
    );
  },

  /**
   * Get goals with pagination
   */
  async getWithPagination(
    userId: string,
    page: number = 1,
    perPage: number = 30
  ): Promise<PBListResponse<Meta>> {
    return apiCall(
      async () => {
        const response = await pb.collection('metas_diarias').getList(page, perPage, {
          filter: `user_id = "${userId}"`,
          sort: '-data',
        });

        return response as unknown as PBListResponse<Meta>;
      },
      'MetasService.getWithPagination'
    );
  },

  /**
   * Get today's goal
   */
  async getTodaysGoal(userId: string): Promise<Meta | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDate(userId, today);
  },

  /**
   * Create or update today's goal
   */
  async upsertTodaysGoal(userId: string, data: Omit<CreateMetaInput, 'data'>): Promise<Meta> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getByDate(userId, today);

    if (existing) {
      return this.update(existing.id, data);
    } else {
      return this.create({ ...data, data: today, user_id: userId });
    }
  },
};
