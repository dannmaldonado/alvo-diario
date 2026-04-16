# Deployment Guide — Hostinger

## Monorepo Structure
This is a **npm workspaces monorepo** with:
- Frontend: `apps/web/` (React + Vite)
- Backend: `apps/api/` (Node.js + Express)

## Hostinger Configuration

### 1. **Build Command**
```bash
npm install && npm run build
```

This will:
- Install dependencies for root + workspaces
- Build frontend → `dist/apps/web/`
- Ready for production

### 2. **Entry Point / Application URL**
```
apps/api/src/index.js
```

This is the **Node.js backend server** that serves:
- API routes at `/api/*`
- Static frontend files from `dist/apps/web/` 

### 3. **Start Command**
```bash
npm start
```

This executes (from package.json):
```bash
npm run build && npm run start --prefix apps/api
```

Which:
1. Rebuilds frontend → `dist/apps/web/`
2. Starts Node.js server on `apps/api/src/index.js`

### 4. **Public Directory**
Since the Node.js server serves static files, ensure the backend (apps/api) is configured to:
- Serve `dist/apps/web/` as static files
- This happens automatically (check `apps/api/src/index.js` for `express.static()`)

### 5. **Environment Variables**
Set these in Hostinger control panel:
```
NODE_ENV=production
DB_HOST=<your-db-host>
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-pass>
DB_NAME=alvo_diario
JWT_SECRET=<strong-random-secret>
PORT=<port> (usually 3001 or leave blank for auto)
```

### 6. **Verify Deployment**

After deployment, check:

**Frontend accessible:**
```bash
curl https://yourdomain.com/
```
Should return HTML from `dist/apps/web/index.html`

**API working:**
```bash
curl https://yourdomain.com/api/health
# or any actual API endpoint
```

---

## Troubleshooting

### Build fails
- Check `npm run build` locally first
- Ensure all dependencies in both `apps/web/package.json` and `apps/api/package.json` are specified
- Check Node.js version compatibility

### Frontend not loading
- Verify `dist/apps/web/` exists after build
- Check `apps/api/src/index.js` has `express.static('../../dist/apps/web')`
- Check browser console for 404 errors

### API not responding
- Verify `apps/api/src/index.js` is the entry point
- Check `DB_*` environment variables are set
- Check logs for database connection errors

---

## Key Files

- `package.json` - Root monorepo config
- `apps/web/vite.config.ts` - Frontend build config (outputs to `../../dist/apps/web`)
- `apps/api/src/index.js` - Backend entry point (serves static + API)
- `apps/api/.env` - Backend environment variables (or use Hostinger control panel)

---

## Quick Checklist

- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Application/Entry Point: `apps/api/src/index.js`
- [ ] Set Start Command: `npm start`
- [ ] Set Node.js version: 18+ (recommended 20+)
- [ ] Add Environment Variables (DB, JWT_SECRET, etc)
- [ ] Deploy
- [ ] Verify frontend loads (check /estudo route)
- [ ] Verify API responds (try login or other endpoints)
