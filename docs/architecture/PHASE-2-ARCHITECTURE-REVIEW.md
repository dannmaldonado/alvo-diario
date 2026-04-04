# Phase 2 Architecture Review — alvo-diario

**Author:** Aria (AIOX Architect)
**Date:** 2026-04-04
**Scope:** Full architecture audit + Phase 2 readiness assessment
**Status:** COMPLETE

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Audit](#2-current-architecture-audit)
3. [Strengths](#3-strengths)
4. [Weaknesses & Technical Debt](#4-weaknesses--technical-debt)
5. [Risk Register](#5-risk-register)
6. [Phase 2 Readiness Assessment](#6-phase-2-readiness-assessment)
7. [Recommendations & Refactoring Plan](#7-recommendations--refactoring-plan)
8. [State Management Strategy](#8-state-management-strategy)
9. [CRUD Operations Pattern](#9-crud-operations-pattern)
10. [Decision Log](#10-decision-log)

---

## 1. Executive Summary

The alvo-diario project has a **sound foundational architecture** for a study-tracking SPA. The PocketBase-to-Express+MySQL migration is functionally complete, and the monorepo structure is clean. However, several patterns that worked at prototype scale will become friction points as Phase 2 adds real CRUD flows, analytics, and error handling.

**Verdict: The architecture supports Phase 2 without a ground-up rewrite, but 4 targeted refactors are needed before heavy feature work begins.** These refactors are small (estimated 8-12 hours total) and prevent compounding debt across Stories 1-7.

### Key Findings

| Area | Rating | Summary |
|------|--------|---------|
| Monorepo Structure | GOOD | Clean separation, npm workspaces work |
| Database Schema | GOOD | Normalized, proper FKs, good indexes |
| API Layer (Express) | ADEQUATE | Works, but repetitive boilerplate needs pattern |
| Frontend Services | ADEQUATE | Clean wrappers, but missing caching layer |
| State Management | NEEDS WORK | Raw useState + useEffect everywhere, no query caching |
| Error Handling | ADEQUATE | Foundation exists, needs integration |
| Security | NEEDS ATTENTION | JWT fallback secret, no rate limiting, no input validation on API |
| Testing | EARLY | E2E skeletons exist, unit tests minimal |
| Type Safety | MIXED | Frontend TypeScript, backend plain JS |

---

## 2. Current Architecture Audit

### 2.1 Monorepo Structure

```
alvo-diario/
  apps/
    api/      # Express.js + MySQL (plain JS, ESM)
    web/      # React 18 + Vite + TypeScript
  docs/       # Architecture, plans, guides
  package.json  # npm workspaces root
```

**Observation:** The monorepo uses npm workspaces with `concurrently` for dev. This is functional but minimal. There is no shared `packages/` workspace for types or utilities.

**Impact:** Frontend types (`types/index.ts`) and backend schema (`schema.sql`) define the same entities independently with no shared contract. This will cause drift as entities evolve in Phase 2.

### 2.2 Backend Architecture (apps/api)

**Stack:** Node.js + Express 4 + mysql2 + JWT + bcryptjs

**Layer Map:**

```
routes/*.js     -> authMiddleware -> services/*.js -> db/connection.js (pool)
```

**Pattern per domain:** Each domain (cronogramas, sessoes, metas, badges, historico, exames) has:
- `routes/{domain}.js` -- Express router with try/catch per endpoint
- `services/{domain}.js` -- Business logic with direct SQL via `pool.getConnection()`

**Connection Pattern:** Every service function follows:
```javascript
const connection = await pool.getConnection();
try {
  const [rows] = await connection.query(...);
  return rows;
} finally {
  connection.release();
}
```

This is repeated ~30 times across 7 service files. It works but is verbose and error-prone.

**Migration System:** Single `schema.sql` file executed on startup via `runMigrations()`. Statements split by `;`. No versioning, no rollback, no migration ordering.

### 2.3 Frontend Architecture (apps/web)

**Stack:** React 18 + Vite 7 + TypeScript + shadcn/ui + Tailwind CSS

**Layer Map:**

```
pages/*.tsx -> services/*.ts -> api.ts (fetch client) -> Express API
contexts/ -> AuthContext, ThemeContext
hooks/ -> useScheduleCalculator, use-mobile, use-toast
components/ -> domain components + ui/ (shadcn)
```

**Data Flow Pattern (current):**
```
Page component
  -> useState for loading/data/error
  -> useEffect on mount
  -> service.getXxx() call
  -> setState with result
  -> render
```

This is the classic "fetch in useEffect" anti-pattern. It works but provides no caching, deduplication, refetching, or optimistic updates.

### 2.4 Database Schema

7 tables, all user-scoped:

| Table | Purpose | Indexes | Notes |
|-------|---------|---------|-------|
| `users` | Auth + profile | email | Stores streak/points directly (denormalized) |
| `cronogramas` | Study schedules | user_id, status | `materias` stored as JSON blob |
| `sessoes_estudo` | Study sessions | user_id, data_sessao, cronograma_id | Core tracking entity |
| `metas_diarias` | Daily goals | user_id, data, UNIQUE(user_id,data) | One per user per day |
| `exames_diarios` | Daily self-exams | user_id, data, UNIQUE(user_id,data) | Answers as JSON |
| `badges` | Achievements | user_id | Simple badge tracking |
| `historico_pontos` | Points log | user_id, data | Audit trail for gamification |

**Schema Quality:** Good normalization. Proper foreign keys with CASCADE deletes. Indexes on query-heavy columns. The `UNIQUE(user_id, data)` constraints on metas and exames prevent duplicates correctly.

**Concern:** `materias` as JSON in `cronogramas` means you cannot query "all sessions for materia X across all schedules" efficiently. This matters for analytics in Phase 2 Story 5.

---

## 3. Strengths

### S1. Clean Service Layer Abstraction
The frontend service layer (`CronogramaService`, `SessoesService`, `MetasService`, `AuthService`) provides clean, typed interfaces. API client (`api.ts`) handles auth headers and base URL resolution. This is a solid foundation to layer caching on top.

### S2. Production-Hardened Server Setup
The Express server in `index.js` demonstrates real production experience: multi-path `.env` loading for Hostinger, CDN cache-busting headers, SPA fallback with proper exclusions, graceful error handling, and non-blocking migration on startup. This is not prototype code -- it has survived a real deployment.

### S3. Type System on Frontend
The `types/index.ts` file has well-structured domain types with proper `Omit`/`Partial` derivations for input types. Error class hierarchy (`APIError`, `ValidationError`, `AuthenticationError`, etc.) is well thought out.

### S4. Lazy Loading and Code Splitting
App.tsx uses `React.lazy()` for all authenticated pages with a consistent `Suspense` fallback. This is correctly implemented and will scale well.

### S5. Consistent UI Framework
shadcn/ui components provide accessible, well-tested primitives. The design token system (`lib/design-tokens.ts`) and Tailwind configuration are properly set up.

---

## 4. Weaknesses & Technical Debt

### W1. [CRITICAL] No Server-Side Input Validation

**Location:** All route handlers in `apps/api/src/routes/*.js`

Every route handler passes `req.body` directly to services without validation:
```javascript
router.post('/', authMiddleware, async (req, res) => {
  const cronograma = await createCronograma(req.user.id, req.body);
  // req.body is NEVER validated
});
```

**Risk:** SQL injection is mitigated by parameterized queries, but:
- Malformed data can corrupt the database (wrong types, missing fields)
- JSON fields (`materias`, `respostas`) accept arbitrary structures
- No length limits on any field
- `duracao_minutos` could be negative

**Recommendation:** Add Zod validation on the backend (already used on frontend). Create a `middleware/validate.js` that validates request bodies per route schema. Estimated effort: 4-6 hours.

### W2. [HIGH] useState/useEffect Data Fetching (No Caching Layer)

**Location:** All page components (`DashboardPage.tsx`, `CronogramaPage.tsx`, `StudySessionPage.tsx`, `ProgressAnalysisPage.tsx`)

Every page does:
```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);
useEffect(() => { loadData(); }, []);
```

**Problems:**
- No caching: navigating away and back refetches everything
- No background refetching: stale data after mutations
- No deduplication: multiple components requesting the same data
- No optimistic updates: UI waits for server roundtrip
- Waterfall requests: DashboardPage makes 3 sequential API calls

**Recommendation:** Introduce TanStack Query (React Query). The project already has the dependency in `package.json` but it is NOT being used anywhere. This is the single highest-impact improvement. Estimated effort: 6-8 hours to migrate existing pages.

### W3. [HIGH] Oversized Page Components

**Location:**
- `StudySessionPage.tsx` -- 664 lines
- `CronogramaPage.tsx` -- 598 lines
- `ProgressAnalysisPage.tsx` -- 669 lines
- `DashboardPage.tsx` -- 412 lines

These pages contain business logic, data fetching, state management, and rendering all in one file. DashboardPage alone has:
- 6 useState hooks
- 1 useEffect with 3 API calls
- 2 derived computation functions
- Monthly statistics calculation logic
- Multiple rendering branches

**Recommendation:** Extract into custom hooks (`useDashboardData`, `useStudySession`, etc.) and smaller sub-components. This is necessary before Phase 2 adds more complexity. Estimated effort: 4-6 hours.

### W4. [MEDIUM] Backend Service Boilerplate

**Location:** All files in `apps/api/src/services/*.js`

The `getConnection/try/finally/release` pattern is repeated in every function. The dynamic field-update pattern in `updateSessao`, `updateMeta`, `updateUser` is also duplicated.

**Recommendation:** Create a `db/helpers.js` with:
- `withConnection(fn)` -- wraps the connection lifecycle
- `buildUpdateQuery(table, allowedFields, data, whereClause)` -- generates safe dynamic updates

This is not blocking but reduces bug surface. Estimated effort: 2-3 hours.

### W5. [MEDIUM] No Shared Type Contract Between Frontend and Backend

**Location:** `apps/web/src/types/index.ts` vs `apps/api/src/db/schema.sql`

The frontend defines TypeScript types; the backend has no type definitions at all (plain JavaScript). There is no mechanism to ensure they stay in sync.

**Examples of drift risk:**
- Frontend `Sessao` type has `notas?: string` but the backend schema has no `notas` column
- Frontend `Badge` type has `nome` and `icone` but backend schema has `tipo_badge` and `descricao`
- Frontend has `PBListResponse` and `PBResponse` types (PocketBase leftovers) that are unused

**Recommendation:** For Phase 2, the pragmatic approach is to clean up the type file (remove PB leftovers, align field names) and add a comment-based contract. A shared `packages/types` workspace is ideal but can wait for Phase 3. Estimated effort: 2 hours.

### W6. [MEDIUM] Streak Logic Bug

**Location:** `apps/api/src/services/pontos.js`, line 36-68

The `atualizarStreak` function has a subtle bug: it increments `streak_atual` every time a session is created on a day that follows a day with sessions. But if a user creates 3 sessions in one day, it will increment the streak 3 times (once per session creation).

```javascript
// Called for EVERY session creation:
await atualizarStreak(userId);
```

The function checks `countHoje > 0` but the session just inserted counts, so the first session of the day correctly sets streak=1 or increments. But the second and third sessions of the same day will ALSO increment if `countOntem > 0`.

**Recommendation:** The streak update should be idempotent per day. Add a check: "if already updated streak today, skip." Or better, calculate streak from data rather than maintaining it as a running counter. Estimated effort: 1-2 hours.

### W7. [LOW] Migration System Has No Versioning

**Location:** `apps/api/src/migrations/index.js`

The migration system reads `schema.sql`, splits by `;`, and executes every statement on every server start. This works because all statements use `CREATE TABLE IF NOT EXISTS`. However:
- `ALTER TABLE` statements will fail if run twice (only partially mitigated by `IF NOT EXISTS` on the ALTER)
- No rollback capability
- No migration ordering
- No way to add data migrations

**Recommendation:** For Phase 2 scope, this is acceptable as long as new schema changes only use idempotent DDL. For Phase 3, consider a proper migration tool (e.g., `knex migrations` or a simple numbered-file system).

### W8. [LOW] PocketBase Type Leftovers

**Location:** `apps/web/src/types/index.ts`

`PBListResponse<T>` and `PBResponse<T>` types remain from the PocketBase era. The `AuthResponse` type uses `record` instead of `user`. Minor cleanup needed.

---

## 5. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R1 | JWT secret fallback to `'secret'` in production | MEDIUM | CRITICAL | **Immediate**: Remove fallback, fail if env var missing |
| R2 | No rate limiting on auth endpoints | HIGH | HIGH | Add express-rate-limit to `/api/auth/*` routes |
| R3 | Streak counter corruption from concurrent sessions | HIGH | MEDIUM | Make streak update idempotent (W6) |
| R4 | Stale frontend data after mutations (no caching) | HIGH | MEDIUM | Adopt TanStack Query (W2) |
| R5 | Type drift between frontend and backend | MEDIUM | MEDIUM | Clean up types, align contracts (W5) |
| R6 | Page complexity blocking feature velocity | MEDIUM | MEDIUM | Extract hooks and sub-components (W3) |
| R7 | Unvalidated API inputs corrupting data | MEDIUM | HIGH | Add Zod validation middleware (W1) |
| R8 | Connection pool exhaustion under load | LOW | HIGH | Current limit=10 is fine for expected traffic |

---

## 6. Phase 2 Readiness Assessment

### Question 1: Does the current architecture support Phase 2 without critical refactors?

**Answer: YES, with conditions.** The architecture is functional but will produce increasingly fragile code if Phase 2 stories are built on the current useState/useEffect pattern. The 4 priority refactors below should be done BEFORE or IN PARALLEL with Story 1.

### Question 2: What are the biggest technical risks ahead?

1. **Data consistency** -- Streak bug (W6) and lack of server validation (W1) can corrupt user data
2. **Developer velocity** -- 600+ line page components (W3) will make feature changes slow and error-prone
3. **UX quality** -- No caching means every navigation triggers loading spinners, degrading perceived performance

### Question 3: Optimal strategy for state + APIs at scale?

**TanStack Query for server state, React Context for auth/theme only.** See Section 8.

### Question 4: How to structure CRUD operations?

**Standardized pattern with TanStack Query mutations + optimistic updates.** See Section 9.

### Question 5: Are there blocking technical debts?

**R1 (JWT fallback) is the only truly blocking item** -- it is a security vulnerability. Everything else is friction, not a blocker.

---

## 7. Recommendations & Refactoring Plan

### Priority 0: Security Fixes (Before anything else, ~2 hours)

| Item | File | Change |
|------|------|--------|
| Remove JWT fallback | `api/src/services/auth.js:16` + `api/src/middleware/auth.js:11` | Replace `\|\| 'secret'` with `process.env.JWT_SECRET` and throw if undefined |
| Add rate limiting | `api/src/index.js` | `npm install express-rate-limit` + apply to `/api/auth/*` |

### Priority 1: Adopt TanStack Query (~6 hours)

TanStack Query is already in `package.json` but unused. Migration plan:

1. Create `apps/web/src/lib/queryClient.ts` -- configure QueryClient with default staleTime, retry, error handler
2. Wrap App in `<QueryClientProvider>`
3. Migrate DashboardPage first (highest API call count)
4. Create query hooks: `useActiveCronograma()`, `useTodayMeta()`, `useMonthSessions()`
5. Create mutation hooks: `useCreateSessao()`, `useUpdateMeta()`, etc.

**Before:**
```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);
useEffect(() => {
  CronogramaService.getActive(userId).then(setData).finally(() => setLoading(false));
}, []);
```

**After:**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['cronograma', 'active', userId],
  queryFn: () => CronogramaService.getActive(userId),
});
```

### Priority 2: Extract Page Logic into Hooks (~4 hours)

| Page | Extract To | Responsibility |
|------|-----------|----------------|
| DashboardPage | `useDashboardData()` | Active cronograma, today's meta, monthly stats |
| StudySessionPage | `useStudySession()` | Timer, phase management, session save |
| CronogramaPage | `useCronogramaManager()` | CRUD operations, form state |
| ProgressAnalysisPage | `useProgressAnalytics()` | Data aggregation, chart data preparation |

### Priority 3: API Input Validation (~4 hours)

Create `apps/api/src/middleware/validate.js`:
```javascript
import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
  }
  req.body = result.data;
  next();
};
```

Define schemas per route in `apps/api/src/schemas/` directory.

### Priority 4: Fix Streak Bug (~1 hour)

Modify `atualizarStreak` to be idempotent:
```javascript
// Check if this is the FIRST session of today
if (countHoje === 1) { // was just inserted
  // Only then update streak
}
```

Or better, check `historico_pontos` for today's streak update record.

---

## 8. State Management Strategy

### Decision: React Context for Auth + Theme. TanStack Query for everything else.

**Trade-off Analysis:**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Keep useState/useEffect | No migration effort | No caching, waterfall requests, stale data | REJECT |
| TanStack Query | Caching, dedup, background refetch, devtools | Learning curve, migration effort | ACCEPT |
| Zustand | Lightweight, simple API | Manual cache invalidation, no query dedup | REJECT (overkill for this use case) |
| Redux Toolkit + RTK Query | Full featured | Heavy, complex setup, overkill for app size | REJECT |

**Rationale:** The app is server-state-heavy (all meaningful data comes from API). TanStack Query is designed exactly for this pattern. The app has zero complex client-only state that would justify Zustand or Redux. Auth and theme are the only truly client-side state, and React Context handles them well.

**Caching Strategy:**
- `staleTime: 5 * 60 * 1000` (5 min) for lists (cronogramas, sessoes)
- `staleTime: 60 * 1000` (1 min) for today's meta (changes during study)
- `staleTime: 0` for user profile (always fresh after auth)
- Invalidate related queries after mutations (e.g., creating a session invalidates today's meta and monthly stats)

---

## 9. CRUD Operations Pattern

### Recommended Pattern for Phase 2

**Backend (Express + Service):**

```
Route (validation middleware) -> Service (business logic) -> DB (pool query)
```

Each CRUD endpoint should:
1. Validate input with Zod schema via middleware
2. Call service function with validated data
3. Return consistent response shape: `{ data: T }` for success, `{ error: string, details?: any }` for failure

**Frontend (TanStack Query + Service):**

```
Component -> useQuery/useMutation hook -> Service function -> apiClient -> API
```

**File Organization for new features:**

```
apps/web/src/
  hooks/queries/
    useCronogramas.ts    # useActiveCronograma, useCronogramaById, useCronogramaList
    useSessoes.ts        # useSessoesByDate, useCreateSessao, useDeleteSessao
    useMetas.ts          # useTodayMeta, useUpsertMeta
    useUser.ts           # useCurrentUser, useUpdateProfile
  hooks/
    useStudySession.ts   # Timer logic, phase management (pure client state)
    useDashboardData.ts  # Composes query hooks for dashboard
```

**Mutation Pattern:**
```typescript
export function useCreateSessao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSessaoInput) => SessoesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessoes'] });
      queryClient.invalidateQueries({ queryKey: ['metas', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['user'] }); // streak/points update
      toast.success('Sessao salva com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'CreateSessao');
    },
  });
}
```

---

## 10. Decision Log

| ID | Decision | Alternatives Considered | Rationale |
|----|----------|------------------------|-----------|
| D1 | Use TanStack Query for server state | Zustand, Redux, raw useState | App is server-state-heavy; TQ provides caching, dedup, and devtools with minimal setup |
| D2 | Keep React Context for auth only | Move auth to TQ, use Zustand for auth | Auth state is truly client-side (token in localStorage); Context is sufficient and already working |
| D3 | Add Zod validation on backend | express-validator, joi, manual checks | Frontend already uses Zod; consistency reduces cognitive load; Zod has best TS inference |
| D4 | Do NOT add shared packages/types yet | Create monorepo shared package now | Effort vs. value: 7 entity types with ~20 fields is manageable with comment-based contract; shared package justified at 15+ entities |
| D5 | Keep single schema.sql migration | knex, prisma, typeorm | Migration complexity not justified for 7 tables; switch to numbered files in Phase 3 if table count exceeds 15 |
| D6 | Do NOT introduce an ORM | Prisma, Drizzle, Knex | Raw SQL is fine for this scale; ORM adds complexity and abstraction leaks; team knows SQL |
| D7 | Extract page logic to hooks, not to a state manager | Zustand stores, MobX | Hooks compose naturally with TanStack Query; adding a state manager for UI logic that is page-scoped is unnecessary indirection |

---

## Appendix A: Phase 2 Implementation Order (Revised)

Based on this analysis, the recommended story execution order differs from the Phase 2 plan:

| Week | Stories | Notes |
|------|---------|-------|
| **Pre-Phase 2** (2-3 days) | P0: Security fixes, P1: TanStack Query setup, P2: Hook extraction scaffolding | Foundation work that all stories depend on |
| **Week 1** | Story 1 (Auth) + Story 6 (Error Handling) | Auth and error handling are cross-cutting; do them first |
| **Week 2** | Story 2 (Dashboard) + Story 3 (Sessions) | Dashboard is read-heavy (benefits most from TQ); Sessions is the core write path |
| **Week 3** | Story 4 (Cronograma CRUD) + Story 5 (Analytics) | Full CRUD and analytics build on the patterns from weeks 1-2 |
| **Week 4** | Story 7 (E2E Testing) + Polish | E2E tests after features are stable |

### Appendix B: File-Level Impact Map

Files that will change most during Phase 2:

| File | Why | Priority |
|------|-----|----------|
| `apps/web/src/App.tsx` | Add QueryClientProvider | P1 |
| `apps/web/src/pages/DashboardPage.tsx` | Refactor to hooks + TQ | P2 |
| `apps/web/src/pages/StudySessionPage.tsx` | Extract timer hook, add mutations | P2 |
| `apps/web/src/pages/CronogramaPage.tsx` | Full CRUD with TQ mutations | Story 4 |
| `apps/web/src/pages/ProgressAnalysisPage.tsx` | Analytics queries with TQ | Story 5 |
| `apps/web/src/services/api.ts` | Add 401 interceptor for auto-logout | Story 1 |
| `apps/api/src/index.js` | Rate limiting, validation middleware | P0 |
| `apps/api/src/services/pontos.js` | Streak bug fix | P0 |
| `apps/web/src/types/index.ts` | Clean PB leftovers, align with backend | P1 |

---

*Generated by AIOX Architect (@architect / Aria)*
*Project: alvo-diario | Phase: 2 Planning*
