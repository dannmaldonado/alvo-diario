# PHASE-3-STORY-301: Daily Rating 1-5 Schema & UI

**Epic:** Phase 3 — Daily Rating Feature (P0)
**Status:** Done
**Effort:** 4-6 hours
**Priority:** HIGH
**Created:** 2026-04-04

---

## Objective

Add a qualitative self-evaluation field (1-5 rating) to daily goals (`metas_diarias`), allowing users to rate their own performance beyond the quantitative hours metric. Rating labels provide semantic meaning ("Ruim" → "Otimo") and the value feeds downstream stories (streak recalculation, points multiplier) as well as the analytics hook.

---

## Acceptance Criteria

- [x] New column `avaliacao_diaria` (INT, nullable, check 1-5) added to `metas_diarias` table via SQL migration
- [x] `Meta` type in `apps/web/src/types/index.ts` extended with `avaliacao_diaria?: 1 | 2 | 3 | 4 | 5`
- [x] `UpdateMetaInput` type accepts `avaliacao_diaria` as an optional field
- [x] `apps/api/src/services/metas.js` `updateMeta()` allows `avaliacao_diaria` in `allowedFields`
- [x] New component `apps/web/src/components/dashboard/DailyRating.tsx` renders 5 interactive star icons
- [x] Hovering over a star shows its label: 1="Ruim", 2="Fraco", 3="Neutro", 4="Bom", 5="Otimo"
- [x] Selecting a star calls `useUpdateMeta` mutation and persists `avaliacao_diaria` to the database
- [x] `DailyRating` is rendered in Dashboard after the daily goal progress section; previously saved rating is pre-selected on load
- [x] Rating can be updated (clicking a different star overwrites the previous value)
- [x] `useProgressAnalytics` hook exposes `avgDailyRating: number` and `ratingDistribution: Record<1|2|3|4|5, number>` derived from `metas_diarias` data

---

## Technical Details

### Database Migration

```sql
-- apps/api/migrations/XXXXXXXX_add_avaliacao_diaria.sql
ALTER TABLE metas_diarias
  ADD COLUMN avaliacao_diaria INTEGER NULL
    CHECK (avaliacao_diaria BETWEEN 1 AND 5);
```

No data migration required — existing rows default to NULL (no rating).

### Type Extension

```typescript
// apps/web/src/types/index.ts — Meta type
export type Meta = {
  id: string;
  user_id: string;
  data: string;
  horas_meta: number;
  horas_realizadas: number;
  status: 'nao_iniciada' | 'em_progresso' | 'concluida';
  avaliacao_diaria?: 1 | 2 | 3 | 4 | 5;  // NEW
  created: string;
  updated: string;
};
```

`UpdateMetaInput` inherits from `Partial<CreateMetaInput>` — `avaliacao_diaria` is automatically included once added to `CreateMetaInput` or `Meta`. Verify the Omit chain covers it.

### Backend: metas.js updateMeta()

```javascript
// apps/api/src/services/metas.js
const allowedFields = ['horas_meta', 'horas_realizadas', 'status', 'avaliacao_diaria'];
```

The `PATCH /api/metas/:id` route already delegates to `updateMeta()` — no route changes needed.

### DailyRating Component

```
apps/web/src/components/dashboard/DailyRating.tsx
```

Props:
- `metaId: string`
- `currentRating?: 1 | 2 | 3 | 4 | 5`
- `disabled?: boolean` (true when no meta exists for today)

Behavior:
- Uses `Star` icon from `lucide-react` (already installed)
- Hover state: show label in tooltip or inline text below stars
- Selected state: filled star (fill="currentColor")
- Unselected state: outline star
- On click: call `useUpdateMeta` with `{ avaliacao_diaria: starIndex }`
- Show `toast.success('Avaliacao salva!')` on success

### Analytics Extension

In `useProgressAnalytics` hook (`apps/web/src/hooks/useProgressAnalytics.ts`):

Add a TanStack Query for `metas` data:
```typescript
const metasQuery = useQuery({
  queryKey: ['metas', 'user', currentUser?.id, 'all'],
  queryFn: () => MetasService.getAllByUser(currentUser!.id),
  enabled: !!currentUser?.id,
  staleTime: 5 * 60 * 1000,
});
```

Derived values:
- `avgDailyRating`: average of all non-null `avaliacao_diaria` values
- `ratingDistribution`: count of each rating value (1-5) across all metas

Return both from the hook for use in analytics charts.

---

## Dependencies

None — this is the foundation story for Phase 3. Stories 302 and 303 depend on this story being Done.

---

## Implementation Notes

- The `DailyRating` component must be exported from `apps/web/src/components/dashboard/index.ts` if that barrel file exists (check before adding).
- The `MetasService` (`apps/web/src/services/metas.service.ts`) likely needs a `getAllByUser(userId)` method if it does not already expose one — check before adding to avoid duplication.
- Star icon fill: Lucide `Star` accepts a `fill` prop. Use `fill="currentColor"` for filled, `fill="none"` for outline. Combine with Tailwind color classes for the yellow/amber palette (`text-amber-400`).
- The rating label ("Ruim", "Fraco", "Neutro", "Bom", "Otimo") should be shown in Portuguese without accents for now to match the codebase convention observed in `useProgressAnalytics.ts` (e.g., "Disciplina", "Aprendizado" — accents present in some labels; use best judgment, match existing patterns).
- Do NOT modify any streak or points logic in this story — that is the scope of Stories 302 and 303.

---

## File List

### Create (new files)
- [x] `apps/api/migrations/XXXXXXXX_add_avaliacao_diaria.sql`
- [x] `apps/web/src/components/dashboard/DailyRating.tsx`

### Modify (existing files)
- [x] `apps/web/src/types/index.ts` — extend `Meta`, `CreateMetaInput`
- [x] `apps/api/src/services/metas.js` — add `avaliacao_diaria` to `allowedFields`
- [x] `apps/web/src/hooks/useProgressAnalytics.ts` — add `metasQuery`, `avgDailyRating`, `ratingDistribution`
- [x] `apps/web/src/pages/DashboardPage.tsx` (or equivalent) — render `DailyRating` component

---

## Status Updates

- Draft: 2026-04-04 — Created by @sm (River)
