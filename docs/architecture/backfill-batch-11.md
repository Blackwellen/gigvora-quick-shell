# Backfill batch 11 — Live Streaming, Payouts v2, Moderation, Referrals, Learning

Closes 5 more domains beyond batch 10.

## Schemas (Drizzle)
- `live-streaming.ts` — `live_streams`, `live_stream_viewers`, `live_stream_chat`
- `payouts-v2.ts` — `payout_accounts`, `payouts`, `payout_ledger`, `payout_schedules`
- `moderation-queues.ts` — `moderation_reports`, `moderation_decisions`, `moderation_appeals`, `moderation_audit`
- `referrals-affiliate.ts` — `referral_codes`, `referral_visits`, `referral_conversions`, `affiliate_payouts`
- `learning-paths.ts` — `learning_courses`, `learning_modules`, `learning_lessons`, `learning_enrollments`, `learning_progress`, `learning_certificates`

## Migrations
`packages/db/migrations/0058`–`0062`. CHECK constraints on every status enum, FK CASCADE on child rows, unique indexes on natural keys (referral codes, payout references, course slugs, certificate numbers).

## Flutter wiring
`apps/mobile-flutter/lib/features/backfill_batch_11/backfill_batch_11_screens.dart` exposes 5 screens. Routes added in `apps/mobile-flutter/lib/app/router.dart`:
`/live`, `/payouts/v2`, `/moderation/queues`, `/referrals`, `/learn`.

## Production seeder guard
`database/seeders/run-seeders.mjs` refuses to run when `NODE_ENV=production` unless `FORCE_SEED=1` is set. This satisfies the "no demo data in production" rule. Dev/preview seeding remains a single command.

## Project page wiring (this turn)
- `ProjectMilestonesPage`, `ProjectDeliverablesPage`, `ProjectEscrowPage` now read from `/api/v1/project-workspaces-handover` via the `useProjectWorkspace` hook. All action buttons (Submit-for-Review, Approve, Request Changes, Reject, Fund, Release, Start Handover, Upload Deliverable) trigger real mutations with toast feedback. Mock arrays remain only as preview-mode fallback when `VITE_GIGVORA_API_URL` is unset.

## Open follow-ups (next turn)
- Wire NestJS modules + repositories for the 5 new domains (controllers/DTOs/state machines).
- Wire `MyProjectsPage` and `ProjectDashboardPage` to live PWH data (bigger refactors — separate turn).
- Build 8K-capable VideoViewer (device/codec/GPU/bandwidth detection, HLS/DASH ABR, full controls).
- Wire Feed posting, Inbox messaging, Search ranking, Profile editing to live APIs.
