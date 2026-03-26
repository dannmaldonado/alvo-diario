# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**alvo-diario** is a monorepo containing a visual web builder platform (Hostinger Horizons) with a React frontend and PocketBase backend. The project includes custom Vite plugins for real-time visual editing, selection mode, and component inspection.

## Architecture

### Monorepo Structure

```
monorepo/
├── apps/web/          # React + Vite frontend
└── apps/pocketbase/   # PocketBase backend & database
```

### Web Application (apps/web)

**Tech Stack:**
- React 18 with Vite (not Next.js)
- TailwindCSS + Shadcn/ui (Radix UI components)
- React Router for navigation
- React Hook Form + Zod for forms
- PocketBase JS SDK for backend communication

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
- `plugins/vite-plugin-pocketbase-auth.js` - PocketBase auth management

These plugins are **only active in development** (`isDev` check in vite.config.js) and inject error handlers, fetch monitoring, and navigation detection.

### PocketBase Backend (apps/pocketbase)

**Database:**
- PocketBase CLI binary
- TypeScript type definitions (`database-types.d.ts`)
- Migrations in `pb_migrations/`
- Hooks in `pb_hooks/`
- Data in `pb_data/`

## Common Commands

### Root (Monorepo)
```bash
npm run dev       # Start both web (port 3000) and pocketbase (port 8090)
npm run build     # Build web app to dist/apps/web
npm run start     # Start pocketbase server
npm run lint      # Lint web app
```

### Web App (apps/web)
```bash
npm run dev         # Start Vite dev server (http://localhost:3000)
npm run build       # Build for production
npm run start       # Preview production build
npm run lint        # ESLint check
npm run lint:warn   # ESLint with warnings shown
```

**Single Test/File:**
- Run ESLint on specific file: `cd apps/web && npx eslint path/to/file.jsx`

### PocketBase (apps/pocketbase)
```bash
npm run dev                  # Start dev server
npm run start               # Start with data persistence
npm run migrations:up       # Apply migrations
npm run migrations:revert   # Revert migrations
npm run migrations:snapshot # Create migration snapshot
npm run update             # Update PocketBase binary
```

**Note:** PocketBase runs on `http://localhost:8090` with admin dashboard at `/admin`.

## Development Workflow

### Starting Development
```bash
npm run dev  # Runs both web and pocketbase concurrently
```

This starts:
- Web app at `http://localhost:3000` with Vite HMR
- PocketBase at `http://localhost:8090`

The web app can communicate with PocketBase via the PocketBase JS SDK (already imported in dependencies).

### Adding Components

Use Shadcn/ui components from the library. The project uses `@radix-ui/*` packages directly. Components are in `src/components/ui/`.

To add a new component:
1. Create component in `src/components/` or use Shadcn library
2. Import from `@/components/...`
3. Apply TailwindCSS classes (configured in `tailwind.config.js`)

### Forms

Use React Hook Form + Zod:
- Define schema with Zod
- Use `useForm()` hook
- Resolver: `zodResolver(schema)`
- Access form state, errors, and submit handler

### Database Access

Use the PocketBase JS SDK (`pocketbase` package):
```javascript
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://localhost:8090');
```

Database types are auto-generated in `database-types.d.ts` in the PocketBase directory.

## Key Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite config with custom plugins |
| `tailwind.config.js` | TailwindCSS styling config |
| `jsconfig.json` | Path aliases (`@/` → `src/`) |
| `eslint.config.mjs` | ESLint rules (React, hooks) |
| `components.json` | Shadcn/ui component metadata |

## Important Notes

### Development-Only Plugins

The custom Vite plugins (`inlineEditPlugin`, `editModeDevPlugin`, `selectionModePlugin`, etc.) are **only loaded in development** and inject runtime code for:
- Visual error handling (Vite errors, runtime errors, console errors)
- Fetch monitoring and error logging
- Navigation event detection
- PocketBase auth context management

These do **not** affect production builds.

### Error Handling

Vite is configured to suppress certain console warnings (line 269: `console.warn = () => {}`). CSS syntax errors are also filtered to reduce noise during development.

### Environment Variables

- **PB_ENCRYPTION_KEY**: Encryption key for PocketBase (used in npm scripts)
- **NODE_ENV**: Set automatically by Vite (`production` during build)
- **TEMPLATE_BANNER_SCRIPT_URL & TEMPLATE_REDIRECT_URL**: Optional production-only template scripts

Check `.env` files if they exist for additional configuration.

### Build Output

- Production build: `dist/apps/web/` (specified in vite.config.js)
- Vite uses Terser for minification
- External dependencies: Babel packages are marked as external in rollupOptions

## Debugging

### Console Output

- Open browser DevTools (F12)
- Check Network tab for API calls to PocketBase
- Runtime errors are logged and sent via `window.parent.postMessage` (for iframe environments)

### Vite Errors

- Errors appear in dev server console and browser overlay
- Custom error handler parses stack traces to show file locations

### PocketBase Logs

- Admin dashboard: `http://localhost:8090/admin`
- Check request logs and hook execution results there

## Testing & Linting

```bash
npm run lint       # Check for lint errors
npm run lint:warn  # Show all warnings
```

No test framework is currently configured. For new features, consider adding unit tests if they involve complex logic.

## Notes on Monorepo Setup

- Uses npm workspaces (`packages` field in root package.json)
- `concurrently` for running multiple dev servers
- Shared dependencies at root level; app-specific deps in each app's package.json
- Build scripts handle cross-app references (e.g., `dist/apps/web` path in web build)

---

**Last Updated:** 2026-03-25
