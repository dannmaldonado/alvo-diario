# PHASE-3-STORY-302: Rating-based Streak Recalculation

**Epic:** Phase 3 — Daily Rating Feature (P0)
**Status:** Done
**Effort:** 2-3 hours
**Priority:** HIGH
**Created:** 2026-04-04

---

## Objective

Modify the streak calculation logic so that only days where the user assigned a rating >= 3 count as "active days" that maintain the streak. A rating of 1 or 2 breaks the streak, and a day with no rating (NULL) also breaks the streak. This adds a qualitative gate to streak progression, making streaks reflect genuine productive days rather than any study activity.

---

## Acceptance Criteria

- [x] `atualizarStreakByRating()` in `apps/api/src/services/pontos.js` added — queries `metas_diarias` for `avaliacao_diaria >= 3` and counts consecutive active days backward from today
- [x] Days with `avaliacao_diaria` of 1 or 2 do NOT extend the streak
- [x] Days with NULL `avaliacao_diaria` do NOT extend the streak (treated as no qualifying activity)
- [x] Consecutive day calculation is correct: streak counts backward from today, only counting days with rating >= 3
- [x] Streak resets to 0 when no consecutive qualifying day exists from today
- [x] Dashboard displays streak with tooltip explaining "Dias consecutivos com avaliacao 3+ estrelas"; `useUpdateMetaRating` invalidates `['user']` query so streak refreshes
- [x] Analytics: `useProgressAnalytics` exposes `activeDays`, `inactiveDays`, `activePercentage` — shown in ProgressAnalysisPage with summary cards, progress bar, and ActiveDaysChart weekly bar chart
- [x] Edge cases handled: multiple-day gap (streak breaks), rating exactly 3 (boundary, counts as active), re-rating same day (recalculates correctly, no idempotency issue since we count from scratch each time)

---

## Technical Details

### Streak Logic (pontos.js)

New function `atualizarStreakByRating(userId)`:
- Gets all metas for last 365 days from `metas_diarias`
- Builds a Set of dates with `avaliacao_diaria >= 3`
- Counts consecutive days backward from today
- Sets `users.streak_atual` to the count (0 if today is not active)
- No idempotency guard needed: recalculates from scratch on every call (user can change rating)
- Original `atualizarStreak()` preserved for session-based streak

### Route Integration (metas.js)

PATCH `/api/metas/:id` handler calls `atualizarStreakByRating(userId)` when `avaliacao_diaria` is present in request body. Wrapped in try/catch so streak failure does not fail the meta update.

### Frontend

- `useProgressAnalytics.ts`: Added `activeDays`, `inactiveDays`, `activePercentage` to `RatingStats` interface and return value. Exposed `allMetas` for chart consumption.
- `DashboardPage.tsx`: Added hover tooltip on streak badge explaining rating-based streak logic.
- `ProgressAnalysisPage.tsx`: Added "Dias Ativos vs Inativos" summary section with 3 stat cards and progress bar. Added ActiveDaysChart weekly bar chart.
- `useMetas.ts`: `useUpdateMetaRating` now invalidates `['user']` query key to refresh streak on dashboard.

---

## Dependencies

- **PHASE-3-STORY-301-DailyRating.md** must be Done before starting this story.
  - Requires: `avaliacao_diaria` column in `metas_diarias`
  - Requires: `atualizarStreakByRating` call site (PATCH metas route)
  - Requires: `metas` query in `useProgressAnalytics`

---

## Implementation Notes

- The existing `atualizarStreak()` uses `sessoes_estudo` as its data source. This story introduces a parallel mechanism that uses `metas_diarias.avaliacao_diaria`. Both coexist.
- Streak is set to absolute value (not incremented), preventing double-count issues. If today has rating >= 3 and yesterday has rating >= 3, streak = 2 (not streak + 1).
- Re-rating from 4 to 2 on same day: recalculates correctly since we count from scratch.
- Re-rating from 2 to 4 on same day: recalculates correctly, streak includes today.

---

## File List

### Create (new files)
- [x] `apps/web/src/components/analytics/ActiveDaysChart.tsx` — Weekly bar chart showing active vs inactive days

### Modify (existing files)
- [x] `apps/api/src/services/pontos.js` — added `atualizarStreakByRating()` export
- [x] `apps/api/src/routes/metas.js` — import and call `atualizarStreakByRating` on PATCH with `avaliacao_diaria`
- [x] `apps/web/src/hooks/useProgressAnalytics.ts` — added `activeDays`, `inactiveDays`, `activePercentage` to `RatingStats`; exposed `allMetas`
- [x] `apps/web/src/hooks/queries/useMetas.ts` — `useUpdateMetaRating` invalidates `['user']` query for streak refresh
- [x] `apps/web/src/pages/DashboardPage.tsx` — added streak tooltip explaining rating-based logic
- [x] `apps/web/src/pages/ProgressAnalysisPage.tsx` — added active/inactive days stats section and ActiveDaysChart

---

## Status Updates

- Draft: 2026-04-04 — Created by @sm (River)
- InProgress: 2026-04-08 — Implementation by @dev (Dex)
