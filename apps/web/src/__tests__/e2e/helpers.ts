import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers
 * Utilities for common test scenarios
 */

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Check if user is authenticated by looking for protected elements
 */
export async function isUserAuthenticated(page: Page): Promise<boolean> {
  // Protected pages have auth context
  const authElements = page.locator('[data-testid="user-menu"], [data-user-id]');
  return await authElements.first().isVisible().catch(() => false);
}

/**
 * Get current page title
 */
export async function getPageTitle(page: Page): Promise<string> {
  return await page.title();
}

/**
 * Check if an error message is displayed
 */
export async function hasErrorMessage(page: Page): Promise<boolean> {
  const errorMessages = page.locator('[role="alert"], [class*="error"]');
  return await errorMessages.first().isVisible().catch(() => false);
}

/**
 * Check if a success message is displayed
 */
export async function hasSuccessMessage(page: Page): Promise<boolean> {
  const successMessages = page.locator('[class*="success"], [role="status"]');
  return await successMessages.first().isVisible().catch(() => false);
}

/**
 * Fill and submit a form
 */
export async function fillAndSubmitForm(
  page: Page,
  formData: Record<string, string>,
  submitButtonSelector: string = 'button[type="submit"]'
) {
  for (const [name, value] of Object.entries(formData)) {
    const input = page.locator(`input[name="${name}"], textarea[name="${name}"]`);
    await input.fill(value);
  }

  const submitButton = page.locator(submitButtonSelector);
  await submitButton.click();
}

/**
 * Wait for navigation and check new URL
 */
export async function waitForNavigation(page: Page, urlPattern: RegExp) {
  await page.waitForURL(urlPattern, { timeout: 10000 }).catch(() => {});
  return page.url();
}

/**
 * Check if element is visible within timeout
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    await page.locator(selector).first().waitFor({ timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Click element if visible
 */
export async function clickIfVisible(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector).first();
  const visible = await element.isVisible().catch(() => false);

  if (visible) {
    await element.click();
    return true;
  }

  return false;
}

/**
 * Get text content of element
 */
export async function getElementText(page: Page, selector: string): Promise<string | null> {
  return await page.locator(selector).first().textContent().catch(() => null);
}

/**
 * Check multiple elements exist
 */
export async function elementsExist(page: Page, selectors: string[]): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  for (const selector of selectors) {
    results[selector] = await page.locator(selector).first().isVisible().catch(() => false);
  }

  return results;
}

/**
 * Take screenshot for debugging
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  await page.screenshot({ path: `test-results/${name}-${timestamp}.png` });
}

/**
 * Mock API response
 */
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  responseData: unknown
) {
  await page.route(urlPattern, route => {
    route.abort('blockedbyclient');
  });

  // Alternative: could use interceptor pattern
}

/**
 * Check localStorage for token (if using JWT)
 */
export async function hasAuthToken(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return !!localStorage.getItem('pb_auth') || !!localStorage.getItem('auth_token');
  });
}

/**
 * Clear authentication
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('pb_auth');
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
  });
}

/**
 * Get all console messages during navigation
 */
export async function captureConsoleLogs(page: Page): Promise<string[]> {
  const logs: string[] = [];

  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  return logs;
}

/**
 * Wait and collect all network requests
 */
export async function captureNetworkRequests(page: Page, callback: () => Promise<void>) {
  const requests: Array<{ url: string; method: string; status?: number }> = [];

  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
    });
  });

  page.on('response', response => {
    const lastRequest = requests[requests.length - 1];
    if (lastRequest) {
      lastRequest.status = response.status();
    }
  });

  await callback();

  return requests;
}
