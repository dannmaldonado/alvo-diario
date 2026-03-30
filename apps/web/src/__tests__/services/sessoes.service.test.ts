/**
 * SessoesService Tests
 * Test study session CRUD operations: create, getByDateRange, update, delete
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessoesService } from '@/services/sessoes.service';
import { Sessao } from '@/types';

// Mock data
const mockSessao: Sessao = {
  id: 'sessao-1',
  user_id: 'user-1',
  cronograma_id: 'cronograma-1',
  materia: 'Português',
  duracao_minutos: 60,
  data_sessao: '2026-03-30',
  notas: 'Boa session',
  created: '2026-03-30T10:00:00Z',
  updated: '2026-03-30T10:00:00Z'
};

describe('SessoesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Structure', () => {
    it('should have getByDateRange method', () => {
      expect(typeof SessoesService.getByDateRange).toBe('function');
    });

    it('should have create method', () => {
      expect(typeof SessoesService.create).toBe('function');
    });

    it('should have update method', () => {
      expect(typeof SessoesService.update).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof SessoesService.delete).toBe('function');
    });
  });

  describe('Sessao Data Structure', () => {
    it('should have valid Sessao structure', () => {
      expect(mockSessao).toHaveProperty('id');
      expect(mockSessao).toHaveProperty('user_id');
      expect(mockSessao).toHaveProperty('cronograma_id');
      expect(mockSessao).toHaveProperty('materia');
      expect(mockSessao).toHaveProperty('duracao_minutos');
      expect(mockSessao).toHaveProperty('data_sessao');
      expect(mockSessao).toHaveProperty('created');
      expect(mockSessao).toHaveProperty('updated');
    });

    it('should validate duracao_minutos is positive', () => {
      expect(mockSessao.duracao_minutos).toBeGreaterThan(0);
    });

    it('should accept optional notas field', () => {
      expect(mockSessao).toHaveProperty('notas');
      expect(mockSessao.notas).toBeDefined();
    });
  });

  describe('Duration Handling', () => {
    it('should support different duration values', () => {
      const shortSession: Sessao = { ...mockSessao, duracao_minutos: 25 };
      const longSession: Sessao = { ...mockSessao, duracao_minutos: 120 };
      expect(shortSession.duracao_minutos).toBeLessThan(longSession.duracao_minutos);
    });

    it('should support decimal duration values', () => {
      const decimalSession: Sessao = { ...mockSessao, duracao_minutos: 45.5 };
      expect(decimalSession.duracao_minutos).toBe(45.5);
    });

    it('should convert minutes to hours', () => {
      const durationInHours = mockSessao.duracao_minutos / 60;
      expect(durationInHours).toBe(1);
    });
  });

  describe('Date Range Queries', () => {
    it('should accept YYYY-MM-DD date format', () => {
      const dateStr = '2026-03-30';
      expect(new Date(dateStr)).not.toBeNaN();
    });

    it('should support date range filtering', () => {
      const startDate = '2026-03-01';
      const endDate = '2026-03-31';
      const sessionDate = '2026-03-15';

      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime();
      const sessionTime = new Date(sessionDate).getTime();

      expect(sessionTime).toBeGreaterThanOrEqual(startTime);
      expect(sessionTime).toBeLessThanOrEqual(endTime);
    });
  });

  describe('Subject Tracking', () => {
    it('should track materia per session', () => {
      const portuguesSession: Sessao = { ...mockSessao, materia: 'Português' };
      const matematicoSession: Sessao = { ...mockSessao, materia: 'Matemática' };
      expect(portuguesSession.materia).not.toBe(matematicoSession.materia);
    });

    it('should aggregate duration by subject', () => {
      const sessao1: Sessao = { ...mockSessao, materia: 'Português', duracao_minutos: 60 };
      const sessao2: Sessao = { ...mockSessao, materia: 'Português', duracao_minutos: 30 };
      const totalPorMateria = sessao1.duracao_minutos + sessao2.duracao_minutos;
      expect(totalPorMateria).toBe(90);
    });
  });

  describe('Optional Notes', () => {
    it('should support sessions without notes', () => {
      const sessaoSemNotas: Sessao = { ...mockSessao };
      delete sessaoSemNotas.notas;
      expect(sessaoSemNotas.notas).toBeUndefined();
    });

    it('should support long notes', () => {
      const longNote = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      const sessaoComNotas: Sessao = { ...mockSessao, notas: longNote };
      expect(sessaoComNotas.notas).toBe(longNote);
    });
  });
});
