# Backfill batch 14 — Analytics v2, Reporting, Audit Log, Webhooks, Integrations

## Schemas (Drizzle)
- `analytics-v2.ts` — `analytics_events`, `analytics_sessions`, `analytics_funnels`, `analytics_cohorts`, `analytics_metrics_daily`
- `reporting.ts` — `report_definitions`, `report_schedules`, `report_runs`, `report_subscriptions`
- `audit-log.ts` — `audit_log_entries` (append-only, hash-chained), `audit_log_streams`
- `webhooks.ts` — `webhook_endpoints`, `webhook_events`, `webhook_deliveries`
- `integrations.ts` — `integration_connectors`, `integration_connections`, `integration_oauth_tokens`, `integration_api_keys`, `integration_sync_runs`

## Migrations
`packages/db/migrations/0068_analytics_v2.sql` … `0072_integrations.sql`. Highlights:
- Audit log has a `BEFORE UPDATE OR DELETE` trigger raising an exception so the hash chain stays tamper-evident. Severity-partitioned index for fast warning/critical filtering.
- Webhook endpoints enforce `https?://` URL + `length(secret) >= 32`; deliveries cap at 20 attempts; retry index is partial-on-pending for cheap scheduler scans.
- Integrations registry uses FK `connector_key` for referential integrity; OAuth tokens have a partial expiring index for the rotation worker.
- Analytics events are partitioned-friendly: `(tenant_id, occurred_at DESC)`, `(tenant_id, event_name, occurred_at DESC)`, plus identity/session indexes.
- Reporting schedules validated for cron length; partial index `WHERE enabled` powers the dispatcher.

## Flutter wiring
`apps/mobile-flutter/lib/features/backfill_batch_14/backfill_batch_14_screens.dart` — 5 screens. Routes wired in `apps/mobile-flutter/lib/app/router.dart`:
`/analytics/v2`, `/reporting`, `/audit-log`, `/webhooks`, `/integrations`.

## Open follow-ups
- NestJS modules (controllers/services/repositories) for batches 11–14.
- Wire `/projects/P-001/workspace` and remaining project pages to live PWH API.
- Strip demo-data arrays outside `import.meta.env.DEV` (dedicated pass).
