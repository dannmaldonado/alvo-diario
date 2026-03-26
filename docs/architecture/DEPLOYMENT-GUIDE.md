# Deployment Guide — alvo-diario

**Status:** Planning Phase
**Last Updated:** 2026-03-25

---

## Overview

This guide covers deployment options for alvo-diario's React frontend + PocketBase backend architecture.

---

## Deployment Options

### Option 1: Single Container (Recommended) 🚀

**Best for:** Starting out, cost-conscious, simple operations

**Architecture:**
```
Docker Container
├── React app (built assets, served by nginx/caddy)
├── PocketBase binary
└── SQLite database (mounted volume)
```

**Platforms:** Railway, Fly.io, DigitalOcean App Platform, AWS ECS, Heroku alternative

**Cost:** $5-20/month

**Pros:**
- ✅ Simple deployment (single container)
- ✅ Easy scaling (horizontal)
- ✅ Excellent DX with GitHub Actions
- ✅ Fast iteration

**Cons:**
- ⚠️ Database file-based (use volumes carefully)
- ⚠️ Requires container orchestration knowledge

**Recommended: Railway**
- Free tier: perfect for testing
- Pay-as-you-go: transparent pricing
- GitHub integration: automatic deploys on push
- PostgreSQL add-on available

**Steps:**
```bash
# 1. Push to GitHub (already done)
# 2. Create Railway project
# 3. Connect GitHub repo
# 4. Set environment variables
# 5. Deploy automatically on push
```

**Estimated effort:** 30 minutes

---

### Option 2: Separate Frontend + Backend

**Best for:** Scaling independently, CDN for frontend, managed backend

**Architecture:**
```
Frontend (Vercel/Netlify)    Backend (Railway/Fly.io)
├── React app                └── PocketBase
├── Static assets            └── SQLite/PostgreSQL
└── CDN caching              └── Volumes/Database
```

**Cost:** Frontend free ($0-20), Backend $5-20/month

**Pros:**
- ✅ Frontend on global CDN (fast)
- ✅ Backend can scale independently
- ✅ Frontend free tier option
- ✅ Excellent for performance

**Cons:**
- ⚠️ Two deployments to manage
- ⚠️ CORS configuration needed
- ⚠️ More complex setup

**Recommended:** Vercel (frontend) + Railway (backend)

**Steps:**
```bash
# Frontend (Vercel)
1. Push web/ to GitHub
2. Connect Vercel to GitHub
3. Set build: npm run build
4. Deploy

# Backend (Railway)
1. Separate GitHub repo or monorepo setup
2. Create Railway app
3. Configure environment variables
4. Deploy PocketBase
```

**Estimated effort:** 1-2 hours

---

### Option 3: Serverless (Advanced)

**Best for:** High traffic, auto-scaling, pay-per-use

**Architecture:**
```
Frontend: Vercel (serverless)
Backend: Firebase/Supabase or AWS Lambda + RDS
```

**Cost:** Free-$100+/month (usage-based)

**Pros:**
- ✅ Infinite scaling
- ✅ Pay for what you use
- ✅ Automatic backups
- ✅ Professional managed services

**Cons:**
- ⚠️ PocketBase not serverless-friendly (stateful)
- ⚠️ Consider moving to Firebase/Supabase instead
- ⚠️ Cold start delays
- ⚠️ More expensive at scale

**Not recommended for current project** — PocketBase is stateful (needs running process)

---

## Recommended Path: Railway + Vercel

### Step 1: Deploy Backend (Railway)

**Prerequisites:**
- Railway account (free)
- GitHub repo push (done)
- Environment variables defined

**Process:**

1. **Create Railway Project**
   ```bash
   1. Go to railway.app
   2. Click "New Project"
   3. Select "Deploy from GitHub"
   4. Authorize GitHub
   5. Select alvo-diario repository
   ```

2. **Configure PocketBase Service**
   ```yaml
   # Railway automatically detects Node.js project
   # Need to add custom Dockerfile for PocketBase:

   FROM node:18-alpine
   WORKDIR /app
   COPY . .
   RUN npm ci --prefix apps/web && npm run build --prefix apps/web
   COPY apps/pocketbase/pocketbase /app/pocketbase
   RUN chmod +x /app/pocketbase
   EXPOSE 8090
   CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090"]
   ```

3. **Set Environment Variables**
   ```env
   PB_ENCRYPTION_KEY=your-secret-key
   NODE_ENV=production
   ```

4. **Deploy**
   - Railway deploys automatically from GitHub
   - Monitor logs: Dashboard → Logs
   - Public URL assigned automatically

**Expected time:** 15 minutes

### Step 2: Deploy Frontend (Vercel)

**Prerequisites:**
- Vercel account (free)
- GitHub repo push (done)
- Backend URL from Railway

**Process:**

1. **Create Vercel Project**
   ```bash
   1. Go to vercel.com
   2. Click "New Project"
   3. Select alvo-diario repository
   4. Select "web" as root directory
   ```

2. **Configure Build Settings**
   ```yaml
   Framework: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm ci
   Environment Variables:
     VITE_PB_URL=https://your-railway-app.up.railway.app
   ```

3. **Deploy**
   - Vercel deploys automatically
   - Get production URL
   - CNAME configured for custom domain (optional)

**Expected time:** 10 minutes

### Step 3: Configure Frontend for Backend

**Update API endpoint:**

```javascript
// apps/web/src/lib/pocketbaseClient.js

const pb = new PocketBase(
  import.meta.env.VITE_PB_URL || 'http://localhost:8090'
);

export default pb;
```

**Update Vite config:**

```javascript
// apps/web/vite.config.js

server: {
  proxy: {
    '/api': {
      target: process.env.VITE_PB_URL || 'http://localhost:8090',
      changeOrigin: true,
    }
  }
}
```

**Expected time:** 5 minutes

---

## Local Development Setup

### Prerequisites

```bash
# Required
Node.js 18+
npm 9+
Git

# Optional (for testing)
Docker
```

### Setup Commands

```bash
# Clone repository
git clone https://github.com/dannmaldonado/alvo-diario.git
cd alvo-diario

# Install dependencies
npm install

# Start development servers
npm run dev

# This runs:
# - React app on http://localhost:3000
# - PocketBase on http://localhost:8090
```

### Access Points

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:3000 | Auto-reload on changes |
| PocketBase API | http://localhost:8090/api | REST API |
| PocketBase Admin | http://localhost:8090/_/ | Database management |
| PocketBase Docs | http://localhost:8090/docs | OpenAPI docs |

---

## Production Checklist

Before deploying to production:

- [ ] Environment variables set (PB_ENCRYPTION_KEY, API URLs)
- [ ] Database backed up
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] CORS configured correctly
- [ ] Error tracking set up (Sentry/similar)
- [ ] Monitoring enabled
- [ ] Backup strategy documented
- [ ] Disaster recovery plan created
- [ ] Security audit completed

---

## Database Backup Strategy

### Automated Backups (Railway)

Railway automatically backs up PostgreSQL databases (if migrated).

### Manual Backups (SQLite)

```bash
# Export PocketBase data
./pocketbase export pb_backup.zip

# Restore from backup
./pocketbase restore pb_backup.zip
```

### Backup Schedule

| Environment | Frequency | Retention |
|-------------|-----------|-----------|
| Development | Manual | N/A |
| Staging | Daily | 7 days |
| Production | Daily | 30 days |

---

## Scaling Strategy

### Phase 1: Single Container (Current)
- Sufficient for < 100 concurrent users
- Simple deployment
- Easy to debug

### Phase 2: Separate Services (100-1K users)
- Frontend on CDN (Vercel)
- Backend on dedicated server
- PostgreSQL instead of SQLite

### Phase 3: Distributed (1K+ users)
- Load balanced backend instances
- Read replicas for reporting
- Cache layer (Redis)
- CDN for static assets

---

## Monitoring & Logging

### Essential Metrics

- [ ] Error rate (errors per minute)
- [ ] Response time (p50, p95, p99)
- [ ] Database query time
- [ ] Authentication failures
- [ ] API uptime

### Recommended Tools

1. **Error Tracking:** Sentry (free tier available)
2. **Logging:** Loki or CloudFlare Logpush (free options)
3. **Metrics:** Prometheus + Grafana (self-hosted)
4. **Uptime:** UptimeRobot (free)

---

## Rollback Procedures

### Frontend Rollback (Vercel)

```bash
# Vercel keeps all deployments
# Click previous deployment → "Redeploy"
# Takes 1-2 minutes
```

### Backend Rollback (Railway)

```bash
# Option 1: Redeploy previous commit
git revert <commit-hash>
git push  # Railway auto-deploys

# Option 2: Restore database from backup
# (if schema changed)
```

---

## Cost Estimate (Monthly)

| Component | Platform | Cost | Notes |
|-----------|----------|------|-------|
| Frontend | Vercel | $0-20 | Free tier available |
| Backend | Railway | $5-20 | Pay-as-you-go |
| Database | SQLite (in container) | $0 | Included in Railway |
| Domain | Namecheap | $0-12 | Optional |
| Monitoring | Sentry | $0-29 | Free tier generous |
| **Total** | | **$5-81** | **Starting: $5-10** |

---

## Next Steps

1. **Create Railway account** (5 min)
2. **Create Vercel account** (5 min)
3. **Deploy backend** (15 min)
4. **Deploy frontend** (10 min)
5. **Test production connection** (5 min)
6. **Set up monitoring** (30 min)

**Total setup time:** ~1.5 hours

---

**Deployment Guide by:** Aria (Architect)
**Recommended Status:** Ready to deploy
**Next Review:** After first production deployment
