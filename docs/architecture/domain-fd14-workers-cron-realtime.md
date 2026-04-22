# Domain — FD-14 Workers, Cron, Realtime Broker (closed)

## Storage
Migration: `packages/db/migrations/0089_realtime_jobs.sql`
Tables: `job_runs`, `cron_jobs`, `realtime_counters`, `webhook_deliveries`, `analytics_rollups`.
All tables in user's Postgres (`DATABASE_URL`) — never Lovable Cloud.

## Queue infra (Nest side)
- `apps/api-nest/src/infra/queues/queues.constants.ts` — single source of queue names + default opts
- `apps/api-nest/src/infra/queues/queue-producer.service.ts` — `QueueProducerService.enqueue(queue, name, data, { idempotencyKey })`
- `apps/api-nest/src/infra/queues/realtime-broker.service.ts` — `RealtimeBrokerService.bump|set|emit|snapshot`
- `apps/api-nest/src/infra/queues/cron-registry.service.ts` — 6 declarative `@Cron` jobs that enqueue onto the matching queue
- `apps/api-nest/src/infra/queues/realtime-counters.controller.ts` — `GET /api/v1/realtime/counters` + `/queues`
- `QueuesModule` is `@Global()` — every other Nest module just injects `QueueProducerService` / `RealtimeBrokerService`.

## Worker (BullMQ consumer)
- `apps/workers/src/queues.ts` — mirrors queue names
- `apps/workers/src/handlers.ts` — real handlers (notifications fan-out, indexing, media, billing reconcile, webhooks delivery + retry sweep, analytics rollup, ml-batch bridge to ml-python)
- `apps/workers/src/job-audit.ts` — append-only `job_runs` insert per outcome
- `apps/workers/src/worker-realtime.ts` — DB counter delta + Redis pub/sub publish
- `apps/workers/src/index.ts` — bootstraps Worker + QueueEvents per queue, with concurrency env

## Realtime fan-out
Workers can't speak Socket.IO directly. They publish JSON onto Redis channel
`realtime:fanout`. `NotificationsGateway` subscribes to that channel and
re-emits to the matching room (`user:{id}` / `topic:org:{id}` / `topic:global`).

## Cron registry
| Name | Cron | Queue/Job |
|---|---|---|
| analytics.rollup.hourly | `0 * * * *` | analytics-rollup / rollup.hour |
| analytics.rollup.daily  | `5 0 * * *` | analytics-rollup / rollup.day |
| billing.reconcile.nightly | `15 2 * * *` | billing / reconcile |
| webhooks.retry.sweep    | `*/5 * * * *` | webhooks-out / retry.sweep |
| ml.batch.embeddings     | `*/15 * * * *` | ml-batch / embeddings.refresh |
| counters.recompute      | `*/2 * * * *` | analytics-rollup / counters.recompute |

## Frontend
- `src/hooks/useRealtimeCounters.ts` — `useRealtimeCounters(identityId)` + `useRealtimeCounter(key, identityId)` — REST snapshot + live `counter.update` events from the Socket.IO singleton (`src/lib/realtime/socket.ts`).
- All existing badge/inbox/queue-depth UI can swap fixture state for these hooks without changing layout.

## Security
- `/api/v1/realtime/*` is `@UseGuards(AuthGuard('jwt'))`.
- Worker → API trust runs over Redis pub/sub (private network). No worker accepts inbound HTTP.
- `job_runs` is append-only and bounded by `removeOnComplete` / `removeOnFail` job opts.
