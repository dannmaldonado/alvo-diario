# PHASE-3-STORY-303: Rating-based Points Multiplier

**Epic:** Phase 3 — Daily Rating Feature (P0)
**Status:** Done
**Effort:** 2-3 hours
**Priority:** HIGH
**Created:** 2026-04-04

---

## Objective

Implement a points multiplier system driven by the daily rating. When a user submits their end-of-day rating, the points already earned that day from study sessions are recalculated using the multiplier table. Higher ratings amplify points; rating 1 zeros them out; rating 2 halves them. This creates a meaningful incentive to self-assess honestly and perform well.

---

## Acceptance Criteria

- [x] Multiplier table applied to points earned on the rated day:
  - Rating 1 = 0x (no points for the day)
  - Rating 2 = 0.5x (half points)
  - Rating 3 = 1x (base points, no change)
  - Rating 4 = 1.5x
  - Rating 5 = 2x
- [x] `historico_pontos` records `rating_multiplier` value for rating-triggered point adjustments
- [x] `calcularPontos()` in `pontos.js` accepts optional `rating` parameter and returns multiplied value
- [x] When a rating is submitted via PATCH `/api/metas/:id`, the backend calculates total session minutes for that day, applies the multiplier delta, and updates `users.pontos_totais` accordingly
- [x] Rating 3 (1x) on a day results in zero point adjustment (no duplicate credit for base points already awarded)
- [x] Dashboard displays `pontos_totais` correctly after rating submission (existing query invalidation handles this via `useQueryClient`)
- [x] Analytics: `useProgressAnalytics` exposes `pointsByRating: Record<1|2|3|4|5, number>` showing total points distribution per rating level
- [x] UI: `DailyRating` component displays a small points preview ("+20 pts" or "-10 pts") when user hovers over a star, based on today's session minutes and the multiplier delta

---

## Technical Details

### calcularPontos() Extension

```javascript
// apps/api/src/services/pontos.js
const RATING_MULTIPLIERS = {
  1: 0,
  2: 0.5,
  3: 1,
  4: 1.5,
  5: 2,
};

export const calcularPontos = (duracao_minutos, rating = 3) => {
  const base = Math.floor(duracao_minutos / 15);
  const multiplier = RATING_MULTIPLIERS[rating] ?? 1;
  return Math.floor(base * multiplier);
};
```

The default `rating = 3` preserves backwards compatibility for all existing callers that do not pass a rating.

### Rating-triggered Point Adjustment

When a rating is submitted (PATCH `/api/metas/:id` with `avaliacao_diaria`), a new function `ajustarPontosRating()` is called:

```javascript
// apps/api/src/services/pontos.js — new function
export const ajustarPontosRating = async (userId, data, metaDate) => {
  if (!data.avaliacao_diaria) return;

  const connection = await pool.getConnection();
  try {
    // Idempotency: only process once per day per meta
    const [[{ jaProcessado }]] = await connection.query(
      `SELECT COUNT(*) as jaProcessado
       FROM historico_pontos
       WHERE user_id = ? AND DATE(data) = ? AND motivo = 'rating_adjustment'`,
      [userId, metaDate]
    );
    if (jaProcessado > 0) return;

    // Sum session minutes for the rated day
    const [[{ totalMinutos }]] = await connection.query(
      `SELECT COALESCE(SUM(duracao_minutos), 0) as totalMinutos
       FROM sessoes_estudo
       WHERE user_id = ? AND data_sessao = ?`,
      [userId, metaDate]
    );

    const basePoints = Math.floor(totalMinutos / 15);
    const multiplier = RATING_MULTIPLIERS[data.avaliacao_diaria];
    const adjustedPoints = Math.floor(basePoints * multiplier);
    const delta = adjustedPoints - basePoints; // can be negative, zero, or positive

    if (delta !== 0) {
      await connection.query(
        'UPDATE users SET pontos_totais = pontos_totais + ? WHERE id = ?',
        [delta, userId]
      );
    }

    // Record adjustment regardless of delta (for audit and idempotency)
    const { v4: uuidv4 } = await import('uuid');
    await connection.query(
      `INSERT INTO historico_pontos
         (id, user_id, data, pontos, motivo, rating_multiplier)
       VALUES (?, ?, ?, ?, 'rating_adjustment', ?)`,
      [uuidv4(), userId, metaDate, delta, multiplier]
    );
  } finally {
    connection.release();
  }
};
```

### historico_pontos Schema Extension

```sql
-- apps/api/migrations/XXXXXXXX_add_rating_multiplier_to_historico.sql
ALTER TABLE historico_pontos
  ADD COLUMN rating_multiplier DECIMAL(3,1) NULL;
```

Existing rows get NULL — no backfill needed.

### Route Integration

```javascript
// apps/api/src/routes/metas.js (same handler as Story 302)
// After updateMeta() and atualizarStreakByRating():
if (req.body.avaliacao_diaria !== undefined) {
  const meta = await getMetaById(req.user.id, req.params.id);
  await ajustarPontosRating(req.user.id, req.body, meta.data);
}
```

### Points Preview in DailyRating Component

In `DailyRating.tsx` (created in Story 301), add:
- Props: `todaySessionMinutes: number` (passed from Dashboard)
- On hover: compute `previewDelta = Math.floor(todaySessionMinutes / 15 * multiplier) - Math.floor(todaySessionMinutes / 15)`
- Display below stars: `+{previewDelta} pts` (green) or `{previewDelta} pts` (red) or blank if delta = 0

### Analytics Extension

In `useProgressAnalytics.ts`, using `metas` data:

```typescript
const pointsByRating = metas.reduce<Record<number, number>>((acc, m) => {
  if (m.avaliacao_diaria != null) {
    const rating = m.avaliacao_diaria;
    const base = Math.floor((m.horas_realizadas * 60) / 15);
    acc[rating] = (acc[rating] ?? 0) + Math.floor(base * RATING_MULTIPLIERS[rating]);
  }
  return acc;
}, {});
```

Return `pointsByRating` from the hook.

### "Perfect Day" Badge / Notification

When `avaliacao_diaria === 5` AND `meta.status === 'concluida'` (hours goal met), the route handler calls `badges.js` to check/award a "Perfect Day" badge. Exact badge implementation depends on existing `badges.js` structure — verify before implementing.

---

## Dependencies

- **PHASE-3-STORY-302-RatingStreak.md** must be Done before starting this story.
  - Requires: Story 301 Done (column, types, DailyRating component)
  - Requires: Story 302 Done (PATCH metas route already calls rating-processing functions)
  - Requires: `rating_multiplier` column in `historico_pontos` (new migration in this story)

---

## Implementation Notes

- `delta !== 0` guard: a rating of 3 results in zero delta — the guard prevents a useless `UPDATE` and ensures no `historico_pontos` noise. But the idempotency row IS still inserted so re-submission is blocked.
- Negative points delta: rating 1 (0x) or 2 (0.5x) can reduce `pontos_totais`. This is by design. The Dashboard should reflect the true value; no floor at zero is required unless the product decides otherwise.
- The points preview in `DailyRating` is a UI enhancement — it requires `todaySessionMinutes` to be passed down. The Dashboard already has this via `useDashboardData` (monthly sessions query covers today). Extract today's total from the sessions array.
- `RATING_MULTIPLIERS` should be defined once in a shared location. Options: (a) duplicate in `pontos.js` (backend) and a frontend constants file; (b) expose via API endpoint. For now, duplicate in both locations — a future refactor can unify via a shared config.
- Tests: cover (a) rating 5 with 60 minutes → 8 base × 2 = 16 points, delta = +8; (b) rating 1 with 60 minutes → 0, delta = -8; (c) rating 3 → delta = 0, no UPDATE called; (d) idempotency: second call with same date returns early.

---

## File List

### Create (new files)
- [x] `apps/web/src/components/analytics/PointsByRatingChart.tsx` — bar chart showing points per rating level with base/bonus breakdown

### Modify (existing files)
- [x] `apps/api/src/db/schema.sql` — add `rating_multiplier DECIMAL(3,1)` column to `historico_pontos`
- [x] `apps/api/src/services/pontos.js` — add `RATING_MULTIPLIERS` constant, extend `calcularPontos()` with optional rating param, add `ajustarPontosRating()` function
- [x] `apps/api/src/routes/metas.js` — import and call `ajustarPontosRating` on PATCH with `avaliacao_diaria`
- [x] `apps/web/src/components/dashboard/DailyRating.tsx` — fix multiplier values (0x/0.5x/1x/1.5x/2x), add `todaySessionMinutes` prop, points delta preview on hover
- [x] `apps/web/src/hooks/useDashboardData.ts` — compute and expose `todaySessionMinutes`
- [x] `apps/web/src/hooks/queries/useMetas.ts` — add `RATING_MULTIPLIERS`, show multiplier info in toast on rating save
- [x] `apps/web/src/hooks/useProgressAnalytics.ts` — add `pointsByRating`, `basePointsEarned`, `bonusPointsFromRating` to `RatingStats`
- [x] `apps/web/src/pages/DashboardPage.tsx` — pass `todaySessionMinutes` to DailyRating, add Perfect Day badge
- [x] `apps/web/src/pages/ProgressAnalysisPage.tsx` — add PointsByRatingChart section
- [x] `apps/web/src/types/index.ts` — add `rating_multiplier` to `HistoricoPontos` type

---

## Status Updates

- Draft: 2026-04-04 — Created by @sm (River)
- InProgress: 2026-04-08 — Implementation by @dev (Dex). All 8 AC implemented. Lint + typecheck pass.
