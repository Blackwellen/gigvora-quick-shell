# Domain 48 — User Dashboard, Personal Overview & Guided Next Actions

## Surfaces
- Web: `/dashboard` and role-specific variants under `/app/user-dashboard`.
- Mobile: `UserDashboardScreen` with swipe-actions and bottom-sheet snooze.

## Backend
- Module: `apps/api-nest/src/modules/user-dashboard/`
- Controller: `/api/v1/user-dashboard/{overview,widgets,actions}`
- Storage: `dashboard_widgets`, `dashboard_snapshots`, `dashboard_actions`, `dashboard_events`.

## State machines
- **Action lifecycle:** `pending → snoozed → pending → done` or `pending → dismissed`.
- **Snapshot freshness:** `fresh (< staleAt) → stale → recomputed` (TTL 60s).

## Intelligence
- Analytics (`apps/analytics-python/app/user_dashboard.py`): role-aware KPI/insight payload at `POST /user-dashboard/overview`.
- ML (`apps/ml-python/app/user_dashboard.py`): `POST /user-dashboard/rank-actions` for next-best-action ordering with deterministic kind-bias scoring.

## Frontend hooks
- `useDashboardOverview`, `useDashboardActions`, `useDashboardWidgets` in `src/hooks/useUserDashboard.ts`.
- `demoMode: true` keeps existing UI rendering during transition from mocks.

## Logic paths validated
- Entry: `/dashboard` → overview → snapshot cache hit/miss → analytics fallback proven deterministic.
- Action queue: complete, dismiss, snooze (requires `snoozeUntil`).
- Widgets: upsert, reorder, delete with audit events.

## UK posture
- All user data filtered by `auth.user.sub`; no cross-user leakage.
- Snapshots TTL'd to avoid stale PII drift.
- Audit events recorded for every mutation.
