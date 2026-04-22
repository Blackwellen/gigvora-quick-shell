# Domain 70 — Moderator Dashboard, Content Enforcement, Messaging Incident Review

## Surfaces
Internal: `/internal/moderator-dashboard`, `/internal/moderation`,
`/internal/moderation/queue`, `/internal/moderation/messaging-incidents`.

## Persistence
Migration `packages/db/migrations/0078_moderator_dashboard.sql`:
- `mod_queue_items` — queue + status + ML score/band/reasons + SLA timer.
- `mod_actions` — every enforcement action (warn/hide/remove/suspend/ban/etc.).
- `mod_messaging_incidents` — DM-thread review (phishing, solicitation,
  rate-limit abuse, grooming, threats).
- `mod_events` — append-only audit (immutable trigger).
- `mod_macros` — canned action templates (5 seeded).
6 demo items + 3 demo messaging incidents seeded.

## Item state machine
`open → triaging → holding/escalated → actioned/dismissed → closed`
Queue auto-derived (`QUEUE_BY_STATUS`).

## Backend
NestJS `apps/api-nest/src/modules/moderator-dashboard/` — JWT-guarded.
Role ladder `viewer < moderator < senior_moderator < trust_safety_admin`.

Endpoints:
- `GET /overview` — KPIs + queues + insights + risk + pending incidents
- `GET/POST/PATCH /items*` (list/detail/create/transition/assign)
- `POST /items/claim-next` — queue jump (`FOR UPDATE SKIP LOCKED`,
  auto-flips `open → triaging`)
- `POST /items/act` — single action (warn/hide/remove/suspend/ban/etc.)
- `POST /items/bulk-act` — bulk action with per-item result envelope
- `GET /messaging-incidents`, `PATCH /messaging-incidents/review`
- `GET /macros`

Permission rules:
- `remove`/`suspend`/`quarantine` → senior_moderator+
- `ban`/`escalate_legal`/`restore` → trust_safety_admin only
- Messaging incident review → senior_moderator+
- Every write produces `mod_events` row (immutable).

## ML + Analytics
- ML `apps/ml-python/app/moderator_dashboard.py`:
  - `POST /moderator-dashboard/score` (per-item content scoring)
  - `POST /moderator-dashboard/risk` (desk-level risk)
- Analytics `apps/analytics-python/app/moderator_dashboard.py`:
  - `POST /moderator-dashboard/insights` (sla_breached, escalations,
    triage_backlog, messaging_incidents, mod_healthy)
Service falls back to in-process implementations on timeout.

## SDK + Hooks
- `packages/sdk/src/moderator-dashboard.ts` — typed envelopes.
- `src/hooks/useModeratorDashboard.ts` — `useModOverview` (30s refetch),
  `useModItems`, `useModItem`, `useModCreateItem`, `useModTransition`,
  `useModAssign`, `useModClaimNext`, `useModAct`, `useModBulkAct`,
  `useModMessagingIncidents`, `useModReviewIncident`, `useModMacros`.

## Mobile
`apps/mobile-flutter/lib/features/moderator_dashboard/*` — KPI strip
(risk score, SLA breached, in triage, messaging incidents pending),
insight cards, review-queue list, "Claim next" FAB, pull-to-refresh.

## Tests
Playwright `tests/playwright/moderator-dashboard.spec.ts` — 4 surface mounts.

## UK / GDPR posture
Immutable event ledger, role-gated actions, senior-only destructive
enforcement, ts_admin-only ban/legal-escalation/restore, SLA timer
seeded by severity, messaging incidents reviewed by senior_moderator+.
