# Domain 53 — Enterprise & Company Dashboard, Hiring, Procurement, Team Operations

**Route family**: `/app/enterprise-dashboard`
**Module**: `apps/api-nest/src/modules/enterprise-dashboard/`
**Schema**: `packages/db/src/schema/enterprise-dashboard.ts`
**Migration**: `packages/db/migrations/0053_enterprise_dashboard.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `useEnterpriseOverview` | `GET /api/v1/enterprise-dashboard/overview` |
| Requisitions (hiring) | `useEnterpriseRequisitions` | `GET /requisitions`, `PATCH /requisitions/:id/status` |
| Purchase orders (procurement) | `useEnterprisePurchaseOrders` | `GET /purchase-orders`, `PATCH /purchase-orders/:id/status` |
| Team members | `useEnterpriseTeam` | `GET /team/members` |
| Team tasks (operations) | `useEnterpriseTasks` | `GET /team/tasks`, `PATCH /team/tasks/:id/status` |
| Spend ledger | (overview + endpoints) | `GET /spend`, `GET /spend/by-category` |

## State machines

- `ed_requisitions.status`: `draft → open → on_hold | filled | cancelled`,
  with `on_hold ↔ open`. `filled`/`cancelled` terminal.
- `ed_purchase_orders.status`: `draft → submitted → approved | rejected → received | cancelled`.
  `rejected` requires `reason`; `received` requires `receivedOn` (Zod `superRefine`).
- `ed_team_tasks.status`: `todo ↔ in_progress → blocked | done`. `blocked` requires
  `blockedReason`; `done` snapshots `completed_at`.

All transitions enforced server-side via `*_TRANSITIONS` tables. Invalid transitions
return 400. Every transition emits an `ed_events` audit row with `from`/`to` diff.

## RBAC + tenancy

Every read and write is scoped by `enterprise_identity_id = req.user.sub`. Cross-tenant
access is impossible by construction: every query composes
`enterprise_identity_id = $userId` into the WHERE clause and ownership lookups
(`getRequisition`, `getPurchaseOrder`, `getTask`) are required before any mutation.

## ML + analytics

- **Analytics** (`apps/analytics-python/app/enterprise_dashboard.py`):
  `POST /enterprise-dashboard/insights` returns severity-tagged insights from
  hiring volume, approval queue, blockers, overdue tasks, and spend-per-head.
  NestJS calls this from `overview()` with a 2s timeout and falls back to a
  deterministic built-in set if unavailable.
- **ML** (`apps/ml-python/app/enterprise_dashboard.py`):
  - `POST /enterprise-dashboard/score-purchase-orders` returns risk scores
    (0-1) from amount band, status, vendor known/unknown, and category.
  - `POST /enterprise-dashboard/rank-requisitions` ranks by seniority, headcount,
    target-fill-by urgency, and applicant pool size.
  Fallback: pure-python heuristic returns identical-shape results when ML offline.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/enterprise_dashboard/`:
- Horizontal KPI tiles (open reqs, pending POs, headcount, onboarding, blocked, spend).
- Requisitions: popup status menu (Open / Hold / Filled / Cancel).
- POs: tap to approve, long-press for rejection reason bottom sheet.
- Tasks: swipe-right (complete), swipe-left (block via reason bottom sheet).

## Audit + observability

`ed_events` records every meaningful write with actor, action, target, and a
`diff` payload (`from`/`to` for transitions, reason / blockedReason for context).

## UK / GDPR posture

- Identity references use platform-internal UUIDs only.
- Spend ledger stores amount + category — no PII.
- Audit events store actor + diff only; member personal data lives in governed
  identity tables and is referenced by ID.
- Procurement amounts and PO metadata avoid storing payment instruments or
  bank details (those belong in the regulated payments domain).

## Tests

- Playwright smoke: `tests/playwright/enterprise-dashboard.spec.ts`.
- Recommended Jest coverage to add next:
  - Requisition state-machine valid/invalid transitions.
  - PO `rejected` requires `reason`, `received` requires `receivedOn` (Zod refinement).
  - Task `blocked` requires `blockedReason`.
  - Overview composition with empty arrays.
  - ML `score-purchase-orders` fallback returns deterministic scores when ML offline.
  - RBAC isolation across `enterpriseIdentityId`.
