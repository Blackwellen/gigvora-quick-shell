# Domain 68 — Finance Admin Dashboard, Refunds, Payouts, Billing Controls

## Surfaces
Internal: `/internal/finance-admin-dashboard`, `/internal/finance`,
`/internal/finance-dashboard`, `/internal/compliance`.

## Persistence
Migration `packages/db/migrations/0076_finance_admin.sql`:
- `fin_refunds` — refund lifecycle with state-machine + dual-approval evidence.
- `fin_holds` — payout/wallet holds with reason codes.
- `fin_billing_controls` — global/customer/plan/region scoped controls
  (refund auto-approve threshold, dual-approval threshold, payout pause,
  billing freeze).
- `fin_ledger` — append-only signed ledger (immutable trigger).
- `fin_audit_events` — append-only audit (immutable trigger).
Seeds 5 demo refunds, 3 holds, 4 controls.

## Refund state machine
`draft → pending → approved → processing → succeeded`
with `failed → pending|rejected` and `succeeded → reversed` (super_admin only).

## Backend
NestJS module `apps/api-nest/src/modules/finance-admin/` exposes
`/api/v1/finance-admin/*` (JWT-guarded). Role ladder
`viewer < operator < finance_admin < super_admin`. Sensitive controls
(`payout_pause`, `billing_freeze`) and `reversed` transition require
`super_admin`. Dual-approval enforced when amount ≥ threshold and
requester == approver. Every write produces an audit row; terminal refund
states write to the ledger.

## ML + Analytics
- ML `apps/ml-python/app/finance_admin.py` — `POST /finance-admin/score`
  (deterministic risk score with band normal/elevated/high/critical).
- Analytics `apps/analytics-python/app/finance_admin.py` —
  `POST /finance-admin/insights` (locked envelope: refund_backlog,
  refund_failed, holds_active, refunds_high_value, fin_healthy).
Service falls back to in-process implementations on timeout.

## SDK + Hooks
- `packages/sdk/src/finance-admin.ts` — typed envelopes.
- `src/hooks/useFinanceAdmin.ts` — `useFinOverview`, `useFinRefunds`,
  `useFinRefund`, `useFinHolds`, `useFinControls`, `useFinLedger`,
  `useFinCreateRefund`, `useFinTransitionRefund`, `useFinCreateHold`,
  `useFinReleaseHold`, `useFinSetControl` — all with fixture fallback.

## Mobile
`apps/mobile-flutter/lib/features/finance_admin/*` — KPI strip
(risk score band, pending refunds, active holds), insight cards, recent
refunds list, pull-to-refresh.

## Tests
Playwright `tests/playwright/finance-admin.spec.ts` — 4 surface mounts.

## UK / FCA posture
Immutable ledger + audit, dual-approval threshold, super-admin-only
reversal, billing_freeze + payout_pause as global kill switches.
