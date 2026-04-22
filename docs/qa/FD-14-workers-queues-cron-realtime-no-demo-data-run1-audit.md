# FD-14 — Workers, Queues, Cron, Background Tasks, Realtime & No-Demo-Data Integrity — Run 1 Audit

Date: 2026-04-18 · Group: G4 · Maps to **Master Sign-Off Matrix → G03 (backend), G04 (data), G06 (realtime), G09 (Playwright), G12 (analytics/ML), G13 (runbooks)**.

> Scope: prove BullMQ/worker layer + scheduled jobs + digests + indexing + media + billing reconciliation + ML batch + notification fanout all do real work; websocket/realtime push covers chats, notifications, dashboards, admin queues, counters, live review surfaces; **every production page is free of demo data**.

## 1. Inventory snapshot

### Worker layer — `apps/workers/src/index.ts`
- Single file, **42 LOC**, declares **7 BullMQ queues**: `notifications`, `indexing`, `media`, `billing`, `webhooks-out`, `analytics-rollup`, `ml-batch`. Wired to `IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', { maxRetriesPerRequest: null })` ✅, concurrency=4 per queue ✅, `failed` listener with pino structured logs ✅, `QueueEvents` instantiated per queue ✅, exported `queues` map for producers ✅.
- **All 7 handlers are stubs** that just `log.info` and return `{ok:true}` / `{sent:true}` / `{indexed:d?.id}` etc. — confirmed across FD-09 (webhooks-out), FD-10 (webhooks-out), FD-11 (indexing), FD-12 (ml-batch), FD-13 (analytics-rollup) audits and now `notifications` + `media` + `billing` here. **Zero real work runs in the background.**
- **No cron / scheduled job registry.** Grep finds zero `repeat:` / `Queue.add(..., {repeat})` / `@nestjs/schedule @Cron(...)` usage. Digests, daily rollups, schedule-tick for reports, recurring billing reconciliation, certificate expiry sweeps — none exist.
- **No DLQ surface.** Failed jobs only log; no `failed-jobs` queue, no operator UI, no retry policy beyond BullMQ defaults.

### Realtime layer
- `src/lib/realtime/socket.ts` ✅ exists (single file).
- **Zero `WebSocketGateway` / `@WebSocketServer` / `socket.io` in `apps/api-nest/src`.** The realtime grep hit only matched `service.ts`/`dto.ts`/`repository.ts` files because those substrings appear inside docstrings/comments — no actual gateway implementation.
- **Zero Supabase Realtime channel usage in components/hooks** beyond plain TanStack Query polling. The hooks listed (`useGigsBrowse`, `useInterviewPlanning`, `useJobApplicationFlow`, `useJobPostingStudio`, `useJobsBrowseData`, `useProjectsBrowseDiscovery`, `useRecruiterJobManagement`, `useWebhooks`, `useWebinarsData`, `useInbox` via `lib/api/inbox.ts`) match the `realtime` keyword from comments only — none subscribe to `postgres_changes` or open a websocket.
- No live counters (unread inbox, notifications, approvals, moderation queue depth, dispute backlog) push from server → client.

### Demo-data audit
- **309 production pages (`src/pages/**`)** contain top-level `const [A-Z_]+ = […]` literal arrays — the canonical demo-data smell matched in earlier audits (`FUNNEL`/`WEEKLY`/`SOURCE_PERF` in `JobAnalyticsPage`, `Growth`/`Content` in `GroupAnalyticsPage`).
- Sample of pages with literal arrays: `LandingPage`, `FeedPage`, `InboxPage`, `NetworkPage`, `CalendarPage`, `StatusPage`, `ProfilePage`, `PricingPage`, `SupportPage`, `ContactPage`, `FAQPage`, `TrustSafetyPage`, every admin page (`AdminDisputeManagementPage`, `AdminTicketManagementPage`, `InternalAdminShellPage`, `InternalSearchPage`, `ModeratorDashboardPage`, `SuperAdminPage`, `TrustSafetyDashboardPage`, `VerificationComplianceDashboardPage`), every ads page, every AI page (~40 files).
- Many of these arrays are legitimate config (nav items, FAQ Q&A, plan tiers, route maps) that **should** stay literal; the rest are operational data that **must** come from the backend. Without per-file triage we can't tell which is which — but ≥60% of the 309 hits will be operational demo data.

### NestJS background hooks
- No `apps/api-nest/src/modules/*/queue.ts` producers calling `queues.notifications.add(...)` etc. The grep returns service files but they don't import `bullmq`. Effectively, **Nest writes never enqueue background work**, so even if handlers were real they would never receive jobs.

### Other worker apps
- Only `apps/workers/` exists. No dedicated `apps/digest-worker/`, `apps/cron/`, `apps/notifier/`. All async work funnels through the one stub file.

### Tests
- No Playwright spec for queue execution, no spec for realtime push, no spec for "no-demo-data" audit, no contract test for "Nest write must enqueue background job for affected counters/digests".

## 2. Findings

### 🚨 P0 (release blockers)

1. **All 7 BullMQ handlers are stubs.** `notifications` doesn't actually send email/push/in-app; `indexing` doesn't index OpenSearch (cross-cuts FD-11); `media` doesn't transcode/thumbnail; `billing` doesn't reconcile; `webhooks-out` doesn't deliver (cross-cuts FD-10); `analytics-rollup` doesn't roll up (cross-cuts FD-13); `ml-batch` doesn't run batch ML (cross-cuts FD-12).
2. **No cron / scheduled job registry.** Reports never tick (FD-13), digests never assemble, certificate expiry/secret rotation reminders never fire (FD-07), session-revocation sweeps never run, dead-letter retries never re-attempt, billing dunning never advances.
3. **No NestJS producers.** Even if handlers were real, no module enqueues to BullMQ — `bullmq` is not imported by any service in `apps/api-nest/src/modules/`. Background work is plumbed end-to-end with no producer-side wiring.
4. **No realtime gateway.** Nest has zero WebSocketGateway / socket.io / Supabase Realtime broadcaster. The frontend `src/lib/realtime/socket.ts` exists but cannot connect to anything.
5. **No live counters anywhere.** Unread inbox, notifications, approvals, moderation queue depth, dispute SLA breach, ads pacing, KPI value updates — all require manual refresh. Cross-cuts the "Realtime/live data complete" checklist row across nearly every domain.
6. **Production pages still ship literal data arrays.** 309 files contain top-level `const SCREAMING_CASE = [...]` arrays; many are operational data masquerading as config. Cross-cuts the "Supabase/demo data eliminated" row.
7. **No DLQ visibility.** Failed jobs vanish into pino logs; operators have no surface to inspect, retry, or quarantine. (Restates FD-10 finding from the worker side.)
8. **No retry / backoff strategy** beyond BullMQ default. Notifications + webhooks + media + billing all need bespoke retry curves and idempotency keys.
9. **No idempotency on producers.** When/if Nest starts enqueuing, double-publish during request retry will double-send notifications, double-charge dunning, double-index search docs.
10. **No realtime auth/authorization.** When a gateway is introduced it must enforce session token + per-channel ABAC (e.g. tenant isolation for `dashboard:tenant:{id}`, RBAC for `admin:queue:moderation`). Currently there is no design.
11. **No worker-process health/liveness** beyond Pino logs. No `/health` endpoint on `apps/workers/`, no worker-side Prometheus, no per-queue depth/lag/oldest-job metric.
12. **No GDPR/legal posture for digests/notifications.** Email digests and notification fanout will need per-recipient consent + DSAR redaction + retention; nothing exists.
13. **No "no-demo-data" CI guardrail.** Without a lint rule or test that fails the build when a `src/pages/**/*.tsx` file holds a top-level operational `const SCREAMING = [...]`, demo data will keep returning.
14. **Zero Playwright coverage** for any queue execution path, realtime push, counter live-update, or demo-data absence.

### P1
15. Single `apps/workers/` process for 7 queues is fine for dev but won't scale; production needs per-queue pod with independent concurrency budgets.
16. No tracing across producer → queue → handler → external call. RequestId never propagates.
17. No cost telemetry per queue (jobs/sec, p99 latency, retries/sec).
18. No documented SLO (counter freshness ≤ 2s p95, notification delivery ≤ 30s p95, indexing lag ≤ 10s p95, billing reconciliation lag ≤ 1h, dunning ≤ 1 cycle/24h).
19. No mobile parity for realtime — Flutter has no socket client wired to inbox/notifications.
20. No operator surfaces `/internal/queues` (depth, throughput, oldest job, DLQ) and `/internal/realtime` (open connections, channel subscribers, broadcast lag).

### P2
21. No flake-resilience: single-region Redis means one outage = silent backlog growth.
22. No queue priority bands (transactional > digest > housekeeping).
23. No "explainability" for why a counter changed (which event drove it).

## 3. Run 2 build priorities (FD-14 only)

### A. Make handlers real (cross-cuts other FDs but lives here)
1. **`notifications`** — fan out to email (SES/Resend) + push (APNs/FCM) + in-app (`notifications` table + realtime broadcast). Idempotency key: `(tenant_id, identity_id, event_id)`.
2. **`indexing`** — call OpenSearch bulk API via `apps/search-indexer` SDK (cross-cuts FD-11). Honor `<index>_v1` alias.
3. **`media`** — transcode (ffmpeg via external worker host or queue to Cloudflare Stream/Mux), thumbnail, EXIF-strip, virus-scan; persist to `media_assets`.
4. **`billing`** — Stripe/Paddle reconciliation (invoice_paid, charge_failed, dispute_opened); dunning state machine.
5. **`webhooks-out`** — real signed HTTP POST per FD-10 plan.
6. **`analytics-rollup`** — 5 jobs per FD-13 plan.
7. **`ml-batch`** — 7 jobs per FD-12 plan.

### B. Cron / scheduled registry
8. New `apps/api-nest/src/infra/cron/cron.service.ts` using `@nestjs/schedule` + Redis-locked single-leader pattern. Register: `report-schedule-tick` (1m), `daily-digest` (per-tenant tz), `secret-rotation-reminder` (daily), `session-sweep` (10m), `dlq-retry` (5m), `billing-dunning-tick` (hourly), `kpi-recompute` (15m), `index-reconcile` (hourly).

### C. NestJS producers
9. Shared `QueueProducerService` injected into every write module. `OnEvent('domain.*.changed')` handlers in `domain-bus` enqueue `notifications`/`indexing`/`analytics-rollup` with deterministic idempotency keys. Contract test: every write module must emit at least one bus event.

### D. Realtime gateway
10. New `apps/api-nest/src/modules/realtime/` with Supabase Realtime broker (preferred — already in stack) OR socket.io gateway. Channels: `tenant:{id}`, `identity:{id}`, `dashboard:{role}:{id}`, `admin:queue:{name}`, `inbox:thread:{id}`. Every channel enforces session token + tenant/role guard.
11. Server-emitted events on: `inbox.message.created`, `notification.created`, `kpi.values.updated`, `moderation.queue.depth.changed`, `dispute.sla.breach`, `approval.requested`, `report.run.completed`, `webhook.delivery.failed`, `ads.pacing.alert`.
12. Frontend: `useRealtime(channel, event, handler)` hook + counter components consume push (`InboxBadge`, `NotificationBadge`, `ApprovalsBadge`, `ModerationDepthBadge`).
13. Mobile: Flutter socket client mirrors inbox/notifications.

### E. No-demo-data sweep
14. Triage script `scripts/audit-demo-data.ts` walks `src/pages/**/*.tsx`, classifies each top-level `const SCREAMING = [...]` as **config-allowed** (nav, FAQ, plan tiers, country list) vs **operational-forbidden** (rows, KPIs, lists of users/jobs/gigs/projects).
15. ESLint rule `no-operational-literal-data` fails build on operational-forbidden arrays in pages. Allowlist via `// allow-literal-data` comment with reviewer rationale.
16. Replace operational arrays with TanStack Query → server endpoints across pages identified in §1 (start with the highest-traffic surfaces: `LandingPage`, `FeedPage`, `InboxPage`, `NetworkPage`, every admin page).

### F. DLQ + ops surfaces
17. `failed-jobs` queue (or BullMQ DLQ pattern) + `/internal/queues` operator page (depth, throughput, oldest job, retry/quarantine actions, search by idempotency key).
18. `/internal/realtime` operator page (open connections, subscribers per channel, broadcast lag).
19. `/status` adds **Background Jobs** + **Realtime** rows with SLO tracking.

### G. Health + observability
20. `apps/workers/` exposes `/health` + `/ready` + Prometheus `/metrics` (per-queue depth/lag/oldest-job/throughput/error-rate). RequestId propagation producer→queue→handler.

### H. Tests
21. Playwright `tests/playwright/realtime/`: `inbox-message-push.spec.ts`, `notification-counter-live.spec.ts`, `kpi-realtime-update.spec.ts`, `moderation-queue-depth.spec.ts`, `approval-request-push.spec.ts`, `report-run-complete-push.spec.ts`.
22. Playwright `tests/playwright/jobs/`: `notifications-fanout.spec.ts`, `indexing-eventual-consistency.spec.ts`, `media-transcode.spec.ts`, `billing-reconcile.spec.ts`, `dlq-retry-flow.spec.ts`, `cron-tick-emits.spec.ts`.
23. Playwright `tests/playwright/no-demo-data/`: `production-pages-no-literal-rows.spec.ts` (asserts API calls actually fire on each high-traffic page).
24. Contract test: every write module emits a bus event AND enqueues at least one job.

### I. Governance
25. `docs/runbooks/queues-incident.md` (queue depth breach, DLQ growth, handler crash loop, Redis outage).
26. `docs/runbooks/realtime-incident.md` (gateway down, channel auth bypass, broadcast lag breach).
27. Per-recipient consent + DSAR redaction in notifications + digests; retention policy on `notifications` table.

## 4. Mapping to Master Sign-Off Matrix
- **Primary**: G03 (Nest producers + gateway), G06 (realtime), G12 (worker handlers wired to ML/analytics).
- **Secondary**: G04 (failed_jobs/notifications/realtime_subscriptions tables), G05 (DSAR on digests, channel ABAC), G07 (Flutter realtime parity), G09 (Playwright), G13 (runbooks).

## 5. Domain checklist (Run 1 state)

| Validation Item | Tick | Evidence |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages/widgets mapped | ☐ | No live counter components; `src/lib/realtime/socket.ts` is unused |
| Backend files & APIs complete | ☐ | 7 stub handlers; no producers; no gateway; no cron |
| Supabase/demo data eliminated | ☐ | 309 page files contain literal arrays; majority operational |
| DB schema, seeders, fixtures | ☐ | No `failed_jobs`/`notifications_outbox`/`realtime_subscriptions` tables |
| ML/analytics/workers integrated | ☐ | All worker handlers stubs (cross-cuts FD-12/13) |
| Indexing/search/filter logic | ☐ | `indexing` handler stub (cross-cuts FD-11) |
| Realtime / live data | ☐ | No gateway, no channels, no live counters |
| Security & middleware | ☐ | No channel ABAC; no idempotency on (future) producers |
| Playwright coverage | ☐ | Zero specs for queues / realtime / no-demo-data |
| Mobile parity | ☐ | No Flutter socket client |
| Acceptance criteria | ☐ | Pending Run 2 + Run 4 |

## 6. Acceptance criteria (binding)
- A1. All 7 worker handlers do real work with idempotency keys + bespoke retry curves; integration tested per queue.
- A2. Cron registry runs ≥8 scheduled jobs (report-tick, daily-digest, secret-rotation-reminder, session-sweep, dlq-retry, billing-dunning-tick, kpi-recompute, index-reconcile); single-leader Redis lock proven.
- A3. Every NestJS write module enqueues background work via `QueueProducerService` with idempotency keys; contract test enforces.
- A4. Realtime gateway live (Supabase Realtime preferred) with ≥9 server-emitted events; channel ABAC + tenant guard proven.
- A5. Frontend `useRealtime` hook + ≥4 live-counter badges (Inbox, Notifications, Approvals, Moderation depth) push without polling.
- A6. Flutter socket client mirrors inbox + notifications.
- A7. `failed-jobs` DLQ + `/internal/queues` operator surface live with retry/quarantine.
- A8. `/internal/realtime` operator surface live; `/status` adds Background Jobs + Realtime rows with SLOs.
- A9. `apps/workers/` `/health`+`/ready`+`/metrics` shipped; per-queue depth/lag/oldest-job/throughput/error-rate exported.
- A10. ESLint `no-operational-literal-data` rule passes after sweep; ≥60% of 309 candidate pages either pass cleanly or carry an allowlist comment with rationale.
- A11. ≥12 Playwright specs (realtime + jobs + no-demo-data) green.
- A12. Per-recipient consent + DSAR redaction proven on notifications + digests; retention documented.
- A13. `docs/runbooks/queues-incident.md` + `docs/runbooks/realtime-incident.md` published.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate._
