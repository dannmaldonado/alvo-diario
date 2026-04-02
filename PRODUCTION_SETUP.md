# Production Setup Guide - Alvo Diário

## Problem Fixed: 503 Errors on Asset Loading

### Root Cause
The Express.js server was not properly serving static assets (CSS, JS files) with correct MIME types and cache headers, causing 503 Service Unavailable errors when the frontend tried to load them.

### What Was Wrong
1. **Missing MIME type configuration** - Assets were served without proper `Content-Type` headers
2. **Incomplete cache headers** - Static files need aggressive caching directives for performance
3. **No proper error handling** - 404s for assets weren't handled gracefully

### What Was Fixed
Updated `/apps/api/src/index.js` to:
- Serve static assets with proper MIME types (application/javascript, text/css, font/woff2, etc.)
- Add correct cache headers:
  - Hashed assets (e.g., `index-BU7d93Yp.js`) are cached for 1 year with `immutable` flag
  - HTML/entry points are never cached (`max-age=0, must-revalidate`)
- Handle 404 errors gracefully for missing assets
- Log errors with timestamps for debugging

## Deployment Configuration

### For Lovable Deployment

When deploying to Lovable, configure the following:

#### 1. Build Command
```
npm run build
```

This builds both the frontend and prepares the backend.

#### 2. Output Directory
```
dist/apps/web
```

Lovable should serve files from this directory.

#### 3. Start Command
```
npm run start
```

This starts the Express.js server which serves both:
- API endpoints at `/api/*`
- Static frontend files and SPA fallback

### 4. Environment Variables
Make sure the following are set in Lovable dashboard:

```
NODE_ENV=production
PORT=3000 (or whatever port Lovable assigns)
DATABASE_URL=your_mysql_connection_string
JWT_SECRET=your_jwt_secret
```

## Key Changes Made

### File: `apps/api/src/index.js`

**Added:**
- Proper static file serving with MIME type configuration
- Cache-Control headers for assets vs. HTML
- ETag disabling to ensure fresh content
- Improved error logging with timestamps
- 404 handling for both API and non-API routes

**Before:** Assets were served without proper headers, causing browser caching and MIME type issues.

**After:** All asset types are served with correct headers, modern cache busting via filename hashing works properly.

## Testing the Fix Locally

### 1. Build the frontend
```bash
npm run build
```

### 2. Start the server
```bash
npm run start
```

The server will run on port 3000 and serve:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/*
- Assets: http://localhost:3000/assets/*

### 3. Check for errors
Open browser DevTools (F12) → Network tab
- CSS files should load with `Content-Type: text/css`
- JS files should load with `Content-Type: application/javascript`
- All responses should have appropriate Cache-Control headers

### 4. Test the SPA fallback
Visit any route like http://localhost:3000/chronograms
- Should serve index.html and let React handle routing
- No 404 errors in console

## Architecture

### Production Flow
```
Request → Express.js Server
  ├─ /api/* → API routes (auth, cronogramas, etc.)
  ├─ /assets/* → Static files (CSS, JS, fonts) with aggressive caching
  ├─ /health → Health check endpoint
  └─ /* → SPA fallback (index.html) for client-side routing
```

### Build Output Structure
```
dist/apps/web/
├── index.html (entry point, never cached)
├── assets/
│   ├── index-CK0dn-Gt.css (hashed, cached 1 year)
│   ├── vendor-react-B6JWnSTd.js (hashed, cached 1 year)
│   └── ... (other chunks)
└── llms.txt (metadata)
```

## Monorepo Structure

This is a **monorepo** with two apps:

### `apps/web`
- React frontend with Vite build tool
- Builds to `dist/apps/web`
- Dev server on port 3000 (for development only)

### `apps/api`
- Express.js backend (Node.js)
- Serves the frontend in production
- Runs on port 3001 (development) or whatever Lovable assigns

## Troubleshooting

### If Assets Still Show 503 Errors

1. **Check build artifacts exist:**
   ```bash
   ls -la dist/apps/web/assets/
   ```

2. **Verify Express is serving from correct path:**
   - Log should show: `Server running on port 3000 (production)`
   - Check `apps/api/src/index.js` line 48 - path should be `../../../dist/apps/web`

3. **Check frontend path is correct:**
   - All asset references should start with `/assets/` (absolute paths)
   - Check `dist/apps/web/index.html` for correct script/link tags

4. **Enable verbose logging:**
   ```bash
   NODE_DEBUG=http npm run start
   ```

### If SPA Routing Fails

Make sure all non-API, non-asset routes fall through to the catch-all handler:
```javascript
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
```

This should be the LAST middleware before error handler.

## Cache Busting Strategy

The build system (Vite) automatically adds content hashes to filenames:
- `index-BU7d93Yp.js` - Hash changes if content changes
- `vendor-react-B6JWnSTd.js` - Hash changes if dependency changes

This allows safe 1-year caching since filenames are unique per version.

If you need to force a cache clear in production:
1. Re-run `npm run build`
2. Deploy new build artifacts
3. Old hashes won't be requested (Lovable serves new index.html with new hashes)

## Related Files

- `apps/web/vite.config.ts` - Frontend build configuration (Vite)
- `apps/web/package.json` - Build command: `vite build --outDir ../../dist/apps/web`
- `apps/api/src/index.js` - Backend server (Express.js) - **MODIFIED**
- `package.json` - Monorepo root with workspaces
