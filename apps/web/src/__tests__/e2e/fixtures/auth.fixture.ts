import { test as base, Page } from '@playwright/test';

/**
 * Test user data used across all authenticated E2E tests.
 * Matches the User type shape from @/types.
 */
export const TEST_USER = {
  id: 'test-user-e2e-001',
  email: 'e2e-test@alvodiario.com',
  nome: 'E2E Test User',
  pontos_totais: 150,
  streak_atual: 5,
  nivel_atual: 2,
  meta_diaria_horas: 4,
  created: '2026-01-01T00:00:00Z',
  updated: '2026-04-01T00:00:00Z',
};

export const TEST_TOKEN = 'e2e-test-token-fake-jwt-abc123';

const TODAY = new Date().toISOString().split('T')[0];

/**
 * Inject auth state into localStorage so ProtectedRoute sees the user
 * as authenticated without hitting the real API.
 */
async function injectAuthState(page: Page) {
  await page.addInitScript(
    ({ user, token }) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { user: TEST_USER, token: TEST_TOKEN }
  );
}

/**
 * Clear auth state from localStorage.
 */
async function clearAuthState(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  });
}

/**
 * Mock API responses for common endpoints so tests don't depend
 * on a running backend.
 *
 * IMPORTANT: Services call apiClient.get<T>() which returns response.json()
 * directly. So API responses must be the raw data shape (array for list
 * endpoints, object for single endpoints), NOT wrapped in { key: data }.
 */
async function setupAPIMocks(page: Page) {
  // Mock: GET /api/auth/me (session validation) - returns User directly
  await page.route('**/api/auth/me', (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...TEST_USER, nome: 'Updated Name' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TEST_USER),
    });
  });

  // Mock: GET /api/cronogramas?user_id=... → returns Cronograma[] directly
  await page.route('**/api/cronogramas?*', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'cron-001',
            user_id: TEST_USER.id,
            edital: 'PC-SP 2026',
            ativo: true,
            materias: [
              { nome: 'Direito Penal', peso: 3, status: 'pendente' },
              { nome: 'Direito Constitucional', peso: 2, status: 'pendente' },
              { nome: 'Legislacao Especial', peso: 2, status: 'pendente' },
            ],
            data_inicio: '2026-01-15',
            data_fim: '2026-12-15',
            created: '2026-01-15T00:00:00Z',
            updated: '2026-03-01T00:00:00Z',
          },
        ]),
      });
    }
    return route.continue();
  });

  // Mock: POST /api/cronogramas → returns single Cronograma
  await page.route('**/api/cronogramas', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: `cron-${Date.now()}`,
          user_id: TEST_USER.id,
          edital: 'PRF 2026',
          ativo: true,
          materias: [{ nome: 'Direito Penal', peso: 3, status: 'pendente' }],
          data_inicio: '2026-06-01',
          data_fim: '2026-12-31',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        }),
      });
    }
    // GET without query params (shouldn't happen, but fallback)
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    return route.continue();
  });

  // Mock: PATCH/DELETE /api/cronogramas/:id
  await page.route(/\/api\/cronogramas\/[^?]+/, (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'cron-001',
          user_id: TEST_USER.id,
          edital: 'PC-SP 2026 - Atualizado',
          ativo: true,
          materias: [{ nome: 'Direito Penal', peso: 3, status: 'pendente' }],
          created: '2026-01-15T00:00:00Z',
          updated: new Date().toISOString(),
        }),
      });
    }
    if (route.request().method() === 'DELETE') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'cron-001',
          user_id: TEST_USER.id,
          edital: 'PC-SP 2026',
          ativo: true,
          materias: [
            { nome: 'Direito Penal', peso: 3, status: 'pendente' },
            { nome: 'Direito Constitucional', peso: 2, status: 'pendente' },
            { nome: 'Legislacao Especial', peso: 2, status: 'pendente' },
          ],
          data_inicio: '2026-01-15',
          data_fim: '2026-12-15',
          created: '2026-01-15T00:00:00Z',
          updated: '2026-03-01T00:00:00Z',
        }),
      });
    }
    return route.continue();
  });

  // Mock: GET /api/sessoes (all variants) → returns Sessao[] directly
  await page.route('**/api/sessoes*', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'sess-001',
            user_id: TEST_USER.id,
            cronograma_id: 'cron-001',
            materia: 'Direito Penal',
            duracao_minutos: 45,
            data_sessao: TODAY,
            fase_revisao: true,
            fase_estudo: true,
            fase_questoes: false,
            notas: 'Revisao do capitulo 3',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
          {
            id: 'sess-002',
            user_id: TEST_USER.id,
            cronograma_id: 'cron-001',
            materia: 'Direito Constitucional',
            duracao_minutos: 30,
            data_sessao: TODAY,
            fase_revisao: true,
            fase_estudo: false,
            fase_questoes: true,
            notas: '',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        ]),
      });
    }
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: `sess-${Date.now()}`,
          user_id: TEST_USER.id,
          cronograma_id: 'cron-001',
          materia: 'Direito Penal',
          duracao_minutos: 25,
          data_sessao: TODAY,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        }),
      });
    }
    return route.continue();
  });

  // Mock: GET /api/metas?user_id=... → returns Meta[] directly
  await page.route('**/api/metas?*', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'meta-001',
            user_id: TEST_USER.id,
            data: TODAY,
            horas_meta: 4,
            horas_realizadas: 1.5,
            status: 'em_andamento',
            created: TODAY,
            updated: TODAY,
          },
        ]),
      });
    }
    return route.continue();
  });

  // Mock: GET /api/metas/by-date/:date → returns Meta | null
  await page.route('**/api/metas/by-date/*', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'meta-001',
          user_id: TEST_USER.id,
          data: TODAY,
          horas_meta: 4,
          horas_realizadas: 1.5,
          status: 'em_andamento',
          created: TODAY,
          updated: TODAY,
        }),
      });
    }
    return route.continue();
  });

  // Mock: POST /api/metas → returns single Meta
  await page.route('**/api/metas', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: `meta-${Date.now()}`,
          user_id: TEST_USER.id,
          data: TODAY,
          horas_meta: 4,
          horas_realizadas: 0,
          status: 'pendente',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        }),
      });
    }
    return route.continue();
  });

  // Mock: GET /api/exames → returns ExameDiario[] directly
  await page.route('**/api/exames*', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    return route.continue();
  });

  // Mock: PATCH /api/users/:id → returns User directly
  await page.route('**/api/users/*', (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...TEST_USER, nome: 'Updated Name' }),
      });
    }
    return route.continue();
  });
}

// ============================================================================
// Custom test fixtures
// ============================================================================

type AuthFixtures = {
  /** Page with auth state already injected (no API mocks) */
  authenticatedPage: Page;
  /** Page with auth state AND full API mocks */
  authedPage: Page;
};

/* eslint-disable react-hooks/rules-of-hooks -- Playwright fixture `use` callback is not a React hook */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await injectAuthState(page);
    await use(page);
  },

  authedPage: async ({ page }, use) => {
    await injectAuthState(page);
    await setupAPIMocks(page);
    await use(page);
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

export { expect } from '@playwright/test';
export { clearAuthState, injectAuthState, setupAPIMocks };
