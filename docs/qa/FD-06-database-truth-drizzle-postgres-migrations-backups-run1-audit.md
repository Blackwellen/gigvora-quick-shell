# FD-06 — Database Truth, Drizzle/Postgres Integrity, Migrations, Seeders & Backup Governance — Run 1 Audit

Date: 2026-04-18 · Group: G2 · Maps to **Master Sign-Off Matrix → G04 (database completeness)** + G05 (real-data persistence), G02 (Supabase/demo-data elimination), G12 (security/compliance — backup + RLS).

> **Platform constraint reminder** — backend rate-limiting primitives are not available; this audit therefore omits per-IP/per-token rate-limit recommendations on DB-facing endpoints. Throughput defense is scoped to (a) connection-pool caps, (b) statement_timeout / lock_timeout / idle_in_transaction_session_timeout at the role level, and (c) bounded BullMQ worker concurrency.

## 1. Business & technical purpose
Make a **single, owned PostgreSQL** instance the unambiguous source of truth for every domain object on Gigvora — identity, marketplace (gigs/services/jobs/projects), commerce (orders/escrow/payouts/wallet/credits), social (feed/network/groups/events), media (reels/video/podcast), workspace (project execution, shared workspaces, calendar), recruitment (applications/interviews/scorecards/hiring decisions), enterprise hiring, ads, billing/tax, audit/compliance, admin/internal terminals — modelled in **Drizzle ORM** (`packages/db/src/schema/*`) with full integrity (PK/FK, enums, defaults, NOT NULLs, unique constraints, partial indexes, generated columns, check triggers per FD-04 §rule), versioned via **forward-only ordered migrations** (`database/migrations/*.sql`), populated with **deterministic seeders + factories** for dev/CI/staging, snapshotted via **PITR-eligible backups**, and protected by **RLS policies** that align with the FD-02 RBAC/ABAC model so the DB itself enforces ownership even if the API layer is bypassed.

In parallel, finish the **Supabase removal runbook** (`docs/architecture/supabase-removal.md`) by closing the 7 remaining `src/` references so the web app speaks only to `api-nest` via the SDK and the auth/storage/realtime/edge-function layers move off Supabase entirely (per the documented plan).

## 2. Inventory snapshot

### Drizzle schema (good shape, gaps below)
- `packages/db/src/schema/` contains **79 schema modules** mapping cleanly to the domain map (identity, gigs-browse, jobs-browse, agency, companies, billing-invoices, donations-purchases-commerce, enterprise-hiring-workspace, recruiter-job-management, internal-admin-login-terminal, file-storage, idempotency, integrations, integrations-sync, audit, audit-log, …).
- **`pgTable` calls: 453** — coverage is broad.
- **Indexes declared: 502** — strong baseline; spot-check needed for partial indexes (`WHERE state = 'open'`), GIN indexes on tsvector/jsonb, and BRIN on append-only audit tables.
- **`pgEnum` defs: 0** ⚠️ — every status/role/lifecycle column is currently a `text` with (presumably) check constraints or no constraint at all. This is a P0 integrity gap: enums prevent typos at the DB layer, ship to Drizzle types automatically, and integrate with FD-02 `app_role` plans.
- **`.references()` calls: 23** ⚠️ — for 453 tables this is **far too few**. Many ownership/foreign-key relationships are likely modelled via raw `uuid` columns without an FK constraint, which means no ON DELETE behaviour, no referential integrity, and no query planner help. Expectation: a healthy schema of this size has hundreds of `.references()`. P0.
- Drizzle client wired in `packages/db/src/index.ts:40` via `drizzle(getPool(), { schema, logger: process.env.SQL_LOG === '1' })` ✅, using `drizzle-orm/node-postgres` (Worker-incompatible — see §3 P0 #11).

### Migrations
- `database/migrations/` — **1 file** (`0001_init.sql`) — clearly *not* the source of truth.
- `packages/db/migrations/` — **85 SQL files** (e.g. `0001_init.sql` … `0018_calls.sql` based on `ls` head) — **this is the real migration tree**.
- **Two competing migration roots** (`database/` and `packages/db/migrations/`) is itself a P0 — the runbook references `database/migrations/0001_init.sql` while the tooling is producing `packages/db/migrations/0001_init.sql`. Decide one, archive the other.
- **`drizzle.config.ts` not present** ⚠️ — without a config file, `drizzle-kit generate`/`migrate` cannot be run repeatably; new schema changes won't get migrations auto-generated.
- No rollback scripts (forward-only is fine, but each migration should ship with documented manual rollback if applied to prod).
- `supabase/migrations/` — exists, scope unclear; per the FD-01..FD-05 audit thread the project also has a Supabase project with its own migration history (`auth.*`, `public.profiles`, `public.habits`, `public.habit_logs`). Need to converge.

### Enums / constraints / triggers
- 0 `pgEnum` declarations — must be remediated.
- Validation triggers (per project guidance "use validation triggers instead of CHECK for time-based"): **not visible** in grep; hard to count without reading every migration. Spot-check needed in Run 2.
- `audit-log.ts` exists — but not yet wired to the FD-02/FD-03 guard chain to receive denial rows (cross-cutting carry-over).

### Seeders / factories / fixtures
- `database/seeders/` exists but content not enumerated. Per the framework rule ("Database completeness: factories/fixtures, seeders…"), every domain needs deterministic seeders AND randomized factories. Need a per-domain inventory in Run 2.
- No mention of a CI step that runs `pnpm db:seed` against a fresh DB to prove the seeders converge to a green state.
- No persona-based seed sets (User / Professional / Enterprise / Admin / Suspended / Locked) for Playwright matrices.

### Supabase residual usage
- `apps/` → **0 imports** of `@supabase/supabase-js` ✅ (the API tier is clean).
- `src/` → **10 import sites across 7 files**:
  - `src/integrations/supabase/client.ts` (browser client, auto-generated, not editable)
  - `src/integrations/supabase/client.server.ts` (admin client)
  - `src/contexts/AuthContext.tsx` (still using `supabase.auth`)
  - `src/hooks/useAI.ts` (calls `supabase.functions.invoke('ai-assistant')`)
  - `src/pages/ProfilePage.tsx` (likely direct table query)
  - `src/pages/auth/ForgotPasswordPage.tsx` (uses `supabase.auth.resetPasswordForEmail`)
  - `src/pages/auth/ResetPasswordPage.tsx` (uses `supabase.auth.updateUser`)
- Per `docs/architecture/supabase-removal.md`, the cutover sequence is documented (8 steps) but steps 3–7 have not yet completed in the web app. **The plan exists; execution is partial.**
- `supabase/functions/ai-assistant/` still hosts the AI gateway. Per the runbook, this should move into api-nest controllers + workers.
- The `public.profiles` / `public.habits` / `public.habit_logs` schema in Supabase **is not reflected in `packages/db/src/schema/`** — the canonical Postgres schema does not currently include the data the web app actually reads. This is a P0 split-brain.

### Realtime
- Per runbook: target is Socket.IO gateway in api-nest, replacing Supabase Postgres-changes channels. `apps/api-nest/src/modules/notifications.gateway.ts` exists (per FD-01) but per-event authorization gap is open. Realtime data path itself is not yet driven from owned Postgres.

### Backups / PITR
- `grep "pg_dump|pgbackrest|wal-g|wal-e|pitr|point-in-time"` → only matches in **docs**, no tooling.
- No documented backup cadence (full + incremental WAL), no documented restore drill, no off-site copy policy, no encryption-at-rest verification, no GDPR-aligned retention (e.g., 35 days hot, 1 year cold for finance, anonymized erasure pathway for "right to be forgotten").
- No automated **restore test** in CI/staging (a backup that has never been restored is not a backup).

### Mobile
- Mobile reads only via api-nest (it has no Supabase client). Once the web app finishes cutover, the entire mobile surface is already on the canonical Postgres path — that is the easy win.

## 3. Findings

### 🚨 P0 (release blockers)
1. **Two competing migration trees** (`database/migrations/` with 1 file vs `packages/db/migrations/` with 85). Pick `packages/db/migrations/` as canonical, delete or archive `database/`. Update the supabase-removal runbook reference.
2. **`drizzle.config.ts` missing** — generate it (`schema: './packages/db/src/schema/*'`, `out: './packages/db/migrations'`, `dialect: 'postgresql'`, `dbCredentials.url: process.env.DATABASE_URL`). Without it `drizzle-kit generate` cannot be run.
3. **Zero `pgEnum` declarations across 453 tables** — every status/role/lifecycle/state column needs to be promoted to an enum (or, where the value set evolves often, a lookup table with FK). Without enums: typos pass, Drizzle types are `string`, FD-02 `app_role` cannot be referenced from app code with type safety.
4. **Only 23 `.references()` for 453 tables** → most ownership/relationship columns are unconstrained `uuid`s. No ON DELETE CASCADE/RESTRICT/SET NULL, no referential integrity, no planner hints. Audit every `*_id` column in every schema file and add `.references(() => parent.id, { onDelete: '…' })`.
5. **Web app still on Supabase auth/queries/edge-functions** — 7 files in `src/` still import the Supabase client. Until cutover is complete, "Postgres is the source of truth" is false for the user-facing web tier.
6. **Split-brain schema**: `public.profiles`/`public.habits`/`public.habit_logs` (the data the web app currently reads via Supabase) are NOT in `packages/db/src/schema/`. The canonical Drizzle schema does not include the columns the production web app depends on. P0.
7. **No backup tooling configured** — no `pg_dump`/WAL archiving/PITR strategy. A production launch without a tested restore is not a production launch.
8. **No automated restore drill** in CI/staging. An untested backup is theoretical.
9. **Edge AI function (`supabase/functions/ai-assistant/`) still authoritative** — must move to api-nest per runbook step 7.
10. **No RLS on owned Postgres tables** (the FD-02 `has_role()`/`is_owner()` SECURITY DEFINER fns from the FD-02 build pack are not yet present in `packages/db/migrations/`). DB-layer ownership enforcement is missing → any compromise of the API layer = full-table read.
11. **`drizzle-orm/node-postgres` driver is Node-only** — fine for the api-nest container, but if any TanStack Start server function needs to talk to Postgres directly, it must use `drizzle-orm/postgres-js` or the Hyperdrive-compatible Neon HTTP driver (Worker runtime constraint). Document that the Worker SSR layer talks to Postgres only via api-nest, never directly.
12. **No idempotency_keys table actually wired** despite `packages/db/src/schema/idempotency.ts` existing — required for FD-04 P1 #22 (money-movement POSTs).
13. **No `DATABASE_URL` rotation runbook** — credentials rotation is a security/compliance posture requirement (G12).

### P1
14. Forward-only migrations are fine, but no "manual rollback" notes per migration → operational risk if a migration ships a destructive DDL.
15. No statement-level safety net: `statement_timeout = '15s'`, `lock_timeout = '5s'`, `idle_in_transaction_session_timeout = '60s'` should be set per database role (api-nest role tighter than admin role).
16. No partial indexes called out (`CREATE INDEX … WHERE deleted_at IS NULL`). For soft-deleted models, partial indexes are 5–50× smaller and faster.
17. No GIN indexes for the search/filter surfaces (FD per `mem://features/advanced-filtering-system` — Gigs/Services/Projects/Jobs filter panels demand GIN on tags/tsvector for performance).
18. No BRIN indexes on append-only audit tables (audit_log_entries, upload_audit_events, …) — BRIN gives 1000× index-size savings on time-ordered data.
19. No `pg_stat_statements` enablement documented for query observability.
20. No connection-pool sizing documented per service (`api-nest`, `workers`, `media-pipeline`, `analytics-python`, `search-indexer`). All hitting the same Postgres without per-service caps risks one runaway service starving the rest.
21. No read-replica strategy for the analytics-python tier (BI/heavy aggregations should not run on the OLTP primary).
22. Drizzle `relations()` definitions (`packages/db/src/schema/*-relations.ts` or inline) probably underspecified given only 23 `.references()` — `db.query.users.findMany({ with: { profile, gigs } })` won't work without the `relations()` map.
23. No "schema freeze" gate before release — i.e., a CI job that diffs `drizzle-kit introspect:pg` against `packages/db/src/schema` and fails if drift is detected.
24. No test database fixtures isolated per worker (Playwright shards) — concurrent test runs will collide on shared seed rows unless schema-per-test or transactional rollback is in place.
25. No data-retention / right-to-erasure cron (GDPR Art. 17) — soft-delete + scheduled purge per data class.

### P2
26. No `EXPLAIN (ANALYZE, BUFFERS)` checked-in baseline for the 20 hottest queries (regressions go unnoticed).
27. No `pg_repack`/`VACUUM FULL` cadence documented for high-churn tables (`audit_log_entries`, `notifications`).
28. No row-level encryption considered for sensitive PII columns (KYC docs metadata, payout bank details) — `pgcrypto` symmetric encryption with a KMS-backed key.

## 4. Run 2 build priorities (FD-06 only)

**Migration consolidation**
1. Delete `database/migrations/`, declare `packages/db/migrations/` canonical, update `docs/architecture/supabase-removal.md` references and any CI scripts.
2. Add `drizzle.config.ts` at repo root; wire `pnpm db:generate` + `pnpm db:migrate` + `pnpm db:studio`.

**Schema integrity**
3. New migration `00XX_enums.sql` defining every enum the codebase already uses as a string union: `app_role`, `entitlement_tier`, `gig_status`, `service_status`, `job_status`, `project_status`, `application_status`, `interview_outcome`, `payout_state`, `escrow_state`, `order_state`, `wallet_txn_kind`, `notification_kind`, `media_kind`, `upload_state` (FD-05), `audit_severity`, `incident_severity`, `staff_role` (FD-03). Update Drizzle schema files to use `pgEnum(…)` + regenerate types.
4. New migration `00XX_fk_backfill.sql` adding FK constraints and Drizzle `.references()` to every `*_id` column. Audit must enumerate the full list per schema file (estimate: 400+ FKs to add). Choose ON DELETE policy per relationship (`CASCADE` for owned children, `RESTRICT` for referenced lookups, `SET NULL` for soft references).
5. New migration `00XX_owned_profiles.sql` to bring `public.profiles` (and `habits`/`habit_logs` if they're real product features rather than template leftovers — flag for owner check) into `packages/db/src/schema/profiles.ts` with proper FKs to `identities` table.
6. New migration `00XX_rls.sql` (carries the FD-02 SECURITY DEFINER fns + RLS enable on every domain table; one-time large migration, then per-table policies as features land).

**Backups**
7. Configure managed PITR via the platform DB provider (≥7-day retention, target ≤5 min RPO, ≤30 min RTO). Document the provider-specific knobs in `docs/runbooks/backup-restore.md`.
8. Add `apps/workers/src/jobs/backup-verify.ts` — weekly: spin a fresh disposable DB, restore latest backup, run smoke queries (`SELECT count(*)` per critical table within ±0.1% of source), report green/red into `audit_log_entries` severity:`info|error`.
9. Document GDPR retention matrix per data class (identity 7y, finance 10y per HMRC, audit logs 7y, ephemeral logs 90d, KYC per FCA-safe schedule).

**Operational hardening**
10. Per-role Postgres timeouts:
    ```sql
    alter role api_nest set statement_timeout = '15s';
    alter role api_nest set lock_timeout = '5s';
    alter role api_nest set idle_in_transaction_session_timeout = '60s';
    alter role workers set statement_timeout = '5min';   -- batch jobs
    alter role analytics_ro set statement_timeout = '2min';
    ```
11. Per-service connection pools (PgBouncer or driver-side): `api-nest` 50, `workers` 30, `media-pipeline` 10, `analytics-python` 10, `search-indexer` 5 — sized to fit the Postgres `max_connections` budget.
12. Enable `pg_stat_statements`; export to admin terminal observability tab.
13. Read-replica for `analytics-python` and `search-indexer`.

**Supabase cutover (close the runbook)**
14. Move `supabase/functions/ai-assistant/` into `apps/api-nest/src/modules/ai-gateway/` controller calling Lovable AI Gateway via `LOVABLE_API_KEY` (already a project secret).
15. Switch `src/contexts/AuthContext.tsx` from `supabase.auth.*` → `sdk.auth.*` (api-nest endpoints `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot`, `/auth/reset`). Mirror `onAuthStateChange` via WS or storage event.
16. Switch `src/hooks/useAI.ts` from `supabase.functions.invoke('ai-assistant')` → `sdk.ai.chat(...)`.
17. Switch `src/pages/ProfilePage.tsx` direct query → SDK call (`sdk.me.getProfile()` / `sdk.me.updateProfile()`).
18. Switch `src/pages/auth/{Forgot,Reset}PasswordPage.tsx` from `supabase.auth.{resetPasswordForEmail,updateUser}` → `sdk.auth.{requestReset,confirmReset}`.
19. Once #14–#18 land + Playwright parity green: keep `src/integrations/supabase/{client,client.server}.ts` only as **dead code** for one release behind a `LEGACY_SUPABASE=true` env flag, then delete in the following release.
20. Decommission Supabase project per runbook step 7.

**Seeders / factories**
21. `packages/db/src/seed/` (new) with: `seed:base` (idempotent reference data — countries, currencies, plans, enums-as-data, system roles), `seed:personas` (8 deterministic test users — Free/Pro/Team/Enterprise × User/Pro/Enterprise + Admin + Suspended), `seed:demo` (rich content for staging/manual QA only — never ships to prod).
22. Factories via `@faker-js/faker` in `packages/db/src/factories/{gig,service,job,project,application,order,...}.ts` — used by Playwright + unit tests.
23. CI step: `pnpm db:reset && pnpm db:migrate && pnpm db:seed:base && pnpm db:seed:personas` on every PR; failure blocks merge.

**Tests**
24. `tests/db/schema-drift.spec.ts` — `drizzle-kit introspect:pg` ↔ `packages/db/src/schema/`; fail on drift.
25. `tests/db/fk-integrity.spec.ts` — orphan-row scan per FK after seed.
26. `tests/db/restore-drill.spec.ts` (manual+nightly) — restore latest backup to disposable DB, smoke queries.

## 5. Mapping to Master Sign-Off Matrix
- **Primary**: G04 (database completeness).
- **Secondary**: G02 (Supabase/demo elimination — close the 7 web `src/` sites + `supabase/functions/`), G05 (real-data persistence), G12 (RLS, backups, retention, GDPR).

## 6. Domain checklist matrix (Run 1 state)

| Validation Item | Tick | Evidence / File pointers |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages, tabs, widgets, forms, popups, drawers mapped | ☐ | 7 web `src/` files still on Supabase enumerated §2 |
| Backend files and APIs complete | ☐ | api-nest is Supabase-clean ✅; ai-assistant edge fn pending move |
| Supabase/demo data eliminated | ☐ | Runbook exists; steps 3–7 incomplete; ai-assistant fn live |
| Database schema, seeders, fixtures complete | ☐ | 79 schema files / 453 tables / 502 indexes ✅; 0 enums, 23 FKs, no canonical seeders |
| ML / analytics / workers integrated | ☐ | analytics-python on shared OLTP — needs read-replica |
| Indexing/search/filter logic | ☐ | GIN/BRIN/partial indexes not yet enumerated |
| Realtime / live data | ☐ | Socket.IO gateway pending (FD-01 carry-over); Postgres LISTEN/NOTIFY or logical-replication source pending |
| Security & middleware protections | ☐ | RLS not yet on owned tables; SECURITY DEFINER helpers pending FD-02 build |
| Playwright logic-flow coverage | ☐ | schema-drift / fk-integrity / restore-drill specs absent |
| Mobile / API parity | ☑ | Mobile already exclusively on api-nest path |
| Acceptance criteria passed | ☐ | Pending Run 2 + Run 4 |

## 7. Acceptance criteria (binding)
- A1. Single canonical migration tree at `packages/db/migrations/`; `database/migrations/` removed; `drizzle.config.ts` present and `pnpm db:generate` produces no diff against `packages/db/src/schema/`.
- A2. Every status/role/lifecycle column uses `pgEnum`; Drizzle types reflect the union.
- A3. Every `*_id` column has a Drizzle `.references()` and a Postgres FK with explicit ON DELETE policy; `tests/db/fk-integrity.spec.ts` finds zero orphans after seed.
- A4. RLS enabled on every public table; FD-02 SECURITY DEFINER helpers (`has_role`, `is_owner`, `is_org_member`, `is_suspended`) present; representative anti-bypass test green (FD-02 carry-over).
- A5. PITR configured; weekly `backup-verify` job green for 4 consecutive runs; documented restore drill executed once on staging with timing recorded.
- A6. `src/integrations/supabase/*` deleted (or behind `LEGACY_SUPABASE=true` flag for one release) and 7 web import sites migrated to `@gigvora/sdk`; Playwright auth/profile/ai parity suites green against api-nest.
- A7. `supabase/functions/ai-assistant/` removed; api-nest `ai-gateway` module live and called from `useAI.ts`.
- A8. Per-role Postgres timeouts set; per-service pool sizes documented and applied.
- A9. `seed:base` + `seed:personas` deterministic; CI proves a fresh DB → migrate → seed completes under N seconds and the 8 persona users authenticate end-to-end.
- A10. GDPR retention matrix documented per data class with cron jobs scheduled.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate. Note: rate-limiting recommendations omitted per platform constraint; throughput defended via per-role statement_timeout/lock_timeout/idle_in_transaction_session_timeout, per-service connection-pool caps, and bounded BullMQ worker concurrency._
