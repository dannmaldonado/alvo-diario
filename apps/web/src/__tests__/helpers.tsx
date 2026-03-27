/**
 * Test Helpers
 * Shared utilities for testing with providers and mocks
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Render component with all required providers
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

/**
 * Mock successful auth response
 */
export const mockAuthResponse = {
  token: 'test-token-123',
  record: {
    id: 'user-1',
    email: 'test@example.com',
    nome: 'Test User',
    nivel_atual: 1,
    pontos_totais: 0,
    streak_atual: 0,
    meta_diaria_horas: 2,
    data_criacao: '2026-01-01T00:00:00Z',
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
  },
};

/**
 * Mock cronograma response
 */
export const mockCronogramaResponse = {
  id: 'cron-1',
  user_id: 'user-1',
  edital: 'ENEM 2026',
  materias: [
    {
      nome: 'Matemática',
      status: 'pendente',
      horas_dedicadas: 0,
    },
  ],
  data_inicio: '2026-01-01',
  data_fim: '2026-12-31',
  criado_em: '2026-01-01T00:00:00Z',
  created: '2026-01-01T00:00:00Z',
  updated: '2026-01-01T00:00:00Z',
};

/**
 * Mock session response
 */
export const mockSessionResponse = {
  id: 'sessao-1',
  user_id: 'user-1',
  cronograma_id: 'cron-1',
  materia: 'Matemática',
  duracao_minutos: 120,
  data_sessao: '2026-01-01',
  notas: 'Estudei derivadas',
  created: '2026-01-01T10:00:00Z',
  updated: '2026-01-01T10:00:00Z',
};

/**
 * Mock meta (goal) response
 */
export const mockMetaResponse = {
  id: 'meta-1',
  user_id: 'user-1',
  data: '2026-01-01',
  horas_meta: 2,
  horas_realizadas: 1.5,
  status: 'em_progresso',
  created: '2026-01-01T00:00:00Z',
  updated: '2026-01-01T10:00:00Z',
};

/**
 * Mock list response
 */
export const mockListResponse = <T,>(items: T[]) => ({
  page: 1,
  perPage: 10,
  totalItems: items.length,
  totalPages: 1,
  items,
});

export * from '@testing-library/react';
