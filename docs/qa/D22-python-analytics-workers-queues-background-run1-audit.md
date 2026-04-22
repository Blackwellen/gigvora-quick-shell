# D22 — Python Analytics, Workers, Queues, and Background Processing — Run 1 Audit

Date: 2026-04-18 · Group: G6 (D22/4) · Status: Run 1 (Audit) complete.

## Inventory

### `apps/workers` (Node BullMQ worker host)
- ✅ Single file `apps/workers/src/index.ts` — **40 LOC total**. Defines 7 queues (`notifications`, `indexing`, `media`, `billing`, `webhooks-out`, `analytics-rollup`, `ml-batch`) wired to BullMQ + IORedis with concurrency 4 and a `failed` event log.
- ❌ **Every handler is a `log.info(...)` stub** — no real notification dispatch, no real billing reconciliation, no real analytics rollup, no real ML batch trigger. Zero business logic.
- ❌ No retry/backoff config (BullMQ defaults), no DLQ, no idempotency key, no per-job-type dedicated worker file (everything in `index.ts`), no graceful shutdown, no health endpoint, no metrics export.

### `apps/media-pipeline`
- ✅ Real S3 presign for upload/download (`signUpload`/`signDownload` 15-min TTL).
- ✅ BullMQ `media` worker reads job `{kind, key}`, calls `HeadObjectCommand` to verify asset exists.
- ❌ **No actual transcoding** — comment admits "actual transcoding (ffmpeg/sharp) is delegated to an external worker host" which doesn't exist. Reels/podcasts/webinars/interviews/videos cannot be processed.
- ❌ No thumbnail generation, no waveform extraction, no duration probe, no virus scan, no DRM, no CDN warmup, no per-asset state machine in DB.

### `apps/search-indexer`
- ✅ Defines 10 OpenSearch indexes (`users/jobs/projects/gigs/services/companies/startups/media/groups/events`).
- ✅ BullMQ `indexing` worker handles `{index, doc, op}` for upsert/delete with `refresh: 'wait_for'`.
- ❌ **Toy mappings only** (`id/title/body/tags/createdAt`) — no per-index field discipline (skills/seniority/geo_point per D19 audit), no analyzers, no synonyms, no k-NN/vector fields.
- ❌ No bulk-indexer batch path (one HTTP call per doc), no reconciliation worker (DB → index drift detector), no full reindex command, no zero-downtime alias swap.

### `apps/webhook-gateway`
- ✅ Fastify with `@fastify/rate-limit` (600/min), HMAC verification per provider (stripe/github/generic), Redis SETNX replay-prevention (24h TTL), `webhooks-in` BullMQ producer.
- ✅ Worker config `attempts: 8, backoff: exponential delay 2000, removeOnComplete: 1000`.
- ❌ Only 3 providers (stripe/github/generic) — D20 listed Slack/HubSpot/Calendly/Twilio as needed. No DLQ table, no admin replay UI, no per-provider routing to domain bus.

### `apps/api-nest` producers (who enqueues?)
- ✅ Only **~10 services** import BullMQ Queue: `gigs-browse`, `job-application-flow`, `job-posting-studio`, `podcasts`, plus a few via DTO references. Out of 50+ NestJS modules, only ~20% use the queue at all.
- ❌ **No `BullModule` registration in `app.module.ts`** — services hand-import `Queue` from `bullmq` and instantiate ad-hoc instead of using `@nestjs/bullmq` `@InjectQueue('name')` pattern. Every queue producer is reinventing the connection.
- ❌ **Zero `@Cron(...)` / `@Interval(...)` / `@Scheduled` decorators** anywhere — no scheduled NestJS jobs at all. No `@nestjs/schedule` registration.

### Python ML service background jobs
- ✅ 53 FastAPI routers (audited in D21) — request/response only, no background work.
- ❌ **No `@app.on_event("startup")` / `@app.on_event("shutdown")` hooks**, no `BackgroundTasks` usage, no APScheduler, no Celery, no RQ, no asyncio scheduled tasks.
- ❌ **No dedicated batch-jobs module** — no nightly aggregation, no embedding refresh, no model training trigger, no feature-store ETL, no historical replay, no reconciliation between Postgres and ml-python's in-memory state.
- ❌ No Python worker entrypoint (no `if __name__ == "__main__":` worker loop). All "batch" expectations from D17/D18/D19/D21 (payouts_fraud daily, ads_pacing hourly, talent_match nightly, embeddings refresh) have nowhere to run.

### Database — analytics / queue / job tables
- ✅ `0062_ads_analytics_performance.sql`, `0068_analytics_v2.sql` — analytics rollup tables exist (per D18 audit, but minimal).
- ❌ Missing tables: `worker_jobs` (audit log of every BullMQ job), `worker_dead_letters` (DLQ persistence beyond Redis ephemeral), `cron_schedules` (declared schedules + last_run_at/next_run_at), `cron_runs` (execution audit trail), `analytics_aggregations` (named rollup state with `as_of`), `daily_metric_snapshots` (per-tenant per-day KPI snapshot), `nightly_reports` (generated artefact registry), `enrichment_jobs` (per-entity enrichment state machine), `reconciliation_runs` (which provider × date × diff), `materialized_view_refresh_log`, `data_quality_checks` (per-table pass/fail history), `worker_heartbeats` (liveness per worker pod).
- ❌ **No `pg_cron` migrations at all** — even though the project knowledge file documents pg_cron as the recommended scheduler.
- ❌ No materialized views for heavy aggregations (every dashboard query recomputes from raw tables).
- ❌ No `pg_partman` partitioning on high-volume tables (events/impressions/audit/notifications) → unbounded growth.

### Frontend admin observability for queues/jobs
- ✅ `AdminOpsPage.tsx`, `SuperAdminPage.tsx`, `InternalAuditPage.tsx`, `TrustSafetyDashboardPage.tsx` exist.
- ❌ **No queue health page** (per-queue depth / waiting / active / completed / failed / delayed counters).
- ❌ **No worker fleet page** (running workers, heartbeat, last job processed, p50/p95 latency, error rate per queue).
- ❌ **No DLQ replay UI** (browse failed jobs, inspect payload + error, retry one or batch).
- ❌ **No cron schedules page** (declared schedules, last/next run, success rate, manual trigger).
- ❌ **No analytics rollup status page** (which aggregations are fresh, which are stale, force-refresh).
- ❌ **No reconciliation runs page** (provider × date × diff count + drill-down).
- ❌ **No data-quality dashboard** (per-table pass/fail trend).
- ❌ Pages named `*Queue*` (`PodcastQueuePage`, `ProWorkQueuePage`, `RecruiterPipelinePage`, `ScheduledContentPage`) are domain workflow queues, NOT operational worker queues.

### SDK
- ❌ No `workers.ts` / `queues.ts` / `cron.ts` / `analytics-rollups.ts` / `reconciliation.ts` / `data-quality.ts` SDK modules — admin pages cannot be built without them.

### Mobile
- N/A — workers/queues are server-side, but mobile should at least surface user-facing job states (e.g. "your video is processing"). Currently no mobile job-state widgets.

### Inngest connector availability (relevant)
- ✅ Inngest connector is documented in this session. Could replace the entire BullMQ + Redis + cron stack with durable functions + automatic retries + observable runs UI — without managing infrastructure. Worth flagging as a Run 2 build-direction decision.

## Gaps (34 total — 11 P0 / 13 P1 / 7 P2 / 3 P3)

### P0
1. **All BullMQ workers are stubs** — `apps/workers/src/index.ts` is 40 LOC of `log.info` no-ops. Notifications, billing reconciliation, analytics rollups, ML batch all silently succeed without doing anything.
2. **Media pipeline does no actual processing** — no ffmpeg/sharp transcoding, no thumbnails, no waveforms. Reels (D14)/podcasts (D15)/webinars (D16)/videos all assume processed assets that never get processed.
3. **No `@nestjs/schedule` and no pg_cron** — zero scheduled jobs platform-wide. No nightly aggregations, no hourly pacing, no token-refresh cron, no expiry sweeps, no daily reports.
4. **No Python worker host** — D17–D21 ML batch jobs (`payouts_fraud`, `ads_pacing`, `donations_recommend`, embeddings refresh, talent_match nightly, recommendation_impressions ETL) have nowhere to execute.
5. **No durable job audit (`worker_jobs`/`worker_dead_letters`)** — DLQ exists only in Redis (ephemeral); cannot replay failed jobs after restart; no admin visibility.
6. **No queue health / worker fleet / DLQ replay UI** — operators cannot see what's running, what's stuck, what failed, or retry it.
7. **No cron schedules registry** — even if cron jobs are added, no `cron_schedules` + `cron_runs` table to declare/audit them; no admin page to manage.
8. **No reconciliation framework** — financial reconciliation (Stripe vs ledger), search reconciliation (DB vs OpenSearch), CRM reconciliation (HubSpot vs CRM mirror), webhook delivery reconciliation all unimplemented.
9. **No materialized views / partitioning** — dashboards recompute heavy aggregations on every load; high-volume tables (events/impressions/audit) grow unbounded with no partitioning.
10. **No data quality framework** — no row-count drift checks, no orphaned-FK sweeps, no null-rate monitoring; data corruption surfaces only via user complaints.
11. **No worker heartbeats / liveness** — silent worker death is invisible (especially in BullMQ where queue keeps growing while worker is offline).

### P1
12. **No `BullModule` registration** in NestJS — every producer hand-instantiates `new Queue()`, no DI, no shared connection pool.
13. **Search-indexer has no reconciliation worker** — DB ↔ OpenSearch drift unchecked; no full-reindex command; no alias-swap zero-downtime reindex.
14. **No bulk indexer path** — one HTTP call per doc kills throughput.
15. **No webhook DLQ table + replay UI** — `webhook-gateway` retries 8× then drops; no admin recovery path.
16. **No nightly report generation pipeline** — D11 notifications/D17 finance/D18 ads should ship daily/weekly digest emails; no worker exists.
17. **No analytics rollup state table** — `analytics-rollup` queue exists but no `analytics_aggregations` to track which named rollup (`feed_engagement_daily`, `gig_revenue_weekly`) was last refreshed.
18. **No SDK modules** for workers/queues/cron/reconciliation/data-quality → admin pages can't be built.
19. **No graceful shutdown** in workers — SIGTERM kills in-flight jobs without draining.
20. **No Prometheus/OpenTelemetry export** from workers (only pino logs).
21. **No per-tenant queue isolation / priority** — noisy-neighbor risk.
22. **No backpressure monitoring** — queue depth alerts absent.
23. **No `apps/workers` Dockerfile** — deployment story unclear.
24. **No enrichment job pipeline** — companies/profiles/jobs miss third-party enrichment (Clearbit, LinkedIn, GitHub) sweeps.

### P2
25. **No replay tooling** — replay yesterday's events through new ranker; replay failed webhooks; replay analytics from a date.
26. **No per-job idempotency keys** — duplicate enqueue → duplicate side effects.
27. **No job-type-specific concurrency** — every queue is concurrency 4 regardless of weight.
28. **No `pg_partman` partitioning** for unbounded tables (events/impressions/audit/notifications).
29. **No backup-restore drill** for Redis (queue state lost on Redis loss).
30. **No SLO/SLA tracking** per queue (p95 wait time, p95 process time).
31. **No cost attribution** per worker/queue (which queue is most expensive).

### P3
32. **No Temporal/Inngest evaluation** — durable execution might be a better fit than raw BullMQ for long-running workflows (KYC, payouts, recruiting funnels).
33. **No multi-region worker deployment**.
34. **No autoscaling on queue depth**.

## Recommended Run 2 (Build) priorities

### Decision point first
**A.** Stay on BullMQ + Redis and build all the missing scaffolding ourselves (workers/cron/DLQ/replay/admin UI) — high effort, high control.
**B.** Add the **Inngest connector** for new domains (durable functions, automatic retries, built-in observability) and progressively migrate; keep BullMQ for high-throughput indexing only — recommended as it removes ~half of the "build admin UI for queues" work.
**C.** Hybrid: pg_cron for scheduling + BullMQ for async fan-out + Inngest for durable workflows (payouts, KYC, recruiting funnels, multi-step ML pipelines).

### Builds (regardless of A/B/C)
1. **Replace stubs in `apps/workers/src/index.ts`** with real handlers per queue, split into `apps/workers/src/queues/{notifications,billing,analytics,ml-batch}.ts`, add graceful shutdown, heartbeat, Prometheus metrics, per-job idempotency keys, attempts+backoff config, DLQ persistence to `worker_dead_letters` table.
2. **Build `apps/python-worker/`** — RQ or APScheduler-based Python worker that runs nightly/hourly batches: `payouts_fraud`, `ads_pacing`, `ads_attribution`, `donations_recommend`, `embeddings_refresh`, `talent_match_score`, `recommendation_impressions_etl`, `feature_store_recompute`. Shares `apps/ml-python/app/` modules.
3. **Add `@nestjs/schedule` + pg_cron migration `0089_scheduling_fabric.sql`** with `cron_schedules` + `cron_runs` + `worker_jobs` + `worker_dead_letters` + `worker_heartbeats` + `analytics_aggregations` + `daily_metric_snapshots` + `enrichment_jobs` + `reconciliation_runs` + `materialized_view_refresh_log` + `data_quality_checks` tables.
4. **Build `BullModule` registration** in `app.module.ts` + migrate every ad-hoc `new Queue()` to `@InjectQueue('name')`.
5. **Build admin observability pages**: `/admin/queues` (per-queue depth/waiting/active/completed/failed/delayed + worker fleet + p50/p95 latency), `/admin/queues/:queue/dlq` (browse + replay), `/admin/cron` (declared schedules, last/next run, success rate, manual trigger), `/admin/reconciliation` (provider × date × diff with drill-down + force-rerun), `/admin/data-quality` (per-table pass/fail trend), `/admin/analytics-rollups` (which rollups are fresh/stale + force-refresh), `/admin/nightly-reports` (generated artefacts).
6. **Build SDK modules**: `workers.ts`, `queues.ts`, `cron.ts`, `analytics-rollups.ts`, `reconciliation.ts`, `data-quality.ts`, `dlq.ts`.
7. **Build reconciliation workers**: `stripe-vs-ledger` (D17), `db-vs-opensearch` (D23 dependency), `hubspot-vs-crm-mirror` (D19), `webhook-deliveries-vs-source` (D20).
8. **Build search-indexer reconciliation worker** + bulk-indexer batch path + full-reindex command + alias-swap zero-downtime reindex.
9. **Build media-pipeline real transcoding** — either external worker host with ffmpeg, or Cloudflare Stream / Mux integration; persist per-asset state machine in DB.
10. **Add `pg_partman`** partitioning to high-volume tables (`events`, `recommendation_impressions`, `audit_log`, `notifications`, `webhook_deliveries`).
11. **Add materialized views** for top dashboard aggregations (feed engagement, gig revenue, recruiter funnel, ads spend).
12. **Add Prometheus/OpenTelemetry export** from all workers + per-queue p95 SLO + alert on backpressure.
13. **Add data-quality framework** (`great_expectations`-lite or hand-rolled): row-count drift, null-rate, orphaned FK, duplicate detection per table, daily report.
14. **Add Playwright**: enqueue job → check `worker_jobs` row → simulate failure → check `worker_dead_letters` row → admin replay → success → cron schedule trigger → `cron_runs` row → reconciliation diff appears in admin UI.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.
