import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers
 * Shared utilities for common test patterns
 */

/**
 * Wait for page to be fully loaded (network idle + DOM ready)
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Check if an error toast/alert is visible on the page
 */
export async function hasErrorMessage(page: Page): Promise<boolean> {
  const errorSelectors = [
    '[role="alert"]',
    '.text-destructive',
    '[class*="error"]',
  ];

  for (const selector of errorSelectors) {
    const visible = await page.locator(selector).first().isVisible().catch(() => false);
    if (visible) return true;
  }
  return false;
}

/**
 * Fill a form by input name-value pairs and submit
 */
export async function fillAndSubmitForm(
  page: Page,
  fields: Record<string, string>,
  submitSelector = 'button[type="submit"]'
) {
  for (const [name, value] of Object.entries(fields)) {
    await page.locator(`input[name="${name}"], textarea[name="${name}"]`).fill(value);
  }
  await page.locator(submitSelector).click();
}

/**
 * Assert no horizontal overflow on the page (responsive check)
 */
export async function assertNoHorizontalOverflow(page: Page, tolerance = 5) {
  const bodyWidth = await page.locator('body').evaluate((el) => el.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + tolerance);
}

/**
 * Capture console errors during a callback
 */
export async function captureConsoleErrors(
  page: Page,
  callback: () => Promise<void>
): Promise<string[]> {
  const errors: string[] = [];

  const handler = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  };

  page.on('console', handler);
  await callback();
  page.off('console', handler);

  return errors;
}

/**
 * Capture uncaught page errors during a callback
 */
export async function capturePageErrors(
  page: Page,
  callback: () => Promise<void>
): Promise<string[]> {
  const errors: string[] = [];

  const handler = (err: Error) => {
    errors.push(err.message);
  };

  page.on('pageerror', handler);
  await callback();
  page.off('pageerror', handler);

  return errors;
}

/**
 * Take a named screenshot for debugging
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/debug-${name}-${timestamp}.png`,
    fullPage: true,
  });
}
