# PHASE-2-STORY-001: Complete AuthContext Integration

**Epic:** Phase 2 — Feature Development & Integration
**Status:** Done
**Effort:** 4 hours
**Priority:** HIGH
**Created:** 2026-04-04

---

## Objective

Fully integrate AuthService with AuthContext so that login, signup, and logout all work through a single, consistent auth layer with proper redirects, persisted state, and user-friendly error messages.

---

## Acceptance Criteria

- [x] AuthContext uses AuthService instead of direct API calls
- [x] Login redirects to `/dashboard` on success
- [x] Signup auto-logs in user immediately after account creation
- [x] Logout clears user state and redirects to `/`
- [x] Auth state persists across page refresh (token stored in localStorage)
- [x] Protected routes redirect unauthenticated users to `/login`
- [x] Error messages display for auth failures (invalid credentials, network error, duplicate email)
- [x] `api.ts` handles `401` responses by triggering auto-logout (no infinite loops)

---

## Technical Details

### AuthContext Refactor

The current `AuthContext` makes direct API calls. It must be refactored to delegate entirely to `AuthService`:

```typescript
// apps/web/src/contexts/AuthContext.tsx
// AuthService methods to call:
// - AuthService.login(email, password) → { user, token }
// - AuthService.signup(email, password, name) → { user, token }
// - AuthService.logout() → void
// - AuthService.getCurrentUser() → User | null  (reads from localStorage)
```

### Token Persistence Strategy

- Store JWT in `localStorage` under key `alvo_token`
- Store user object in `localStorage` under key `alvo_user`
- On `AuthContext` mount: read both keys to restore session (no API call needed)
- On logout: clear both keys

### 401 Auto-Logout (api.ts Interceptor)

```typescript
// apps/web/src/services/api.ts
// If response.status === 401:
//   - Clear localStorage
//   - Call window.location.href = '/login'
//   - This ensures any expired token triggers clean re-auth
// NOTE: Do NOT call this on the /auth/login endpoint itself
//       (login returning 401 = bad credentials, not expired session)
```

### TanStack Query Integration for User State

Wrap current user in a `useQuery` with `queryKey: ['user']` and `staleTime: Infinity`. Invalidate this key after login/logout mutations so all consuming components re-render correctly.

### Protected Routes

`ProtectedRoute` wrapper component reads auth state from context. If `user === null` and loading is `false`, redirect to `/login`. Implement in `apps/web/src/components/ProtectedRoute.tsx`.

---

## Dependencies

None — this is the foundation story for all others.

---

## Implementation Notes

- Architecture decision D2 from `PHASE-2-ARCHITECTURE-REVIEW.md`: React Context for auth only, TanStack Query for server data.
- The JWT fallback `|| 'secret'` in `apps/api/src/services/auth.js` and `apps/api/src/middleware/auth.js` **must be removed** as part of this story (Risk R1 — Critical Security). Throw if `JWT_SECRET` env var is missing.
- PocketBase type leftovers (`PBListResponse`, `PBResponse`, `PBAuthResponse`) in `apps/web/src/types/index.ts` should be removed during this story since they are only relevant to auth-era code.
- Do not implement JWT refresh tokens in this story — localStorage persistence with a reasonable token TTL (7 days) is sufficient for Phase 2 scope.

---

## File List

Files already existing (no changes needed):
- [x] `apps/web/src/components/ProtectedRoute.tsx` (already existed with correct implementation)
- [x] `apps/api/src/services/auth.js` (JWT_SECRET guard already in place — no fallback)
- [x] `apps/api/src/middleware/auth.js` (JWT_SECRET guard already in place — no fallback)

Files modified:
- [x] `apps/web/src/contexts/AuthContext.tsx` (refactored: TanStack Query, localStorage-first restore, logout redirect)
- [x] `apps/web/src/services/api.ts` (added 401 auto-logout interceptor, skips /auth/login)
- [x] `apps/web/src/types/index.ts` (removed PBListResponse and PBResponse)
- [x] `apps/web/src/pages/LoginPage.tsx` (uses AuthContext.login instead of AuthService directly)
- [x] `apps/web/src/pages/SignupPage.tsx` (uses AuthContext.signup instead of AuthService directly)

---

**Status Updates:**
- Draft: 2026-04-04 — Created by @sm
- InProgress: 2026-04-06 — All 8 AC implemented by @dev. Lint and typecheck pass.
