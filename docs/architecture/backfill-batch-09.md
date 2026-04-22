# Backfill batch — Contracts, Recruiter Pro, Inbox, Integrations, Webhooks

This batch closes 5 schema files referenced by `packages/db/src/schema/index.ts` that did not exist on disk.

## Schemas (Drizzle)
- `contracts-sow-acceptance.ts` — `master_agreements`, `sow_documents`, `sow_versions`, `sow_signatures`, `sow_events`
- `recruiter-job-management.ts` — `recruiter_pipelines`, `recruiter_pipeline_stages`, `recruiter_candidate_assignments`, `recruiter_notes`, `recruiter_hiring_decisions`, `recruiter_pipeline_snapshots`
- `inbox.ts` — `inbox_threads`, `inbox_participants`, `inbox_messages`, `inbox_read_receipts`, `inbox_typing_pings`
- `integrations.ts` — `integration_providers`, `integration_connections`, `integration_events`, `integration_usage_daily`
- `outbound-webhooks.ts` — `webhook_event_types`, `webhook_endpoints`, `webhook_deliveries`, `webhook_dead_letters`

## SQL migrations
`packages/db/migrations/0048` … `0052` mirror the Drizzle definitions with `CHECK` constraints on every status enum, `ON DELETE CASCADE` for child rows, and unique indexes for natural keys (e.g. `(tenant_id, url)` for webhook endpoints, `(provider_id, owner_identity_id, external_account_id)` for connections).

## Idempotent dev seeders
`database/seeders/0048` … `0052` use `DO $$ … $$` blocks with fixed UUIDs and `ON CONFLICT DO NOTHING` so they can be safely re-run. They must be skipped in production by the runner (`NODE_ENV=production` guard).

## Flutter wiring
- `apps/mobile-flutter/lib/features/contracts/contracts_screens.dart`
- `apps/mobile-flutter/lib/features/recruiter_pro/recruiter_pro_screens.dart`
- `apps/mobile-flutter/lib/features/inbox/inbox_screens.dart` (v2 — threaded messaging with send box)
- `apps/mobile-flutter/lib/features/integrations/integrations_screens.dart`
- `apps/mobile-flutter/lib/features/webhooks/webhooks_screens.dart`

Routes added in `apps/mobile-flutter/lib/app/router.dart`:
`/contracts`, `/contracts/:id`, `/hire/pipelines`, `/hire/pipelines/:id`, `/inbox/threads`, `/inbox/threads/:id`, `/integrations`, `/integrations/:id`, `/webhooks`, `/webhooks/:id/deliveries`.

## Open follow-ups (not in this batch)
- Wire NestJS modules + repositories for each domain.
- Replace Inbox v2 mock state with real API calls + realtime subscription.
- Promote VideoViewer to 8K HLS/DASH with device codec/GPU detection.
- Build `apps/webhook-gateway` to consume `webhook_deliveries` with HMAC signing + DLQ replay.
- Enforce `NODE_ENV=production` guard on the seeder runner and a Vite plugin that fails the build on fixture imports.
