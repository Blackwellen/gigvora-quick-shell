# FD-09 — SDK, Shared Contracts, Connectors, Third-Party Integrations & BYOK — Run 1 Audit

Date: 2026-04-18 · Group: G3 · Maps to **Master Sign-Off Matrix → G03 (backend coverage), G04 (frontend wiring), G07 (mobile parity), G10 (third-party integrations), G11 (BYOK)**.

> Scope: prove `@gigvora/sdk` + `@gigvora/api-contracts` cover every NestJS controller, every connector (CRM, SMTP, storage, MFA, calendar, video/voice, Notion-style, BYOK AI) is wired end-to-end with health/state surfaced in the product, and admin/customer API tooling exists with role-aware governance.

## 1. Inventory snapshot

### Packages
- `packages/`: **6 packages** present — `api-contracts`, `db`, `sdk`, `shared-config`, `shared-domain`, `ui-tokens` ✅.
- `packages/sdk/package.json`: **22 named exports** (booking, calls, groups, inbox, interview-planning, job-application-flow, job-posting-studio, jobs-browse, recruiter-job-management, trust, webhooks, webinars, candidate-availability-matching, projects-browse-discovery, project-posting-smart-match, proposal-builder-bid-credits, proposal-review-award, contracts-sow-acceptance, project-workspaces-handover + 3 utility) — strong start, but **22 vs 73 NestJS controllers (FD-08) = 30% coverage**.
- `packages/api-contracts/`, `packages/shared-domain/`, `packages/shared-config/` exist but contents not enumerated in this snapshot.
- `packages/ui-tokens/` ✅ — design-token sharing (good for mobile parity).

### NestJS integration modules
- 4 modules: `billing-invoices-tax`, `calendar`, `integrations`, `outbound-webhooks` — covers some surfaces, but **missing dedicated modules for: CRM (HubSpot/Salesforce), MFA (TOTP/SMS providers), SMTP (Sendgrid/Postmark), Storage (S3/R2 admin surface), Auth providers (Google/Apple/SSO admin), Video (LiveKit/Jitsi admin), Notion-style tools (Notion/Linear/Asana), AI providers BYOK admin**.

### Adapter packages (`apps/integrations/src/`)
- AI: `ai/providers.ts` ✅ (BYOK adapter present)
- Email: `email/sendgrid.ts` ✅
- Payments: `payments/stripe.ts` ✅ (single provider; no Adyen/Paddle/Wise)
- Storage: `storage/local.ts`, `storage/r2.ts`, `storage/s3.ts` ✅ (3 adapters, good)
- Voice/video: `voice/jitsi.ts`, `voice/livekit.ts` ✅
- `domain-adapter-map.ts` ✅ — central provider→adapter routing

### Apps
- `apps/connectors/src/index.ts` — **30 lines only** — clearly a scaffold, not a real connector orchestrator service.
- `apps/webhook-gateway/src/index.ts` — **50 lines only** — scaffold; but webhook signature handling exists in 4 places (`createHmac` count) so signing logic is partially live.

### Frontend
- `src/lib/api/`: 8 hand-rolled modules (`agency, events, feed, gigvora, groups, inbox, projectWorkspaces, search`).
- `src/lib/sdk/`: **empty directory** — `@gigvora/sdk` is not yet imported into the web app.
- BYOK UI present: `src/pages/ai/AIBYOKPage.tsx`, `AISettingsPage.tsx`, `AIBillingPage.tsx`, `AIChatWorkspacePage.tsx`, `AIToolsHubPage.tsx`, `AIShell.tsx`, `settings/IntegrationsSettingsPage.tsx` ✅ surfaces exist.

### Mobile
- `apps/mobile-flutter/lib/core/`: `api_client.dart`, `async_state.dart`, `offline_cache.dart`, `storage.dart` — bespoke client, **not generated from shared contracts** → drift risk.

### OpenAPI / docs
- `@nestjs/swagger` wired in `apps/api-nest/src/main.ts` at `/api/docs` ✅ — strong foundation for SDK code-gen.

## 2. Findings

### 🚨 P0 (release blockers)
1. **SDK coverage gap: 22 exports vs 73 NestJS controllers (30%).** 51 backend domains have no typed SDK consumer; web/mobile are forced into hand-rolled fetch + drifting types. Cross-cuts FD-08 P0 #4.
2. **`src/lib/sdk/` is empty.** Even the 22 SDK modules that exist are not imported by the web app — `src/lib/api/` (8 hand-rolled modules) is the active path, so the SDK is shelfware.
3. **`apps/connectors/src/index.ts` is 30 lines.** No real connector orchestrator — no provider catalog, no health-check loop, no per-tenant credential vault, no rate-limit aggregator.
4. **`apps/webhook-gateway/src/index.ts` is 50 lines.** Signature verification logic appears in only 4 grep hits across `webhook-gateway` + `api-nest` — far too low for the 100+ provider mandate. Need per-provider signature schemes (Stripe `Stripe-Signature`, GitHub `X-Hub-Signature-256`, Slack `v0=`, etc.) registered in a provider registry.
5. **No CRM module** — HubSpot connector is documented in custom instructions, but `apps/api-nest/src/modules/integrations/` does not split into `crm/`, `mfa/`, `smtp/`, `storage-admin/`, `video/`, `notion-style/`, `byok-ai/` per-domain submodules. One opaque `integrations` module = no role-aware governance per provider family.
6. **No MFA-provider abstraction.** `security-authentication` memory mandates 5-attempt lockout etc., but FD-09 needs MFA *provider* pluggability (TOTP via Authy/Google Authenticator, SMS via Twilio, WebAuthn) — no adapter directory under `apps/integrations/src/mfa/`.
7. **Mobile uses bespoke `api_client.dart`** rather than a code-generated client from the same OpenAPI spec → guaranteed contract drift between web SDK and Flutter SDK.
8. **No customer API key surface** — `add_secret` references exist but no admin UI for *customers* to create/rotate their own outbound API keys (with scopes, IP allowlists, expiry) for calling Gigvora's public API.
9. **No connector health-check loop / status surface.** `system-status-page` (`/status`) memory mentions 15+ core systems but no per-connector live health (Stripe / SendGrid / Twilio / S3 / R2 / LiveKit / HubSpot) wired into `apps/workers/`.
10. **`packages/api-contracts/` content unverified.** If it doesn't already export Zod schemas per domain (matched to NestJS DTOs), the SDK + mobile + connectors all derive types from different sources → drift.

### P1
11. Single payments adapter (`stripe.ts`) — needs Adyen/Paddle/Wise plus regional optionality for FCA compliance.
12. No Notion-style integration adapters (Notion, Linear, Asana, ClickUp) under `apps/integrations/src/productivity/`.
13. No calendar provider abstraction beyond the NestJS module — adapters for Google Calendar, Outlook 365, Apple should live in `apps/integrations/src/calendar/`.
14. `apps/connectors/` and `apps/webhook-gateway/` lack Dockerfiles / deployment docs.
15. No idempotency-key store dedicated to inbound webhooks (replay protection).
16. No per-connector circuit breaker.
17. No outbound-webhook subscriber UI (customers configure their own webhook endpoints).
18. SDK has no auth interceptor / token refresh strategy documented.

### P2
19. No SDK semantic versioning policy.
20. No connector deprecation lifecycle.
21. No per-provider rate-limit telemetry surfaced to admin terminal.

## 3. Run 2 build priorities (FD-09 only)

### A. SDK code-gen pipeline
1. Add `pnpm sdk:generate` script that consumes the `/api/docs` OpenAPI export from NestJS (already wired) via `openapi-typescript-codegen`. Output: one typed module per controller (73 modules), replacing the 22 hand-written ones. Lock with a CI job that fails if `pnpm sdk:generate --check` produces a diff.
2. Same pipeline emits a Dart client to `apps/mobile-flutter/lib/sdk/` — replaces bespoke `api_client.dart`. Tag both web + Flutter outputs with the OpenAPI spec hash.

### B. Adopt SDK in web
3. Refactor `src/lib/api/*` (8 modules) + 319 inline `useMutation` bodies (per FD-08) to call `sdk.<domain>.<method>()`. Delete the 8 hand-rolled modules in the same PR; add ESLint rule `no-direct-fetch-to-api` (forbid `fetch(API_BASE + …)` outside `@gigvora/sdk`).

### C. Connector orchestrator
4. Expand `apps/connectors/` into a real service: provider catalog (`packages/api-contracts/connectors.ts` enumerating Stripe, SendGrid, Postmark, Twilio, S3, R2, LiveKit, Jitsi, HubSpot, Salesforce, Pipedrive, Notion, Linear, Asana, ClickUp, Google Calendar, Outlook 365, Slack, Microsoft Teams, GitHub, GitLab, Discord, Zoom, Google Meet, plus the Lovable-supplied connector list per `standard_connectors` knowledge), per-tenant credential vault using sealed columns from FD-07, per-provider health-check job in `apps/workers/`, and a uniform `connect / verify / refresh / revoke` lifecycle.

### D. Webhook gateway hardening
5. Expand `apps/webhook-gateway/` into a real router with a `providerRegistry` mapping URL prefix → signature scheme, replay-window, idempotency key extraction. Persist inbound events to a `webhook_events` table (idempotent insert keyed on `(provider, external_event_id)`), then publish to BullMQ. Add per-provider Playwright test exercising signature verification + replay rejection.

### E. NestJS integrations split
6. Decompose `integrations` into domain submodules: `integrations/crm/`, `integrations/mfa/`, `integrations/smtp/`, `integrations/storage-admin/`, `integrations/calendar-providers/`, `integrations/video/`, `integrations/productivity/` (Notion-style), `integrations/byok-ai/`. Each gets controller + service + repo + DTO + RBAC guard scoped to admin & owner.

### F. MFA providers
7. New `apps/integrations/src/mfa/` with `totp.ts`, `sms-twilio.ts`, `webauthn.ts`. Wire to `IdentityModule` (FD-01). Surface enrollment in `src/pages/settings/SecuritySettingsPage.tsx`.

### G. Customer API keys
8. New module `apps/api-nest/src/modules/customer-api-keys/` (CRUD, scopes, IP allowlist, expiry, rotation, last-used-at). Frontend: `src/pages/settings/ApiKeysPage.tsx` with create/rotate/revoke flows. Hash stored using FD-07 KMS adapter; secret returned exactly once at creation.

### H. Connector health & status
9. Worker job `connector-health-check` (every 60s) pings each connector's lightweight `verify` endpoint and writes to `connector_health_check` table; surfaced on `/status` (per `system-status-page` memory) **and** on the admin terminal `/internal/connectors`.

### I. Outbound webhook subscriptions (customer-facing)
10. New module `apps/api-nest/src/modules/outbound-webhook-subscriptions/` letting customers subscribe their own URLs to event topics (`job.published`, `proposal.accepted`, etc., from FD-08 P0 #10 domain-bus contracts). Uses HMAC-SHA256 signing with rotating secrets.

### J. Tests
11. Playwright spec per connector family (CRM, SMTP, storage, MFA, calendar, video, productivity, BYOK AI) covering: connect happy path, verify, simulated provider 5xx → circuit-breaker open, revoke, re-connect.

## 4. Mapping to Master Sign-Off Matrix
- **Primary**: G03 (backend coverage), G04 (frontend wiring), G07 (mobile parity), G10 (third-party integrations), G11 (BYOK).
- **Secondary**: G01 (Supabase removal — none in this domain), G05 (security — webhook signing + customer API key scoping), G09 (Playwright per connector family), G13 (release docs — connector catalog + SDK changelog).

## 5. Domain checklist (Run 1 state)

| Validation Item | Tick | Evidence / pointers |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages, tabs, widgets mapped | ☐ | BYOK + IntegrationsSettings ✅; ApiKeysPage missing; per-connector status missing |
| Backend files & APIs complete | ☐ | 4 nest integration modules vs 8 connector families needed; CRM/MFA/SMTP/storage-admin missing |
| Supabase/demo data eliminated | ☐ | No direct Supabase imports in `apps/integrations/`; n/a here |
| Database schema, seeders, fixtures complete | ☐ | `connector_health_check`, `webhook_events`, `customer_api_keys`, `outbound_webhook_subscriptions` tables not enumerated; cross-cuts FD-06 |
| ML / analytics / workers integrated | ☐ | No connector-health worker; no outbound-webhook delivery worker enumerated |
| Indexing/search/filter logic | n/a | – |
| Realtime / live data | ☐ | Per-connector live status not surfaced |
| Security & middleware protections | ☐ | Webhook signing only 4 grep hits; per-provider scheme registry missing |
| Playwright logic-flow coverage | ☐ | No per-connector spec inventory |
| Mobile / API parity | ☐ | Bespoke `api_client.dart` instead of generated client |
| Acceptance criteria passed | ☐ | Pending Run 2 + Run 4 |

## 6. Acceptance criteria (binding)
- A1. `pnpm sdk:generate` produces typed web modules for **all 73** NestJS controllers + a Dart client for Flutter; CI job `sdk-drift` fails if generated output differs from committed.
- A2. `src/lib/api/*` and inline `fetch(API_BASE + …)` removed; ESLint `no-direct-fetch-to-api` enforced; web exclusively calls `@gigvora/sdk`.
- A3. `apps/connectors/` exposes a real catalog with `connect/verify/refresh/revoke` per provider; per-tenant credentials sealed via FD-07 KMS; rate-limit + circuit-breaker per provider.
- A4. `apps/webhook-gateway/` has a `providerRegistry` covering ≥15 providers; signature verification + replay rejection enforced; `webhook_events` idempotent table populated.
- A5. NestJS `integrations` decomposed into 8 submodules (`crm/mfa/smtp/storage-admin/calendar-providers/video/productivity/byok-ai`); each guarded with admin + owner RBAC.
- A6. MFA adapters TOTP + SMS (Twilio) + WebAuthn live; settings page enrollment works end-to-end.
- A7. `customer-api-keys` module + UI shipped; secret shown once; rotate/revoke flows; `last_used_at` tracked.
- A8. `connector-health-check` worker writes to `connector_health_check`; `/status` + admin terminal surface live state per provider.
- A9. `outbound-webhook-subscriptions` module + UI; signed delivery with rotating secrets; retry with exponential backoff; DLQ after N attempts.
- A10. Playwright spec per connector family covers happy path + provider 5xx + circuit-breaker + revoke + re-connect.
- A11. `packages/api-contracts/` exports Zod schemas per domain; SDK + mobile client + workers all import from this single source.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate._
