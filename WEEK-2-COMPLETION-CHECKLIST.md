# Week 2 Completion Checklist - Critical Path to Friday Deploy

## ✅ Completed This Session

- [x] Monorepo foundation (pnpm workspaces)
- [x] Type-safe interfaces (@trading-os/types)
- [x] Broker adapter factory pattern (3 adapters)
- [x] OAuth flows (authRoutes.ts) - all 3 brokers
- [x] tRPC API endpoints (type-safe)
- [x] Frontend pages (home, connect, dashboard)
- [x] Next.js + React 19 setup
- [x] PostgreSQL schema with Drizzle ORM
- [x] GitHub Actions CI/CD pipeline
- [x] Railway/Vercel deployment configs
- [x] Auth middleware (JWT verification)
- [x] PostgreSQL token store implementation

## 📋 Pre-Deployment (Friday)

### Backend Tasks
- [ ] Create Railway project + PostgreSQL addon
- [ ] Set all env vars (DATABASE_URL, BROKER_KEYS, JWT_SECRET)
- [ ] Run pnpm db:push (database migrations)
- [ ] Test /health endpoint returns 200

### Frontend Tasks  
- [ ] Connect Vercel to GitHub repo
- [ ] Set NEXT_PUBLIC_API_URL env var
- [ ] Verify build succeeds
- [ ] Deploy to Vercel

### Integration Tests
- [ ] Frontend loads without 404
- [ ] OAuth flow works end-to-end
- [ ] /auth/status shows broker connections
- [ ] POST /trpc/orders.place succeeds

## 🎯 Critical Fixes (Post-Deploy)

- Token storage: Use PostgreSQLTokenStore from tokenStore.ts
- Auth middleware: Wire JWT to protected tRPC procedures
- WebSocket quote streaming: Replace stub with live streaming
- Error handling & monitoring setup

## 🚀 Timeline

| Step | Time | Status |
|------|------|--------|
| GitHub Push | ✅ | Complete |
| Railway Deploy | 15 min | Next |
| Vercel Deploy | 10 min | Next |
| E2E Testing | 10 min | Next |
| **TOTAL** | **~50 min** | In Progress |

**Target:** Complete by Friday 3pm IST

## 📊 Success Criteria

- [ ] GET /health returns 200
- [ ] OAuth redirect works (≥1 broker)
- [ ] /auth/status shows connections
- [ ] tRPC orders.place succeeds
- [ ] Frontend dashboard loads
- [ ] No console errors
