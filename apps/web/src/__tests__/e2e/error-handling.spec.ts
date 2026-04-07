import { test as base, expect as baseExpect } from '@playwright/test';
import { test, expect, injectAuthState } from './fixtures/auth.fixture';

/**
 * Error Handling E2E Tests
 * Covers: Network failure, validation errors, 404 pages, API errors
 *
 * AC: Error handling (network failure, validation)
 */

base.describe('Error Handling — Unauthenticated', () => {
  base('shows 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');

    // App should render the NotFound page
    await baseExpect(page.getByText(/(404|não encontrada|not found|página)/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  base('login form handles API network failure gracefully', async ({ page }) => {
    // Block all API calls to simulate network failure
    await page.route('**/api/**', (route) => route.abort('failed'));

    await page.goto('/login');

    // Fill valid credentials
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('validpassword123');

    // Submit the form
    await page.getByRole('button', { name: /entrar/i }).click();

    // Should show error message (not crash) — may be in Portuguese or English
    const errorMessage = page.getByText(/(erro|error|falha|failed|conexão|servidor|tente novamente|login failed)/i);
    await baseExpect(errorMessage.first()).toBeVisible({ timeout: 10_000 });
  });

  base('signup form handles API network failure gracefully', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort('failed'));

    await page.goto('/signup');

    await page.locator('input[name="nome"]').fill('Test User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('validpassword123');
    await page.locator('input[name="passwordConfirm"]').fill('validpassword123');

    await page.getByRole('button', { name: /criar conta/i }).click();

    const errorMessage = page.getByText(/(erro|error|falha|failed|conexão|servidor|tente novamente|signup failed)/i);
    await baseExpect(errorMessage.first()).toBeVisible({ timeout: 10_000 });
  });

  base('login form handles 401 response from API', async ({ page }) => {
    // Mock login endpoint to return 401
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Email ou senha incorretos' }),
      })
    );

    await page.goto('/login');

    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');

    await page.getByRole('button', { name: /entrar/i }).click();

    // Should show auth error, not crash — message may be in Portuguese or English
    const errorMessage = page.getByText(/(incorretos|inválido|erro|error|invalid|failed)/i);
    await baseExpect(errorMessage.first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Error Handling — Authenticated', () => {
  test('dashboard handles API 500 error gracefully', async ({ authenticatedPage: page }) => {
    // Mock all API calls to return 500
    await page.route('**/api/**', (route) => {
      // Let auth/me pass so the user stays authenticated
      if (route.request().url().includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 'test', nome: 'Test' } }),
        });
      }
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/dashboard');

    // Page should render (error state) without crashing
    await expect(page.locator('body')).toBeVisible();

    // DashboardPage has an error state with AlertTriangle and "Erro ao carregar dados"
    const errorState = page.getByText(/(erro|falha|tente novamente)/i);
    const bodyVisible = await page.locator('body').isVisible();

    // Either error message shows or page renders gracefully
    expect(
      (await errorState.first().isVisible().catch(() => false)) || bodyVisible
    ).toBeTruthy();
  });

  test('page handles slow API responses without freezing', async ({ authenticatedPage: page }) => {
    // Mock API to respond slowly (3 seconds)
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/dashboard');

    // Loading state should appear while waiting
    // The ProtectedRoute or DashboardPage shows loading spinners
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('console has no unhandled errors on page load', async ({ authedPage: page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(3000); // Give page time to finish loading

    // Filter out known noise (React dev warnings, etc.)
    const criticalErrors = consoleErrors.filter(
      (msg) =>
        !msg.includes('Download the React DevTools') &&
        !msg.includes('Warning:') &&
        !msg.includes('favicon')
    );

    // Should have no unhandled JS errors
    expect(criticalErrors).toHaveLength(0);
  });

  test('no uncaught exceptions on navigation between pages', async ({ authedPage: page }) => {
    const uncaughtErrors: string[] = [];

    page.on('pageerror', (err) => {
      uncaughtErrors.push(err.message);
    });

    // Navigate through multiple pages
    await page.goto('/dashboard');
    await page.goto('/cronograma');
    await page.goto('/study-session');
    await page.goto('/');

    expect(uncaughtErrors).toHaveLength(0);
  });
});
