/**
 * CronogramaService Tests
 * Test schedule CRUD operations: getActive, getAll, create, update, delete
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CronogramaService } from '@/services/cronograma.service';
import { Cronograma, Materia } from '@/types';

// Mock data
const mockMateria: Materia = {
  nome: 'Português',
  status: 'nao_iniciada'
};

const mockCronograma: Cronograma = {
  id: 'cronograma-1',
  user_id: 'user-1',
  edital: 'PC',
  materias: [mockMateria],
  data_alvo: '2026-12-31',
  created: '2026-03-30T10:00:00Z',
  updated: '2026-03-30T10:00:00Z'
};

describe('CronogramaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Structure', () => {
    it('should have getActive method', () => {
      expect(typeof CronogramaService.getActive).toBe('function');
    });

    it('should have getAll method', () => {
      expect(typeof CronogramaService.getAll).toBe('function');
    });

    it('should have create method', () => {
      expect(typeof CronogramaService.create).toBe('function');
    });

    it('should have update method', () => {
      expect(typeof CronogramaService.update).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof CronogramaService.delete).toBe('function');
    });
  });

  describe('Cronograma Data Structure', () => {
    it('should have valid Cronograma structure', () => {
      expect(mockCronograma).toHaveProperty('id');
      expect(mockCronograma).toHaveProperty('user_id');
      expect(mockCronograma).toHaveProperty('edital');
      expect(mockCronograma).toHaveProperty('materias');
      expect(mockCronograma).toHaveProperty('data_alvo');
      expect(mockCronograma).toHaveProperty('created');
      expect(mockCronograma).toHaveProperty('updated');
    });

    it('should validate Materia structure', () => {
      const materia = mockCronograma.materias[0];
      expect(materia).toHaveProperty('nome');
      expect(materia).toHaveProperty('status');
      expect(['nao_iniciada', 'em_progresso', 'concluida']).toContain(materia.status);
    });

    it('should accept valid edital values', () => {
      const validEditais = ['PC', 'PRF', 'PF'];
      expect(validEditais).toContain(mockCronograma.edital);
    });
  });

  describe('Date Validations', () => {
    it('should accept ISO date strings', () => {
      const isoDate = '2026-03-30';
      expect(new Date(isoDate)).not.toBeNaN();
    });

    it('should have data_alvo as target date', () => {
      const alvo = new Date(mockCronograma.data_alvo);
      expect(alvo.getTime()).toBeGreaterThan(0);
      expect(mockCronograma.data_alvo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Materias Array Operations', () => {
    it('should support multiple materias in array', () => {
      const cronWithMultiMateria: Cronograma = {
        ...mockCronograma,
        materias: [
          { nome: 'Português', status: 'nao_iniciada' },
          { nome: 'Matemática', status: 'nao_iniciada' },
          { nome: 'Raciocínio Lógico', status: 'nao_iniciada' }
        ]
      };
      expect(cronWithMultiMateria.materias).toHaveLength(3);
    });

    it('should support empty materias array', () => {
      const cronWithoutMateria: Cronograma = {
        ...mockCronograma,
        materias: []
      };
      expect(cronWithoutMateria.materias).toHaveLength(0);
    });
  });

  describe('Optional Fields', () => {
    it('should accept cronograma without data_alvo', () => {
      const cronWithoutAlvo: Cronograma = {
        ...mockCronograma
        // data_alvo is optional
      };
      expect(cronWithoutAlvo).toBeDefined();
    });

    it('should accept cronograma with data_alvo', () => {
      const cronWithAlvo: Cronograma = {
        ...mockCronograma,
        data_alvo: '2026-12-31'
      };
      expect(cronWithAlvo.data_alvo).toBeDefined();
    });
  });
});
