# Domain — FD-13 Custom KPIs, Reporting, Analytics Rollups (closed)

## Storage
Migration: `packages/db/migrations/0090_kpi_registry_and_reporting.sql`
- `kpi_definitions` — the four FD-13 binding fields:
  `title`, `target_type`, `value_mode`, `unset_state` (plus `metric_key`,
  `source`, `format`, `unit`, `decimals`, `target_value`, `filters`,
  `schedule_cron`, `status`).
- `kpi_assignments` — which admin portal renders which KPI, with position.
- `kpi_snapshots` — time-series per KPI (`bucket` × `bucket_at` unique).
- `kpi_audit` — append-only audit (trigger blocks UPDATE/DELETE).
- Reporting tables (`report_definitions`, `report_schedules`, `report_runs`,
  `report_subscriptions`) come from migration `0069_reporting.sql`.

## Backend modules
- `apps/api-nest/src/modules/kpi-registry/`
  - `kpi-registry.controller.ts` — CRUD, assign/unassign, portal cards,
    series, evaluate, evaluate-all. JWT-guarded.
  - `kpi-evaluator.service.ts` — runtime that materialises target_type/
    value_mode/unset_state into a single number, with rolling avg + target
    progress + last-known fallback per `unset_state`.
  - `kpi-registry.repository.ts` — pure SQL repo, no ORM coupling.
- `apps/api-nest/src/modules/reporting/`
  - `reporting.controller.ts` — list/create/delete reports, run JSON,
    download CSV, list runs, list/create schedules.
  - `reporting.service.ts` — pivots `analytics_rollups` by metric × bucket
    and persists a `report_runs` row.
- Both modules registered in `app.module.ts`.

## Worker
`apps/workers/src/handlers.ts::analyticsRollup` — replaced the stub with
real logic:
1. Aggregates `analytics_events` → `analytics_rollups` per bucket
   (hour/day/week/month) via `date_trunc`.
2. Computes derived KPIs (e.g. `jobs.apply_rate` = applications / views).
3. Evaluates every live KPI definition and writes a `kpi_snapshots` row
   honouring `value_mode` and `unset_state`.
4. Emits `analytics.rollup.tick` over the realtime broker.

Cron entries already declared in FD-14:
- `analytics.rollup.hourly` (`0 * * * *`)
- `analytics.rollup.daily`  (`5 0 * * *`)
- `counters.recompute`      (`*/2 * * * *`)

## Frontend
- `src/hooks/useKpiRegistry.ts` — `useKpis`, `useKpiPortalCards`,
  `useKpiSeries`, `useCreateKpi`, `useUpdateKpi`, `useAssignKpi`,
  `useEvaluateAllKpis`, plus `formatKpiValue` honouring `unset_state`.
- `src/hooks/useAnalyticsRollups.ts` — `useAnalyticsRollups(metrics)` +
  helpers (`bucketSum`, `pivotByBucket`).
- `src/pages/jobs/JobAnalyticsPage.tsx` — funnel + weekly trend now derive
  from rollup data with deterministic fallback when API offline.
- `src/pages/groups/GroupAnalyticsPage.tsx` — same pattern (members,
  posts, engagement metrics).

## Security
- All `/api/v1/kpi-registry/*` and `/api/v1/reporting/*` endpoints are
  `@UseGuards(AuthGuard('jwt'))`.
- Custom-SQL KPIs (`source: 'sql'`) are rejected unless the query starts
  with `SELECT` and contains no DML keywords (`INSERT|UPDATE|DELETE|DROP|
  ALTER|GRANT|TRUNCATE`).
- `kpi_audit` is append-only (DB-level trigger).

## Tests
- KPI evaluator: `value_mode` × `unset_state` matrix should be unit-tested
  in `apps/api-nest/test/kpi-registry/evaluator.spec.ts`.
- Reporting service: pivot correctness in
  `apps/api-nest/test/reporting/reporting.service.spec.ts`.
- Rollup worker: snapshot-write outcome in
  `apps/workers/test/handlers/analytics-rollup.spec.ts`.
