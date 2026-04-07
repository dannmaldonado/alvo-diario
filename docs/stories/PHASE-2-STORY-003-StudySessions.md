# PHASE-2-STORY-003: Study Session Management

**Epic:** Phase 2 — Feature Development & Integration
**Status:** Done
**Effort:** 6 hours
**Priority:** HIGH
**Created:** 2026-04-04

---

## Objective

Users can start a study session, use a Pomodoro timer, select a subject, and save the session to the database — with points, streak, and daily progress updating immediately after save.

---

## Acceptance Criteria

- [x] `StudySessionPage` loads the active cronograma and populates the subject selector
- [x] Pomodoro timer works correctly: 25-minute study cycle followed by 5-minute break
- [x] Timer shows remaining time in `MM:SS` format and indicates current phase (Study / Break)
- [x] User can select a subject (materia) from the active cronograma before starting
- [x] User can input session duration in minutes (valid range: 1–1440)
- [x] User can add optional notes to the session (free text, max 500 chars)
- [x] Saving a session calls `SessoesService.create()` via `useCreateSessao()` mutation
- [x] On successful save: toast notification confirms, dashboard query cache is invalidated
- [x] Streak counter and points update in the dashboard after session save
- [x] Saving multiple sessions in one day does not corrupt the streak counter
- [x] User can view the list of sessions saved for the current day on this page

---

## Technical Details

### Timer Logic

Extract timer into `useStudySession` hook — pure client-side state, no API calls inside the hook:

```typescript
// apps/web/src/hooks/useStudySession.ts
interface StudySessionState {
  phase: 'idle' | 'study' | 'break' | 'done';
  secondsRemaining: number;
  cycleCount: number;
  selectedMateria: string | null;
  duration: number;
  notes: string;
}
// Phases:
// - idle: not started, showing configuration
// - study: 25-min countdown active
// - break: 5-min break countdown
// - done: user stopped or cycles completed
```

Timer uses `setInterval` (1-second tick). Cleanup interval on unmount. Do not use `Date.now()` drift correction — accuracy to ±1 second is acceptable.

### Create Session Mutation

```typescript
// apps/web/src/hooks/queries/useSessoes.ts  (add to existing file)
export function useCreateSessao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSessaoInput) => SessoesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessoes'] });
      queryClient.invalidateQueries({ queryKey: ['metas', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['user'] }); // streak + points
    },
    onError: (error) => handleApiError(error, 'Salvar sessao'),
  });
}
```

### Streak Bug Fix (Priority 0 from Architecture Review)

The streak update in `apps/api/src/services/pontos.js` increments streak on every session save, including the 2nd and 3rd sessions in the same day.

Fix by making `atualizarStreak` idempotent:
```javascript
// Only update streak if this is the FIRST session of today
const [countHoje] = await connection.query(
  'SELECT COUNT(*) as count FROM sessoes_estudo WHERE user_id = ? AND DATE(data_sessao) = CURDATE()',
  [userId]
);
if (countHoje[0].count === 1) {
  // This is the first session today — proceed with streak update
}
```

This fix MUST be included in this story since the streak mutation is triggered by session save.

### Session List for Today

```typescript
// apps/web/src/hooks/queries/useSessoes.ts
export function useTodaySessions(userId: string)
// queryKey: ['sessoes', 'today', userId, todayDate]
// staleTime: 30 * 1000  (short — reflects saves quickly)
```

Display as a compact list below the timer: subject, duration, time saved. No delete functionality needed in this story.

### Backend API Endpoint (verify/add)

Confirm `POST /api/sessoes` exists and accepts:
```json
{
  "cronograma_id": "number",
  "materia": "string",
  "duracao_minutos": "number (1-1440)",
  "notas": "string (optional, max 500)"
}
```
If Zod validation middleware (Story 006) is not yet done, add inline validation for the session endpoint here as a minimum viable guard (`duracao_minutos` must be positive, materia must not be empty).

---

## Dependencies

- **Story 001** must be complete: user must be authenticated
- **Story 002** must be complete: `useActiveCronograma` hook must exist for subject list

---

## Implementation Notes

- `StudySessionPage.tsx` is currently 664 lines (W3 from architecture review). After extracting `useStudySession`, the page should be under 200 lines.
- Timer component should be extracted as `components/study/PomodoroTimer.tsx` — receives only display props and callbacks, no hook logic inside.
- Session duration input: use a number `<input>` with `min=1 max=1440`, not a slider. Sliders are imprecise for >60 min sessions.
- The `useActiveCronograma` hook from Story 002 is reused here — do not create a duplicate query.
- `materias` is stored as a JSON array in `cronogramas.materias`. The subject selector should parse this once in the hook and pass `string[]` to the component.
- Streak fix goes into `apps/api/src/services/pontos.js` — this is a backend change included in this story.

---

## File List

Files created:
- [x] `apps/web/src/hooks/useStudySession.ts` (timer + session state hook)
- [x] `apps/web/src/components/study/PomodoroTimer.tsx` (display component)
- [x] `apps/web/src/components/study/TodaySessionsList.tsx` (today's sessions list)

Files modified:
- [x] `apps/web/src/hooks/queries/useSessoes.ts` (`useCreateSessao`, `useTodaySessions`, `useDeleteSessao`)
- [x] `apps/web/src/pages/StudySessionPage.tsx` (refactored to use hooks, extracted components)
- [x] `apps/api/src/services/pontos.js` (streak idempotency fix with double guard)
- [x] `apps/api/src/schemas/sessao.schema.js` (Zod validation for create/update)
- [x] `apps/web/src/services/sessoes.service.ts` (SessoesService CRUD)

---

**Status Updates:**
- Draft: 2026-04-04 — Created by @sm
- Done: 2026-04-04 — All 9 AC verified by @dev. Lint and typecheck pass clean.
