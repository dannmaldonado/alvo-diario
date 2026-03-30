# E2E Testing Guide 🎭

Complete guide for end-to-end testing with Playwright in Alvo Diário.

## 📋 Overview

**Playwright** runs automated tests against the real application in a real browser.

### Why E2E Testing?

- ✅ Tests actual user workflows (login → create schedule → start session)
- ✅ Catches bugs in integration between frontend and backend
- ✅ Validates UI interactions and navigation
- ✅ Tests across multiple browsers (Chrome, Firefox, Safari)
- ✅ Tests on mobile devices

---

## 🚀 Getting Started

### Installation

Already installed via `npm install`. Browsers installed with:

```bash
npx playwright install
```

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run With UI

```bash
npm run test:e2e:ui
```

Opens interactive test runner with live preview.

### Run in Debug Mode

```bash
npm run test:e2e:debug
```

Step through tests and inspect state.

### Run in Headed Mode

```bash
npm run test:e2e:headed
```

See browser opening/closing during tests.

### View Test Report

```bash
npm run test:e2e:report
```

---

## 📁 Test Files

### Current Test Suites

```
src/__tests__/e2e/
├── auth.spec.ts           # Login, signup, auth flows
├── dashboard.spec.ts       # Dashboard page, stats, navigation
├── cronograma.spec.ts      # Schedule creation and management
├── study-session.spec.ts   # Study timer, controls
├── helpers.ts             # Common test utilities
└── userFlows.spec.ts      # (Existing) Full user workflows
```

### Test Coverage

| Feature | Tests | Status |
|---------|-------|--------|
| Authentication | 7 tests | ✅ |
| Schedule Mgmt | 7 tests | ✅ |
| Study Session | 8 tests | ✅ |
| Dashboard | 10 tests | ✅ |
| User Flows | 5 tests | ✅ (existing) |
| **Total** | **37 tests** | ✅ |

---

## 🧪 Writing E2E Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange: Set up test state
    await page.goto('/path');

    // Act: Perform user action
    await page.click('button');

    // Assert: Verify result
    await expect(page).toHaveURL(/new-path/);
  });
});
```

### Common Patterns

#### 1. Navigate to Page

```typescript
await page.goto('/dashboard');
await page.waitForLoadState('networkidle');
```

#### 2. Fill Form

```typescript
await page.fill('input[name="email"]', 'user@example.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button[type="submit"]');
```

#### 3. Wait for Navigation

```typescript
await page.waitForURL(/dashboard/);
```

#### 4. Check Element Visibility

```typescript
const button = page.locator('button:has-text("Click me")');
await expect(button).toBeVisible();
```

#### 5. Get Text Content

```typescript
const title = await page.locator('h1').textContent();
expect(title).toContain('Welcome');
```

#### 6. Handle Multiple Browsers

```typescript
test('should work on all browsers', async ({ page, browserName }) => {
  if (browserName === 'firefox') {
    // Firefox-specific behavior
  }
});
```

---

## 🎯 Test Helpers

### Available Utilities (in `helpers.ts`)

```typescript
// Wait for page to load
await waitForPageLoad(page);

// Check authentication status
const isAuth = await isUserAuthenticated(page);

// Fill and submit form
await fillAndSubmitForm(page, {
  email: 'user@example.com',
  password: 'password123'
});

// Wait for element
const exists = await waitForElement(page, '#myButton', 5000);

// Click if visible
await clickIfVisible(page, '.optional-button');

// Get element text
const text = await getElementText(page, 'h1');

// Check multiple elements
const elements = await elementsExist(page, ['#id1', '#id2', '#id3']);

// Check for auth token
const hasAuth = await hasAuthToken(page);

// Clear authentication
await clearAuth(page);
```

---

## 🔧 Configuration

### File: `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './src/__tests__/e2e',
  baseURL: 'http://localhost:3000',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'Mobile Chrome', use: devices['Pixel 5'] },
  ],
});
```

### Browser Configuration

Tests run on:
- ✅ Chromium (Chrome)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile (Pixel 5)

---

## 🌊 Workflow Tests

### Test User Flows

Full end-to-end workflows from auth to task completion:

```typescript
test('complete study workflow', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'user@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("Enter")');

  // 2. Create schedule
  await page.goto('/cronograma');
  await page.click('button:has-text("Create")');
  // ... fill form ...

  // 3. Start study session
  await page.goto('/dashboard');
  await page.click('button:has-text("Start")');

  // 4. Verify session started
  await expect(page).toHaveURL(/study-session/);
});
```

---

## 📊 Test Reports

### HTML Report

Automatically generated after tests:

```bash
npm run test:e2e:report
```

Shows:
- ✅ Passed tests (green)
- ❌ Failed tests (red) with screenshots
- ⏱️ Execution time
- 🎬 Video recordings (if enabled)
- 📸 Screenshots (on failure)

### CI/CD Integration

Tests can run in CI pipeline:

```yaml
# .github/workflows/e2e.yml
- name: Run E2E tests
  run: npm run test:e2e

- name: Upload results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

---

## 🐛 Debugging

### Interactive Mode

```bash
npm run test:e2e:debug
```

Step through tests line by line with debugger.

### UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

- Visual test editor
- Click on lines to jump to execution
- See live preview of actions
- Inspect DOM state

### Verbose Output

```bash
npm run test:e2e -- --reporter=list
```

### Screenshots on Failure

Already configured - check `test-results/` for failed test screenshots.

### Video Recording

Can be enabled in config for debugging flaky tests:

```typescript
use: {
  video: 'retain-on-failure', // Only on failure
  trace: 'on-first-retry',    // Trace for debugging
}
```

---

## ⚡ Best Practices

### DO ✅

- Use `data-testid` attributes for reliable selectors
- Wait for network idle before assertions
- Test critical user flows first
- Keep tests focused (one feature per test)
- Use helpers for common operations
- Clean up auth between tests
- Mock external APIs if needed

### DON'T ❌

- Rely on CSS class names (they change)
- Use `sleep()` instead of `waitFor()`
- Test implementation details
- Run tests in parallel with shared state
- Hardcode user credentials
- Make tests dependent on execution order

### Selector Best Practices

```typescript
// ✅ GOOD: data-testid
page.locator('[data-testid="login-button"]')

// ✅ GOOD: text content
page.locator('button:has-text("Login")')

// ✅ GOOD: role attribute
page.locator('[role="button"]')

// ❌ AVOID: CSS classes
page.locator('.btn-primary')

// ❌ AVOID: Complex XPath
page.locator('//div[@class="form"]/div[2]/button')
```

---

## 📚 Test Checklists

### Before Submitting PR

- [ ] `npm run test:e2e` passes locally
- [ ] No flaky tests (runs consistently)
- [ ] Added new tests for new features
- [ ] Tests use proper selectors (not class names)
- [ ] No hardcoded credentials
- [ ] Test report shows all passing

### Before Merging

- [ ] All E2E tests passing in CI
- [ ] No performance regressions
- [ ] Screenshots/videos reviewed if failures
- [ ] Test report uploaded to artifacts

---

## 🎓 Example Tests

### Login Test

```typescript
test('should login successfully', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password123');

  await page.click('button:has-text("Login")');

  await page.waitForURL(/dashboard/);
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

### Form Validation Test

```typescript
test('should validate password length', async ({ page }) => {
  await page.goto('/signup');

  await page.fill('input[name="password"]', 'short');

  const error = page.locator('[role="alert"]');
  await expect(error).toContainText('at least 8 characters');
});
```

### Navigation Test

```typescript
test('should navigate between pages', async ({ page }) => {
  await page.goto('/dashboard');

  await page.click('a:has-text("Schedule")');

  await expect(page).toHaveURL(/cronograma/);
  await expect(page.locator('h1')).toContainText('Schedule');
});
```

---

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📖 References

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)

---

**Last Updated:** 30/03/2026
**E2E Testing Version:** 1.0
