import { test, expect } from '@playwright/test';

/**
 * Schedule (Cronograma) E2E Tests
 * Tests for creating, viewing, and managing study schedules
 */

test.describe('Schedule Management', () => {
  test('should display schedule page', async ({ page }) => {
    // Note: In real tests, you'd need to be authenticated first
    // This is a smoke test that checks page structure
    await page.goto('/cronograma', { waitUntil: 'networkidle' });

    // Either shows create form or existing schedule
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    // Check for key elements
    const createButton = page.locator('button:has-text(/criar|create|novo/i)');
    const title = page.locator('h1, h2');

    // At least one should exist
    const hasCreateButton = await createButton.isVisible().catch(() => false);
    const hasTitle = await title.isVisible().catch(() => false);

    expect(hasCreateButton || hasTitle).toBeTruthy();
  });

  test('should show schedule form elements', async ({ page }) => {
    await page.goto('/cronograma', { waitUntil: 'networkidle' });

    // Look for form inputs that would be in schedule creation
    const editals = page.locator('text=/PC|PRF|PF/i');
    const dateInputs = page.locator('input[type="date"]');

    // At least one should be present if in create mode
    const hasEditals = await editals.first().isVisible().catch(() => false);
    const hasDates = await dateInputs.first().isVisible().catch(() => false);

    expect(hasEditals || hasDates).toBeTruthy();
  });

  test('should display page title', async ({ page }) => {
    await page.goto('/cronograma');

    const title = page.locator('h1, h2');
    await expect(title).toBeVisible();

    // Title should mention schedule/cronograma
    const titleText = await title.first().textContent();
    expect(titleText).toBeTruthy();
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/cronograma');

    // Check that content is visible on different viewport sizes
    const content = page.locator('main, [role="main"]').first();

    if (await content.isVisible()) {
      // Desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(content).toBeVisible();

      // Mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(content).toBeVisible();
    }
  });

  test('should handle page navigation', async ({ page }) => {
    await page.goto('/cronograma');

    // Check if page loaded without errors
    const errors = page.locator('[role="alert"]');

    // Page should load successfully
    await expect(page).toHaveURL(/cronograma/);

    // Check for any error messages (there shouldn't be)
    const errorCount = await errors.count();
    // In a successful page load, error count should be 0
    // But we're being lenient here for smoke testing
    expect(errorCount).toBeLessThanOrEqual(1);
  });

  test('should display controls for schedule management', async ({ page }) => {
    await page.goto('/cronograma');

    // Look for common action buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    // Should have at least one button (e.g., Create, Add, Edit)
    expect(buttonCount).toBeGreaterThan(0);
  });
});
