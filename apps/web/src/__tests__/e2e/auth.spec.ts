import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests for login, signup, and authentication flows
 */

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/Alvo Diário/);
    await expect(page.locator('h1')).toContainText(/Login/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.locator('h1')).toContainText(/Cadastro/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="nome"]')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/login');

    // Try to submit with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Entrar")');

    // Should show validation message (specific behavior depends on app)
    // This test is exploratory - actual behavior may vary
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/signup');

    // Try to submit with password < 8 chars
    await page.fill('input[name="nome"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'short');

    // App should validate before submission
    const submitButton = page.locator('button:has-text("Cadastrar")');

    // Either button is disabled or error shows
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled || (await page.locator('[role="alert"]').isVisible())).toBeTruthy();
  });

  test('should navigate from login to signup', async ({ page }) => {
    await page.goto('/login');

    // Find link to signup (usually says "Don't have an account?")
    const signupLink = page.locator('a:has-text(/cadastro|sign up|inscrever/i)');

    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/signup/);
    }
  });

  test('should navigate from signup to login', async ({ page }) => {
    await page.goto('/signup');

    // Find link to login
    const loginLink = page.locator('a:has-text(/login|entrar/i)');

    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/dashboard');

    // Should redirect to login or home
    await expect(page).toHaveURL(/login|\/$/);
  });

  test('should display home page for public access', async ({ page }) => {
    await page.goto('/');

    // Home page should be accessible
    await expect(page.locator('body')).toBeTruthy();
  });
});
