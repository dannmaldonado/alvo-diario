# PHASE-2-STORY-006: Global Error Handling & User Feedback

**Epic:** Phase 2 — Feature Development & Integration
**Status:** Done
**Effort:** 3 hours
**Priority:** MEDIUM
**Created:** 2026-04-04

---

## Objective

The application has consistent, user-friendly error handling across all API interactions, form submissions, and unexpected failures — with toast notifications, fallback UIs, and graceful degradation.

---

## Acceptance Criteria

- [ ] All API errors surface a toast message with a clear, non-technical description
- [ ] `401` errors trigger auto-logout and redirect to login (handled in `api.ts` — see Story 001)
- [ ] `404` errors show a "resource not found" message without crashing the page
- [ ] `5xx` errors show a "something went wrong" message with a Retry button
- [ ] Network errors (fetch failed, timeout) show "Sem conexao — verifique sua internet"
- [ ] `429` (rate limit) errors show "Muitas tentativas — aguarde alguns segundos"
- [ ] Form validation errors display inline under the relevant field (not as toasts)
- [ ] All TanStack Query mutations use a shared `onError` handler that calls `handleApiError()`
- [ ] An `ErrorBoundary` component wraps the router — unexpected React errors show a safe fallback UI instead of a blank screen
- [ ] Loading states use skeleton components (not spinners) for data-heavy pages

---

## Technical Details

### handleApiError Utility

```typescript
// apps/web/src/lib/errors.ts
export function handleApiError(error: unknown, context: string): void {
  if (error instanceof ValidationError) {
    toast.error(`Dados inválidos: ${error.message}`);
  } else if (error instanceof AuthenticationError) {
    // auto-logout handled in api.ts; nothing extra needed here
    return;
  } else if (isNetworkError(error)) {
    toast.error('Sem conexao — verifique sua internet');
  } else if (error instanceof APIError) {
    const msg = getHttpErrorMessage(error.status);
    toast.error(msg, { action: error.status >= 500 ? { label: 'Tentar novamente', onClick: () => window.location.reload() } : undefined });
  } else {
    toast.error('Algo deu errado. Tente novamente.');
    console.error(`[${context}]`, error);
  }
}

function getHttpErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Dados inválidos',
    403: 'Acesso negado',
    404: 'Recurso não encontrado',
    429: 'Muitas tentativas — aguarde alguns segundos',
    500: 'Erro interno — tente novamente',
    503: 'Servico indisponivel — tente mais tarde',
  };
  return messages[status] ?? 'Algo deu errado';
}
```

### ErrorBoundary Component

```typescript
// apps/web/src/components/ErrorBoundary.tsx
// Class component (required for React error boundaries)
// Props: children, fallback?: ReactNode
// Catches unhandled render errors
// Fallback UI: centered card with error message + "Recarregar página" button
```

Wire into `App.tsx` wrapping `<RouterProvider>` or `<BrowserRouter>`.

### TanStack Query Global Error Handler

```typescript
// apps/web/src/lib/queryClient.ts
new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => handleApiError(error, 'Mutation'),
    },
  },
})
```

This ensures every mutation automatically calls `handleApiError` unless the mutation hook overrides `onError` explicitly.

### Backend Validation Middleware (Priority 1 from Architecture Review)

```javascript
// apps/api/src/middleware/validate.js
import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validacao falhou',
      details: result.error.flatten(),
    });
  }
  req.body = result.data;
  next();
};
```

Apply to at minimum: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/sessoes`, `POST /api/cronogramas`.

### Rate Limiting (Security Fix)

```javascript
// apps/api/src/index.js
import rateLimit from 'express-rate-limit';
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth', authLimiter);
```

Requires: `npm install express-rate-limit` in `apps/api`.

### Skeleton Loading

Replace all `isLoading` spinner patterns with shadcn/ui `Skeleton` components. Pages that need skeletons: `DashboardPage`, `CronogramaPage`, `ProgressAnalysisPage`. `StudySessionPage` only needs a skeleton for the subject selector dropdown.

---

## Dependencies

- Can be implemented in parallel with Story 002 and Story 003. Its artifacts (`handleApiError`, `ErrorBoundary`) will be consumed by all other stories.
- **Story 001** must be complete for the `401` auto-logout path to work end-to-end.

---

## Implementation Notes

- The `toast` utility is already in the project via shadcn/ui Sonner integration. Use the existing `useToast` hook — do not introduce a second toast library.
- The `APIError` class hierarchy already exists in `apps/web/src/types/index.ts` (S3 from architecture review). Use it as-is.
- `isNetworkError` check: `error instanceof TypeError && error.message === 'Failed to fetch'` covers most network failure cases in browser environments.
- The architecture review does not recommend a global Redux/Zustand error store — keep error state local to components via TanStack Query's `error` return value. The `handleApiError` utility is a side-effect handler (toast), not a state store.
- Install `express-rate-limit` at the workspace level: `npm install express-rate-limit -w apps/api`.

---

## File List

Files to be created:
- [ ] `apps/web/src/lib/errors.ts` (new — `handleApiError`, `getHttpErrorMessage`, `isNetworkError`)
- [ ] `apps/web/src/components/ErrorBoundary.tsx` (new)
- [ ] `apps/api/src/middleware/validate.js` (new)

Files to be modified:
- [ ] `apps/web/src/lib/queryClient.ts` (add global mutation `onError` handler)
- [ ] `apps/web/src/App.tsx` (wrap router with `ErrorBoundary`)
- [ ] `apps/api/src/index.js` (add `express-rate-limit` to auth routes)
- [ ] `apps/api/src/routes/auth.js` (apply `validate` middleware to login + register)
- [ ] `apps/api/src/routes/sessoes.js` (apply `validate` middleware to POST)
- [ ] `apps/api/src/routes/cronogramas.js` (apply `validate` middleware to POST + PUT)

---

**Status Updates:**
- Draft: 2026-04-04 — Created by @sm
