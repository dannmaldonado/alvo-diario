# QA Report -- Phase 2 Refactoring Sprint

**Date:** 2026-04-04
**Scope:** Security fixes, TanStack Query migration, page refactoring, streak idempotency bug fix
**Tester:** Quinn (QA Agent)
**Status:** CONCERNS -- see findings below

---

## Executive Summary

The Phase 2 refactoring sprint is structurally sound. All four priorities have been implemented: security hardening (JWT strict, rate limiting), TanStack Query migration with centralized QueryClient, four page refactorings with custom hooks, and the streak idempotency fix. Code passes lint and typecheck cleanly. The architecture follows good separation-of-concerns patterns with well-typed query key factories and proper cache invalidation chains.

However, I identified **3 concerns** and **2 minor issues** that should be addressed before committing. One concern is a potential render-loop risk in the `useDashboardData` hook.

---

## Layer 1: Code Quality (Automated)

### Lint
- [x] `npm run lint` -- **PASS** (zero errors, zero warnings)

### TypeScript Type Checking
- [x] `npx tsc --noEmit` -- **PASS** (zero errors)

### Unused Imports/Variables
- [x] No unused imports found in new hooks or pages

### `any` Type Usage
- [ ] **2 occurrences in ProgressAnalysisPage.tsx** (lines 21, 26)
  - `payload?: any[]` and `(entry: any, ...)` in `CustomTooltip` component
  - **Severity:** LOW -- Recharts tooltip payload type is genuinely complex. Using `any` here is a pragmatic choice given Recharts' untyped callback props.
  - **Recommendation:** Consider a local `TooltipPayloadEntry` interface if desired, but not blocking.

### console.log / console.error
- [x] No `console.log` left behind in frontend hooks or pages
- [x] `console.error` in `useCronogramaManager.ts` (lines 176, 192) -- **ACCEPTABLE**: error-path logging for CRUD failures, paired with user-facing toast notifications. This is appropriate error handling.

### Error Handling
- [x] All mutations have `onError` handlers via QueryClient global config (toast.error)
- [x] All route handlers wrapped in try/catch
- [x] Backend validation middleware returns structured 400 errors
- [x] Global error boundary in App.tsx

---

## Layer 2: Functional Testing (Code Review)

### DashboardPage
- [x] Uses `useDashboardData` hook -- clean separation
- [x] Loading skeleton renders during data fetch
- [x] Cronograma data, today subject, cycle info all derived from TanStack Query
- [x] Monthly stats computed from `useSessoesByDateRange`
- [x] Empty state (no cronograma) handled with CTA
- [x] Cache behavior: `staleTime: 5min` on cronograma/sessions, `1min` on meta
- [ ] **CONCERN C-1: Auto-create meta runs during render** (see Risk Assessment)

### StudySessionPage
- [x] Uses `useStudySession` hook -- well-structured with typed state/actions
- [x] Timer logic extracted cleanly with interval ref cleanup
- [x] Phase management (revisao/estudo/questoes) with transitions
- [x] Subject selector bound to active cronograma materias
- [x] Duration customization via range sliders
- [x] Exam modal extracted as sub-component with proper typing
- [x] `finalizarSessao` correctly computes total time across completed phases
- [x] Session save via `createSessaoMutation.mutateAsync` with proper invalidation (sessoes, metas, user, cronogramas)
- [x] Loading state handled

### CronogramaPage
- [x] Uses `useCronogramaManager` hook -- clean CRUD abstraction
- [x] Create flow: edital select -> generate schedule -> save
- [x] Edit flow: materias list with add/remove/rename
- [x] Date editing with save/cancel
- [x] Delete with confirmation dialog
- [x] Cycle grid view with navigation between cycles
- [x] Sub-components properly typed (OverviewCard, EditMateriasCard, CycleGrid, etc.)
- [x] Saving/deleting states disable buttons (prevents double submission)

### ProgressAnalysisPage
- [x] Uses `useProgressAnalytics` hook -- data aggregation extracted
- [x] Period filter (7 days, week, month, all) works on memoized data
- [x] Stats computed: total hours (all/month/week), average per day
- [x] Subject bar chart, evolution line chart, pie distribution chart all data-driven
- [x] Detailed sortable table with percentage bars
- [x] Exam stats section with consistency heatmap and per-question metrics
- [x] Loading skeleton provided
- [x] Empty states ("Nenhum dado no periodo") handled in all charts

### API Validation (Zod Schemas)
- [x] `signupSchema` -- email validation, password length 6-128, passwordConfirm match
- [x] `loginSchema` -- email format, password required
- [x] `createCronogramaSchema` -- edital required, data_alvo YYYY-MM-DD, materias array min 1
- [x] `createSessaoSchema` -- materia required, duracao_minutos 1-1440, date format
- [x] `createMetaSchema` -- horas_meta 0.5-24, date format
- [x] All update schemas require at least one field
- [x] `validate` middleware replaces `req.body` with parsed data (sanitized)
- [x] Validation wired on all POST and PATCH routes

### Rate Limiting
- [x] `express-rate-limit` configured on `/api/auth/login` and `/api/auth/signup`
- [x] 5 attempts per 15-minute window
- [x] Returns 429 with descriptive message
- [ ] **CONCERN C-2: `skipSuccessfulRequests: false`** -- counts successful logins against the limit. A legitimate user who logs in 5 times in 15 minutes (e.g., switching devices, session expired) will be locked out. Consider setting `skipSuccessfulRequests: true` so only failed attempts count.

### Streak Idempotency
- [x] `atualizarStreak` in `pontos.js` checks `historico_pontos` for existing "streak" entry today
- [x] If already processed, returns early (no double increment)
- [x] Secondary guard: `countHoje === 1` ensures only the first session triggers streak logic
- [x] After updating streak, inserts marker row in `historico_pontos` with `motivo = 'streak'`
- [ ] **MINOR M-1: Double guard may have a race condition edge case** -- if two sessions are created simultaneously (e.g., two browser tabs), both could see `countHoje === 1` before either insert completes. The `historico_pontos` idempotency check is the real guard, but the `countHoje` check may short-circuit incorrectly for the second tab (seeing count=2 and skipping streak even though the first hasn't written the marker yet). In practice this is unlikely but worth documenting.

---

## Layer 3: Performance (Code Analysis)

### Parallel API Calls
- [x] `useDashboardData` fires 3 queries in parallel (cronograma, todayMeta, monthSessions) -- TanStack Query handles this automatically via independent hooks
- [x] `useProgressAnalytics` fires 2 queries in parallel (sessions, exams)
- [x] No sequential waterfall patterns found

### Cache Configuration
- [x] `QueryClient` defaults: `staleTime: 5min`, `gcTime: 10min`, `retry: 1`
- [x] `refetchOnWindowFocus` disabled in dev, enabled in prod -- good DX
- [x] Meta queries use `staleTime: 1min` (appropriate for frequently changing data)
- [x] Per-hook overrides applied sensibly

### Cache Invalidation
- [x] `useCreateSessao` invalidates: sessoes, metas, user, cronogramas -- comprehensive
- [x] `useDeleteSessao` invalidates: sessoes, metas, user
- [x] Cronograma mutations invalidate all cronograma queries
- [x] No stale data risk from missing invalidations

### Code Splitting
- [x] All 4 refactored pages are lazy-loaded via `React.lazy()` with `Suspense` fallbacks
- [x] Entry pages (Home, Login, Signup) are eager-loaded -- correct prioritization

### Memoization
- [x] Computed values in hooks use `useMemo` (subjects list, schedule data, stats, chart data)
- [x] Actions wrapped in `useCallback` with correct dependency arrays
- [x] No unnecessary re-renders from unstable references

---

## Layer 4: Regression Testing (Code Analysis)

### Authentication Flow
- [x] Signup/login routes have Zod validation
- [x] JWT generation requires `JWT_SECRET` (hard failure if missing -- no fallback)
- [x] Auth middleware strictly verifies token
- [x] Protected routes use `ProtectedRoute` component
- [x] `AuthProvider` wraps the app

### Navigation
- [x] All routes defined in App.tsx
- [x] `ScrollToTop` component present
- [x] 404/catch-all redirects to HomePage

### Error Handling
- [x] Global `ErrorBoundary` wraps the entire app
- [x] `setupGlobalErrorHandler` called on mount
- [x] `Toaster` component rendered for toast notifications
- [x] API error handler middleware catches unhandled errors
- [x] `unhandledRejection` and `uncaughtException` handlers prevent crashes

### Security
- [x] JWT_SECRET validated on startup (warning logged if missing)
- [x] Auth middleware fails closed (returns 500 if JWT_SECRET missing, 401 if no token)
- [x] No JWT fallback (previously reported as fixed -- confirmed)
- [x] CORS configured with explicit origin
- [x] Rate limiting on auth endpoints
- [x] SQL queries use parameterized statements (no injection risk)
- [x] `updateUser` uses allowlist for fields (`nome`, `meta_diaria_horas`) -- prevents mass assignment

---

## Risk Assessment

| ID | Risk | Severity | Details | Mitigation |
|----|------|----------|---------|------------|
| C-1 | `useDashboardData` triggers mutation during render | MEDIUM | Lines 132-141: `createMetaMutation.mutate()` is called synchronously during render when `shouldCreateMeta` is true. This violates React's rule against side effects during render. While it works in practice because TanStack Query internally batches mutations, React StrictMode in dev will double-invoke and could trigger duplicate meta creation. In production it will fire once, but the pattern is fragile. | Wrap in `useEffect` with `shouldCreateMeta` as dependency, or use a `useRef` flag to prevent re-execution. |
| C-2 | Rate limiter counts successful requests | LOW | `skipSuccessfulRequests: false` means legitimate successful logins count toward the 5-attempt limit. A power user switching devices/browsers could self-lock. | Set `skipSuccessfulRequests: true` to only count failures. |
| M-1 | Streak race condition (theoretical) | LOW | Two simultaneous session inserts could both pass `countHoje` check before either writes the idempotency marker. The window is very small and unlikely in a single-user study app. | Acceptable for current scale. Add a unique constraint on `(user_id, DATE(data), motivo='streak')` in `historico_pontos` if scaling. |
| M-2 | `any` types in CustomTooltip | LOW | Recharts callback payload is untyped. 2 occurrences in ProgressAnalysisPage. | Non-blocking. Create a local type interface if cleanup desired. |

---

## Findings Summary

| Category | Pass | Concern | Fail |
|----------|------|---------|------|
| Lint & Typecheck | 2/2 | 0 | 0 |
| Code Quality | 4/5 | 1 (any types) | 0 |
| Page Refactoring | 4/4 | 0 | 0 |
| TanStack Query Setup | 5/5 | 0 | 0 |
| API Validation | 5/5 | 0 | 0 |
| Security (JWT, Rate Limit) | 3/4 | 1 (rate limit config) | 0 |
| Streak Idempotency | 1/1 | 0 | 0 |
| Cache & Performance | 4/4 | 0 | 0 |
| Regression | 4/4 | 0 | 0 |
| **Total** | **32/34** | **2** | **0** |

---

## Recommendation

**NEEDS_WORK** -- 1 item should be fixed before commit:

1. **C-1 (MEDIUM): Move auto-create meta out of render path** in `useDashboardData.ts` (lines 132-141). Wrap the `createMetaMutation.mutate()` call inside a `useEffect` to comply with React's side-effect rules and prevent potential double-execution in StrictMode.

The following are advisory (non-blocking):

2. **C-2 (LOW):** Change `skipSuccessfulRequests` to `true` in `apps/api/src/index.js` line 116.
3. **M-1 (LOW):** Document the theoretical streak race condition. No code change needed at current scale.
4. **M-2 (LOW):** Address `any` types in `ProgressAnalysisPage.tsx` CustomTooltip when convenient.

Once C-1 is resolved, this sprint is **APPROVED** for commit and push.
