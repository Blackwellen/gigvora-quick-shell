# Domain 58 — Billing, Invoices, Tax, Subscriptions & Commercial Setup

**Route family**: `/app/billing-invoices-tax`
**Module**: `apps/api-nest/src/modules/billing-invoices-tax/`
**Schema**: `packages/db/src/schema/billing-invoices-tax.ts`
**Migration**: `packages/db/migrations/0058_billing_invoices_tax.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + aging + insights | `useBitOverview` | `GET /overview` |
| Commercial profile | `useBitProfile` | `GET/POST /profile` |
| Tax rates + on-the-fly compute | (controller) / `computeTax()` | `GET/POST /tax-rates`, `POST /tax/compute` |
| Invoices list + lifecycle | `useBitInvoices` | `GET/POST /invoices`, `PATCH /invoices/:id(/status)`, `POST /invoices/:id/{payments,refund,remind}` |
| Invoice detail (lines, payments, events, dunning, credit notes, disputes) | `useBitInvoiceDetail` | `GET /invoices/:id` |
| Subscriptions + lifecycle | `useBitSubscriptions` | `GET/POST /subscriptions`, `PATCH /subscriptions/:id/status` |
| Disputes | `useBitDisputes` | `GET/POST /disputes`, `PATCH /disputes/:id/status` |
| Customer-side views | `myInvoices`, `mySubs` | `GET /invoices/mine`, `GET /subscriptions/mine` |
| Risk score (assistive ML) | (controller) | `GET /invoices/:id/risk` |
| Audit log | (controller) | `GET /audit?limit=` |
| Provider webhook | n/a | `POST /webhook/:provider` |

## State machines

- `bit_invoices.status`:
  - `draft → open → partially_paid → paid`
  - `draft → void`; `open → uncollectible`
  - `paid → partially_refunded → refunded`
- `bit_subscriptions.status`:
  - `trialing → active ↔ past_due`
  - `active ↔ paused`; any → `cancelled`
  - `incomplete → active | cancelled`
- `bit_disputes.status`: `opened → under_review → won | lost | accepted` (or `opened → accepted`).

## Money & tax discipline

- All amounts are integers in **minor units** (`subtotalMinor`, `totalMinor`,
  `paidMinor`, `refundedMinor`). Tax rates are basis points (`rateBp`,
  2000 = 20%).
- CHECK invariants: `paid_minor ≤ total_minor`, `refunded_minor ≤ paid_minor`.
- Reverse-charge invoices set `reverse_charge = true` and skip line tax.
- Invoice numbers are owner-scoped via `bit_commercial_profiles.next_invoice_seq`
  (atomically incremented on each issue) and unique per owner.
- Credit notes are auto-issued on every refund with their own sequence.

## Append-only event log

`bit_invoice_events` is **append-only** — a Postgres trigger
(`bit_invoice_events_immutable`) blocks `UPDATE` and `DELETE`. Every meaningful
state change writes an event (`created`, `paid`, `partially_paid`, `voided`,
`refunded`, `reminded`, `disputed`, `status_changed`).

## Authorisation invariants

- Owner-scoping on every read/write via `req.user.orgId ?? req.user.sub`.
- Customers can only read their own invoices/subscriptions
  (`/invoices/mine`, `/subscriptions/mine`).
- Only `draft` invoices can be edited; transitioning rejects invalid state moves.
- Refunds require `paid` or `partially_paid`/`partially_refunded` and never
  exceed `paid - refunded`.
- Voiding/uncollectible require an explicit `reason` (Zod `superRefine`).
- Dispute amount must be ≤ invoice total.

## Audit

`bit_audit_events` records every meaningful write
(profile create/update, tax-rate create, invoice create/update/transition/
payment/refund/remind, subscription create/transition, dispute open/transition)
with actor, target, `from`/`to` diff, IP, and UA.

## Webhooks

`POST /api/v1/billing-invoices-tax/webhook/:provider` is the public ingress
for provider callbacks. It:
1. Validates the signature (placeholder header check today; production must
   verify with the provider secret against `req.rawBody`).
2. Persists every delivery to `bit_webhook_deliveries` with
   `(provider, event_id)` unique for replay protection.
3. Maps known event types onto state transitions:
   - `invoice.payment_succeeded` → `recordPayment`.
   - `charge.dispute.created` → `openDispute`.
4. Records the outcome (`processed | skipped | failed`).

## ML / Analytics

- **`apps/ml-python/app/billing_invoices_tax.py`** — `POST /billing-invoices-tax/risk-score`
  returns a deterministic risk score using `days_outstanding`, `total_minor`,
  and customer history. Threshold `> 0.6` recommends `manual_review`. NestJS
  treats the output as **assistive**; humans always retain override.
- **`apps/analytics-python/app/billing_invoices_tax.py`** — `POST
  /billing-invoices-tax/insights` returns severity-tagged operational
  insights (overdue, past-due subscriptions, MRR, healthy).
- Both calls use a 2s timeout and degrade to deterministic in-process
  fallbacks when the Python services are offline.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/billing_invoices_tax/`:
- Sticky KPI header (outstanding, overdue, MRR).
- Invoice list with swipe-to-remind and tap-to-action bottom sheet
  (record full payment, send reminder, issue draft).
- Subscriptions list summary.

## UK / GDPR / FCA posture

- Audit `ip` and `user_agent` are stored per write; retention follows the
  org's audit-retention policy.
- Invoice PII (customer email, name, address) is the minimum needed for
  invoicing and HMRC record-keeping.
- VAT (basis points) is stored per line and per invoice for HMRC-ready
  accounting; reverse-charge is explicit on the invoice.
- Refunds are ledger-style: paid amount stays, `refundedMinor` increases,
  and a credit note is auto-issued — satisfying FCA-aligned reversal history.
- Cross-tenant isolation is enforced at every controller method via the
  authenticated owner/customer identity.

## Tests

- Playwright smoke: `tests/playwright/billing-invoices-tax.spec.ts`.
- Recommended Jest coverage to add next:
  - Invoice state-machine valid/invalid transitions; void/uncollectible
    require reason.
  - Edit rejected for non-draft invoices.
  - Payment exceeds remaining → 400; partial then full → status flips
    `partially_paid → paid`.
  - Refund exceeds paid → 400; auto credit note issued.
  - Subscription state-machine (`trialing → active`, `active → past_due → active`,
    `paused ↔ active`, terminal `cancelled`).
  - Dispute amount > invoice → 400.
  - Webhook duplicate event ID → no double action; bad signature → 403.
  - Append-only trigger rejects `UPDATE`/`DELETE` on `bit_invoice_events`.
  - ML risk fallback when Python is offline.
