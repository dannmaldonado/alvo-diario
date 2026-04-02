# Hostinger Node.js Deployment -- alvo-diario

**Last Updated:** 2026-04-02
**Status:** Production deployment guide

---

## Architecture

```
Browser -> Hostinger CDN/LiteSpeed -> Node.js (Express.js)
                                        |
                              +---------+---------+
                              |                   |
                         /api/* routes      Static files
                         (Express Router)   (dist/apps/web/)
                              |                   |
                         MySQL DB           SPA fallback
                                            (index.html)
```

## Hostinger Configuration

### Node.js App Panel Settings

| Field | Value |
|-------|-------|
| **Node.js Version** | 20 |
| **Entry File** | `apps/api/src/index.js` |
| **App Root** | `/` (repository root) |
| **Build Command** | `npm run build` |
| **Start Command** | `npm run start` |

### Environment Variables (Set in Hostinger Panel)

```
NODE_ENV=production
PORT=3000

# Database (Hostinger MySQL)
DB_HOST=<hostinger-mysql-host>
DB_USER=<database-user>
DB_PASSWORD=<database-password>
DB_NAME=alvo_diario
DB_PORT=3306

# Authentication
JWT_SECRET=<strong-random-string-32-chars-minimum>
JWT_EXPIRES_IN=7d

# CORS (must match your domain exactly)
FRONTEND_URL=https://alvodiario.com.br
```

**IMPORTANT:** If Hostinger sets PORT automatically, do NOT override it. The app reads `process.env.PORT` and falls back to 3001 if unset.

### Git Deployment

1. Push to `main` branch on GitHub
2. Hostinger pulls from GitHub (configure in Node.js app panel)
3. Hostinger runs `npm install` automatically
4. Hostinger runs `npm run build` (builds frontend to `dist/apps/web/`)
5. Hostinger runs `npm run start` (starts Express server)

## Build Pipeline

```
npm run build
  -> rm -rf dist/                    (clean previous build)
  -> vite build --outDir dist/apps/web  (compile React app)
  -> Output: dist/apps/web/
       |- index.html                 (entry point)
       |- assets/                    (JS, CSS, fonts, images)
       |    |- index-{hash}.js       (main bundle)
       |    |- vendor-react-{hash}.js
       |    |- vendor-ui-{hash}.js
       |    |- index-{hash}.css
       |    |- ...
       |- .htaccess                  (LiteSpeed cache rules)
       |- llms.txt
```

## Cache Strategy

### Problem: Hostinger CDN Caching

Hostinger uses LiteSpeed CDN which aggressively caches responses. Without proper headers, it can serve stale HTML for days, causing the browser to request JS/CSS files that no longer exist (from old builds).

### Solution: Headers at 3 Levels

**Level 1: Express.js (primary)**
- HTML/SPA fallback: `no-cache, no-store, must-revalidate`
- Hashed assets: `public, max-age=31536000, immutable`
- API responses: `Surrogate-Control: no-store`

**Level 2: .htaccess (LiteSpeed backup)**
- Default: `no-cache, no-store, must-revalidate`
- Asset override: `public, max-age=31536000, immutable`

**Level 3: Vite content hashing**
- Every asset filename includes a content hash (e.g., `index-BU7d93Yp.js`)
- When code changes, hash changes, so old cached assets are never requested

### CDN-Specific Headers

| Header | Purpose |
|--------|---------|
| `Surrogate-Control: no-store` | Tells CDN proxies not to cache |
| `X-Accel-Expires: 0` | Nginx/LiteSpeed specific: no cache |
| `Vary: Accept-Encoding, Cookie` | Prevents CDN from serving same response to all users |
| `Pragma: no-cache` | HTTP/1.0 backward compatibility |

## Troubleshooting

### 503 Service Unavailable

**Possible causes:**
1. Express.js crashed on startup (check logs)
2. `.env` not found and DB_HOST not set -> MySQL connection fails
3. `dist/apps/web/` does not exist (build did not run)
4. PORT mismatch (Hostinger expects specific port)

**Debug steps:**
```
1. Check Hostinger Node.js logs in panel
2. SSH into server and run: node apps/api/src/index.js
3. Look for [env], [config], [frontend] log lines
4. Check /health endpoint: curl https://alvodiario.com.br/health
```

### MIME Type Errors

**Symptom:** Browser console says "Expected JS/CSS but got HTML"

**Cause:** CDN cached old HTML that references non-existent asset hashes. When browser requests those files, Express returns index.html (SPA fallback) instead of JS.

**Fix:**
1. Purge Hostinger CDN cache (if available in panel)
2. Hard refresh: Ctrl+Shift+R / Cmd+Shift+R
3. Wait for CDN TTL to expire (headers now set to no-cache)

### White Screen

**Cause:** Frontend JS failed to load or execute.

**Debug:**
1. Open DevTools (F12) -> Console tab
2. Check Network tab for failed requests (red)
3. Verify /health returns `{"status":"ok"}`
4. Check that `dist/apps/web/index.html` references existing files

### Old Content / "Hostinger Horizons"

**Cause:** Hostinger CDN serving cached version from before your app was deployed.

**Fix:**
1. The new `.htaccess` and Express headers prevent future caching
2. If old cache persists: restart Node.js app in Hostinger panel
3. Clear browser cache: Ctrl+Shift+Delete

## Environment Variable Verification

After deployment, hit the health endpoint:

```bash
curl https://alvodiario.com.br/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-02T...",
  "env": "production",
  "port": 3000,
  "dbConfigured": true
}
```

If `dbConfigured: false`, environment variables are not set correctly.

## Files Modified in This Fix

| File | Change |
|------|--------|
| `apps/api/src/index.js` | Complete rewrite: env loading, path resolution, cache headers, CORS, error handling |
| `apps/api/src/db/connection.js` | Smart env loading with multiple path candidates |
| `apps/web/public/.htaccess` | Anti-CDN cache headers (was pro-CDN before) |
| `apps/web/vite.config.ts` | Added `emptyOutDir: true` |
| `package.json` | Build script now cleans dist/ first |

## Rollback

If the new deployment fails:

```bash
git revert HEAD
git push
```

Hostinger will redeploy the previous version automatically.
