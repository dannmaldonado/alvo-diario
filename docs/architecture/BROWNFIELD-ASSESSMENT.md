# Brownfield Architecture Assessment — alvo-diario

**Project:** alvo-diario
**Assessment Date:** 2026-03-25
**Status:** Active Development
**Architecture Class:** Modern Monorepo (React + Express.js + MySQL)

---

## Executive Summary

**alvo-diario** is a modern full-stack application for study planning and goal tracking. The architecture is **well-structured** with clear separation of concerns (React frontend + PocketBase backend) and implements **contemporary best practices** (Vite, TailwindCSS, React Router, Context API).

**Key Strengths:**
- Modern tooling (Vite, React 18, TypeScript-ready)
- Clean monorepo structure with npm workspaces
- Comprehensive UI component library (Shadcn/ui)
- Strong type system foundation (PocketBase TypeScript support)
- Custom Vite plugins for enhanced developer experience

**Primary Opportunities:**
- State management strategy documentation and optimization
- API layer abstraction (service/SDK layer)
- Testing infrastructure (unit, integration, E2E)
- Performance monitoring and optimization
- Database query optimization strategy

---

## Current Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   React App     │
                    │  (Vite + HMR)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌────────┐          ┌─────────┐         ┌──────────┐
    │ Pages  │          │Components│        │ Context  │
    └────────┘          │ (Shadcn) │        │(Auth)    │
                        └─────────┘        └──────────┘
                             │
                    ┌────────▼────────┐
                    │ PocketBase SDK  │
                    │   (HTTP/REST)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────────┐
                    │   PocketBase API    │
                    │  (http://localhost) │
                    │    :8090/api        │
                    └────────┬────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌─────────┐         ┌──────────┐       ┌──────────┐
    │ Auth    │         │Collections│      │  Hooks   │
    │ System  │         │(Database) │      │(Business │
    └─────────┘         └──────────┘       │ Logic)   │
                                           └──────────┘
```

### Monorepo Structure

```
alvo-diario/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   ├── src/
│   │   │   ├── pages/         # Route pages
│   │   │   ├── components/    # UI components
│   │   │   │   └── ui/        # Shadcn/ui library
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── contexts/      # React Context (Auth)
│   │   │   └── lib/           # Utilities, SDK clients
│   │   ├── plugins/           # Custom Vite plugins
│   │   ├── public/            # Static assets
│   │   └── vite.config.js     # Vite configuration
│   │
│   └── pocketbase/            # PocketBase backend
│       ├── pb_migrations/     # Database migrations
│       ├── pb_hooks/          # Server-side hooks
│       ├── pb_data/           # Database files
│       ├── database-types.d.ts# Generated types
│       └── pocketbase         # Binary executable
│
├── docs/                       # Project documentation
├── .github/workflows/          # GitHub Actions CI/CD
├── package.json               # Monorepo config
└── CLAUDE.md                  # Developer guide
```

---

## Technology Stack Analysis

### Frontend Layer

| Component | Technology | Status | Notes |
|-----------|-----------|--------|-------|
| **Framework** | React 18.3.1 | ✅ Current | Modern, with Hooks support |
| **Bundler** | Vite 7.3.1 | ✅ Current | Fast rebuild times, excellent DX |
| **Styling** | TailwindCSS 3.4.17 | ✅ Current | Utility-first, maintainable |
| **UI Components** | Shadcn/ui (Radix) | ✅ Current | 50+ component library |
| **Routing** | React Router 7.13.0 | ✅ Current | Stable, handles protected routes |
| **Forms** | React Hook Form 7.71.2 | ✅ Current | Performant form state |
| **Validation** | Zod 4.3.6 | ✅ Current | TypeScript-first schema |
| **State** | Context API | ⚠️ Limited | Sufficient for Auth, needs strategy for global state |
| **Animations** | Framer Motion 11.15.0 | ✅ Current | Smooth, declarative animations |
| **Charts** | Recharts 2.15.4 | ✅ Current | Used for progress analysis |
| **HTTP** | PocketBase SDK | ✅ Current | REST client, built-in types |

**Assessment:** Modern, well-selected stack with no deprecated technologies. Excellent for developer experience.

### Backend Layer

| Component | Technology | Status | Notes |
|-----------|-----------|--------|-------|
| **Framework** | PocketBase 0.25.0 | ✅ Current | Self-hosted, batteries-included |
| **Database** | SQLite (file-based) | ⚠️ Greenfield | Suitable for early stage, plan for migration path |
| **API** | REST + WebSockets | ✅ Current | Built-in, real-time capable |
| **Authentication** | Built-in JWT | ✅ Current | Secure, configurable |
| **Migrations** | PocketBase CLI | ✅ Current | Version-controlled migrations |
| **Hooks** | JavaScript/Node | ✅ Current | Server-side business logic |
| **Authorization** | RLS (Row-Level Security) | ⚠️ Not visible | Should audit for implemented policies |

**Assessment:** Self-contained, minimal dependencies. PocketBase excellent for rapid development; review for scale/performance as project grows.

### DevOps & Tooling

| Component | Technology | Status | Notes |
|-----------|-----------|--------|-------|
| **Version Control** | Git + GitHub | ✅ Setup | Just initialized |
| **CI/CD** | GitHub Actions | ✅ Setup | Lint, build, CodeQL configured |
| **Package Manager** | npm (workspaces) | ✅ Current | Monorepo setup correct |
| **Linting** | ESLint 8.57.1 | ✅ Current | React + hooks rules enabled |
| **Type Checking** | JSConfig (not TS) | ⚠️ Partial | Ready to migrate to TypeScript |
| **Testing** | None configured | ❌ Missing | Critical gap |

**Assessment:** Solid CI/CD foundation. Needs testing framework and TypeScript migration.

---

## Current State Assessment

### Strengths ✅

1. **Modern React Architecture**
   - Functional components with Hooks
   - Context API for auth state
   - Protected routes with AuthProvider
   - Clean component hierarchy

2. **Developer Experience**
   - Vite with HMR (fast feedback loop)
   - Custom Vite plugins for visual editing and selection mode
   - Path aliases (`@/` for src/)
   - Comprehensive UI component library

3. **Backend Simplicity**
   - PocketBase handles auth, DB, API, webhooks
   - TypeScript types auto-generated
   - Migrations version-controlled
   - No external service dependencies for core features

4. **Deployment Ready**
   - Docker-friendly (PocketBase binary + Node.js)
   - GitHub Actions CI/CD configured
   - Static frontend (can deploy to CDN)
   - Self-contained backend

5. **Code Organization**
   - Clear monorepo separation (web + pocketbase)
   - Logical directory structure
   - Proper isolation with npm workspaces

### Weaknesses ⚠️

1. **Testing Infrastructure**
   - No unit tests configured
   - No integration tests
   - No E2E tests
   - Risk: Regression bugs in production

2. **State Management**
   - Context API only for auth
   - No strategy for global/feature state
   - May lead to prop drilling or redundant API calls
   - Risk: Performance degradation as features grow

3. **Type Safety**
   - Using JSConfig instead of TypeScript
   - Reduces IDE support and refactoring safety
   - Risk: Runtime errors on large refactors

4. **API Layer Abstraction**
   - Direct PocketBase SDK calls in components
   - No service/repository layer
   - Tight coupling between UI and data fetching
   - Risk: Difficult to change API client later

5. **Error Handling**
   - Basic error handling visible
   - No centralized error boundary strategy
   - Limited error recovery patterns
   - Risk: Poor user experience on failures

6. **Performance Monitoring**
   - No logging strategy
   - No performance metrics collection
   - No error tracking/reporting
   - Risk: Can't diagnose production issues

7. **Database Query Optimization**
   - No visible query optimization strategy
   - N+1 queries possible with current architecture
   - No caching layer documented
   - Risk: Performance degradation with scale

8. **Documentation**
   - CLAUDE.md created (good!)
   - No API documentation
   - No database schema documentation
   - No deployment runbook

---

## Architecture Patterns

### Current Patterns ✅

| Pattern | Location | Quality |
|---------|----------|---------|
| **Provider Pattern** | AuthProvider context | ✅ Good |
| **Protected Routes** | ProtectedRoute component | ✅ Good |
| **Component Composition** | UI components | ✅ Good |
| **Hook Composition** | useAuth, custom hooks | ✅ Good |

### Missing/Underdeveloped Patterns ⚠️

| Pattern | Impact | Priority |
|---------|--------|----------|
| **Service Layer** | Decouples components from API | High |
| **Repository Pattern** | Centralizes data access | Medium |
| **Error Boundary** | Graceful error handling | High |
| **Suspense** | Loading states | Medium |
| **Lazy Loading** | Performance optimization | Medium |

---

## Database Architecture

### Current Schema

```
Collections (inferred from code):
- users           # Auth users + profile fields
- cronogramas     # Study schedules
- sessoes_estudo  # Study sessions
- metas_diarias   # Daily goals
- badges          # Achievement system
- historico_pontos# Points history
```

### Assessment

**Strengths:**
- Migrations are version-controlled
- Type definitions auto-generated (database-types.d.ts)
- Clear domain model (study tracking)

**Concerns:**
- No visible schema documentation
- N+1 queries possible in list views
- No indexes visible
- No caching strategy documented
- SQLite file-based (no persistence strategy for scaling)

**Recommendations:**
- Document schema with relationships diagram
- Analyze and optimize N+1 queries
- Plan migration path for production scale (PostgreSQL)
- Implement query result caching

---

## Deployment & Infrastructure

### Current Setup

- **Hosting:** Not yet deployed
- **Frontend:** Static build (can use Vercel, Netlify, GitHub Pages, etc.)
- **Backend:** PocketBase binary (needs server/container)
- **Database:** SQLite (file-based, in pb_data/)

### Deployment Options

**Option 1: Containerized (Recommended)**
```dockerfile
Frontend + Backend in single container
- Deploy to Railway, Fly.io, DigitalOcean, AWS ECS
- Benefits: Easy scaling, CI/CD integration
- Cost: $5-50/month
```

**Option 2: Serverless Frontend + Managed Backend**
```
Frontend: Vercel/Netlify (free tier)
Backend: Railway (PocketBase) or custom VPS
Benefits: Scale frontend independently, cheap
Cost: Free-$10/month
```

**Option 3: Full Managed (PocketBase Hosting)**
```
Some third parties offer PocketBase hosting
Benefits: Minimal ops burden
Cost: Variable pricing
```

---

## Modernization Roadmap

### Phase 1: Foundation (Weeks 1-2) 🚀
**Priority: High** | **Effort: Medium**

- [ ] Migrate from JSConfig to TypeScript
- [ ] Add testing framework (Vitest + React Testing Library)
- [ ] Create API service layer (encapsulate PocketBase calls)
- [ ] Add Error Boundary component
- [ ] Document API endpoints

**Impact:** Type safety, testability, maintainability

### Phase 2: Quality & Reliability (Weeks 3-4) ⚠️
**Priority: High** | **Effort: High**

- [ ] Write unit tests (components, hooks, utilities)
- [ ] Add integration tests (auth flow, data fetching)
- [ ] Implement error handling strategy
- [ ] Add logging/monitoring (Sentry or similar)
- [ ] Create runbook for common issues

**Impact:** Production reliability, debugging capability

### Phase 3: Performance & Scale (Weeks 5-6) 📈
**Priority: Medium** | **Effort: Medium**

- [ ] Implement query caching (React Query or SWR)
- [ ] Code splitting and lazy loading
- [ ] Analyze and optimize N+1 queries
- [ ] Add performance monitoring (Lighthouse CI)
- [ ] Create deployment runbook

**Impact:** Faster load times, better UX at scale

### Phase 4: Production Ready (Weeks 7-8) 🚀
**Priority: Medium** | **Effort: High**

- [ ] Plan database migration (SQLite → PostgreSQL)
- [ ] Set up production environment
- [ ] Configure backups and disaster recovery
- [ ] Security audit (OWASP top 10)
- [ ] Load testing

**Impact:** Production reliability, data safety

---

## Risk Assessment

### High Risk ⚠️

1. **No Testing Framework**
   - **Risk:** Regression bugs in production
   - **Mitigation:** Implement unit + integration tests immediately
   - **Timeline:** Phase 2 (start in Phase 1)

2. **JSConfig vs TypeScript**
   - **Risk:** Runtime errors, poor refactoring safety
   - **Mitigation:** Migrate to TypeScript
   - **Timeline:** Phase 1

3. **No Error Boundary**
   - **Risk:** Full page crash on component error
   - **Mitigation:** Add Error Boundary component
   - **Timeline:** Phase 1

### Medium Risk ⚠️

4. **SQLite for Production**
   - **Risk:** Performance degradation, data loss without backup
   - **Mitigation:** Plan PostgreSQL migration, implement backups
   - **Timeline:** Phase 4

5. **No Monitoring**
   - **Risk:** Can't debug production issues
   - **Mitigation:** Add error tracking and logging
   - **Timeline:** Phase 2

6. **API Layer Coupling**
   - **Risk:** Difficult to test, refactor, or change API client
   - **Mitigation:** Create service layer
   - **Timeline:** Phase 1

### Low Risk ✅

7. **Performance**
   - **Risk:** Slowdowns with scale
   - **Mitigation:** Add caching, optimize queries
   - **Timeline:** Phase 3

---

## Recommendations Summary

### Immediate Actions (This Sprint)

1. **Add TypeScript support** — Use `jsconfig.json` → `tsconfig.json`
2. **Create service layer** — Wrap PocketBase calls in services
3. **Add Error Boundary** — Prevent white screen of death
4. **Setup testing** — Vitest + React Testing Library

### Short Term (Next 2 Sprints)

5. **Unit tests** — Pages, components, hooks
6. **Integration tests** — Auth flow, CRUD operations
7. **API documentation** — OpenAPI/Swagger for PocketBase
8. **Database documentation** — Schema diagram, relationships

### Medium Term (Next Month)

9. **Query optimization** — Identify and fix N+1 queries
10. **Caching strategy** — React Query or SWR for data fetching
11. **Monitoring** — Error tracking, performance metrics
12. **Security audit** — OWASP top 10 review

### Long Term (Next Quarter)

13. **Database migration** — Plan SQLite → PostgreSQL path
14. **Deployment** — Set up production environment
15. **Performance optimization** — Code splitting, lazy loading
16. **Scaling** — Load testing, horizontal scaling strategy

---

## Architecture Decision Records (ADRs)

### ADR-1: Monorepo Structure
**Decision:** Keep frontend (web) and backend (pocketbase) as separate apps in monorepo
**Status:** ✅ Accepted
**Rationale:** Separate scaling concerns, independent deployments, clearer boundaries

### ADR-2: State Management
**Decision:** Use Context API for auth, need strategy for global state
**Status:** ⚠️ Needs Review
**Alternative:** React Query, Zustand, Redux
**Recommendation:** React Query for server state (data fetching), Context for UI state (theme, modals)

### ADR-3: Database
**Decision:** Use PocketBase with SQLite
**Status:** ✅ Accepted (Short Term), ⚠️ Plan Migration
**Rationale:** Fast development, great DX, self-contained
**Plan:** Evaluate PostgreSQL migration at scale

### ADR-4: Styling
**Decision:** TailwindCSS + Shadcn/ui
**Status:** ✅ Accepted
**Rationale:** Utility-first, component library reduces UI bugs, excellent DX

### ADR-5: Testing
**Decision:** To be determined — recommend Vitest + React Testing Library
**Status:** ⏳ Pending
**Rationale:** Modern, fast, great DX, compatible with Vite

---

## Conclusion

**alvo-diario** has a **solid foundation** with modern tooling and clean architecture. The project is well-positioned for growth with clear paths for improvement.

**Key Actions:**
1. ✅ Git + CI/CD initialized (DevOps complete)
2. 🎯 Implement testing framework (Phase 1)
3. 🎯 Migrate to TypeScript (Phase 1)
4. 🎯 Create service layer (Phase 1)
5. 📊 Document API and database schema

The architecture supports the current scope well. Plan ahead for scaling (database, monitoring, caching) before they become bottlenecks.

---

**Assessment by:** Aria (Architect)
**Date:** 2026-03-25
**Next Review:** After Phase 1 completion

