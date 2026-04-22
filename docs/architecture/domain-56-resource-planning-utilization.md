# Domain 56 — Resource Planning, Utilization, Capacity & Assignment Dashboards

**Route family**: `/app/resource-planning-utilization`
**Module**: `apps/api-nest/src/modules/resource-planning-utilization/`
**Schema**: `packages/db/src/schema/resource-planning-utilization.ts`
**Migration**: `packages/db/migrations/0056_resource_planning_utilization.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + utilization + insights | `useRpuOverview` | `GET /overview` |
| Utilization grid (windowed) | `useRpuUtilization` | `GET /utilization?from=&to=&resourceId=&team=` |
| Resources | `useRpuResources` | `GET/POST /resources`, `PATCH /resources/:id` |
| Projects | `useRpuProjects` | `GET/POST /projects`, `PATCH /projects/:id(/status)` |
| Assignments | `useRpuAssignments` | `GET/POST /assignments`, `PATCH /assignments/:id(/status)` |
| Time-off | `useRpuTimeOff` | `GET/POST /time-off`, `DELETE /time-off/:id` |
| Recommendations | `recommendForProject(projectId, role?)` | `GET /recommend?projectId=&role=` |
| Audit log | (controller) | `GET /audit?limit=` |

## State machines

- `rpu_resources.status`: `active ↔ inactive`.
- `rpu_projects.status`: `active ↔ paused → completed → archived`. `archived` is terminal.
- `rpu_assignments.status`:
  - `draft → proposed → confirmed → active → completed`.
  - `confirmed/active ↔ on_hold`.
  - Any non-terminal status → `cancelled` (requires `reason`, Zod refinement).
  - `completed` and `cancelled` are terminal; edits and further transitions blocked.

## Authorisation invariants

- Org-scoping: every read/write filters on `org_identity_id = req.user.orgId ?? req.user.sub`.
- Assignment creation requires the resource and project to live in the same org and be assignable
  (resource `active`; project `active` or `paused`).
- Editing a terminal-status assignment is rejected (`cannot edit assignment in terminal status`).
- Project code is unique per org; resource email is unique per org.

## Audit

`rpu_audit_events` records every meaningful write (resource create/update, project create/update/transition,
assignment create/update/transition, time-off create/delete) with actor, target, `from`/`to` diff,
and request `ip` + `userAgent`.

## Utilization computation

The utilization endpoint computes — entirely in SQL inside `rpu_assignments` and `rpu_time_off` —
per-resource:
- `capacity_hours` = `weekly_capacity_hours × weeks(window)`
- `booked_hours` = sum of `hours_per_week` across overlapping `confirmed`/`active` assignments,
  scaled by overlap days/7
- `pto_hours` = sum of `hours_per_day × overlap_days` across overlapping time-off
- `available_hours` = `max(0, capacity − booked − pto)`
- `utilization_ratio` = `booked / capacity`

Overbooking is `utilization_ratio > 1`; underbooking is `< 0.6`. These thresholds drive
KPI badges and the analytics insight rules.

## ML / Analytics

- **`apps/ml-python/app/resource_planning_utilization.py`** — `POST /resource-planning-utilization/recommend`
  ranks candidate resources for a project by combining `headroom (45%) + role match (35%) + skill overlap (20%)`.
  Deterministic — no external model.
- **`apps/analytics-python/app/resource_planning_utilization.py`** — `POST /resource-planning-utilization/insights`
  produces severity-tagged insights from overbooking, underutilization, average-util thresholds, and missing
  resources/projects/assignments signals.
- NestJS calls both with a 2s timeout and falls back to deterministic in-process logic when offline:
  - `recommend` falls back to a headroom + role-match score using the same utilization view.
  - `overview` falls back to a static insight set covering over/under booking and an all-clear case.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/resource_planning_utilization/`:
- Horizontal KPI tiles (resources, projects, assignments, avg utilization).
- Utilization rows colour-coded by ratio (green/amber/red).
- Confirmed assignment cards: swipe-right to activate, swipe-left to cancel (reason sheet).

## UK / GDPR posture

- Audit `ip` and `user_agent` are stored for governance; retention follows the org's audit-retention policy.
- Resource personal data (full name, email, location, timezone, cost/bill rates) is required for the service
  per GDPR Art. 6(1)(b) (contract) and Art. 6(1)(f) (legitimate interest in capacity planning).
- Cost rates are confidential operational data — only org members with the dashboard route can view them.
- Cross-tenant isolation is enforced at every controller method via `orgIdentityId`.

## Tests

- Playwright smoke: `tests/playwright/resource-planning-utilization.spec.ts`.
- Recommended Jest coverage to add next:
  - Assignment state-machine valid/invalid transitions.
  - `cancel` without `reason` rejected (Zod refinement).
  - Edit of terminal-status assignment rejected.
  - Cross-org assignment creation rejected (resource or project from another org).
  - Resource email uniqueness per org; project code uniqueness per org.
  - Utilization SQL correctness on overlapping windows + PTO.
  - ML fallback path returns deterministic candidates when ML service is offline.
