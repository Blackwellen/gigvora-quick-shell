# FD-08 — NestJS Core Backend Completion & Full Frontend Route Wiring — Run 1 Audit

Date: 2026-04-18 · Group: G3 · Maps to **Master Sign-Off Matrix → G03 (backend coverage), G04 (frontend live wiring), G06 (creation flows), G09 (Playwright)**.

> Scope: prove every site-map page family has a NestJS controller backing it, every frontend page consumes that controller via a TanStack Query hook (no mocks, no `onClick={() => {}}`), and every interactive element (button, drawer, popup, widget, form) has a real handler wired to a real endpoint.

## 1. Business & technical purpose
Eliminate the gap between (a) the NestJS surface area, (b) the legacy/migrated frontend route tree, and (c) the SDK + hook layer that bridges them. After FD-08, no UI element should call a stub, no controller should exist without a frontend consumer, and no frontend page should render placeholder data when an envelope endpoint exists. This is the gate that turns the platform from "scaffolds plus shells" into "every click hits a real backend".

## 2. Inventory snapshot

### Backend (NestJS)
- **77 module dirs** under `apps/api-nest/src/modules/` — strong coverage breadth.
- **73 controllers**, **120 services**, **67 repositories**, **67 DTO files** — services-to-controllers ratio 1.6× (good — split read/write/analytics/ml services).
- **`app.module.ts` imports the full set** with one big import block + 6 stubbed module placeholders (`UsersModule, ProfilesModule, JobsModule, ProjectsModule, GigsModule, ServicesModule, OrdersModule, BillingModule, MessagingModule, MediaModule, AdminModule` from `_stub.module.ts`) — these stubs are P0 blockers.
- Infra: TypeORM + ConfigModule + ThrottlerModule + BullMQ wired ✅.
- **`grep "Module," app.module.ts | wc -l` returned 9** because the import lines are concatenated on one logical line (single import statement per module follows ESLint single-line) — actual import count from the file body is ~75; not a red flag, just a measurement artefact.

### Frontend
- **0 files in `src/routes/`** — TanStack Start file-based routing is **not yet adopted at all**.
- **499 files in `src/pages/`** — every route family currently lives in the legacy React Router tree. Per **Core memory rule** (`React, react-router-dom to TanStack Start migration`) this is the single largest pre-existing tech-debt vector and the biggest risk to FD-08 closure.
- 59 hooks in `src/hooks/`, 8 API modules in `src/lib/api/`, 319 `useMutation` calls — frontend has substantial wiring already.
- **0 dead handlers** (`onClick={() => {}}`) — `frontend-integration-completeness` rule has held; ✅.
- **0 `href="#"`** — ✅.
- **0 placeholder toasts matching "coming soon|TODO|placeholder|not implemented"** — ✅.
- **0 TODO/FIXME in `src/routes/`** (because the dir doesn't exist yet).
- **42 files import or define mock data** (`MOCK_|mockData|fakeData|fixtures.json`) — these are the UI-preserving fixture fallbacks per `frontend-integration-completeness` rule, but several need re-validation that the live envelope path is reached when `VITE_GIGVORA_API_URL` is set.

### Residual Supabase coupling (web)
- 7 files in `src/` import `@/integrations/supabase/...` — same finding as FD-06 P0 #5 (must move to `@gigvora/sdk` or NestJS auth endpoints). These are: `AuthContext.tsx`, `ProfilePage.tsx`, and 5 others (full enumeration in FD-06 audit).

### Tests
- **66 Playwright spec files** under `tests/playwright/` — solid coverage breadth, but FD-08 needs the matrix below to confirm every page family is exercised, not just the routes-mount smoke tests.

### Security on controllers
- **23 of 73 controllers (32%) have no `@UseGuards` decorator** — these endpoints either rely on a global guard (acceptable if it's `JwtAuthGuard` mounted via `APP_GUARD`) or are unguarded (P0). Need to verify by inspecting the global guard registration.

## 3. Findings

### 🚨 P0 (release blockers)

1. **Frontend route tree is still 100% `src/pages/` (499 files), 0% `src/routes/`.** The TanStack Start migration is not started. Per master sign-off matrix and core memory rule, no domain can claim "complete frontend wiring" while the framework migration is pending — TanStack Start routes are the gate for SSR, SEO meta, error/notFound boundaries, and the typed `<Link>` API. **Mitigation strategy** below — incremental migration domain-by-domain, with `src/pages/` and `src/routes/` coexisting during the transition.
2. **`_stub.module.ts` exports 11 stub modules** (`UsersModule, ProfilesModule, JobsModule, ProjectsModule, GigsModule, ServicesModule, OrdersModule, BillingModule, MessagingModule, MediaModule, AdminModule`) that are imported by `app.module.ts`. Any controller in those stubs is a fake. Need to enumerate what each stub registers (likely empty `@Module({})` shells) and either delete the import or replace with the real domain module.
3. **23/73 controllers lack `@UseGuards`** — must verify that `APP_GUARD` registers `JwtAuthGuard` globally; if not, these are unauthenticated endpoints (severity scales with what they expose).
4. **No SDK package wiring proof.** `@gigvora/sdk` is referenced in `frontend-integration-completeness` but `src/lib/api/` only has 8 modules vs 73 controllers — confirms the SDK→hook bridge is incomplete. Each domain hook needs a typed SDK method per controller route, not hand-rolled `fetch(API_BASE + path)`.
5. **42 files contain mock data declarations.** Per `frontend-integration-completeness`, fixtures are allowed only as a fallback when `VITE_GIGVORA_API_URL` is unset; need to audit each file to confirm: (a) fixture is only returned when API is unreachable, (b) live path is exercised by Playwright when API URL is set, (c) loading/empty/error/retry states all render.
6. **7 web files still import Supabase client.** Cross-cuts FD-06 P0 #5; called out here because each represents a frontend page wired to the wrong backend.
7. **No site-map → controller → hook → page → spec coverage matrix exists.** Without this matrix, "complete" is unprovable. FD-08 Run 2 must produce `docs/architecture/site-map-coverage.csv` enumerating every page family with status flags.
8. **Creation Studio backend (`creation-studio` module) exists** ✅, but the 10-step enterprise wizard mandate (per `commercial-builders` memory) requires backend draftability per step (`POST /studio/drafts`, `PATCH /studio/drafts/:id`, `POST /studio/drafts/:id/publish`) — need to verify this contract is implemented for **all 7 wizard families** (Jobs, Gigs, Services, Projects, Webinars, Podcasts, Videos) per master sign-off matrix.
9. **No reels/video/streaming module** — `grep apps/api-nest/src/modules | grep "reel|media|video|stream"` returned only `media-viewer`. Reels = special priority per master sign-off matrix; missing dedicated module is a release blocker.
10. **No `domain-bus` event-contract documentation.** Module exists but cross-domain events (e.g., `job.published → notifications`, `proposal.accepted → contracts`) have no enumerated contract; without it, wiring is unverifiable.

### P1
11. **Service:controller ratio of 1.6× is uneven** — some modules (`ads-manager-builder`, `ads-ops`, `dispute-ops`, `customer-service`) have controllers but the service may not implement the analytics/ml split required by `enterprise-build-standard`. Audit per-domain.
12. **319 `useMutation` calls but only 8 SDK files** — many hand-rolled mutation bodies; need consolidation into typed SDK methods to prevent contract drift.
13. **No global request-id / correlation-id propagation** confirmed across SSR ↔ NestJS ↔ workers chain.
14. **`talent-search-navigator` and `candidate-pipeline` modules** are imported in `app.module.ts` but **not in the module dir listing** — possible orphans / dead imports causing build slowdown.
15. **No Playwright spec inventory mapping spec → page family** — 66 specs is a lot but distribution across 499 pages is unknown.
16. **No mobile parity check per controller** — `mobile-screens-mandate` requires every domain ship list/detail/edit screens; no FD-08 evidence that all 73 backend domains have a Flutter consumer.

### P2
17. **No OpenAPI / contract export from NestJS** for SDK code-gen — manual SDK maintenance is fragile.
18. **No latency/error-rate SLO per controller** documented.
19. **No "deprecated route" tracking** — when a `src/pages/X.tsx` is migrated to `src/routes/X.tsx`, the legacy file must be removed in the same PR; need a CI gate that fails when both exist with the same path.

## 4. Run 2 build priorities (FD-08 only)

### A. Coverage matrix (gate for everything else)
1. Generate `docs/architecture/site-map-coverage.csv` with one row per page family across 5 columns: `path`, `legacy_pages_file`, `tanstack_routes_file`, `nest_controller`, `hook`, `playwright_spec`. Auto-built from a script (`scripts/build-coverage-matrix.ts`) that walks `src/pages/`, `src/routes/`, `apps/api-nest/src/modules/*/*.controller.ts`, `src/hooks/`, and `tests/playwright/`. Status flags: `✅ wired`, `⚠️ legacy-only`, `🚨 missing`.

### B. Stub module elimination
2. Open `apps/api-nest/src/modules/_stub.module.ts`; for each of the 11 stubs, either:
   - Delete the import from `app.module.ts` if a real module already covers the domain (likely for `UsersModule` → `IdentityModule`, `ProfilesModule` → `ProfilesDomainModule`, `JobsModule` → `JobsBrowseModule`, `BillingModule` → `BillingInvoicesTaxModule`, `MessagingModule` → `InboxModule`, `MediaModule` → `MediaViewerModule`, `AdminModule` → `InternalAdminShellModule`), OR
   - Implement the missing domain module with controller/service/repository/DTO if no real coverage exists (likely candidates: `OrdersModule`).

### C. Controller guard audit
3. Inspect `apps/api-nest/src/main.ts` and `infra/infra-global.module.ts` for `APP_GUARD` registration. If `JwtAuthGuard` is registered globally with `@Public()` decorator opt-out, the 23 unguarded controllers are correct. If not, each must add `@UseGuards(JwtAuthGuard, RbacGuard)` at the controller class level. Allowed exceptions: `health`, `marketing` (public landing data).

### D. SDK consolidation
4. Generate `@gigvora/sdk` from NestJS controllers via OpenAPI export (`@nestjs/swagger` is in deps) + `openapi-typescript-codegen`. One SDK method per controller route, typed envelopes from `packages/db` schema inference. Replace hand-rolled `fetch(API_BASE + path)` in `src/lib/api/*` and inline `useMutation` bodies with `sdk.<domain>.<method>()`.

### E. Page-by-page wiring sweep
5. For each of the 499 `src/pages/` files, in priority order (Feed → Jobs → Gigs → Services → Projects → Hire → Settings → Creation Studio → Admin):
   - Confirm hook usage (`use<Domain>` from `src/hooks/`) calls live SDK.
   - Confirm all 4 journey states render (loading skeleton, empty CTA, error retry, populated).
   - Confirm all buttons have real handlers via the typed router or mutation.
   - When the page is ready, migrate to `src/routes/<path>.tsx`, add `head()` SEO metadata, error/notFound boundaries; delete the legacy `src/pages/<path>.tsx` in the same PR.
   - CI gate: fail if `src/pages/X.tsx` and `src/routes/X.tsx` both exist with the same canonical URL.

### F. Reels / video / media
6. New module `apps/api-nest/src/modules/reels/` with controller (`POST /reels`, `GET /reels/feed`, `POST /reels/:id/like`, `POST /reels/:id/view`, `GET /reels/:id/replays`), service (orchestrates upload → media-pipeline → publish state machine from FD-05 uploads), repository, DTO. Wire to `media-pipeline` worker. Mobile screen pack per `mobile-screens-mandate`.

### G. 10-step wizard contract
7. Each of the 7 commercial-builder wizards (Jobs, Gigs, Services, Projects, Webinars, Podcasts, Videos) needs a uniform draft contract on the owning controller:
   - `POST /<domain>/drafts` (create, returns `draftId` + `step: 1`)
   - `PATCH /<domain>/drafts/:id` (save partial, advances `step` if validators for current step pass)
   - `GET /<domain>/drafts/:id`
   - `POST /<domain>/drafts/:id/publish` (final-validate all 10 steps, write through to live entity, audit row)
   - `DELETE /<domain>/drafts/:id`
   - All write paths require `Idempotency-Key` (per `enterprise-build-standard` #5).

### H. Mock data audit
8. For each of the 42 files containing mock data, prove the fallback gate (`if (!apiConfigured()) return MOCK_<domain>`) is the *only* path the mock is reachable. Add an ESLint rule `no-mock-without-fallback-gate` that fails PRs where a `MOCK_*` constant is returned without an `apiConfigured()` check.

### I. Cross-domain event bus contract
9. Document every `domain-bus` event in `docs/architecture/domain-bus-contracts.md`: `event_name`, `producer_module`, `consumer_modules`, `payload_zod`, `idempotent: bool`, `retention`. Code-generate event constants from this doc.

### J. Tests
10. New `tests/coverage-matrix.spec.ts` parses `site-map-coverage.csv` and asserts every row has `nest_controller != null && hook != null && (legacy_pages_file == null || tanstack_routes_file != null) && playwright_spec != null`. CI fails if any row has 🚨 in any of those columns.

## 5. Mapping to Master Sign-Off Matrix
- **Primary**: G03 (backend coverage), G04 (frontend live wiring), G06 (10-step wizards), G09 (Playwright per page family).
- **Secondary**: G01 (Supabase removal — 7 web files), G07 (mobile parity per `mobile-screens-mandate`), G13 (final docs — coverage matrix is part of the release package).

## 6. Domain checklist matrix (Run 1 state)

| Validation Item | Tick | Evidence / File pointers |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages, tabs, widgets, buttons, forms, popups, drawers mapped | ☐ | `site-map-coverage.csv` not yet generated; 499 legacy pages, 0 TanStack routes |
| Backend files and APIs complete | ☐ | 73 controllers / 120 services / 67 repos / 67 DTOs ✅ breadth; 11 stub modules + missing reels module + missing 10-step wizard contract proof = P0 gaps |
| Supabase/demo data eliminated | ☐ | 7 web files import Supabase; 42 files declare mock data (gate proof needed) |
| Database schema, seeders, fixtures complete | n/a | Owned by FD-06 |
| ML / analytics / workers integrated | ☐ | Service:controller 1.6× suggests partial split; per-domain audit pending |
| Indexing/search/filter logic | ☐ | `search` module present ✅; need confirmation OpenSearch indexer is wired per controller |
| Realtime / live data | ☐ | `@nestjs/platform-socket.io` in deps ✅; per-controller realtime contracts unverified |
| Security & middleware protections | ☐ | 23/73 controllers without explicit `@UseGuards` — verify `APP_GUARD` global registration |
| Playwright logic-flow coverage | ☐ | 66 specs ✅ breadth; per-page-family coverage matrix pending |
| Mobile / API parity | ☐ | Per-controller Flutter consumer audit pending (cross-cuts `mobile-screens-mandate`) |
| Acceptance criteria passed | ☐ | Pending Run 2 + Run 4 |

## 7. Acceptance criteria (binding)
- A1. `docs/architecture/site-map-coverage.csv` generated by `scripts/build-coverage-matrix.ts`; CI gate fails if any row is missing `nest_controller`, `hook`, or `playwright_spec`.
- A2. `_stub.module.ts` deleted; all 11 stub imports removed from `app.module.ts`; build passes.
- A3. `JwtAuthGuard` registered globally via `APP_GUARD`; public endpoints opt out via `@Public()` decorator; only `health` + `marketing` listed as public; `tests/security/global-guard.spec.ts` proves random unauthenticated request to a private endpoint returns 401.
- A4. `@gigvora/sdk` published with one typed method per NestJS controller route, generated from OpenAPI; `src/lib/api/*` and inline `useMutation` bodies refactored to call `sdk.<domain>.<method>()`.
- A5. Every `src/pages/X.tsx` either (a) migrated to `src/routes/X.tsx` with `head()` + error/notFound boundaries + legacy file deleted in the same PR, or (b) explicitly listed in `docs/architecture/migration-deferral-list.md` with reason and target sprint; no legacy + new co-existence.
- A6. New `reels` module shipped end-to-end (controller + service + repo + DTO + worker integration + Flutter screen pack + Playwright spec); reels mobile interaction quality validated per master sign-off matrix.
- A7. All 7 commercial-builder wizards expose the uniform draft contract (`POST/PATCH/GET/POST publish/DELETE` on `/<domain>/drafts`); Playwright spec per wizard covers happy path through all 10 steps; resume-from-draft works.
- A8. ESLint rule `no-mock-without-fallback-gate` added; all 42 mock files comply.
- A9. `docs/architecture/domain-bus-contracts.md` enumerates every event with producer + consumer + Zod payload + idempotency flag; constants code-generated from the doc.
- A10. 7 web Supabase imports removed (cross-cut with FD-06 P0 #5); auth flow lives entirely in NestJS `IdentityModule`.
- A11. Per-domain mobile audit completed; gaps logged in `docs/architecture/mobile-parity-gap.md` with target sprint.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate._
