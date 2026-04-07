# PHASE-2-STORY-005: Progress Analytics & Reporting

**Epic:** Phase 2 — Feature Development & Integration
**Status:** Done
**Effort:** 6 hours
**Priority:** MEDIUM
**Created:** 2026-04-04

---

## Objective

Users can view their study progress through analytics charts and statistics: total hours, subject breakdown, streak, goal completion, and monthly trends.

---

## Acceptance Criteria

- [ ] `ProgressAnalysisPage` loads session data via `useProgressAnalytics()` hook
- [ ] Total hours studied (all time and current month) displays correctly
- [ ] Subject breakdown shows hours per materia as a bar chart or horizontal list with percentages
- [ ] Monthly statistics chart shows daily hours for the current month (reuses `MonthlyStatsChart` from Story 002)
- [ ] Streak counter shows current consecutive study days
- [ ] Points total displays correctly
- [ ] Goal completion percentage for the current month shows (actual hours / (daily goal × days elapsed))
- [ ] User can filter by date range (start date + end date) — default is current month
- [ ] All charts render without errors when data is empty (zero state handled)
- [ ] Loading skeleton while data fetches

---

## Technical Details

### useProgressAnalytics Hook

```typescript
// apps/web/src/hooks/useProgressAnalytics.ts
interface ProgressAnalytics {
  totalHoursAllTime: number;
  totalHoursThisMonth: number;
  subjectBreakdown: { materia: string; hours: number; percent: number }[];
  dailyHoursChart: { day: string; hours: number }[];
  streakCurrent: number;
  pointsTotal: number;
  goalCompletionPercent: number;
  isLoading: boolean;
  error: Error | null;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
}
```

### Subject Breakdown — Analytics Concern

The architecture review (Section 2.3) flagged that `materias` is stored as a JSON blob in `cronogramas`, making cross-schedule queries inefficient. For Phase 2, solve this in the API layer:

```
GET /api/sessoes?start=YYYY-MM-DD&end=YYYY-MM-DD
→ Returns all sessions in range with { materia, duracao_minutos, data_sessao }
→ Frontend groups by materia to compute breakdown
```

This is acceptable for up to ~1000 sessions per user. Document the scalability limit as a comment in the hook.

### New API Endpoint

Add `GET /api/sessoes/analytics?start=YYYY-MM-DD&end=YYYY-MM-DD` (or extend existing `GET /api/sessoes`) to return sessions filtered by date range. The frontend aggregates the data — the backend only needs to filter and return raw session rows.

### Chart Components

- **SubjectBreakdownChart**: `components/analytics/SubjectBreakdownChart.tsx` — horizontal bar chart using Recharts `BarChart`. Props: `data: { materia: string; hours: number; percent: number }[]`
- Reuse `components/dashboard/MonthlyStatsChart.tsx` from Story 002 for the daily hours chart.

### Date Range Filter

Use two `<input type="date">` elements. Default values: first day of current month to today. When range changes, invalidate the analytics query. Store the range as `useState` inside `useProgressAnalytics`.

### Recharts Dependency

Recharts is listed as "needs install" in `PHASE-2-PLAN.md`. Confirm it is in `package.json` or add it:
```bash
npm install recharts
```
Both `ProgressAnalysisPage` and `DashboardPage` (Story 002) use Recharts — ensure the version is consistent.

---

## Dependencies

- **Story 001**: user must be authenticated
- **Story 002**: `MonthlyStatsChart` component and `useSessoes` query hook must exist
- **Story 003**: meaningful session data must exist to validate analytics correctness

---

## Implementation Notes

- `ProgressAnalysisPage.tsx` is currently 669 lines (W3). After hook extraction, target under 150 lines.
- Streak and points are denormalized on the `users` table — read them from `useCurrentUser` query (set up in Story 001), not from sessions. This avoids a recalculation.
- Goal completion formula: `(actual_hours_this_month / (daily_goal × days_elapsed_in_month)) × 100`. Cap at 100% for display. If `daily_goal` is 0 or undefined, show "No goal set" instead of dividing by zero.
- Empty state for subject breakdown: render a "Sem sessoes no período" placeholder instead of an empty chart.
- Do not add an export feature in this story — it was listed as optional in the spawn prompt and is deferred to Phase 3.
- Chart colors: use the existing design token system (`lib/design-tokens.ts`) for chart fill colors to stay consistent with the UI.

---

## File List

Files to be created:
- [ ] `apps/web/src/hooks/useProgressAnalytics.ts` (new)
- [ ] `apps/web/src/components/analytics/SubjectBreakdownChart.tsx` (new)

Files to be modified:
- [ ] `apps/web/src/hooks/queries/useSessoes.ts` (add `useAnalyticsSessions(dateRange)` query)
- [ ] `apps/web/src/pages/ProgressAnalysisPage.tsx` (refactor to use `useProgressAnalytics`)
- [ ] `apps/api/src/routes/sessoes.js` (add date range filter to GET endpoint)

---

**Status Updates:**
- Draft: 2026-04-04 — Created by @sm
