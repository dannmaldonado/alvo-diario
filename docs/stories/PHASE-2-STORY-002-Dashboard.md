# PHASE-2-STORY-002: Dashboard Data Loading & Display

**Epic:** Phase 2 — Feature Development & Integration
**Status:** Done
**Effort:** 4 hours
**Priority:** HIGH
**Created:** 2026-04-04

---

## Objective

Dashboard displays real user data (active cronograma, today's progress, monthly stats) fetched via TanStack Query with proper loading, error, and empty states.

---

## Acceptance Criteria

- [x] `DashboardPage` loads active cronograma via `useActiveCronograma()` query hook
- [x] Today's subjects display correctly from the active cronograma's `materias` field
- [x] Daily goal progress shows as a progress bar (hours completed vs. daily goal)
- [x] Loading skeleton renders while data is fetching (no blank flash)
- [x] Error state displays a user-friendly message when any API call fails
- [x] Empty state renders correctly when no active cronograma exists (with CTA to create one)
- [x] Data refreshes automatically when navigating back to the dashboard
- [x] Monthly stats chart renders without errors (bar or line chart via Recharts)
- [x] Streak counter and points total update after a new study session is saved (query invalidation)

---

## Technical Details

### Hook Extraction

`DashboardPage.tsx` (currently 412 lines) must have its data logic extracted into `useDashboardData`:

```typescript
// apps/web/src/hooks/useDashboardData.ts
export function useDashboardData(userId: string) {
  const cronograma = useActiveCronograma(userId);
  const todayMeta = useTodayMeta(userId);
  const monthlySessoes = useMonthSessions(userId, currentMonth);
  // Derived: today's subjects, goal progress %, monthly chart data
  return { cronograma, todayMeta, monthlySessoes, todaySubjects, goalProgressPercent, chartData };
}
```

### Query Hooks to Create

```typescript
// apps/web/src/hooks/queries/useCronogramas.ts
export function useActiveCronograma(userId: string)
// queryKey: ['cronograma', 'active', userId]
// staleTime: 5 * 60 * 1000

// apps/web/src/hooks/queries/useMetas.ts
export function useTodayMeta(userId: string)
// queryKey: ['metas', 'today', userId, todayDate]
// staleTime: 60 * 1000

// apps/web/src/hooks/queries/useSessoes.ts
export function useMonthSessions(userId: string, month: string)
// queryKey: ['sessoes', 'month', userId, month]
// staleTime: 5 * 60 * 1000
```

### Monthly Stats Chart

Use Recharts `BarChart` or `LineChart` to display daily study hours for the current month. The chart component should be extracted as `components/dashboard/MonthlyStatsChart.tsx` and accept pre-computed `chartData: { day: string; hours: number }[]` as a prop (no data fetching inside the chart component).

### Query Client Setup

`QueryClientProvider` must be added to `App.tsx` before this story can be implemented. This should be done in a dedicated setup commit targeting only `apps/web/src/lib/queryClient.ts` and `apps/web/src/App.tsx`.

### Caching Configuration

```typescript
// apps/web/src/lib/queryClient.ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
```

---

## Dependencies

- **Story 001** must be complete: auth must be working so `userId` is available from context

---

## Implementation Notes

- This story completes the pre-condition of TanStack Query setup (P1 from architecture review). If Story 001 includes QueryClientProvider setup, start from the hook creation step.
- `materias` is a JSON blob in the `cronogramas` table — parse it in the service layer and return typed `Materia[]` to avoid repeated parsing in page logic.
- Monthly stats aggregate `sessoes_estudo` rows by `data_sessao`. The API endpoint `GET /api/sessoes?month=YYYY-MM` should filter by month on the backend, not the frontend.
- `staleTime: 60 * 1000` for today's meta is intentionally short: users actively studying will complete goals within the session window.
- The `Streak` and `Points` data live on the `users` table — use `useCurrentUser` query (set up in Story 001) to display these. Invalidate `['user']` key after session save (Story 003).

---

## File List

Files created:
- [x] `apps/web/src/lib/queryClient.ts` (QueryClient config)
- [x] `apps/web/src/hooks/queries/useCronogramas.ts`
- [x] `apps/web/src/hooks/queries/useMetas.ts`
- [x] `apps/web/src/hooks/queries/useSessoes.ts` (month queries + mutations)
- [x] `apps/web/src/hooks/queries/useUser.ts` (user query keys for invalidation)
- [x] `apps/web/src/hooks/queries/index.ts` (barrel export)
- [x] `apps/web/src/hooks/useDashboardData.ts` (composing hook)
- [x] `apps/web/src/hooks/useScheduleCalculator.ts` (cycle/subject calculations)
- [x] `apps/web/src/components/dashboard/MonthlyStatsChart.tsx` (Recharts BarChart)

Files modified:
- [x] `apps/web/src/App.tsx` (added `QueryClientProvider`)
- [x] `apps/web/src/pages/DashboardPage.tsx` (refactored to use `useDashboardData`, added error state, added MonthlyStatsChart)

---

**Status Updates:**
- Draft: 2026-04-04 — Created by @sm
- Done: 2026-04-06 — Verified and completed by @dev. Added missing error state to DashboardPage, added cronograma invalidation to useUpsertTodayMeta, created MonthlyStatsChart component with Recharts BarChart. All AC met. Lint and typecheck pass.
