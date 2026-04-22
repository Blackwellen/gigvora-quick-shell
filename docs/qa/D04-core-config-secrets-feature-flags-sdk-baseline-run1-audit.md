# D04 — Core Config, Secrets, Feature Flags, Environment Hygiene, SDK Baseline
## Run 1 · Audit & Inventory

**Date:** 2026-04-18
**Scope:** root `package.json`, `tsconfig*.json`, `.env`, `.gitignore`, `infrastructure/env/`, `packages/{shared-config,api-contracts,sdk}/`, `apps/api-nest/src/{app.module.ts,modules/**/jwt}`, `apps/{workers,integrations,search-indexer,media-pipeline,ml-python,analytics-python}` env access, `src/integrations/supabase/*`, `src/hooks/*` SDK consumption, `packages/db/migrations/0082_super_admin_command_center.sql` (`sa_feature_flags`), `supabase/functions/ai-assistant/`.
**Mode:** Read-only inventory + gap report. No code changes in Run 1.

---

## 1. Surface inventory

### 1.1 Environment files
| File | Status |
|---|---|
| `.env` (project root) | **5 lines, Lovable-managed**, exposes `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_*` only. No backend variables. |
| `.env.local`, `.env.production` | absent |
| `infrastructure/env/.env.example` | **complete reference** — DB, Redis, OpenSearch, S3, JWT, OAuth, ML/Analytics URLs, Stripe, SendGrid, Twilio, Expo, 12 AI providers (BYOK), CRM connectors, webhook secrets |
| `.gitignore` | covers `.env.local`, `*.local`, `node_modules`, `dist` — **does NOT ignore `.env`** (Lovable-generated, must remain tracked? Confirm.) |

### 1.2 Frontend env access (`src/`)
- `import.meta.env.VITE_*` referenced for: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, **`VITE_API_BASE`**, **`VITE_API_BASE_URL`**, **`VITE_API_URL`**, **`VITE_GIGVORA_API_URL`**, **`VITE_REALTIME_URL`** — *4 different names refer to "the backend base URL"*. None defined in `.env`.
- `process.env` referenced in **client-graph file** `src/integrations/supabase/client.server.ts` (service-role key path). Already flagged D03-G6.

### 1.3 Backend env access
- `apps/api-nest/src/app.module.ts:93` registers `ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] })`.
- 14 distinct `process.env.*` reads across NestJS: `DATABASE_URL`, `REDIS_URL`, `OPENSEARCH_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`, `NODE_ENV`, `MEDIA_AUDIO_BUCKET`, **3 different names for ML URL** (`ML_PY_URL`, `MLPY_URL`, `ML_PYTHON_URL`), **3 different names for analytics URL** (`ANALYTICS_PY_URL`, `ANALYTICS_PYTHON_URL`, `ANALYTICS_URL`).
- Workers/integrations/indexer use `REDIS_URL`, `OPENSEARCH_URL`, `STRIPE_SECRET_KEY`, `SENDGRID_API_KEY`, `MAIL_FROM`, `LIVEKIT_*`, `JITSI_DOMAIN`, `STORAGE_BACKEND`, plus partial `process.env.S` and `process.env.R` (truncated reads — code bug worth investigating).
- Python services read `LOG_LEVEL`, `ML_MAX_BODY_BYTES`, `ML_MAX_ITEMS`, `ANALYTICS_MAX_*` via `os.environ.get`.

### 1.4 Shared config package (`packages/shared-config/`)
- Single 33-line `src/index.ts` exporting `EnvSchema` (Zod) + `loadEnv()`. Validates ~17 backend variables.
- **Not consumed by `apps/api-nest`.** Schema is dead code; NestJS reads `process.env` directly without validation.

### 1.5 Shared API contracts (`packages/api-contracts/`)
- 31-line stub. Compare to `packages/sdk/src/index.ts` (1374 lines) — contracts package is essentially empty; the SDK has absorbed contract types.

### 1.6 SDK package (`packages/sdk/`)
- **32 module files**, 1374-line `index.ts` aggregating cross-domain types.
- `package.json` declares **only 19** sub-path exports. **13 SDK files are missing from `exports`:** `ads-ops`, `customer-service`, `dispute-ops`, `enterprise-connect`, `finance-admin`, `internal-admin-shell`, `moderator-dashboard`, `networking-events-groups`, `sales-navigator`, `super-admin-command-center`, `trust-safety-ml`, `verification-compliance`, `recruiter-job-management` (also missing alongside `webhooks`/`webinars` which appear in exports but **have no source file** — broken in both directions).
- **No identity / auth / profiles SDK module** (D02-G7, D03-G8 already flagged).
- **No `createClient(SdkConfig)` factory.** `SdkConfig` is exported from `index.ts` but no constructor uses it. Modules expose ad-hoc factories, e.g. `createWebhooksClient(fetchImpl, base = '/api/v1')` — each module invents its own signature.
- **15+ frontend hooks already consume `@gigvora/sdk`** (`useContractsSowAcceptance`, `useInterviewPlanning`, `useJobPostingStudio`, etc.) — proves the wiring path works in principle, but each call site re-resolves the base URL.
- Root `package.json` has **no `workspaces` field** — `@gigvora/sdk` resolves only via `tsconfig.json` paths alias. Bun/npm sees 0 workspaces.

### 1.7 Frontend → backend base URL
- 5 different env var names in flight (§1.2). The `useGigsBrowse.ts` pattern reads `import.meta.env.VITE_API_BASE_URL` directly inside the hook with no central resolver.
- Only **1 occurrence** of `fetch('/api/v1/...')` in `src/` (`useCrossDomainContext.ts`). The rest of the SDK call sites construct URLs against the per-hook `baseUrl` variable.

### 1.8 Feature flags
- DB schema: `sa_feature_flags` table exists (`packages/db/migrations/0082_super_admin_command_center.sql`) with `key, name, description, enabled, rollout_pct, status, environments[], segments`.
- Service: `apps/api-nest/src/modules/super-admin-command-center/super-admin-command-center.{repository,service}.ts` exposes admin CRUD.
- Frontend: `src/hooks/useSuperAdminCommandCenter.ts` and `src/pages/admin/SuperAdminPage.tsx` administer flags.
- **No runtime evaluator** — there is no `useFeatureFlag(key)` hook for app code, no `<FeatureGate flag="...">` component, no SSR-time flag fetch in route loaders. Flags exist as administrative records but **do not gate any feature rendering anywhere in `src/`**. The 5 hooks/pages listed in §1.6 are all admin-side management, not consumers.
- `useCtaExperiment` exists separately and is likely an unrelated A/B harness.

### 1.9 Secret handling
- **Critical:** 30+ NestJS module files contain literal `process.env.JWT_SECRET ?? 'dev-secret-change-me'` fallbacks — confirmed in `auth.module.ts`, `identity.module.ts`, `agency.module.ts`, `companies.module.ts`, `entitlements.module.ts`, `events.module.ts`, `feed.module.ts`, `groups.module.ts`, `inbox.module.ts`, `jwt.strategy.ts`, … If `JWT_SECRET` is unset in production the API silently runs on a guessable, public string.
- Lovable runtime secrets present: `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `LOVABLE_API_KEY`, `SUPABASE_URL`. **No `JWT_SECRET`, no `STRIPE_SECRET_KEY`, no `SENDGRID_API_KEY`, no AI provider keys** are configured.
- AI flow tunnels `LOVABLE_API_KEY` through `supabase/functions/ai-assistant/index.ts` (Deno + 12 system prompts) — already flagged D03-G7. The function **uses `Deno.env.get`** which is fine, but the entry point itself must move to a TanStack Start server function.

### 1.10 Monorepo / workspace baseline
- 9 packages declare `@gigvora/*` names (`api-nest`, `connectors`, `integrations`, `media-pipeline`, `search-indexer`, `webhook-gateway`, `workers`, `db`, `sdk`).
- Root `package.json` is the legacy single-package Vite scaffold with **no `workspaces` array**. The monorepo only "works" because `tsconfig.json` rewrites `@gigvora/sdk` → `packages/sdk/src/index.ts`. There is no install/build orchestration for the other 8 packages.
- Both `bun.lock` and `package-lock.json` exist — dual lockfiles, ambiguous package manager.

### 1.11 Vite env handling
- `vite.config.ts` does **not** call `loadEnv`, does not set `envPrefix`, does not `define` any compile-time constants. Uses Vite defaults: every `VITE_*` var bundled into client.

---

## 2. A1–A13 audit checklist

| # | Track | Finding | Evidence |
|---|---|---|---|
| **A1** | Supabase removal | ☒ `.env` only contains Supabase vars; no `VITE_API_BASE_URL` defined for the backend the frontend should be talking to. Reinforces D03 split-brain. | §1.1, §1.2 |
| **A2** | NestJS completeness | ☒ Backend env contract exists (`shared-config/EnvSchema`) but is **not loaded** by `app.module.ts`. NestJS reads raw `process.env` with weak `??` fallbacks. | §1.3, §1.4, §1.9 |
| **A3** | Connectors / secrets | ☒ `.env.example` documents 30+ keys (Stripe, SendGrid, Twilio, 12 AI providers, OAuth, CRM). **None registered in Lovable runtime secrets.** Production-ready connectors will fail. | §1.1, §1.9 |
| **A4** | ML / analytics wiring | ☒ Three different env-var names per service (`ML_PY_URL`, `MLPY_URL`, `ML_PYTHON_URL`). Whichever module loads first wins; the others silently default. | §1.3 |
| **A5** | Indexers / OpenSearch | ☐ `OPENSEARCH_URL` is consistent and defaulted. OK at D04 layer. | §1.3 |
| **A6** | Pages / components | ☒ No `<FeatureGate>` / `useFeatureFlag()` in `src/`. The schema and admin UI exist but nothing consumes the runtime evaluation. | §1.8 |
| **A7** | Real data / no demo | ☒ `JWT_SECRET ?? 'dev-secret-change-me'` is shipped to production-bound modules. This is the runtime equivalent of demo data — auth tokens are guessable. <br>☒ `process.env.S` and `process.env.R` truncated reads in `apps/integrations/` and `apps/media-pipeline/` indicate code bugs (likely `S3_BUCKET` / `REDIS_URL` typos). | §1.3, §1.9 |
| **A8** | Player / editor | ☐ N/A. | — |
| **A9** | Logic-flow | ☒ The 5 frontend env-var aliases (§1.2) mean a developer fixing one hook may still leave another broken. Centralized `getApiBaseUrl()` is missing. | §1.2 |
| **A10** | Forms enrichment | ☐ N/A. | — |
| **A11** | Frontend ↔ backend integration | ☒ SDK `package.json` exports diverge from source files in **both directions**: 13 source files unexported, 2 exported paths reference non-existent files (`./webhooks`, `./webinars`). Build-time consumers will see runtime "Cannot find module" errors. <br>☒ No `createClient(config)` factory; each module re-implements client construction. | §1.6 |
| **A12** | Security / GDPR / FCA | ☒ **P0** — 30+ modules ship `'dev-secret-change-me'` as JWT fallback. Single `JWT_SECRET` must be required-at-bootstrap. <br>☒ No central env validator running in any service entry point. <br>☒ Lovable runtime secrets list does not include any of the API keys the connectors expect. <br>☒ Service-role Supabase key in `client.server.ts` lives in browser import graph (D03-G6). | §1.9 |
| **A13** | Mobile parity / docs | ☒ Flutter `core/api_client.dart` exists but no Dart equivalent of the typed SDK — Dart code presumably stringly-typed. <br>☒ No `docs/architecture/configuration.md` defining the env contract, secret-naming rules, or feature-flag conventions. | §1.10 |

---

## 3. Gaps to remediate in Run 2

| Gap ID | Priority | Description |
|---|---|---|
| **D04-G1** | **P0** | Replace every `process.env.JWT_SECRET ?? 'dev-secret-change-me'` with a single `assertJwtSecret()` helper in `@gigvora/shared-config` that throws at bootstrap if `JWT_SECRET` is missing or shorter than 32 chars. Refactor all 30+ modules through the helper. |
| **D04-G2** | **P0** | Wire `apps/api-nest/src/main.ts` to call `loadEnv(process.env)` from `@gigvora/shared-config` **before** any module loads. Bootstrap fails fast on invalid env. |
| **D04-G3** | **P0** | Collapse the 5 frontend base-URL aliases (`VITE_API_BASE`, `VITE_API_BASE_URL`, `VITE_API_URL`, `VITE_GIGVORA_API_URL`, `VITE_REALTIME_URL`) to **two** canonical names: `VITE_API_BASE_URL` (REST) + `VITE_REALTIME_URL` (WS). Add `src/lib/config.ts` with `getApiBaseUrl()` / `getRealtimeUrl()` resolvers, default to `'/api/v1'`, fail loudly otherwise. Mass-rewrite hooks. |
| **D04-G4** | **P0** | Collapse the 3 NestJS ML/Analytics URL aliases to canonical `ML_SERVICE_URL` / `ANALYTICS_SERVICE_URL` (already in `.env.example`). Delete the 4 alternates. |
| **D04-G5** | **P0** | Repair `packages/sdk/package.json` exports: add the 13 missing modules, delete the 2 phantom paths (`./webhooks`, `./webinars`) **or** create the missing source files. Add a CI check that exports ↔ files match. |
| **D04-G6** | **P0** | Fix the truncated env reads `process.env.S` and `process.env.R` in `apps/integrations/` and `apps/media-pipeline/` — they should be `S3_BUCKET` and `REDIS_URL` (or whatever the original intent was). |
| **D04-G7** | **P1** | Add `createGigvoraClient(config: SdkConfig)` to `packages/sdk/src/index.ts`. All per-module factories accept the same `SdkConfig` (carrying `baseUrl`, `getToken`, `fetchImpl`). Frontend instantiates once, hooks consume the singleton. |
| **D04-G8** | **P1** | Add root `package.json` `workspaces: ['apps/*', 'packages/*']` so `bun install` actually links the monorepo. Pick a single package manager (recommend `bun` given `bun.lock`); delete `package-lock.json`. |
| **D04-G9** | **P1** | Build `useFeatureFlag(key)` hook + `<FeatureGate flag="key">` component backed by a server-function-loaded snapshot of `sa_feature_flags`, evaluated against `(env, segment, identityId)`. Cache per session, invalidate on flag-change webhook. |
| **D04-G10** | **P1** | Register the production-required runtime secrets in Lovable (one batch via `add_secret`): at minimum `JWT_SECRET` (32+ chars), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SENDGRID_API_KEY`, `MAIL_FROM`, plus any AI BYOK keys the platform actually uses. Confirm scope with user before requesting. |
| **D04-G11** | **P1** | Add `vite.config.ts` `envPrefix: 'VITE_'` (defensive default) and a `loadEnv` block that fails the build if `VITE_API_BASE_URL` is missing in non-dev modes. |
| **D04-G12** | **P1** | Replace the `ai-assistant` Supabase Edge Function with a TanStack Start server route at `src/routes/api/ai/assistant.ts` calling Lovable AI Gateway via `process.env.LOVABLE_API_KEY`. Delete `supabase/functions/ai-assistant/`. (Already counted as D03-G7 — re-stated here under config hygiene.) |
| **D04-G13** | **P2** | Generate a Dart counterpart of the SDK (`apps/mobile-flutter/lib/sdk/`) from the same Drizzle/Zod source-of-truth — at minimum hand-written typed clients matching the TS modules. Wire `apps/mobile-flutter/lib/core/api_client.dart` to consume them. |
| **D04-G14** | **P2** | Make `packages/api-contracts/` either (a) the single source of OpenAPI spec + Zod schemas, with `@gigvora/sdk` re-exporting; or (b) delete `api-contracts/` and document SDK as the contract source. Today the 31-line stub is dead. |
| **D04-G15** | **P2** | Write `docs/architecture/configuration.md` codifying: env-var canonical names, "no `??` fallbacks for security secrets" rule, feature-flag naming convention (`<domain>.<surface>.<change>`), runtime-secret registration playbook. |
| **D04-G16** | **P2** | Add ESLint rule blocking `process.env` reads from `src/**/*.{ts,tsx}` except `src/lib/config.ts` and `src/routes/api/**`. Same for `import.meta.env` — only the central resolver may read raw env. |
| **D04-G17** | **P3** | Add CI matrix step that runs `node -e "require('@gigvora/shared-config').loadEnv({...})"` against `.env.example` to prove the schema accepts the documented baseline. |
| **D04-G18** | **P3** | Investigate `.gitignore` policy for `.env`. Lovable generates and tracks it; confirm whether to add `.env` to ignore list once the project no longer relies on the auto-generated Supabase block. |

---

## 4. Sign-off matrix

| Track | Audit | Build | Integrate | Test | Sign-off |
|---|---|---|---|---|---|
| A1  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A2  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A3  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A4  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A6  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A7  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A9  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A11 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A12 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A13 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A5, A8, A10 | n/a at D04 scope | — | — | — | — |

**Run 1 status: COMPLETE.** 18 gaps recorded (6× P0, 6× P1, 4× P2, 2× P3).

**Headline findings:**
1. **30+ NestJS modules ship `'dev-secret-change-me'` as the JWT fallback** — auth tokens become guessable if `JWT_SECRET` is unset (P0).
2. **5 different env-var names** point at the same backend base URL across the frontend; **3 different names** for ML URL on the backend. Centralized resolvers required (P0).
3. **SDK `package.json` exports are broken in both directions:** 13 source modules unexported, 2 exported paths reference missing files. Builds will fail at runtime for any consumer that imports the wrong subpath (P0).
4. **Feature flags table + admin UI ship without a runtime evaluator** — `useFeatureFlag()` does not exist, so no consumer page actually gates on flags (P1).
5. **Root `package.json` has no `workspaces` field** — the monorepo only resolves via `tsconfig` aliases (P1).

D04 P0s are sequencing-friendly with D02-G7 (SDK identity client) and D03-G2 (frontend cutover). The JWT fallback (D04-G1) is the single highest-impact security item across the four foundation domains and should land first in any G1 build run.
