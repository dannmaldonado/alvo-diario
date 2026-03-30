import { test, expect } from '@playwright/test';

/**
 * Study Session E2E Tests
 * Tests for starting sessions, timer functionality, and session completion
 */

test.describe('Study Session', () => {
  test('should display study session page', async ({ page }) => {
    // Smoke test for page structure
    await page.goto('/study-session', { waitUntil: 'networkidle' });

    // Page should load
    await expect(page.locator('body')).toBeVisible();

    // Check for session controls
    const sessionContent = page.locator('main, [role="main"]');
    const isVisible = await sessionContent.first().isVisible().catch(() => false);

    expect(isVisible).toBeTruthy();
  });

  test('should display timer elements', async ({ page }) => {
    await page.goto('/study-session', { waitUntil: 'networkidle' });

    // Look for timer display (should show time like "25:00")
    const timerDisplay = page.locator('text=/\\d+:\\d+/');

    const hasTimer = await timerDisplay.first().isVisible().catch(() => false);
    expect(hasTimer).toBeTruthy();
  });

  test('should have start/pause button', async ({ page }) => {
    await page.goto('/study-session');

    // Look for play/pause button
    const playButton = page.locator('button:has-text(/start|iniciar|play/i)');
    const pauseButton = page.locator('button:has-text(/pause|pausar/i)');

    const hasPlayButton = await playButton.isVisible().catch(() => false);
    const hasPauseButton = await pauseButton.isVisible().catch(() => false);

    expect(hasPlayButton || hasPauseButton).toBeTruthy();
  });

  test('should have reset button', async ({ page }) => {
    await page.goto('/study-session');

    const resetButton = page.locator('button:has-text(/reset|restart|reiniciar/i)');

    const hasReset = await resetButton.isVisible().catch(() => false);
    expect(hasReset).toBeTruthy();
  });

  test('should have subject selector', async ({ page }) => {
    await page.goto('/study-session');

    // Look for subject selection (dropdown or buttons)
    const selectElement = page.locator('select');
    const subjectButtons = page.locator('button:has-text(/matéria|subject|português|matemática/i)');

    const hasSelect = await selectElement.first().isVisible().catch(() => false);
    const hasSubjectButtons = await subjectButtons.first().isVisible().catch(() => false);

    expect(hasSelect || hasSubjectButtons).toBeTruthy();
  });

  test('should have duration settings', async ({ page }) => {
    await page.goto('/study-session');

    // Look for duration inputs
    const inputs = page.locator('input[type="number"]');

    const hasInputs = await inputs.first().isVisible().catch(() => false);
    expect(hasInputs).toBeTruthy();
  });

  test('should display responsive layout', async ({ page }) => {
    await page.goto('/study-session');

    const content = page.locator('main, [role="main"]').first();

    if (await content.isVisible()) {
      // Desktop size
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(content).toBeVisible();

      // Mobile size
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(content).toBeVisible();
    }
  });

  test('should navigate from dashboard to study session', async ({ page }) => {
    // Start at home
    await page.goto('/');

    // Try to find "Start Study" button
    const studyButton = page.locator('button, a:has-text(/iniciar|start|estudo/i)').first();

    if (await studyButton.isVisible()) {
      await studyButton.click();

      // Should navigate to study session or login
      const url = page.url();
      expect(url).toMatch(/study-session|login|signup/);
    }
  });

  test('should have keyboard shortcuts info (optional)', async ({ page }) => {
    await page.goto('/study-session');

    // Look for help/shortcuts section
    const helpText = page.locator('text=/atalho|shortcut|tecla/i');

    // Optional - may or may not be present
    const hasHelp = await helpText.isVisible().catch(() => false);
    // Don't assert - just checking if feature exists
  });
});
