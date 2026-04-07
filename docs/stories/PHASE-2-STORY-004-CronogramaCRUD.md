# PHASE-2-STORY-004: Cronograma CRUD Operations

**Epic:** Phase 2 — Feature Development & Integration
**Status:** InProgress
**Effort:** 5 hours
**Priority:** HIGH
**Created:** 2026-04-04

---

## Objective

Users can create, view, edit, and delete their study schedules (cronogramas) with full form validation, optimistic feedback, and real-time cache updates.

---

## Acceptance Criteria

- [x] `CronogramaPage` lists all cronogramas for the authenticated user
- [x] Active cronograma is visually distinguished from inactive ones
- [x] User can create a new cronograma via a modal form (name, edital, materias, start date, end date, daily goal in hours)
- [x] User can edit an existing cronograma (same fields)
- [x] User can delete a cronograma — requires a confirmation dialog before the delete proceeds
- [x] Materias (subjects) can be added and removed dynamically from the form (add input + remove button per materia)
- [x] Form validates all inputs before submit: name required, at least one materia required, dates valid, goal > 0
- [x] Inline validation errors show under each invalid field (not in a toast)
- [x] Success toast on create, edit, and delete
- [x] After any mutation, the cronograma list re-fetches automatically (cache invalidation)
- [x] Changes persist to the database (verified by refresh)

---

## Technical Details

### useCronogramaManager Hook

```typescript
// apps/web/src/hooks/useCronogramaManager.ts
// Composes: useCronogramaList, useCreateCronograma, useUpdateCronograma, useDeleteCronograma
// Also owns: modal open/close state, which cronograma is being edited
interface CronogramaManagerState {
  cronogramas: Cronograma[];
  isLoading: boolean;
  isModalOpen: boolean;
  editingCronograma: Cronograma | null;
  openCreate: () => void;
  openEdit: (cronograma: Cronograma) => void;
  closeModal: () => void;
}
```

### Query Hooks to Add

```typescript
// apps/web/src/hooks/queries/useCronogramas.ts  (extend from Story 002)
export function useCronogramaList(userId: string)
// queryKey: ['cronograma', 'list', userId]
// staleTime: 5 * 60 * 1000

export function useCreateCronograma()
// mutationFn: (data: CreateCronogramaInput) => CronogramaService.create(data)
// onSuccess: invalidate ['cronograma', 'list'] and ['cronograma', 'active']

export function useUpdateCronograma()
// mutationFn: ({ id, data }) => CronogramaService.update(id, data)
// onSuccess: invalidate ['cronograma', 'list'] and ['cronograma', 'active']

export function useDeleteCronograma()
// mutationFn: (id: number) => CronogramaService.delete(id)
// onSuccess: invalidate ['cronograma', 'list'] and ['cronograma', 'active']
```

### Form Schema (Zod)

```typescript
// apps/web/src/schemas/cronograma.ts
const cronogramaSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(100),
  edital: z.string().optional(),
  materias: z.array(z.string().min(1)).min(1, 'Adicione pelo menos 1 matéria'),
  data_inicio: z.string().min(1, 'Data de início obrigatória'),
  data_fim: z.string().min(1, 'Data de término obrigatória'),
  meta_horas_dia: z.number().min(0.5).max(24),
});
```

### Materias Dynamic Input

The form needs a dynamic multi-value input for subjects: a text field that appends to an array on Enter or clicking "Adicionar", with a remove button per item. Extract as `components/forms/MateriasInput.tsx`.

### CronogramaForm Component

Extract the modal form as `components/cronograma/CronogramaForm.tsx`. It receives an optional `initialValues` prop (for edit mode) and calls `onSubmit(data)` when valid. The parent `useCronogramaManager` hook decides whether to call create or update mutation.

### Backend Validation (Minimum)

`CronogramaService.create()` and `.update()` on the backend must accept the correct shape. If Story 006 (global error handling) is not yet done, add inline route-level validation for the cronograma endpoints: `nome` required, `materias` must be an array.

---

## Dependencies

- **Story 001** must be complete: authenticated user required
- **Story 002** must be complete: `useCronogramaList` and `useActiveCronograma` are built on the query infrastructure from Story 002

---

## Implementation Notes

- `CronogramaPage.tsx` is currently 598 lines (W3). After hook extraction, it should be under 150 lines.
- The `materias` column is JSON in MySQL. The service layer must call `JSON.stringify(materias)` before insert/update and `JSON.parse(materias)` on read. Do this in the service, not in the component.
- Delete should be a soft delete (set `status = 'inativo'`) rather than a hard `DELETE` to preserve session history linked to that cronograma. If the current schema uses hard delete, keep that behavior but add a `CASCADE` guard in a migration to prevent orphaned sessions.
- Confirm modal for delete: use shadcn/ui `AlertDialog` component. Do not implement a custom confirm — shadcn already provides this.
- Only one cronograma can be "active" at a time. If user sets a new one as active, the backend should update the previous one to `inativo`. Implement this in the service layer (`CronogramaService.setActive(id, userId)`).
- Form layout: use React Hook Form `Controller` for the `meta_horas_dia` field (number input) and for the `materias` dynamic field to keep validation clean.

---

## File List

Files created:
- [x] `apps/web/src/components/cronograma/CronogramaForm.tsx` (new — modal form with Zod validation)
- [x] `apps/web/src/components/cronograma/CronogramaList.tsx` (new — card grid with active highlight)
- [x] `apps/web/src/components/forms/MateriasInput.tsx` (new — dynamic multi-value input)
- [x] `apps/web/src/schemas/cronograma.ts` (new — Zod frontend validation schema)

Files modified:
- [x] `apps/web/src/hooks/useCronogramaManager.ts` (refactored: list+modal+selection pattern)
- [x] `apps/web/src/hooks/queries/useCronogramas.ts` (already had list, create, update, delete — verified)
- [x] `apps/web/src/pages/CronogramaPage.tsx` (refactored to list+detail+modal with AlertDialog)

---

**Status Updates:**
- Draft: 2026-04-04 — Created by @sm
- InProgress: 2026-04-04 — Implementation by @dev (Dex): list view, modal form, AlertDialog delete, Zod validation, MateriasInput component
