# Domain 63 — Donations, Purchases, Creator Commerce & Patronage

**Route family**: `/app/donations-purchases-commerce`
**Module**: `apps/api-nest/src/modules/donations-purchases-commerce/`
**Schema**: `packages/db/src/schema/donations-purchases-commerce.ts`
**Migration**: `packages/db/migrations/0064_donations_purchases_commerce.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `useDpcOverview` | `GET /overview` |
| My / Public storefront | `useDpcStorefront` | `GET /storefront/me`, `GET /storefront/by-handle/:handle`, `POST/PATCH /storefront`, `PATCH /storefront/status` |
| Products | `useDpcProducts` | `GET/POST /products`, `PATCH /products/:id`, `PATCH /products/:id/status` |
| Tiers | `useDpcTiers` | `GET/POST /tiers`, `PATCH /tiers/:id`, `PATCH /tiers/:id/status` |
| Pledges (patron + creator) | `useDpcPledges` | `GET /pledges/mine`, `GET /pledges/creator`, `POST /pledges`, `PATCH /pledges/:id/status` |
| Orders (buyer + creator) | `useDpcOrders` | `GET /orders/mine`, `GET /orders/creator`, `GET /orders/:id`, `POST /orders`, `POST /orders/:id/confirm\|fulfill\|cancel\|refund` |
| Donations (donor + creator) | `useDpcDonations` | `GET /donations/mine`, `GET /donations/creator`, `POST /donations`, `POST /donations/:id/confirm\|refund` |
| Ledger | `useDpcLedger` | `GET /ledger` |

## State machines

- `dpc_storefronts.status`: `draft → active ↔ paused → archived` (archive↔active permitted).
- `dpc_products.status`: `draft → active ↔ paused → archived`.
- `dpc_patronage_tiers.status`: `draft → active → archived` (archive↔active).
- `dpc_pledges.status`: `active ↔ paused`, `active|paused|past_due → cancelled` (terminal).
- `dpc_orders.status`: `pending → paid|failed|cancelled`; `paid → fulfilled|refunded`;
  `fulfilled → refunded`; refunded/failed/cancelled are terminal.
- `dpc_donations.status`: `pending → paid|failed`; `paid → refunded`; terminal otherwise.

## Money & FCA-safe posture

- All amounts stored in **minor units** (`*_minor INTEGER`). No floats.
- Order totals enforced by DB CHECK: `total_minor = subtotal_minor + tax_minor`.
- Platform fee model:
  - **Orders**: 5% of subtotal + 20p (deducted from `net_to_creator_minor`).
  - **Donations**: 2.9% + 20p (deducted from `net_minor`).
- VAT (UK posture): 20% standard for `taxRegion = 'GB'`, 0% otherwise (simplified
  default). `vat_rate_bps` clamped to ≤ 5000 (50%) at the DB level.
- `dpc_ledger` is **append-only** (Postgres trigger blocks `UPDATE/DELETE`) and
  is the source of truth for monetary movement; orders/donations are the
  source-of-record but every credit/fee/refund hits the ledger.
- **Idempotency keys** required on `createOrder` and `createDonation`. Replays
  return the existing row — no duplicate provider calls or ledger entries.
- Self-purchase / self-donation / self-pledge blocked at the service layer.

## Role-aware view matrix

- **User / Donor**: `useDpcOrders('buyer')`, `useDpcDonations('donor')`,
  `useDpcPledges('patron')` show their own commerce activity.
- **Creator**: `useDpcStorefront`, `useDpcProducts`, `useDpcTiers`,
  `useDpcPledges('creator')`, `useDpcOrders('creator')`,
  `useDpcDonations('creator')`, `useDpcLedger` show monetisation surfaces.
- **Admin / Moderator**: refunds permitted regardless of ownership
  (`actorRole ∈ ['admin','moderator']`); all writes audited.

## Analytics

- `apps/analytics-python/app/donations_purchases_commerce.py`:
  - `POST /insights` — operational insights (`empty`, `low_mrr`,
    `convert_donors`, `healthy`) with deterministic fallback in NestJS when
    the service is unreachable (2s timeout).

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/donations_purchases_commerce/`:
- Sticky KPI header (MRR, Pledges, Orders, Donations).
- Tabs: My Pledges | My Orders | My Donations.
- Pull-to-refresh on each tab; semantic icons; status surfaced inline.
- Money formatted from minor units with currency symbol.

## Tests

- Playwright smoke: `tests/playwright/donations-purchases-commerce.spec.ts`.
- Recommended Jest coverage:
  - `computeOrderTotals` (subtotal, VAT, fee, net) and `computeDonationFee` math.
  - All state-machine valid/invalid transitions.
  - Cross-tenant `403` on every controller method (other user's order/donation/pledge/product).
  - Idempotency replay returns existing order/donation, never creates duplicate ledger rows.
  - Self-purchase / self-donation / self-pledge rejected.
  - Inventory decrement only on `confirm` (not on create); insufficient inventory rejects.
  - Append-only ledger trigger rejects `UPDATE/DELETE`.
  - Refund cannot exceed `total_minor` / `amount_minor`.
  - Public `/storefront/by-handle/:handle` returns only published storefronts.
