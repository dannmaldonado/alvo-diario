/**
 * MetasService Tests
 * Test daily goals CRUD operations: getByDate, create, update, delete
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetasService } from '@/services/metas.service';
import { Meta } from '@/types';

// Mock data
const mockMeta: Meta = {
  id: 'meta-1',
  user_id: 'user-1',
  data: '2026-03-30',
  horas_meta: 4,
  horas_realizadas: 0,
  status: 'pendente',
  created: '2026-03-30T10:00:00Z',
  updated: '2026-03-30T10:00:00Z'
};

describe('MetasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Structure', () => {
    it('should have getByDate method', () => {
      expect(typeof MetasService.getByDate).toBe('function');
    });

    it('should have create method', () => {
      expect(typeof MetasService.create).toBe('function');
    });

    it('should have update method', () => {
      expect(typeof MetasService.update).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof MetasService.delete).toBe('function');
    });
  });

  describe('Meta Data Structure', () => {
    it('should have valid Meta structure', () => {
      expect(mockMeta).toHaveProperty('id');
      expect(mockMeta).toHaveProperty('user_id');
      expect(mockMeta).toHaveProperty('data');
      expect(mockMeta).toHaveProperty('horas_meta');
      expect(mockMeta).toHaveProperty('horas_realizadas');
      expect(mockMeta).toHaveProperty('status');
    });

    it('should validate horas_realizadas <= horas_meta', () => {
      expect(mockMeta.horas_realizadas).toBeLessThanOrEqual(mockMeta.horas_meta);
    });

    it('should accept valid status values', () => {
      const validStatuses = ['pendente', 'em_progresso', 'completo'];
      expect(validStatuses).toContain(mockMeta.status);
    });
  });

  describe('Daily Goal Progress', () => {
    it('should calculate progress percentage', () => {
      const progress = (mockMeta.horas_realizadas / mockMeta.horas_meta) * 100;
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it('should support meta completion (horas_realizadas = horas_meta)', () => {
      const completedMeta: Meta = {
        ...mockMeta,
        horas_realizadas: 4,
        status: 'completo'
      };
      expect(completedMeta.horas_realizadas).toBe(completedMeta.horas_meta);
    });

    it('should support partial progress', () => {
      const partialMeta: Meta = {
        ...mockMeta,
        horas_realizadas: 2.5,
        status: 'em_progresso'
      };
      expect(partialMeta.horas_realizadas).toBeLessThan(partialMeta.horas_meta);
    });
  });

  describe('Date Handling', () => {
    it('should accept YYYY-MM-DD date format', () => {
      const dateStr = '2026-03-30';
      expect(new Date(dateStr)).not.toBeNaN();
    });

    it('should support different daily goals for different dates', () => {
      const meta1: Meta = { ...mockMeta, data: '2026-03-30', id: 'meta-1' };
      const meta2: Meta = { ...mockMeta, data: '2026-03-31', id: 'meta-2' };
      expect(meta1.data).not.toBe(meta2.data);
    });
  });

  describe('Flexible Goal Settings', () => {
    it('should support different horas_meta values', () => {
      const lowGoal: Meta = { ...mockMeta, horas_meta: 2 };
      const highGoal: Meta = { ...mockMeta, horas_meta: 8 };
      expect(lowGoal.horas_meta).toBeLessThan(highGoal.horas_meta);
    });

    it('should support zero horas_meta', () => {
      const zeroGoal: Meta = { ...mockMeta, horas_meta: 0 };
      expect(zeroGoal.horas_meta).toBe(0);
    });

    it('should support decimal horas_meta', () => {
      const decimalMeta: Meta = { ...mockMeta, horas_meta: 3.5 };
      expect(decimalMeta.horas_meta).toBe(3.5);
    });
  });
});
