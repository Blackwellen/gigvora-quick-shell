# Domain 59 — Payouts, Escrow, Finance Operations & Hold Management

**Route family**: `/app/payouts-escrow-finops`
**Module**: `apps/api-nest/src/modules/payouts-escrow-finops/`
**Schema**: `packages/db/src/schema/payouts-escrow-finops.ts`
**Migration**: `packages/db/migrations/0060_payouts_escrow_finops.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `usePefOverview` | `GET /overview` |
| Payout accounts | `usePefAccounts` | `GET/POST /accounts`, `POST /accounts/:id/default` |
| Schedule | `usePefSchedule` | `GET/POST /schedule` |
| Payouts + lifecycle | `usePefPayouts` | `GET/POST /payouts`, `PATCH /payouts/:id/status` |
| Escrows + hold/release/refund | `usePefEscrows` | `GET /escrows`, `POST /escrows/hold`, `POST /escrows/:id/{release,refund}` |
| Holds queue | `usePefHolds` | `GET/POST /holds`, `PATCH /holds/:id/status` |
| Disputes | `usePefDisputes` | `GET/POST /disputes`, `PATCH /disputes/:id/status` |
| Ledger | `usePefLedger` | `GET /ledger` |
| Audit | (controller) | `GET /audit` |
| Admin queue + reconciliation | (admin controller) | `GET /admin/.../queue`, `GET/POST /admin/.../reconciliation`, `GET /admin/.../audit` |
| Provider webhook | n/a | `POST /webhook/:provider` |

## State machines

- `pef_payouts.status`: `pending → processing → paid | failed`; `failed → processing` (retry); `pending → cancelled`.
- `pef_escrows.status`: `held → released | refunded | disputed | partially_released`; `disputed → released | refunded`; `partially_released → released | refunded | disputed`.
- `pef_holds.status`: `open → released | escalated | converted_to_dispute`; `escalated → released | converted_to_dispute`.
- `pef_disputes.status`: `opened → under_review | rejected`; `under_review → resolved | rejected`.

## Money discipline

- All amounts in **minor units** (integers). `net_amount_minor + fee_minor = amount_minor` (CHECK).
- Escrow CHECK: `released_minor + refunded_minor ≤ amount_minor`.
- Payout retry counter capped at 10. Reference IDs (`PO-…`, `ESC-…`) are unique.
- Initiating a payout requires sufficient available ledger balance (`credits − debits`)
  and a verified, default-eligible account; an open `account` hold blocks it.

## Append-only ledger

`pef_ledger_entries` is append-only — Postgres trigger `pef_ledger_immutable`
rejects `UPDATE`/`DELETE`. Entry types: `credit | debit | reserve | release |
refund | fee | adjustment | hold | hold_release`. Every payout/escrow lifecycle
event writes one or more ledger entries:

- Initiate payout → `reserve`.
- Payout `paid` → `debit` (+ `fee` if any).
- Payout `cancelled | failed` → `release` (reverse the reserve).
- Escrow held → `hold` (payer side).
- Escrow released → `hold_release` (payer) + `credit` (payee).
- Escrow refunded → `refund` (payer).

## Authorisation invariants

- Owner-scoped reads/writes via `req.user.orgId ?? req.user.sub`.
- Customers (payee/payer) can only see their own escrows.
- Hold transitions and dispute transitions require role `admin` or `operator`
  (privileged-operator queue); `403` otherwise.
- Reconciliation runs are admin/operator only.
- Failed/cancelled payout transitions require an explicit `reason` (Zod `superRefine`).
- Dispute resolve/reject requires a `resolution`.

## Audit

`pef_audit_events` records every meaningful write with `actor_role`
(`owner | admin | operator | system`), `target`, diff, IP, and UA. Admin audit
log (`/admin/.../audit`) cross-tenant, scoped behind role check.

## Webhooks

`POST /api/v1/payouts-escrow-finops/webhook/:provider`:
1. Verify signature (header check today; production must verify with provider secret).
2. Persist every delivery to `pef_webhook_deliveries` with `(provider, event_id)`
   unique for replay protection.
3. Map known events: `payout.paid → transition(paid)`, `payout.failed →
   transition(failed)`. Outcome stored as `processed | skipped | failed`.

## Reconciliation

`pef_reconciliation_runs` captures provider statements per period
(`period_start ≤ period_end`). The current implementation marks runs as
`reconciled` deterministically; production should diff provider statement
amounts against `pef_payouts` and write `matched_count`, `unmatched_count`,
and `diff_minor`.

## ML / Analytics

- No domain-specific ML model. Domain consumes shared signals where useful.
- `apps/analytics-python/app/payouts_escrow_finops.py` — `POST
  /payouts-escrow-finops/insights` returns severity-tagged operational insights
  (open holds, queue size, escrow held, healthy). 2s timeout with
  in-process deterministic fallback.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/payouts_escrow_finops/`:
- Sticky KPI header (Available, Reserved, Escrow).
- Tabs: Payouts | Escrows | Holds.
- Tap-to-act bottom sheets: cancel pending payout, retry failed payout,
  release remaining escrow.

## UK / GDPR / FCA posture

- Audit `ip` and `user_agent` per write; retention follows org audit policy.
- Append-only ledger satisfies FCA-aligned reversal/audit history.
- Payout/escrow PII (account display, external IDs) is the minimum needed for
  payment routing and reconciliation.
- Cross-tenant isolation enforced at every controller method.
- Hold reasons (`risk_review`, `kyc_pending`, `provider_block`, `dispute`,
  `manual`, `chargeback_risk`, `sanctions`) align with KYC/AML controls.

## Tests

- Playwright smoke: `tests/playwright/payouts-escrow-finops.spec.ts`.
- Recommended Jest coverage to add next:
  - Payout state-machine valid/invalid transitions; failed/cancelled require reason.
  - `feeMinor > amountMinor` rejected.
  - Insufficient available funds rejected; account hold rejects initiate.
  - Escrow release exceeds remaining → 400; refund exceeds refundable → 400;
    `partially_released` flips to `released` when remaining hits 0.
  - Hold/dispute transitions reject non-admin/operator with 403.
  - Webhook duplicate event no-double-action; bad signature 403.
  - Append-only ledger trigger rejects `UPDATE`/`DELETE`.
  - Analytics insights fallback when Python service offline.
