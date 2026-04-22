# Domain 33 — Project Posting Studio, Smart Match & Invite Flows

**Status:** Backend + SDK + frontend (matching step) wired. Single-sweep.
**Routed surface:** existing wizard at `/projects/create` (`src/pages/projects/ProjectCreatePage.tsx`) — Match & Invite step now consumes the live SDK.
**API base:** `/api/v1/project-posting-smart-match/*`

## Files
- `apps/api-nest/src/modules/project-posting-smart-match/`
  - `dto.ts` — Zod schemas: drafts, publish, smart-match, invites, boost-credit checkout, approval
  - `project-posting-smart-match.repository.ts` — In-memory store + 12 seeded candidates, 4 boost/invite-credit packs, explicit state machines
  - `project-posting-smart-match.ml.service.ts` — Explainable smart-match (skill overlap + experience + workplace + rating + availability) + diversify
  - `project-posting-smart-match.analytics.service.ts` — KPI band, accept rate, anomaly note, wallet
  - `project-posting-smart-match.service.ts` — Orchestration, audit, idempotency, multi-step boost-credit checkout
  - `project-posting-smart-match.controller.ts` — 24 REST endpoints
  - `project-posting-smart-match.emit.ts` — `D33Emit` (26 outbound webhooks + bus) + `D33Adapters`
  - `project-posting-smart-match.module.ts` — registered in `app.module.ts`
- `packages/sdk/src/project-posting-smart-match.ts` + subpath export `@gigvora/sdk/project-posting-smart-match`
- `apps/mobile-flutter/lib/features/project_posting_smart_match/project_posting_smart_match_api.dart`
- `src/hooks/useProjectPostingSmartMatch.ts` — TanStack Query hooks + safe-fetch fallback
- `tests/playwright/project-posting-smart-match.spec.ts`

## State machines
- **project**: `draft → pending_review → active ↔ paused → expired → archived` (also `rejected`, `awarded`, `cancelled`)
- **invite**: `pending → sent → opened → accepted | declined | maybe | expired | revoked`
- **purchase**: `pending → paid | failed → refunded` (multi-step checkout w/ idempotencyKey)
- **approval**: `open → approved | rejected | changes_requested`

## Webhook + cross-domain bus events (26 — `pps.*`)
project.created/updated/transitioned/published/paused/resumed/archived/boosted,
approval.submitted/decided, match.generated/explained,
invite.sent/opened/accepted/declined/maybe/expired/revoked/bulk-sent,
boost-purchase.created/confirmed/refunded, boost.applied,
invite-credits.consumed/topped-up.

## Third-party adapter map (D33Adapters)
| Surface     | Adapters                                |
|-------------|-----------------------------------------|
| payments    | stripe, paddle, wise                    |
| email       | resend, ses, smtp                       |
| sms-push    | twilio, expo, fcm, apns                 |
| storage     | s3, gcs, azure-blob, r2                 |
| av-scanning | clamav, virustotal                      |
| search      | opensearch, algolia, typesense          |
| ml          | internal-python, openai, cohere         |
| crm         | hubspot, salesforce, pipedrive          |
| calendar    | google, microsoft, apple                |
| webhooks    | outbound: D33Emit · inbound: webhook-gateway |

## Frontend wiring
- `src/pages/projects/ProjectCreatePage.tsx` — Match & Invite step now uses `useDraftMatchPreview` for unsaved drafts and `useSmartMatch(projectId)` once saved. The mock `MOCK_MATCHES` array is no longer the source of truth; it remains only as the deterministic fallback inside the hook. Single-invite uses `useInviteCandidate`. Bulk-invite top action will be added when the wizard's "Invite All" CTA is added (next sweep).

## Carry-overs (next sweep)
- Drizzle schema + Postgres migration for `pps_projects`, `pps_invites`, `pps_purchases`, `pps_ledger`, `pps_approvals`, `pps_audit`.
- Python ML smart-match router (real ranker behind the bridge).
- Boost-credit drawer in the wizard's Commercial step.
- Playwright assertions for invite optimistic UI.
