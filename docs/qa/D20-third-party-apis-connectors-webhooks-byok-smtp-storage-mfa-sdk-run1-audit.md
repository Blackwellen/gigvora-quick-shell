# D20 — Third-Party APIs, Connectors, Webhooks, BYOK, SMTP, Storage, MFA, and SDK — Run 1 Audit

Date: 2026-04-18 · Group: G5 (D20/4 — closes G5) · Status: Run 1 (Audit) complete.

## Inventory

### apps/integrations (BYOK adapter packs, opt-in SDKs)
- ✅ `index.ts` — Adapter registry interface (categories: payments/email/sms/auth/storage/ai/calendar/billing/analytics/voice).
- ✅ `domain-adapter-map.ts` — Per-domain default→optIn map for D1–D30 (the canonical BYOK source of truth, ~40 entries).
- ✅ Adapters: `ai/providers.ts` (12 AI providers stubbed: openai/anthropic/gemini/kimi/mistral/groq/perplexity/stability/pixabay/veo/runway/elevenlabs), `email/sendgrid.ts`, `payments/stripe.ts`, `storage/{local,s3,r2}.ts`, `voice/{jitsi,livekit}.ts`.
- ❌ Stubs only — `configure()` / `healthcheck()` are no-ops; no actual SDK calls; no normalised error mapping; no rate-limit / circuit-breaker.
- ❌ Missing major adapters declared in domain-adapter-map but not implemented: `resend`, `ses`, `mailgun`, `postmark` (email); `twilio`, `vonage`, `messagebird` (SMS); `daily`, `zoom`, `whereby`, `agora` (voice); `google-calendar`, `ms-graph` (calendar); `paddle`, `lemonsqueezy` (payments); `posthog`, `segment`, `mixpanel` (analytics); `gcs`, `azure-blob` (storage).

### apps/connectors (enterprise sync framework — DECLARED, NOT IMPLEMENTED)
- ✅ `apps/connectors/src/index.ts` — Connector interface with pull/push contracts.
- ❌ **Every built-in is a no-op stub**: `hubspot, salesforce, notion, slack, workday, greenhouse, lever, ashby, webhook, generic-rest` all return `{records: []}` / `{ok: 0, failed: 0}` — zero real connector code exists.
- ❌ No reconciliation engine, no field mapping, no conflict resolution, no audit, no per-connector retry/backoff, no cursor persistence.
- ❌ Missing: per-connector NestJS modules, per-connector workers, sync-run dashboard.

### apps/api-nest backend
- ✅ `outbound-webhooks/` — controller (32 LOC, thin), publisher (331 LOC, real HMAC + retry + DLQ), module.
- ✅ `integrations/integrations.module.ts` — **14 LOC only** — exposes adapter-map GET endpoints. No connection CRUD, no OAuth callback handler, no token refresh worker, no usage metering, no health checks.
- ✅ `domain-bus/` — cross-domain event bus.
- ❌ Missing modules: `connectors`, `byok`, `mfa`, `developer-portal` (API keys/SDK download), `oauth-broker` (per-tenant OAuth flows for HubSpot/Slack/Google/MS), `connection-health-monitor`, `webhook-receiver` (inbound from Stripe/HubSpot/Slack/Twilio), `smtp-config` (per-tenant SMTP).
- ❌ No inbound webhook receiver — Stripe/HubSpot/Slack/Twilio/Calendly events have nowhere to land.

### Database
- ⚠️ **TWO conflicting webhook schemas** ship in parallel:
  - `0052_outbound_webhooks.sql`: `webhook_event_types` + `webhook_endpoints` + `webhook_deliveries` + `webhook_dead_letters` (richer: rate_limit_per_min, signing_key_version rotation, dead_letters table, response_headers, attempt cap).
  - `0071_webhooks.sql`: `webhook_endpoints` + `webhook_events` + `webhook_deliveries` (different shape — uses `secret` plaintext column, separate `webhook_events` table, `next_retry_at` field).
  - **Risk**: drift between consumer code (publisher uses 0052 shape; SDK contract may use 0071 shape); two CREATE TABLE webhook_endpoints will conflict on first migration to a fresh DB.
- ✅ `0051_integrations.sql` + `0072_integrations.sql` — likely also duplicated; needs reconciliation against `packages/db/src/schema/integrations.ts` (which uses `integration_providers` / `integration_connections` / `integration_events` / `integration_usage_daily` with KMS-sealed `secret_ciphertext`).
- ❌ Missing tables: `inbound_webhook_events` (idempotent receiver log), `oauth_states` (CSRF state for per-tenant OAuth), `oauth_authorization_codes`, `mfa_enrollments` (TOTP/WebAuthn factors), `mfa_backup_codes`, `mfa_challenges`, `api_keys` (developer-portal personal/service tokens with scopes + rate limits), `api_key_usage_daily`, `smtp_configs` (per-tenant outbound SMTP), `connector_sync_runs`, `connector_field_mappings`, `connector_sync_conflicts`, `byok_secrets` (KMS-sealed per-tenant model API keys), `webhook_ip_allowlist`, `signing_keys` (rotation history).

### SDK (`packages/sdk`)
- ✅ 32 typed-client modules (booking, calls, contracts, recruiter, sales-navigator, etc.) + `webhooks.ts` with `verifySignature()` for tenants.
- ❌ **No generated SDK** — every file is hand-written. No OpenAPI spec, no `openapi-typescript-codegen`, no auto-regen on backend change → permanent drift risk.
- ❌ No SDK versioning / changelog, no `packages/sdk/dist`, no published npm package, no `@gigvora/sdk-python`, no `@gigvora/sdk-go`.
- ❌ No SDK download surface for tenant developers.

### Frontend
- ✅ Only **2 dedicated pages**: `settings/IntegrationsSettingsPage.tsx` (185 LOC, modern stack), `ai/AIBYOKPage.tsx` (201 LOC, modern stack).
- ❌ **Missing entire Developer Portal** — no `/developer/*` route group: API Keys page, Webhooks page (per-tenant subscriptions/deliveries/replay), Inbound Webhooks page, OAuth Apps page, SDK Downloads page, API Reference page (interactive, e.g. Scalar/Stoplight), Sandbox/Try-It page, Rate Limits & Quotas page, API Logs page, Status incidents per-API.
- ❌ **Missing Connectors UI** — no per-connector setup wizard, no field-mapping UI, no sync-run history, no conflict resolver UI, no connector marketplace page.
- ❌ **Missing MFA enrollment UI** — no Authenticator app QR enrol, no WebAuthn passkey enrol, no SMS factor, no backup codes view, no recovery flow.
- ❌ **Missing per-tenant SMTP config UI** (Resend/SendGrid/SES/custom SMTP host:port:user:pass).
- ❌ **Missing BYOK key vault UI** beyond AI — model keys only; no per-domain BYOK (CRM/Email/Storage/SMS/Voice).
- ❌ **Missing OAuth Apps UI** — clients can't create OAuth apps to integrate against Gigvora.

### Hooks
- ✅ `useWebhooks.ts` — TanStack Query + realtime invalidation for subscriptions/deliveries.
- ❌ Missing: `useApiKeys`, `useOAuthApps`, `useMfa`, `useConnectors`, `useSmtpConfig`, `useByok`, `useDeveloperUsage`, `useSdkDownloads`.

### ML / Workers
- ❌ No `apps/ml-python/app/integrations*.py` — no anomaly detection on webhook delivery rate, no auth-failure clustering, no API-abuse detection, no connector sync-error classifier.
- ❌ No worker for: webhook retry (publisher-only), webhook ingest signature verification, OAuth token refresh cron, connector pull cron, SDK regeneration on OpenAPI diff.

### Mobile
- ✅ `mobile-flutter/lib/features/{integrations,webhooks}` exist — but parity with web Developer Portal nil (since portal doesn't exist).

### Tests
- ✅ Single Playwright spec: `cross-cutting-integrations.spec.ts` (probe-only). No tenant OAuth lifecycle, no webhook deliver→retry→DLQ→replay, no connector sync, no MFA enrol, no API-key issue/revoke/scope.

### Auth / MFA
- ❌ No `auth/mfa*.ts` controller files; no Supabase MFA enrollment hook; password-only auth (per `mem://features/security-authentication` lockout exists but no second factor).

## Gaps (38 total — 12 P0 / 14 P1 / 9 P2 / 3 P3)

### P0
1. **Duplicate webhook schemas (0052 vs 0071)** — schema drift will break a fresh DB rebuild and is producing inconsistent runtime contracts. Reconcile to one canonical schema (recommend the 0052 richer shape: signing_key_version + rate_limit_per_min + dead_letters table + signing_secret_ciphertext).
2. **Connectors framework is 100% stubs** — `hubspot/salesforce/notion/slack/workday/greenhouse/lever/ashby/webhook/generic-rest` all return empty arrays. Customer-facing CRM Connectivity, ATS sync, Slack notifications, Notion docs sync — all dead.
3. **No inbound webhook receiver** — Stripe (D17), HubSpot (D19/D27), Calendly (D29), Slack, Twilio events have nowhere to land. State drift inevitable.
4. **No per-tenant OAuth broker** — every integration that needs user-OAuth (HubSpot/Slack/Google/MS/Zoom/Calendly) requires OAuth state, code exchange, refresh-token storage, encryption — all absent.
5. **No MFA at all** — TOTP/WebAuthn/SMS factors absent despite enterprise tier promise. SOC 2 / ISO 27001 / SAML SSO posture incomplete.
6. **No Developer Portal** — clients cannot self-serve API keys, see usage, manage webhooks, download SDKs, view rate limits, or read API docs. This is THE customer-facing integration surface and it doesn't exist.
7. **No generated SDK / OpenAPI** — 32 hand-written SDK files = permanent drift; cannot publish official npm/PyPI package; Flutter mobile must hand-mirror every endpoint.
8. **No per-tenant SMTP config** — outbound email locked to platform default; enterprise customers cannot send from their own domain (deliverability + brand requirement).
9. **No BYOK key vault beyond AI** — CRM/Email/Storage/SMS/Voice keys have no UI to capture, no `byok_secrets` table to store KMS-sealed, no per-call envelope encryption.
10. **No connection health monitor** — no token-expiry watchdog, no auto-disable on consecutive failures, no admin alerting; expired tokens fail silently.
11. **Adapter implementations are no-op stubs** — `configure()` / `healthcheck()` do nothing; no real SDK calls. Even adapters that look "implemented" (sendgrid.ts, stripe.ts) need verification against actual SDK shape.
12. **No webhook IP allowlist / mTLS** — receiver attacks (replay, IP spoof, signature bypass) not mitigated beyond HMAC.

### P1
13. **No API key scopes/rate-limits** — `api_keys` table missing; no scope-based authz on endpoints; no per-key throttling.
14. **No OAuth-app registration** — clients can't build third-party apps that integrate against Gigvora (no client_id/client_secret issuance, no consent screen).
15. **No connector sync UI** — field mapping, conflict resolution, sync-run history — all missing.
16. **No SAML/SSO** beyond what `cloud-auth` mentions; no SCIM provisioning for enterprise IdPs (Okta/Azure AD/Google Workspace).
17. **No webhook signing key rotation UI** even though schema supports `signing_key_version`.
18. **No idempotency-key support on inbound webhook receiver** (will deliver duplicate Stripe/HubSpot events on retry).
19. **No SDK versioning + changelog**; no compatibility matrix backend↔SDK.
20. **No interactive API reference** (Scalar/Stoplight/RapiDoc) for tenants to try endpoints.
21. **No per-domain webhook event catalogue UI** — `webhook_event_types` exists but tenants can't browse it visually.
22. **No `notion`, `linear`, `jira`, `confluence`, `pagerduty`, `opsgenie`, `datadog` connector even as stub** — common enterprise asks.
23. **No SMS provider beyond Twilio stub** — no Vonage/MessageBird actual code.
24. **No storage adapter beyond S3/R2/local stubs** — no GCS/Azure Blob/Backblaze for real customers.
25. **No webhook replay UI** beyond what's in domain workbenches; no batch replay; no "replay all DLQ" admin action.
26. **No webhook delivery analytics** — success rate by endpoint, p50/p95 latency, error code breakdown.

### P2
27. **No OAuth refresh-token rotation worker** — tokens expire silently.
28. **No anomaly detection** on webhook traffic (DDOS-via-webhook, spam, abuse).
29. **No GDPR data-residency selection** for storage/email adapters (EU vs US bucket).
30. **No MFA factor diversity policy** (require ≥2 factors enrolled for admins).
31. **No webhook payload schema versioning** (`api_version` field exists in 0071 but no migration tooling).
32. **No connector pricing/billing meter** (per-call cost passthrough).
33. **No webhook signature verification "tester"** in Developer Portal.
34. **No Postman/OpenAPI export** for tenants.
35. **No mobile MFA / passkey** support.

### P3
36. **No cross-region webhook redundancy** (single-region delivery only).
37. **No webhook batch delivery** (one event per HTTP request).
38. **No GraphQL endpoint / SDK** beyond REST.

## Recommended Run 2 (Build) priorities
1. **Reconcile webhook schemas** → single migration `0087_webhooks_canonical.sql` consolidating to the 0052 shape; deprecate 0071.
2. **Build inbound webhook receiver** — `apps/api-nest/src/modules/webhook-receiver/` with per-provider signature verification (Stripe-Signature, X-Hub-Signature, X-Slack-Signature, X-Twilio-Signature, Calendly), `inbound_webhook_events` idempotency table.
3. **Build OAuth broker module** — `oauth-broker` NestJS module + `oauth_states` + `oauth_authorization_codes` tables; per-tenant per-provider OAuth flows with PKCE; encrypted refresh-token storage; refresh-token cron worker.
4. **Build MFA module** — `mfa_enrollments` + `mfa_backup_codes` + `mfa_challenges` tables; TOTP enrol (otpauth:// QR), WebAuthn passkey enrol, SMS factor via Twilio adapter; backup codes; recovery flow; require ≥1 factor for admin/enterprise tiers.
5. **Build Developer Portal** — `/developer/{api-keys,webhooks,inbound-webhooks,oauth-apps,sdk-downloads,api-reference,sandbox,rate-limits,logs,events-catalog}` route group; mount Scalar for interactive API reference; SDK download links; usage charts.
6. **Implement real connector code** — replace stubs in `apps/connectors/src/{hubspot,salesforce,notion,slack,greenhouse,lever,ashby}.ts` with actual API calls, cursor persistence, rate-limit handling, normalised error mapping. Add `connector_sync_runs` + `connector_field_mappings` + `connector_sync_conflicts` tables.
7. **Add OpenAPI spec generation** — `nestjs-swagger` decorators on every controller; export to `packages/sdk/openapi.json`; auto-generate `packages/sdk` via `openapi-typescript-codegen`; CI guard against drift; publish `@gigvora/sdk-js` + `@gigvora/sdk-python` to npm/PyPI.
8. **Add `byok_secrets` table** + KMS sealing helper + per-tenant per-category BYOK UI extending IntegrationsSettingsPage.
9. **Add `smtp_configs` table** + per-tenant SMTP UI; route outbound email through tenant SMTP when configured.
10. **Add `api_keys` + `api_key_usage_daily` + scopes** + per-key rate-limit middleware; key issue/rotate/revoke UI.
11. **Add `oauth_clients` table** + OAuth-app registration UI for tenants building integrations against Gigvora.
12. **Add connection health monitor worker** — token-expiry watchdog, consecutive-failure auto-disable, admin alert via D11 notifications.
13. **Implement adapters for real**: `resend.ts`, `ses.ts`, `mailgun.ts` (email); `twilio-sms.ts`, `vonage.ts` (SMS); `daily.ts`, `zoom.ts` (voice); `google-calendar.ts`, `ms-graph.ts` (calendar); `paddle.ts` (payments); `posthog.ts`, `segment.ts` (analytics); `gcs.ts`, `azure-blob.ts` (storage).
14. **Add webhook IP allowlist + mTLS option** + signing key rotation UI + delivery analytics page.
15. **Add `apps/ml-python/app/integrations.py`** — anomaly detection on delivery rate, auth-failure clustering, API-abuse detection.
16. **Expand Playwright** — full lifecycle: API-key issue→use→revoke; OAuth-broker connect→refresh→revoke; webhook subscribe→deliver→fail→retry→DLQ→replay; MFA TOTP enrol→challenge→backup-code; connector sync→conflict→resolve.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## G5 (D17–D20) close-out summary
G5 audit programme complete: 4 audits, ~14k LOC of frontend debt identified, ~120 gaps total across payments, ads/geo, enterprise/recruiter/CRM, and integrations/webhooks/BYOK/MFA/SDK. D20 is the most foundational — every other domain assumes a working webhook receiver, OAuth broker, MFA, BYOK vault, and Developer Portal that currently DO NOT EXIST. **G5 cannot ship without D20 Run 2 build first.**
