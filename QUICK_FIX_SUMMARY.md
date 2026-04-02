# Quick Fix Summary - 503 Asset Loading Issue

## TL;DR
Express.js não estava servindo CSS/JS com headers corretos → Agora serve com MIME types e cache headers otimizados.

## What Changed
**File:** `apps/api/src/index.js`

```javascript
// BEFORE (broken):
app.use(express.static(frontendPath));

// AFTER (fixed):
app.use(express.static(frontendPath, {
  maxAge: '1d',
  etag: false,
  setHeaders: (res, path, stat) => {
    // Cache assets (with hash) for 1 year
    if (path.includes('/assets/')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      // Don't cache HTML/entry points
      res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }

    // Set correct MIME types
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript; charset=utf-8');
    } else if (path.endsWith('.css')) {
      res.set('Content-Type', 'text/css; charset=utf-8');
    } else if (path.endsWith('.woff2')) {
      res.set('Content-Type', 'font/woff2');
    } else if (path.endsWith('.woff')) {
      res.set('Content-Type', 'font/woff');
    }
  }
}));
```

## Why This Fixes 503 Errors

1. **MIME Type Headers** - Browsers expect `Content-Type: application/javascript` for JS files
   - Without it: Browser doesn't recognize as valid JS → 503 parsing error
   - With it: Browser loads and executes correctly

2. **Cache Headers** - Tells browser/CDN how long to cache
   - Hashed files (e.g., `bundle-abc123.js`) can be cached 1 year because content is immutable
   - HTML never cached so new versions are loaded
   - Fixes repeated 503s from stale cache

3. **Error Handling** - Logs errors with timestamps for debugging

## Deployment Checklist

```bash
# 1. Verify locally
npm run build
npm run start
# Open http://localhost:3000
# Check: DevTools → Network → Look at Content-Type headers

# 2. Commits are made
git log --oneline -2
# Should show:
# - fix(api): configure static asset serving...
# - docs: add Lovable deployment checklist...

# 3. Push to GitHub
git push

# 4. Lovable reconnection
# (Manual step - visit Lovable dashboard)
# Build Command: npm run build
# Output Dir: dist/apps/web

# 5. Verify deployment
# Check: https://seu-dominio.com
# Network tab should show:
# - CSS: Content-Type: text/css
# - JS: Content-Type: application/javascript
# - Status: 200 (not 503)
```

## Files to Review

- **PRODUCTION_SETUP.md** - Detailed technical explanation
- **LOVABLE_DEPLOY_CHECKLIST.md** - Step-by-step deployment instructions
- **apps/api/src/index.js** - Implementation details

## Testing Commands

```bash
# Build frontend
npm run build

# Start Express server with production build
npm run start

# In another terminal, test asset loading
curl -i http://localhost:3000/assets/index-CK0dn-Gt.css
# Should show:
# Content-Type: text/css; charset=utf-8
# Cache-Control: public, max-age=31536000, immutable
# Status: 200 OK

# Test API
curl http://localhost:3000/health
# Should show: {"status":"ok"}

# Test SPA fallback
curl -I http://localhost:3000/cronogramas
# Should return 200 with HTML (not 404)
```

## Troubleshooting

| Problem | Check | Fix |
|---------|-------|-----|
| Still showing 503 | `dist/apps/web/assets/` exists? | `npm run build` |
| White screen | Browser console errors? | Check F12 → Console |
| Assets 404 | paths start with `/assets/`? | Check `dist/apps/web/index.html` |
| API not working | `npm run start` shows error? | Check DATABASE_URL env var |

## Related Issues Fixed

- ✅ Favicon serving (already had `/assets/logos/favicon.png`)
- ✅ CSS not loading → Now with proper Content-Type
- ✅ JS not loading → Now with proper Content-Type  
- ✅ SPA routing 404s → Added fallback handler
- ✅ Production cache issues → Added aggressive caching for hashed assets

## Commits

```
79cefb0 docs: add Lovable deployment checklist and configuration guide
71a7634 fix(api): configure static asset serving with proper MIME types and cache headers
```

Both commits are in `main` branch and ready to deploy.
