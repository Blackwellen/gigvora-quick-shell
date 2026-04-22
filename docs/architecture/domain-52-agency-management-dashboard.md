# Domain 52 — Agency Management Dashboard, Delivery Ops, Utilization, and Client Portfolio

**Route family**: `/app/agency-management-dashboard`
**Module**: `apps/api-nest/src/modules/agency-management-dashboard/`
**Schema**: `packages/db/src/schema/agency-management-dashboard.ts`
**Migration**: `packages/db/migrations/0052_agency_management_dashboard.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `useAgencyOverview` | `GET /api/v1/agency-management-dashboard/overview` |
| Engagements (portfolio) | `useAgencyEngagements` | `GET /engagements`, `PATCH /engagements/:id/status` |
| Deliverables (delivery ops) | `useAgencyDeliverables` | `GET /deliverables`, `PATCH /deliverables/:id/status` |
| Utilization summary | `useAgencyUtilization` | `GET /utilization/summary` |
| Invoices (AR) | `useAgencyInvoices` | `GET /invoices`, `PATCH /invoices/:id/status` |

## State machines

- `amd_engagements.status`: `draft → active → at_risk | on_hold | completed | cancelled`
  with at_risk ↔ active|on_hold and on_hold → active|cancelled. completed/cancelled terminal.
- `amd_deliverables.status`: `todo ↔ in_progress → review → done | blocked`. `blocked`
  requires `blockedReason` (Zod `superRefine`); `done` snapshots `completed_at`.
- `amd_invoices.status`: `draft → sent → paid | overdue | written_off`. `paid` requires
  `paidOn` (Zod `superRefine`).

All transitions enforced server-side via `*_TRANSITIONS` tables. Invalid transitions
return 400. Every transition emits an `amd_events` audit row with `from`/`to` diff.

## RBAC + tenancy

Every read and write is scoped by `agency_identity_id = req.user.sub`. Cross-tenant
access is impossible by construction: every query composes
`agency_identity_id = $userId` into the WHERE clause and ownership lookups
(`getEngagement`, `getDeliverable`, `getInvoice`) are required before any mutation.

## ML + analytics

- **Analytics** (`apps/analytics-python/app/agency_management_dashboard.py`):
  `POST /agency-management-dashboard/insights` returns severity-tagged operational
  cards from raw signals (atRisk, blocked, overdue, AR, utilization, burn rate).
  NestJS calls this from `overview()` with a 2s timeout and falls back to a
  deterministic built-in set if unavailable.
- **ML** (`apps/ml-python/app/agency_management_dashboard.py`):
  - `POST /agency-management-dashboard/score-deliverables` returns risk scores
    (0-1) from priority weight, status weight, and due-date pressure.
  - `POST /agency-management-dashboard/rank-clients` ranks clients by health,
    spend size, and burn-rate penalty.
  Fallback: pure-python heuristic returns identical-shape results when ML offline.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/agency_management_dashboard/`:
- Horizontal KPI tiles replace the desktop left rail.
- Engagements: popup status menu (Activate / At risk / Hold / Complete).
- Deliverables: swipe-right (complete), swipe-left (block via reason bottom sheet).
- Utilization: stacked cards with member rate.

## Audit + observability

`amd_events` records every meaningful write with actor, action, target, and a
`diff` payload (`from`/`to` for transitions, blockedReason / note for context).

## UK / GDPR posture

- Identity references use platform-internal UUIDs only.
- Invoice rows store amount + status — no PII beyond client identity.
- Audit events store actor + diff only; client/member personal data lives in
  governed identity tables and is referenced by ID.
- Utilization rows carry hours + role only — no time-entry descriptions.

## Tests

- Playwright smoke: `tests/playwright/agency-management-dashboard.spec.ts`.
- Recommended Jest coverage to add next:
  - Engagement state-machine valid/invalid transitions.
  - Deliverable `blocked` requires `blockedReason` (Zod refinement).
  - Invoice `paid` requires `paidOn`.
  - Overview composition with empty utilization / invoices arrays.
  - ML `score-deliverables` fallback returns deterministic scores when ML offline.
  - RBAC isolation across `agencyIdentityId`.
