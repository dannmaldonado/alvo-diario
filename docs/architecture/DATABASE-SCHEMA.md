# Database Schema Documentation — alvo-diario

**Status:** ✅ Inferred from migrations and types
**Last Updated:** 2026-03-25

---

## Schema Overview

```
users (extends pb_default_users)
  ├── id (pk)
  ├── email (unique)
  ├── passwordHash
  ├── nome (String) — User name
  ├── nivel_atual (Number) — Current achievement level
  ├── pontos_totais (Number) — Total accumulated points
  ├── streak_atual (Number) — Current study streak (days)
  ├── meta_diaria_horas (Number) — Daily goal (hours)
  ├── data_criacao (DateTime) — Account creation date
  └── [standard pb fields: created, updated, verified, emailVisibility]

cronogramas (Study Schedules)
  ├── id (pk)
  ├── user_id (fk → users)
  ├── [schedule data]
  └── [timestamps]

sessoes_estudo (Study Sessions)
  ├── id (pk)
  ├── user_id (fk → users)
  ├── cronograma_id (fk → cronogramas)
  ├── [session details]
  └── [timestamps]

metas_diarias (Daily Goals)
  ├── id (pk)
  ├── user_id (fk → users)
  ├── data (Date) — Goal date
  ├── [goal details]
  └── [timestamps]

badges (Achievements)
  ├── id (pk)
  ├── nome (String)
  ├── descricao (String)
  └── [achievement details]

historico_pontos (Points History)
  ├── id (pk)
  ├── user_id (fk → users)
  ├── pontos (Number) — Points awarded/deducted
  ├── motivo (String) — Reason for change
  ├── data (DateTime) — When awarded
  └── [timestamps]
```

---

## Entity Relationships

```
users (1) ──────────── (N) cronogramas
users (1) ──────────── (N) sessoes_estudo
users (1) ──────────── (N) metas_diarias
users (1) ──────────── (N) historico_pontos

cronogramas (1) ─────── (N) sessoes_estudo
```

---

## Migration History

| Migration | Description | Status |
|-----------|-------------|--------|
| `1759383931_initial_app_settings` | Initial app configuration | ✅ Applied |
| `1764579159_create_superuser` | Superuser account setup | ✅ Applied |
| `1769159103_disable_auth_alert_superusers` | Auth alert config | ✅ Applied |
| `1764489255_set_rate_limits` | Rate limiting config | ✅ Applied |
| `1774489255_001_created_cronogramas` | Create cronogramas table | ✅ Applied |
| `1774489257_001_created_sessoes_estudo` | Create study sessions | ✅ Applied |
| `1774489259_001_created_metas_diarias` | Create daily goals | ✅ Applied |
| `1774489260_001_created_badges` | Create achievements | ✅ Applied |
| `1774489262_001_created_historico_pontos` | Create points history | ✅ Applied |
| `1774489263_002_add_nome_to_users` | Add user name field | ✅ Applied |
| `1774489265_002_add_nivel_atual_to_users` | Add level field | ✅ Applied |
| `1774489266_002_add_pontos_totais_to_users` | Add points field | ✅ Applied |
| `1774489268_002_add_streak_atual_to_users` | Add streak field | ✅ Applied |
| `1774489269_002_add_meta_diaria_horas_to_users` | Add daily goal field | ✅ Applied |
| `1774489270_002_add_data_criacao_to_users` | Add creation date field | ✅ Applied |

---

## Key Insights

### Design Patterns

1. **User-Centric Design**
   - All core entities relate back to users
   - Enables multi-tenant architecture
   - Row-Level Security (RLS) should enforce user_id isolation

2. **Gamification System**
   - Points accumulation (historico_pontos)
   - Achievement badges (badges)
   - Streak tracking (streak_atual)
   - Level progression (nivel_atual)

3. **Study Planning**
   - Chronogram (cronogramas) — overall study plan
   - Sessions (sessoes_estudo) — actual study instances
   - Daily goals (metas_diarias) — daily targets
   - Historical tracking (historico_pontos) — engagement metrics

### Performance Considerations

⚠️ **Potential N+1 Queries:**
- Loading user + their cronogramas + all sessoes_estudo
- Loading sessions grouped by date
- Loading badges with points history

✅ **Indexes Recommended:**
- `users(id)` — already pk
- `cronogramas(user_id)` — filter by user
- `sessoes_estudo(user_id, cronograma_id)` — queries by user/schedule
- `metas_diarias(user_id, data)` — queries by user and date
- `historico_pontos(user_id, data)` — timeline queries
- `badges(nome)` — lookup by name

### Security Considerations

⚠️ **Must Implement:**
1. Row-Level Security (RLS) rules
   - Users can only see/modify their own data
   - Admin role for superuser operations

2. Data Validation
   - Points changes must have motivo (reason)
   - Dates must be valid
   - Numeric fields must be non-negative

3. Audit Trail
   - historico_pontos already provides point audit trail
   - Consider expanding for other changes

---

## Growth Projections

### Current State
- Small team project
- SQLite sufficient for testing
- Manual data management fine

### At 100 Users
- Daily active sessions: ~50
- Points history entries: ~5K/month
- Database size: ~5-10 MB
- **Still fine with SQLite**

### At 1,000 Users
- Daily active sessions: ~500
- Points history entries: ~50K/month
- Database size: ~50-100 MB
- Concurrent sessions: 5-10
- **SQLite starts showing strain**
- **Recommended: Migrate to PostgreSQL**

### At 10,000+ Users
- Daily active sessions: ~5K
- Database size: ~500+ MB
- Concurrent connections: 50+
- Multiple read replicas needed
- **Must use PostgreSQL with connection pooling**

---

## Migration to PostgreSQL (Future)

**When:** At ~500 concurrent users or 100+ MB database
**Effort:** 2-3 days
**Risk:** Low (PocketBase abstracts migration)

**Steps:**
1. Export data from SQLite
2. Provision PostgreSQL instance
3. Update PocketBase config to use PostgreSQL
4. Verify data integrity
5. Switch over traffic

---

## Optimization Recommendations

### Short Term (This Month)

- [ ] Add indexes on foreign keys (user_id, cronograma_id)
- [ ] Document schema relationships
- [ ] Verify RLS rules are implemented
- [ ] Test concurrent user scenarios

### Medium Term (Next Quarter)

- [ ] Implement query result caching (Redis optional)
- [ ] Add database monitoring (query logs)
- [ ] Plan PostgreSQL migration path
- [ ] Performance testing suite

### Long Term (Production)

- [ ] PostgreSQL migration
- [ ] Read replicas for reporting
- [ ] Backup and disaster recovery
- [ ] Archive old points history

---

**Schema Documentation by:** Aria (Architect)
**Source:** `database-types.d.ts`, migrations, code analysis
**Next Review:** After Phase 1 testing implementation
