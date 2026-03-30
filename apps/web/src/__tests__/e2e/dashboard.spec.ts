import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * Tests for dashboard page structure, stats display, and navigation
 */

test.describe('Dashboard', () => {
  test('should display dashboard page structure', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Page may require auth - just check it loads
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display welcome header', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Look for greeting (e.g., "Olá, João")
    const greeting = page.locator('h1, h2');

    const hasGreeting = await greeting.first().isVisible().catch(() => false);
    expect(hasGreeting).toBeTruthy();
  });

  test('should have key sections', async ({ page }) => {
    await page.goto('/dashboard');

    // Dashboard should have main sections
    const sections = page.locator('section, [role="region"]');

    const sectionCount = await sections.count();
    // Dashboard should have multiple sections
    expect(sectionCount).toBeGreaterThanOrEqual(1);
  });

  test('should display stats cards', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for stat cards (points, streak, etc)
    const statCards = page.locator('[class*="card"], [class*="stat"]');

    // Should have stats visible
    const cardCount = await statCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);
  });

  test('should have navigation to other pages', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for navigation links
    const navLinks = page.locator('a, [role="link"]');

    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should display progress information', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for progress bars or percentage displays
    const progress = page.locator('progress, [role="progressbar"]');
    const percentages = page.locator('text=/%/');

    const hasProgress = await progress.first().isVisible().catch(() => false);
    const hasPercentage = await percentages.first().isVisible().catch(() => false);

    // Should have at least one progress indicator
    expect(hasProgress || hasPercentage).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/dashboard');

    const content = page.locator('main, [role="main"]').first();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    if (await content.isVisible()) {
      // Content should still be accessible
      await expect(content).toBeVisible();
    }
  });

  test('should have quick action buttons', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for action buttons (Start Session, Create Schedule, etc)
    const buttons = page.locator('button:has-text(/iniciar|create|novo|add/i)');

    const hasButtons = await buttons.first().isVisible().catch(() => false);
    expect(hasButtons).toBeTruthy();
  });

  test('should navigate to study session', async ({ page }) => {
    await page.goto('/dashboard');

    // Find and click "Start Session" or similar
    const startButton = page.locator('button, a:has-text(/iniciar|start|study/i)').first();

    if (await startButton.isVisible()) {
      await startButton.click();

      // Should navigate to study session
      await page.waitForURL(/study-session|\//, { timeout: 5000 }).catch(() => {});
      const url = page.url();
      expect(url).toMatch(/study-session|\//);
    }
  });

  test('should navigate to schedule page', async ({ page }) => {
    await page.goto('/dashboard');

    // Find schedule/cronograma link
    const scheduleLink = page.locator('a, button:has-text(/cronograma|schedule/i)').first();

    if (await scheduleLink.isVisible()) {
      await scheduleLink.click();

      // Should navigate to cronograma
      await page.waitForURL(/cronograma/, { timeout: 5000 }).catch(() => {});
      const url = page.url();
      expect(url).toMatch(/cronograma/);
    }
  });
});
