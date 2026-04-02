# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**alvo-diario** is a monorepo for a study platform helping Brazilian students prepare for police exams (PC, PRF, PF). It has a React frontend and a Node.js/Express REST API backend with MySQL.

## Architecture

### Monorepo Structure

```
monorepo/
├── apps/web/   # React + Vite frontend
└── apps/api/   # Node.js + Express REST API
```

### Web Application (apps/web)

**Tech Stack:**
- React 18 with Vite (not Next.js)
- TailwindCSS + Shadcn/ui (Radix UI components)
- React Router for navigation
- React Hook Form + Zod for forms
- Fetch-based `apiClient` (`src/services/api.ts`) for backend communication
- JWT stored in `localStorage` (`auth_token`)

**Key Directories:**
- `src/pages/` - Route pages
- `src/components/` - Reusable components
- `src/components/ui/` - Shadcn/ui component library
- `src/lib/` - Utilities and helpers
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React context providers
- `plugins/` - Custom Vite plugins for visual editing and mode switching

**Custom Vite Plugins (Development Features):**
- `plugins/visual-editor/vite-plugin-react-inline-editor.js` - Live editing
- `plugins/visual-editor/vite-plugin-edit-mode.js` - Edit mode toggle
- `plugins/selection-mode/vite-plugin-selection-mode.js` - Element selection
- `plugins/vite-plugin-iframe-route-restoration.js` - Route restoration in iframes

These plugins are **only active in development** (`isDev` check in vite.config.ts) and inject error handlers, fetch monitoring, and navigation detection.

### API Backend (apps/api)

**Tech Stack:**
- Node.js + Express
- MySQL (managed database)
- JWT authentication
- `apps/api/src/db/schema.sql` — database schema + migrations

**Key files:**
- `src/index.js` — server entry, routes setup
- `src/db/connection.js` — MySQL pool
- `src/routes/` — Express routers (auth, cronogramas, sessoes, metas, badges, historico, exames)
- `src/services/` — business logic
- `src/middleware/auth.js` — JWT middleware

## Common Commands

### Root (Monorepo)
```bash
npm run dev       # Start both web (port 3000) and API (port 3001)
npm run build     # Build web app and run DB migrations
npm run start     # Start API server (production)
npm run lint      # Lint web app
```

### Web App (apps/web)
```bash
npm run dev         # Start Vite dev server (http://localhost:3000)
npm run build       # Build for production
npm run lint        # ESLint check
npm run lint:warn   # ESLint with warnings shown
```

### API (apps/api)
```bash
npm run dev         # Start with nodemon
npm run start       # Start production server
npm run migrate     # Apply DB migrations (schema.sql)
```

## Development Workflow

### Starting Development
```bash
npm run dev  # Runs both web and API concurrently
```

This starts:
- Web app at `http://localhost:3000` with Vite HMR
- API at `http://localhost:3001`

### Adding Components

Use Shadcn/ui components from the library. The project uses `@radix-ui/*` packages directly. Components are in `src/components/ui/`.

### Forms

Use React Hook Form + Zod:
- Define schema with Zod
- Use `useForm()` hook
- Resolver: `zodResolver(schema)`

### API Access

Use `apiClient` from `@/services/api`:
```typescript
import { apiClient } from '@/services/api';
const data = await apiClient.get('/api/some-endpoint');
const result = await apiClient.post('/api/some-endpoint', { body });
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `apps/web/vite.config.ts` | Vite config with custom plugins |
| `apps/web/tailwind.config.js` | TailwindCSS styling config |
| `apps/web/src/services/api.ts` | API client (fetch-based, JWT auth) |
| `apps/api/src/db/schema.sql` | Database schema + migrations |
| `apps/api/.env` | API environment variables (DB, JWT_SECRET) |

## Important Notes

### Authentication

- JWT token stored in `localStorage.auth_token`
- All protected API routes use `authenticate` middleware
- `AuthService` in `src/services/auth.service.ts` handles login/signup/logout

### Development-Only Plugins

The custom Vite plugins are **only loaded in development** and inject runtime code for:
- Visual error handling (Vite errors, runtime errors, console errors)
- Fetch monitoring and error logging
- Navigation event detection

These do **not** affect production builds.

### Environment Variables (apps/api)

- **DB_HOST, DB_USER, DB_PASSWORD, DB_NAME**: MySQL connection
- **JWT_SECRET**: JWT signing key
- **NODE_ENV**: `production` in deployment
- **PORT**: Server port (default 3001)

### Build Output

- Production build: `dist/apps/web/` (specified in vite.config.ts)
- Vite uses Terser for minification
- External dependencies: Babel packages are marked as external in rollupOptions

## Debugging

### Console Output

- Open browser DevTools (F12)
- Check Network tab for API calls to `/api/*`
- Runtime errors are logged and sent via `window.parent.postMessage` (for iframe environments)

### API Logs

- Check Hostinger Node.js app logs in the control panel

## Testing & Linting

```bash
npm run lint       # Check for lint errors
npm run lint:warn  # Show all warnings
```

## Notes on Monorepo Setup

- Uses npm workspaces (`packages` field in root package.json)
- `concurrently` for running multiple dev servers
- Shared dependencies at root level; app-specific deps in each app's package.json
- Build scripts handle cross-app references (e.g., `dist/apps/web` path in web build)

---

**Last Updated:** 2026-04-01
