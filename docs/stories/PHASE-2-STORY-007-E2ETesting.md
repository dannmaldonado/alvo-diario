# PHASE-2-STORY-007: End-to-End Testing

**Epic:** Phase 2 — Feature Development & Integration
**Status:** Done
**Effort:** 8 hours
**Priority:** MEDIUM
**Created:** 2026-04-04

---

## Objective

Critical user flows are covered by automated E2E tests that run reliably on `npm run test:e2e`, validating that the full stack works correctly from browser to database.

---

## Acceptance Criteria

- [ ] `npm run test:e2e` command exists and runs all E2E tests
- [ ] Test suite runs against the local dev stack (API + web + MySQL) without external dependencies
- [ ] **Flow 1:** User signup → auto-login → dashboard visible
- [ ] **Flow 2:** Create a cronograma → verify it appears in the list
- [ ] **Flow 3:** Start a study session → save it → verify dashboard streak/points updated
- [ ] **Flow 4:** View progress analytics → charts render without errors
- [ ] **Flow 5:** Validation error handling — submit empty form → inline errors appear, no API call made
- [ ] **Flow 6:** Error recovery — simulate API 500 → error toast appears, page does not crash
- [ ] All 6 flows pass consistently (no flaky tests)
- [ ] Test output is readable: clear pass/fail indication per flow

---

## Technical Details

### Framework Choice

Use **Playwright** (not Cypress):
- Better async/await API, matches the existing TypeScript patterns
- Faster parallelism (runs multiple browsers if needed)
- No Electron dependency, smaller install

```bash
npm install --save-dev @playwright/test -w apps/web
npx playwright install chromium  # only chromium needed for CI
```

### Test Setup

```typescript
// apps/web/e2e/setup/global-setup.ts
// 1. Start the API server (or verify it's running)
// 2. Seed test database with known state (test user, one cronograma)
// 3. Cleanup before each test file (truncate sessoes, metas for test user)
```

Database seeding uses the API service layer directly (not raw SQL) to stay aligned with business logic:
```bash
# Seed script (bash or node)
POST /api/auth/register { email: "e2e@test.com", password: "test123", nome: "E2E User" }
POST /api/cronogramas { nome: "Concurso Test", materias: ["Português", "Matemática"], ... }
```

### Test File Structure

```
apps/web/e2e/
  setup/
    global-setup.ts
    test-helpers.ts   # login(), createCronograma(), createSessao() helpers
  flows/
    01-auth.spec.ts
    02-cronograma.spec.ts
    03-study-session.spec.ts
    04-analytics.spec.ts
    05-error-handling.spec.ts
```

### Test Helpers

```typescript
// apps/web/e2e/setup/test-helpers.ts
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}
```

All interactive elements that are needed for E2E tests must have `data-testid` attributes. Adding these to existing components is part of this story's scope.

### data-testid Coverage

At minimum, add `data-testid` to:
- Auth: `email-input`, `password-input`, `login-button`, `signup-button`
- Dashboard: `dashboard-container`, `streak-counter`, `points-counter`, `active-cronograma-name`
- CronogramaPage: `cronograma-list`, `create-cronograma-button`, `delete-cronograma-button`
- StudySession: `subject-selector`, `duration-input`, `start-timer-button`, `save-session-button`
- ProgressAnalysis: `analytics-container`, `total-hours`, `subject-breakdown-chart`

### Flow 6: Simulate API 500

Use Playwright's network interception:
```typescript
await page.route('**/api/sessoes', route => route.fulfill({ status: 500, body: '{"error":"Internal error"}' }));
// attempt to save session
// assert: toast with error message appears
// assert: page does not navigate away or crash
```

### CI/CD Script

Add to `package.json` (root workspace):
```json
"test:e2e": "playwright test --config=apps/web/playwright.config.ts"
```

`playwright.config.ts`:
```typescript
export default defineConfig({
  testDir: './e2e/flows',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
```

---

## Dependencies

- **Stories 001–005** must all be marked Done before this story starts. E2E tests validate integrated behavior — testing against incomplete features produces false negatives.

---

## Implementation Notes

- The existing `docs/E2E-TESTING.md` documents prior E2E setup context. Read it before creating test files to avoid duplicating any existing scaffolding.
- The E2E database must be isolated from the development database. Use a separate DB (`alvo_test`) configured via `TEST_DATABASE_URL` env var. The API server should read `process.env.TEST_DATABASE_URL` when `NODE_ENV=test`.
- Avoid `page.waitForTimeout()` — use `page.waitForURL()`, `page.waitForSelector()`, or `expect(locator).toBeVisible()` for deterministic waits.
- All test flows must be independent: each test file seeds its own required data and does not depend on state from another test.
- Do not mock the API for the main happy-path tests. E2E tests should call the real API to catch integration issues (this is the lesson from the `feedback_testing.md` in the dev memory: "integration tests must hit real infrastructure").
- Mock (via `page.route()`) only for error simulation tests (Flow 6).

---

## File List

Files to be created:
- [ ] `apps/web/playwright.config.ts` (new)
- [ ] `apps/web/e2e/setup/global-setup.ts` (new)
- [ ] `apps/web/e2e/setup/test-helpers.ts` (new)
- [ ] `apps/web/e2e/flows/01-auth.spec.ts` (new)
- [ ] `apps/web/e2e/flows/02-cronograma.spec.ts` (new)
- [ ] `apps/web/e2e/flows/03-study-session.spec.ts` (new)
- [ ] `apps/web/e2e/flows/04-analytics.spec.ts` (new)
- [ ] `apps/web/e2e/flows/05-error-handling.spec.ts` (new)

Files to be modified:
- [ ] `package.json` (root — add `test:e2e` script)
- [ ] `apps/web/src/pages/DashboardPage.tsx` (add `data-testid` attributes)
- [ ] `apps/web/src/pages/StudySessionPage.tsx` (add `data-testid` attributes)
- [ ] `apps/web/src/pages/CronogramaPage.tsx` (add `data-testid` attributes)
- [ ] `apps/web/src/pages/ProgressAnalysisPage.tsx` (add `data-testid` attributes)
- [ ] `apps/web/src/components/auth/LoginForm.tsx` or equivalent (add `data-testid` attributes)

---

**Status Updates:**
- Draft: 2026-04-04 — Created by @sm
