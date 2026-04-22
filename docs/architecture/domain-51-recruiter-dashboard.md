# Domain 51 — Recruiter Dashboard, Pipelines, Response Rates, and Hiring Velocity

**Route family**: `/app/recruiter-dashboard`
**Module**: `apps/api-nest/src/modules/recruiter-dashboard/`
**Schema**: `packages/db/src/schema/recruiter-dashboard.ts`
**Migration**: `packages/db/migrations/0051_recruiter_dashboard.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `useRecruiterOverview` | `GET /api/v1/recruiter-dashboard/overview` |
| Pipelines list | `useRecruiterPipelines` | `GET /pipelines`, `PATCH /pipelines/:id/status` |
| Outreach + reply prediction | `useRecruiterOutreach` | `GET /outreach` |
| Velocity time series | `useRecruiterVelocity` | `GET /velocity` |
| Tasks tray | `useRecruiterTasks` | `GET /tasks`, `PATCH /tasks/:id/status` |

## State machines

- `recruiter_dashboard_pipelines.status`: `draft → active ↔ paused → archived`
  enforced server-side via `PIPELINE_TRANSITIONS`. Invalid transitions return 400.
- `recruiter_dashboard_tasks.status`: `open ↔ in_progress → done | snoozed | dismissed`.
  `snoozed` requires `snoozedUntil` (Zod `superRefine`); `done` snapshots `completed_at`.
- `recruiter_dashboard_outreach.status`: `queued → sent → opened → replied | bounced | unsubscribed`
  driven by webhook ingestion (separate domain).

## RBAC + tenancy

Every read and write is scoped by `recruiter_identity_id = req.user.sub`. Cross-tenant
access is impossible by construction: the repository composes
`recruiter_identity_id = $userId` into every WHERE clause and ownership lookups
(`getPipeline`, `getTask`) are required before any mutation.

## ML + analytics

- **Analytics** (`apps/analytics-python/app/recruiter_dashboard.py`):
  `POST /recruiter-dashboard/insights` returns severity-tagged operational cards
  from raw signals (responseRate, openTasks, avgDaysToFill, activePipelines).
  NestJS calls this from `overview()` with a 2s timeout and falls back to a
  deterministic built-in set if unavailable.
- **ML** (`apps/ml-python/app/recruiter_dashboard.py`):
  - `POST /recruiter-dashboard/predict-replies` scores outreach reply probability
    by channel base rate, opened-status boost, and recency decay.
  - `POST /recruiter-dashboard/rank-candidates` sorts candidates by rating + recency.
  Fallback: channel base rate + opened boost (no decay).

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/recruiter_dashboard/`:
- Horizontally scrollable KPI tiles replace the desktop left rail.
- Pipelines support a popup status menu (Activate / Pause / Archive).
- Tasks support swipe-right (complete) and swipe-left (dismiss).
- Funnel renders as compact chips for thumb-readable summary.

## Audit + observability

`recruiter_dashboard_events` records every meaningful write with actor, action,
target, and a `diff` payload (`from`/`to` for transitions, notes for tasks).

## UK / GDPR posture

- Outreach rows store channel + status only — no message body — so retention can
  be governed at the templates table.
- Audit events store actor + diff but never raw candidate PII beyond identity IDs.
- All identity references use platform-internal UUIDs, not raw email addresses.

## Tests

- Playwright smoke: `tests/playwright/recruiter-dashboard.spec.ts`.
- Recommended Jest coverage to add next:
  - Pipeline state-machine valid/invalid transitions.
  - Task `snoozed` requires `snoozedUntil` (Zod refinement).
  - Overview composition handles empty funnel deterministically.
  - ML `predict-replies` fallback returns stable scores when ML offline.
  - RBAC isolation across `recruiterIdentityId`.
