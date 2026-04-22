# FD-10 — Webhook Gateway, External Event Reliability & Provider Failure Handling — Run 1 Audit

Date: 2026-04-18 · Group: G3 · Maps to **Master Sign-Off Matrix → G03 (backend coverage), G05 (security/middleware), G09 (Playwright), G10 (third-party integrations), G13 (release docs/runbooks)**.

> Scope: prove there is a real inbound + outbound webhook gateway with per-provider signature verification, replay defense, idempotency, retry with exponential backoff, dead-letter visibility, delivery logs, operator visibility, and customer-facing webhook subscriptions where the product needs them.

## 1. Inventory snapshot

### Inbound gateway — `apps/webhook-gateway/src/index.ts` (50 LOC, full file inspected)
- **Fastify** server with `@fastify/rate-limit` (600 req/min global) ✅.
- **HMAC-SHA256** verify helper with `timingSafeEqual` ✅ (good crypto choice).
- **Replay defense**: Redis `SETNX wh:seen:<provider>:<eventId>` with 24h TTL ✅.
- **Inbound queue** `webhooks-in` (BullMQ) with 8 attempts, exponential backoff 2s, removeOnComplete 1000 ✅.
- One generic verify path (`POST /in/:provider`) using a single header `x-webhook-signature` for **all** providers — fundamental design flaw (see P0 #1).
- Provider secret table only covers `stripe`, `github`, `generic` ✅ structurally but only 3 entries.

### Outbound — `apps/api-nest/src/modules/outbound-webhooks/`
- `outbound-webhooks.controller.ts` — **32 LOC** (thin).
- `outbound-webhooks.module.ts` — **5 LOC** (likely just module wrapper).
- `outbound-webhooks.publisher.ts` — **331 LOC** (substantial — likely contains delivery + retry + signing).

### Workers — `apps/workers/src/index.ts`
- 7 queues registered (`notifications, indexing, media, billing, webhooks-out, analytics-rollup, ml-batch`) ✅.
- **Handlers are placeholders** — every handler logs and returns a stub success object. The `webhooks-out` queue has no real delivery logic; if `outbound-webhooks.publisher.ts` enqueues here, the work is silently dropped.
- Retry/backoff registered per-queue (4 grep hits) ✅ but worker-level retry config not visible at this layer.

### Database
- `packages/db/migrations/0052_outbound_webhooks.sql`, `0071_webhooks.sql`, plus schema files `outbound-webhooks.ts`, `webhooks.ts` ✅ — tables exist (subscriptions + deliveries + events presumed).
- Cross-cuts FD-06: enums + FK backfill not yet applied (per FD-06 P0 #2/#3) so referential integrity unverified.

### Frontend
- `src/components/integrations/DomainWebhooksTab.tsx` ✅ (per-domain subscriptions UI).
- `src/hooks/useWebhooks.ts` ✅.
- **No DLQ visibility surface, no delivery log inspector, no per-provider health surface** under `/internal/webhooks` for operators.

### Tests
- `tests/unit/outbound-webhooks.spec.ts` — **only 1 spec** for the entire webhook surface. No Playwright spec under `tests/playwright/` for inbound gateway, no per-provider signature suite, no replay test, no DLQ retry-to-success test, no customer subscription happy path.

### Idempotency
- Solid foundation: `apps/api-nest/src/infra/idempotency.interceptor.ts` + `idempotency.service.ts` ✅ used across 12+ modules (booking, calendar, contracts-sow, donations, interview-planning, job-application, job-posting-studio, etc.). Inbound webhook events should plug into this same store keyed on `(provider, external_event_id)`.

## 2. Findings

### 🚨 P0 (release blockers)

1. **Single generic signature header (`x-webhook-signature`) does not match any real provider.** Stripe sends `Stripe-Signature: t=…,v1=…`, GitHub sends `X-Hub-Signature-256: sha256=…`, Slack sends `x-slack-signature` + `x-slack-request-timestamp`, Shopify sends `X-Shopify-Hmac-SHA256` (base64), Svix sends `svix-signature` + `svix-id` + `svix-timestamp`, Twilio sends `X-Twilio-Signature` (HMAC of URL+params). The current verify helper will **reject every real provider** in production.
2. **No `webhook_events` (inbound) row write.** Replay defense lives only in Redis (volatile); when Redis flushes, replays succeed. Need durable Postgres `webhook_events` table with unique `(provider, external_event_id)` insert before enqueue.
3. **`apps/workers/src/index.ts` `webhooks-out` handler is a stub** that returns `{ delivered: true }` without sending any HTTP request. Outbound webhooks are silently dropped despite `outbound-webhooks.publisher.ts` (331 LOC) likely doing the right thing on the producer side. Either consolidate delivery into a single owner, or delete the placeholder so it cannot be wired by mistake.
4. **No DLQ visibility / operator surface.** Grep finds `dead_letter` only in product-feed and dashboard files — there is no `/internal/webhooks/dlq` page, no admin terminal screen showing failed deliveries with replay action.
5. **Provider failure / circuit-breaker missing.** No detection that provider X is returning 5xx and no automatic backoff or per-provider pause. Cross-cuts FD-09 P1 #16.
6. **Inbound `JSON.stringify(req.body)` is wrong for HMAC verification.** All real providers HMAC over the **raw bytes** of the request body. Fastify's body-parser has already JSON-parsed the body, so re-stringifying produces a different byte sequence than the provider signed → false negatives even if the secret is correct. Need `rawBody` capture (Fastify `addContentTypeParser('application/json', { parseAs: 'buffer' }, …)`) for signature verification, then JSON-parse separately for handler logic.
7. **Customer-facing outbound webhook subscriptions UX exists** (`DomainWebhooksTab.tsx`) but **no Playwright e2e proof** of: create → receive event → signed delivery → retry on consumer 5xx → DLQ after N attempts → manual replay.
8. **Per-provider rate-limit + concurrency caps missing.** Global 600/min on the gateway protects Gigvora but not downstream consumers. Need a per-subscription delivery throttle so a single bad consumer cannot DOS the worker pool.
9. **No delivery log table/UI** showing `(subscription_id, event_id, attempt, http_status, latency_ms, response_body_truncated, signed_at)` per attempt.
10. **No HMAC secret rotation** flow for customer-facing subscriptions (publisher key + next-key dual-write window per FD-07 secret-rotation runbook).

### P1
11. Generic event-id header (`x-event-id`) won't match real providers' native event IDs (Stripe `evt_…`, GitHub `X-GitHub-Delivery`, Svix `svix-id`); per-provider extraction needed.
12. No timestamp-skew rejection (Slack/Svix require ±5min window).
13. No mTLS option for high-value enterprise endpoints.
14. No event-replay tool for operators (re-emit a stored event by id).
15. No payload size cap before HMAC verify (DoS amplification risk).
16. No structured `correlation-id` propagation from inbound event → BullMQ job → consumer log lines.
17. Mobile parity: no Flutter screens for customer to view their subscription health (per `mobile-screens-mandate`).
18. No per-event-type filtering on outbound subscriptions.

### P2
19. No webhook portal docs site for customers (event catalog, payload schemas, signature docs).
20. No SLO published for outbound delivery (e.g., p99 within 10s of producing event).
21. No anomaly detection on inbound (volume spikes per provider).

## 3. Run 2 build priorities (FD-10 only)

### A. Provider registry + correct signing
1. New `apps/webhook-gateway/src/providers/` directory with one file per provider implementing a `ProviderHandler` contract: `verifySignature(rawBody, headers, secret)`, `extractEventId(headers, body)`, `replayWindowMs`. Initial cohort: `stripe`, `github`, `slack`, `shopify`, `svix`, `twilio`, `sendgrid`, `linear`, `notion`, `hubspot`, `calendly`, `livekit`, `intercom`, `clerk` (≥14 providers, matches FD-09 connector catalog).
2. Capture **raw body** via Fastify `addContentTypeParser('application/json', { parseAs: 'buffer' }, …)`; pass the buffer to `verifySignature`; only then `JSON.parse` for queue payload.
3. Reject requests when `Math.abs(now - providerTimestamp) > replayWindowMs` for providers that publish a timestamp.
4. Cap request body at 1 MiB (configurable per provider) before HMAC verification.

### B. Durable inbound event store
5. Migration `0072_webhook_inbound_events.sql` — table `webhook_inbound_events(id, provider, external_event_id, raw_body_sha256, headers_jsonb, received_at, signature_verified, replay_check_passed)` with `UNIQUE (provider, external_event_id)`. Insert on receive — `ON CONFLICT DO NOTHING` returns "duplicate" without re-enqueueing.

### C. Real outbound delivery worker
6. Replace the stub `webhooks-out` handler in `apps/workers/src/index.ts` with a real delivery worker: HTTP POST with `gigvora-signature: t=<ts>,v1=<hmac>` header, configurable timeout (default 10s), exponential backoff `attempts: 8, backoff: { type: 'exponential', delay: 2000 }`, on final failure write to `webhook_delivery_dead_letter` table.

### D. Delivery log + DLQ tables
7. Migration `0073_webhook_delivery_logs.sql` with tables:
   - `webhook_delivery_attempts(id, subscription_id, event_id, attempt_number, request_signed_at, http_status, latency_ms, response_body_truncated_2k, error_message)`
   - `webhook_delivery_dead_letter(id, subscription_id, event_id, last_attempt_at, attempt_count, last_error, replayable_until)`
8. Indexes: `(subscription_id, request_signed_at desc)`, `(event_id)`.

### E. Operator surfaces
9. New routes (TanStack Start) and admin pages:
   - `/internal/webhooks/inbound` — per-provider live volume, signature failures, replay rejections, error rate, p50/p99 latency.
   - `/internal/webhooks/outbound` — per-subscription delivery state, success rate, lag.
   - `/internal/webhooks/dlq` — DLQ list with bulk + per-event replay action (re-enqueues).
10. Surface aggregated provider health on `/status` per `system-status-page` memory.

### F. Customer-facing surfaces
11. Per-org Webhook Settings page upgrade (`DomainWebhooksTab.tsx` already exists): show last 100 delivery attempts, "send test event" button, secret rotation flow (publish next-key, dual-sign for grace window, retire old key).
12. Public docs route `/docs/webhooks` (TanStack Start) with event catalog, signing docs, retry policy, IP allowlist.

### G. Circuit breaker
13. Per-subscription circuit breaker (open after N consecutive 5xx within W minutes, half-open with single probe, close after success). Persist state in Redis with Postgres mirror.

### H. Tests
14. Playwright `tests/playwright/webhooks/`:
    - `inbound-stripe-signature.spec.ts` (real fixture + invalid + replay)
    - `inbound-github-signature.spec.ts`
    - `inbound-slack-timestamp-skew.spec.ts`
    - `outbound-create-receive-retry-dlq.spec.ts`
    - `dlq-manual-replay.spec.ts`
    - `customer-secret-rotation.spec.ts`

### I. Mobile parity
15. Flutter screen `lib/features/integrations/webhook_subscriptions_screen.dart` — list subscriptions + recent delivery state + test-event button.

### J. Docs / runbooks
16. `docs/runbooks/webhook-incident.md` — provider outage playbook, replay procedure, secret rotation steps, DLQ purge policy.

## 4. Mapping to Master Sign-Off Matrix
- **Primary**: G03 (backend coverage), G05 (security/middleware — signature + replay + circuit breaker), G09 (Playwright), G10 (third-party integrations).
- **Secondary**: G07 (mobile), G11 (BYOK — webhook secrets are tenant-scoped), G13 (runbooks).

## 5. Domain checklist (Run 1 state)

| Validation Item | Tick | Evidence |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages, tabs, widgets mapped | ☐ | `DomainWebhooksTab.tsx` ✅; DLQ + delivery-log + operator surfaces missing |
| Backend files & APIs complete | ☐ | gateway 50 LOC, outbound controller 32 LOC, workers `webhooks-out` is stub |
| Supabase/demo data eliminated | ☑ | None in this domain |
| Database schema, seeders, fixtures | ☐ | `webhooks.ts` + `outbound-webhooks.ts` ✅; `webhook_inbound_events` + `webhook_delivery_attempts` + `webhook_delivery_dead_letter` missing |
| ML/analytics/workers integrated | ☐ | `webhooks-out` worker is placeholder |
| Indexing/search/filter | n/a | – |
| Realtime / live data | ☐ | No live operator stream |
| Security & middleware | ☐ | Generic header + JSON-restringify HMAC + 3 secrets only |
| Playwright coverage | ☐ | 1 unit spec; 0 Playwright specs |
| Mobile / API parity | ☐ | No Flutter webhook screen |
| Acceptance criteria | ☐ | Pending Run 2 + Run 4 |

## 6. Acceptance criteria (binding)
- A1. `apps/webhook-gateway/src/providers/` covers ≥14 providers with real signature schemes; fixtures + Playwright proof per provider.
- A2. Raw body captured for HMAC; `JSON.stringify(req.body)` removed; payload size cap enforced pre-verify.
- A3. `webhook_inbound_events` populated with `UNIQUE (provider, external_event_id)`; replays return 200 `{deduped:true}` without re-enqueue; Redis cache is an optimisation only.
- A4. `apps/workers/src/index.ts` `webhooks-out` performs real HTTP POST with `gigvora-signature` header; placeholder handler removed.
- A5. `webhook_delivery_attempts` + `webhook_delivery_dead_letter` populated per attempt; indexed for the operator UI.
- A6. `/internal/webhooks/{inbound,outbound,dlq}` pages live with per-provider/per-subscription metrics and replay action.
- A7. `DomainWebhooksTab.tsx` upgraded: last-100 attempts, test-event, secret rotation with dual-sign grace window.
- A8. Per-subscription circuit breaker enforced; state visible in admin UI.
- A9. Playwright suite ≥6 specs covering inbound signature/replay/skew + outbound retry/DLQ/replay + secret rotation.
- A10. `/status` surfaces per-provider inbound health; `/docs/webhooks` published with event catalog + signing docs.
- A11. Flutter `webhook_subscriptions_screen.dart` shipped.
- A12. `docs/runbooks/webhook-incident.md` covers provider outage, replay, rotation, DLQ purge.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate._
