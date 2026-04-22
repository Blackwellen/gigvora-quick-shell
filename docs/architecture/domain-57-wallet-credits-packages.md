# Domain 57 — Wallet, Credits, Packages & Purchase Flows

**Route family**: `/app/wallet-credits-packages`
**Module**: `apps/api-nest/src/modules/wallet-credits-packages/`
**Schema**: `packages/db/src/schema/wallet-credits-packages.ts`
**Migration**: `packages/db/migrations/0057_wallet_credits_packages.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + recent activity + insights | `useWcpOverview` | `GET /overview` |
| Wallet + ledger + reconcile | `useWcpWallet` | `GET /wallet`, `GET /wallet/ledger`, `GET /wallet/reconcile` |
| Owner packages (CRUD + transitions) | `useWcpPackages({ ownerScope: 'owner' })` | `GET/POST /packages`, `PATCH /packages/:id(/status)` |
| Public catalog | `useWcpPackages({ ownerScope: 'catalog' })` | `GET /packages/catalog` |
| Purchases (checkout + lifecycle) | `useWcpPurchases` | `GET/POST /purchases`, `POST /purchases/:id/{confirm,fail,cancel,refund}` |
| Payouts | `useWcpPayouts` | `GET/POST /payouts` |
| Credits | `spendCredits` / `grantCredits` | `POST /credits/{spend,grant}` |
| Audit log | (controller) | `GET /audit?limit=` |
| Provider webhook | n/a | `POST /webhook/:provider` (unauthed, signature-validated) |

## State machines

- `wcp_packages.status`: `draft → active ↔ paused → archived`. `archived` is terminal.
- `wcp_purchases.status`:
  - `pending → succeeded → (refunded | partially_refunded → refunded)`.
  - `pending → failed | cancelled`.
  - `failed`, `cancelled`, `refunded` are terminal.
- `wcp_payouts.status`: `pending → processing → paid | failed`.

## Ledger discipline

`wcp_ledger_entries` is **append-only** — a Postgres trigger
(`wcp_ledger_immutable`) raises on any `UPDATE` or `DELETE`. Reversals create a
new entry that points back via `reverses_entry_id`. Cached wallet balances
(`cash_balance_minor`, `credit_balance`, `held_balance_minor`) are updated by
the service alongside each ledger insert; `GET /wallet/reconcile` exposes the
drift between ledger sums and the cached snapshot.

## Money handling

- All monetary amounts are integers in **minor units** (`amountMinor`,
  `cashBalanceMinor`, …) to avoid float drift. Currencies are ISO-4217 (3-char).
- VAT is stored on every package as basis points (`vatRateBp`, default 2000 =
  20%) and snapshotted onto the purchase row at checkout for audit fidelity.
- Refund invariant: `refunded_minor ≤ amount_minor` (CHECK constraint) and the
  service rejects refunds that exceed the remaining amount.
- Idempotency: `(buyer_identity_id, idempotency_key)` is unique and
  `createPurchase` short-circuits to the existing row when the same key is
  re-submitted.

## Authorisation invariants

- Owner-scoping: every read/write filters on `ownerIdentityId =
  req.user.orgId ?? req.user.sub`. Buyers can only see/act on their own
  purchases; package owners can only edit/transition packages they own.
- Pending-only state changes: `confirm`, `fail`, `cancel` reject any purchase
  not in `pending`. Refunds reject anything other than `succeeded` or
  `partially_refunded`.
- Catalog purchases require `package.status === 'active'`.
- Credit spends require `wallet.creditBalance >= amount`.

## Audit

`wcp_audit_events` records every meaningful write (package create/update/
transition, purchase create/confirm/fail/cancel/refund, credits spend/grant,
payout create) with actor, target, and `from`/`to` diff plus IP + UA.

## Webhooks

`POST /api/v1/wallet-credits-packages/webhook/:provider` is the public
ingress for provider callbacks (Stripe, Paddle, etc.). It:
1. Validates the request signature (placeholder header check today —
   production must verify with the provider secret against `req.rawBody`).
2. Persists every delivery to `wcp_webhook_deliveries` with a unique
   `(provider, event_id)` constraint for replay protection.
3. Maps known event types onto state transitions:
   - `payment_intent.succeeded` / `charge.succeeded` → `confirmPurchase`.
   - `payment_intent.payment_failed` → `failPurchase`.
   - `charge.refunded` → `refundPurchase` (uses `amount_refunded`).
4. Records the outcome (`processed | skipped | failed`) on the delivery row.

## ML / Analytics

- **`apps/ml-python/app/wallet_credits_packages.py`** — `POST
  /wallet-credits-packages/risk-score` returns a deterministic risk score
  combining recent failures, amount thresholds, first-time large purchases,
  and negative cash signal. NestJS treats the ML output as **assistive**:
  scores `> 0.7` mark the purchase as `pending` with `failure_reason =
  'flagged_for_manual_review'` and surface in audit, but humans always
  retain override.
- **`apps/analytics-python/app/wallet_credits_packages.py`** — `POST
  /wallet-credits-packages/insights` produces severity-tagged operational
  insights (no credits, failed purchases, many pending, funds held, empty
  wallet, healthy).
- Both calls use a 2s timeout and degrade to deterministic in-process
  fallbacks when the Python services are offline.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/wallet_credits_packages/`:
- Sticky balance header (cash, credits, held).
- Catalog cards with tap-to-buy → confirmation bottom sheet.
- Recent ledger as compact list with reference + amount/credits.

## UK / GDPR / FCA posture

- Audit `ip` and `user_agent` are stored per write; retention follows the
  org's audit-retention policy.
- Personal data on purchases is the minimum needed for invoicing and
  reconciliation; provider PII (card details) is never persisted — only the
  provider reference and receipt URL.
- VAT is stored on every purchase snapshot for HMRC-ready accounting.
- Refunds are reversible only via new ledger entries, satisfying the audit
  and reversal-history requirements of FCA-aligned record-keeping.
- Cross-tenant isolation is enforced at every controller method via the
  authenticated owner/buyer identity.

## Tests

- Playwright smoke: `tests/playwright/wallet-credits-packages.spec.ts`.
- Recommended Jest coverage to add next:
  - Package state-machine valid/invalid transitions.
  - Purchase state-machine valid/invalid transitions; idempotency replay
    returns the original row.
  - Refund exceeds remaining → 400.
  - Spend credits below balance → 400; ledger balance reconciles.
  - Webhook duplicate event ID → no double-confirmation.
  - Webhook with bad signature → 403 + `wcp_webhook_deliveries.status='failed'`.
  - ML risk fallback when Python service is offline.
  - Append-only trigger rejects `UPDATE`/`DELETE` on ledger.
