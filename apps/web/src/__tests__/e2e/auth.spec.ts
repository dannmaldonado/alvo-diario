import { test, expect } from '@playwright/test';
import { test as authTest, expect as authExpect, TEST_USER } from './fixtures/auth.fixture';

/**
 * Authentication E2E Tests
 * Covers: signup, login, validation, navigation, protected route redirect
 *
 * AC: User signup -> login -> dashboard
 * AC: Error handling (validation)
 */

test.describe('Authentication — Public Pages', () => {
  test('login page renders form elements correctly', async ({ page }) => {
    await page.goto('/login');

    // Title
    await expect(page).toHaveTitle(/Entrar.*Alvo Diário/i);

    // Heading
    await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible();

    // Form fields
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();

    // Link to signup
    await expect(page.getByRole('link', { name: /criar conta/i })).toBeVisible();
  });

  test('signup page renders form elements correctly', async ({ page }) => {
    await page.goto('/signup');

    await expect(page).toHaveTitle(/Criar Conta.*Alvo Diário/i);
    await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible();

    // All four fields
    await expect(page.locator('input[name="nome"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="passwordConfirm"]')).toBeVisible();

    // Submit
    await expect(page.getByRole('button', { name: /criar conta/i })).toBeVisible();

    // Link to login (use .nth(1) to skip header nav link)
    const formEntrarLink = page.locator('form ~ div').getByRole('link', { name: /entrar/i });
    await expect(formEntrarLink).toBeVisible();
  });

  test('login form shows validation error for invalid email', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    // Type invalid email and valid password
    await emailInput.fill('not-an-email');
    await passwordInput.fill('validpassword123');

    // The real-time validator should flag the email
    // Check for error text near the email field
    await expect(page.getByText(/email inválido/i)).toBeVisible();
  });

  test('login form shows validation error for short password', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('short');

    // Real-time validator flags password
    await expect(page.getByText(/mínimo 8 caracteres/i)).toBeVisible();
  });

  test('signup form shows validation error for mismatched passwords', async ({ page }) => {
    await page.goto('/signup');

    await page.locator('input[name="nome"]').fill('Test User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('validpass123');
    await page.locator('input[name="passwordConfirm"]').fill('different123');

    await expect(page.getByText(/senhas não coincidem/i)).toBeVisible();
  });

  test('submit button is disabled when form has validation errors', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[name="email"]').fill('bad');
    await page.locator('input[name="password"]').fill('ok');

    // Button should be disabled due to field errors
    await expect(page.getByRole('button', { name: /entrar/i })).toBeDisabled();
  });

  test('navigates from login to signup and back', async ({ page }) => {
    await page.goto('/login');

    // Click "Criar conta" link
    await page.getByRole('link', { name: /criar conta/i }).click();
    await expect(page).toHaveURL(/\/signup/);

    // Click "Entrar" link back (use nth(1) to skip header nav link)
    await page.getByRole('link', { name: /entrar/i }).nth(1).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected to /login from protected route', async ({ page }) => {
    // Go directly to a protected route
    await page.goto('/dashboard');

    // ProtectedRoute redirects to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from /cronograma', async ({ page }) => {
    await page.goto('/cronograma');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from /study-session', async ({ page }) => {
    await page.goto('/study-session');
    await expect(page).toHaveURL(/\/login/);
  });

  test('home page is publicly accessible', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Alvo Diário/i);
    // Hero section CTA buttons (use .first() since header also has matching links)
    await expect(page.getByRole('link', { name: /começar/i }).first()).toBeVisible();
  });
});

authTest.describe('Authentication — Authenticated State', () => {
  authTest('authenticated user can access dashboard', async ({ authedPage: page }) => {
    await page.goto('/dashboard');

    // Should NOT redirect to login
    await authExpect(page).not.toHaveURL(/\/login/);

    // Dashboard should have content
    await authExpect(page.locator('body')).toBeVisible();
  });

  authTest('authenticated user can access cronograma', async ({ authedPage: page }) => {
    await page.goto('/cronograma');
    await authExpect(page).not.toHaveURL(/\/login/);
  });

  authTest('authenticated user can access study session', async ({ authedPage: page }) => {
    await page.goto('/study-session');
    await authExpect(page).not.toHaveURL(/\/login/);
  });
});
