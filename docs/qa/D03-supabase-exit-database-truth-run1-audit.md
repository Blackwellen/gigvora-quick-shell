# D03 — Supabase Exit, Database Truth, Drizzle Schema, Persistent Data Contracts
## Run 1 · Audit & Inventory

**Date:** 2026-04-18
**Scope:** `src/integrations/{supabase,lovable}/*`, `src/contexts/AuthContext.tsx`, `src/hooks/useAI.ts`, `src/pages/{ProfilePage,auth/ForgotPassword,auth/ResetPassword}.tsx`, `packages/db/src/schema/*` (78 files), `packages/db/src/index.ts`, `packages/db/migrations/*` (85 files), `database/seeders/*` (47 SQL + runner), `apps/api-nest/src/{infra,modules}`, `supabase/{config.toml,functions/ai-assistant,migrations}`.
**Mode:** Read-only inventory + gap report. No code changes in Run 1.

---

## 1. Surface inventory

### 1.1 Supabase footprint in the web app
Only **6 files** in `src/` still import Supabase, but they are the highest-stakes ones:

| File | Calls | Severity |
|---|---|---|
| `src/integrations/supabase/client.ts` | `createClient` (browser, anon key) | infrastructure |
| `src/integrations/supabase/client.server.ts` | `createClient` (service role) | infrastructure |
| `src/integrations/lovable/index.ts` | `supabase.auth.setSession(result.tokens)` after Lovable OAuth | infrastructure (auto-generated) |
| `src/contexts/AuthContext.tsx` | `auth.onAuthStateChange`, `getSession`, `signInWithPassword`, `signOut`, `signUp` | **P0 — duplicates D02-G1** |
| `src/hooks/useAI.ts` | `functions.invoke('ai-assistant', …)` | P1 — AI gateway routes through Supabase Edge Function |
| `src/pages/ProfilePage.tsx` | `from('profiles').select/update` | **P0 — direct table access from browser** |
| `src/pages/auth/ForgotPasswordPage.tsx` | `auth.resetPasswordForEmail` | **P0 — duplicates D02-G2** |
| `src/pages/auth/ResetPasswordPage.tsx` | `auth.getSession`, `auth.updateUser` | **P0 — duplicates D02-G2** |

Total `supabase.*` call sites in `src/`: **12** (verified by grep). No Supabase imports anywhere in `apps/` or `packages/` — the entire monorepo backend is already Postgres/Drizzle.

### 1.2 Drizzle data layer
- **Schema files:** 78 in `packages/db/src/schema/` covering identity, auth, feed, network, profiles, companies, gigs/jobs/services/projects, finance, dashboards, admin terminals, ML/analytics, etc.
- **DB client:** `packages/db/src/index.ts` exposes `getPool`, `getDb`, `Schema`, `Db` types with strict `DATABASE_URL` requirement, statement timeout, pg-mem fallback for tests.
- **NestJS consumption:** `apps/api-nest/src/infra/db.provider.ts` plus 30+ `*.repository.ts` files import from `@gigvora/db`. **Backend is fully Drizzle-native — no Supabase in NestJS.**

### 1.3 Migrations
- **85 SQL files** in `packages/db/migrations/`, numbered `0009` → `0082`.
- All inspected files use idempotent `CREATE TABLE IF NOT EXISTS` + check constraints, declare ownership comments (e.g. *"Mirrors packages/db/src/schema/feed.ts. Owned by apps/api-nest/src/modules/feed/. Never run against Lovable Cloud Supabase."*).
- **Numbering gap:** migrations start at `0009`. No `0001–0008` exist. Either intentional (pre-9 reserved for platform bootstrap) or missing — needs decision.
- **Runner:** No top-level migration runner script visible in `packages/db/`. Drizzle generator config not found at `packages/db/drizzle.config.ts` (file absent — only `migrations/`, `package.json`, `src/` exist). Migrations are hand-written SQL, not generated from schema.

### 1.4 Seeders
- **47 seed SQL files** in `database/seeders/` plus `run-seeders.mjs`.
- **Conflict — `0004_seed_identity.sql` vs `0053_seed_identity.sql`:** The legacy `0004` writes columns `email`, `password_hash`, `status` and bcrypt hash; the canonical `0053` schema uses `tenant_id`, `primary_email`, `primary_handle` (no `email`, no `password_hash` — credentials live in `auth_credentials`). **`0004` will fail against the current schema and was already flagged in D02-G6.**
- `0001_seed_dev` … `0009_seed_settings` are likely obsolete bootstrap fixtures from before the schema was redesigned.

### 1.5 Factories
- **`packages/db/src/factories/` does not exist.** No typed test fixture builders. All test data comes from raw SQL seeders.

### 1.6 MongoDB
- **Zero imports** of `mongodb`, `mongoose`, or `MongoClient` anywhere. ✅ No bounded document store in play — A1 directive is satisfied for MongoDB.

### 1.7 Supabase server-side surface
- `supabase/config.toml` references an unset `project_id` (legacy placeholder, not a real Gigvora target). ⚠️
- `supabase/functions/ai-assistant/index.ts` exists — this is the function `useAI.ts` invokes.
- `supabase/migrations/` holds **1 file** (`20260408144934_*.sql`) — the only migration ever applied to the live Supabase instance. It is the read-only legacy habit-tracker schema (`habits`, `habit_logs`, `profiles`).

### 1.8 Truth contract today
- **Web app's truth source:** Lovable Cloud Supabase (`habits`, `habit_logs`, `profiles` only — legacy scaffold).
- **NestJS backend's truth source:** PostgreSQL via `@gigvora/db` Drizzle, fed by 85 migrations covering 78 schemas.
- **The two systems share zero tables.** The web app reads/writes 3 Supabase tables that have no representation in Drizzle; the NestJS API reads/writes 78 Drizzle schemas the web app never touches.

---

## 2. A1–A13 audit checklist

| # | Track | Finding | Evidence |
|---|---|---|---|
| **A1** | Supabase removal / database truth | ☒ **Catastrophic split-brain.** Frontend persists to Supabase (`profiles`, `habits`, `habit_logs`), backend persists to Postgres+Drizzle. Production has two disjoint truth stores. The Supabase project ref in `supabase/config.toml` is the legacy template placeholder, not a Gigvora project. | §1.1, §1.7, §1.8 |
| **A2** | NestJS completeness | ☒ Backend data layer is **complete and Drizzle-native**: 78 schemas, 85 migrations, 30+ repositories, transactional `getDb()` provider. | §1.2 |
| **A3** | Connectors | ☐ AI hook tunnels through a Supabase Edge Function (`ai-assistant`). Should call NestJS or Lovable AI Gateway server route directly. | `useAI.ts:30` |
| **A4** | ML / analytics | ☐ Out-of-scope for D03 directly; data contracts feeding ML look intact. | — |
| **A5** | Indexers / OpenSearch | ☐ Out-of-scope at D03 layer. | — |
| **A6** | Pages → tabs → components | ☒ `ProfilePage.tsx` is the only frontend that does a direct `from(table)` call — must move to NestJS `/identity/me` + a profile module. | `ProfilePage.tsx:268,297` |
| **A7** | Real data / no demo | ☒ Three demo concerns: <br>• `database/seeders/0004_seed_identity.sql` writes columns that no longer exist (will hard-fail). <br>• `database/seeders/0001_seed_dev.sql … 0009_seed_settings.sql` are pre-redesign bootstrap fixtures — verify each against current schemas. <br>• `supabase/migrations/20260408*.sql` ships habit-tracker tables to the production Supabase project (legacy template leftover). | §1.4, §1.7 |
| **A8** | Player / editor | ☐ N/A. | — |
| **A9** | Logic-flow | ☒ Any user action that crosses the split (sign up via Supabase → backend tries to read `identities` row → 404; profile update via Supabase → NestJS read → stale) silently corrupts state. | §1.8 |
| **A10** | Forms enrichment | ☐ Covered by per-domain audits. | — |
| **A11** | Frontend ↔ backend integration | ☒ **Zero data integration.** No file in `src/` imports from `@gigvora/sdk` or fetches `/api/v1/*`. Frontend has not been wired to the Drizzle truth layer at all. | `grep -rE "/api/v1/\\|@gigvora/sdk" src` → 0 hits |
| **A12** | Security / GDPR | ☒ `client.server.ts` (service-role key) lives under `src/integrations/` — exposed to the same import graph as the browser bundle. Strict bundler discipline required, but a single accidental `import` from a client file would leak the service-role key. Move to `app/server/` or guard with build-time check. <br>☒ Direct browser-side `from('profiles').update(...)` relies entirely on RLS; once Supabase exits, this code is dead. | `src/integrations/supabase/client.server.ts` |
| **A13** | Mobile parity / docs | ☒ No `docs/architecture/data-truth.md` codifies the rule "Postgres+Drizzle is the only production truth store; Supabase is for hosted auth/storage only or eliminated." | — |

---

## 3. Gaps to remediate in Run 2

| Gap ID | Priority | Description |
|---|---|---|
| **D03-G1** | **P0** | Decide cutover strategy for Supabase exit. Two viable options: <br>**(a)** Keep Supabase as auth/storage-only provider, but **all business data moves to Postgres via `/api/v1/*` server functions or NestJS**. Frontend never calls `from(table)` again. <br>**(b)** Full exit — replace Supabase Auth with the NestJS identity module (D02), keep storage on Supabase or move to S3 connector. <br>The framework's wording ("complete removal of Supabase dependence") implies **(b)**. Confirm with user before destructive changes. |
| **D03-G2** | **P0** | Replace `ProfilePage.tsx` direct Supabase calls with backend-mediated reads/writes. Add a `profiles` Drizzle schema + module if one does not yet expose `GET/PATCH /api/v1/profiles/:id`. |
| **D03-G3** | **P0** | Delete `database/seeders/0004_seed_identity.sql` (broken schema, already flagged in D02-G6). |
| **D03-G4** | **P0** | Audit `database/seeders/0001…0009*.sql` against current schemas; either rewrite for the new column set or delete. |
| **D03-G5** | **P0** | Decide what to do with the live Supabase project. Either (i) repurpose its `supabase/migrations/` for **only** the auth+storage tables we keep, or (ii) plan an explicit teardown after frontend cutover. Today it ships habit-tracker tables to production. |
| **D03-G6** | **P1** | Move `src/integrations/supabase/client.server.ts` out of the client import graph (e.g. `src/server/supabase-admin.ts` or delete after exit). Add an ESLint rule blocking `client.server` imports from any non-server file. |
| **D03-G7** | **P1** | Replace `useAI.ts` Supabase Edge Function call with a TanStack Start server function (`/api/ai/assistant`) that calls Lovable AI Gateway with `LOVABLE_API_KEY`. Delete `supabase/functions/ai-assistant/`. |
| **D03-G8** | **P1** | Generate the missing `packages/sdk/` data clients (one per Drizzle module) with shared TypeScript DTOs derived from Drizzle schema (`InferSelectModel`, `InferInsertModel`). Frontend + Flutter consume via SDK only. |
| **D03-G9** | **P1** | Add `packages/db/drizzle.config.ts` so future schema changes generate diffed SQL instead of being hand-written. Lock migrations to forward-only with `drizzle-kit migrate`. |
| **D03-G10** | **P1** | Add `packages/db/src/factories/` with typed test fixture builders (one per major aggregate: identity, profile, gig, project, contract, payout). Used by NestJS unit tests and Playwright seed step. |
| **D03-G11** | **P2** | Investigate the migration numbering gap `0001–0008`. Either reserve those numbers for platform bootstrap (RLS, extensions, roles) or renumber. |
| **D03-G12** | **P2** | `supabase/config.toml` references the wrong `project_id`. Update to the actual Gigvora Supabase ref or remove the file once exit is complete. |
| **D03-G13** | **P2** | Write `docs/architecture/data-truth.md` codifying: (1) Postgres+Drizzle is the sole truth store; (2) MongoDB is forbidden unless an explicit ADR justifies a bounded document use case; (3) no frontend may call `supabase.from(...)` — all data flows through `/api/v1/*` or `@gigvora/sdk`. |
| **D03-G14** | **P2** | Add an integration test that proves a freshly migrated DB + every seeder applies cleanly in `0001 → 0082` order with `psql -1 -v ON_ERROR_STOP=1`. CI gate. |
| **D03-G15** | **P3** | Add CI lint: `grep -rE "from ['\"]@/integrations/supabase" src` returns 0 once exit is complete. Same for `supabase.from(`, `supabase.auth.`, `supabase.functions.invoke(`. |

---

## 4. Sign-off matrix

| Track | Audit | Build | Integrate | Test | Sign-off |
|---|---|---|---|---|---|
| A1  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A2  | ☒ | ☐ (already complete) | ☐ | ☐ | ☐ |
| A3  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A6  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A7  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A9  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A11 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A12 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A13 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A4, A5, A8, A10 | n/a at D03 scope | — | — | — | — |

**Run 1 status: COMPLETE.** 15 gaps recorded (5× P0, 5× P1, 4× P2, 1× P3).

**Headline finding:** the project has a **catastrophic split-brain** — the entire NestJS backend (78 Drizzle schemas, 85 migrations, 30+ repositories) is fully implemented and untouched by the frontend, while the frontend reads/writes 3 legacy-template Supabase tables that the backend has never heard of. Closing D03 requires a deliberate cutover: pick **auth-only Supabase** vs **full exit**, then route every web page through `/api/v1/*` or `@gigvora/sdk`. P0 gaps must be sequenced after D02-G1/G2 (identity rewire) since they share the same client refactor.

