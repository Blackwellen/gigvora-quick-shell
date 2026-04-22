# Domain 64 — Pricing, Promotions, Offer Packaging & Monetization

**Route family**: `/app/pricing-promotions-monetization`
**Module**: `apps/api-nest/src/modules/pricing-promotions-monetization/`
**Schema**: `packages/db/src/schema/pricing-promotions-monetization.ts`
**Migration**: `packages/db/migrations/0067_pricing_promotions_monetization.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `usePpmOverview` | `GET /overview` |
| Price books | `usePpmPriceBooks` | `GET/POST /price-books`, `PATCH /price-books/:id`, `PATCH /price-books/:id/status` |
| Price entries | `usePpmPriceEntries` | `GET /price-books/:id/entries`, `POST /price-entries`, `DELETE /price-entries/:id` |
| Offer packages | `usePpmPackages` | `GET/POST /packages`, `PATCH /packages/:id`, `PATCH /packages/:id/status` |
| Promotions | `usePpmPromotions` | `GET/POST /promotions`, `PATCH /promotions/:id`, `PATCH /promotions/:id/status`, `GET /promotions/:id/redemptions` |
| Checkout calculator | `usePpmPreview` | `POST /preview` (stateless) |
| Quotes (owner + customer) | `usePpmQuotes` | `GET /quotes/owner`, `GET /quotes/customer`, `GET /quotes/:id`, `POST /quotes`, `PATCH /quotes/:id/status` |

## State machines

- `ppm_price_books.status`: `draft → active → archived` (archive↔active).
- `ppm_offer_packages.status`: `draft → active ↔ paused → archived` (archive↔active).
- `ppm_promotions.status`: `draft → active ↔ paused → expired → archived`; `archived` terminal.
- `ppm_quotes.status`: `draft → sent → accepted|expired|cancelled`; `accepted/expired/cancelled` terminal.

## Money & FCA-safe posture

- All amounts stored in **minor units** (`*_minor INTEGER`). No floats.
- Quote totals enforced by DB CHECK:
  `total_minor = GREATEST(0, subtotal_minor - discount_minor) + tax_minor`
  and `discount_minor <= subtotal_minor`.
- Promo value model enforced by DB CHECK:
  - `percent`: `value_bps > 0`, `value_minor = 0`
  - `fixed`: `value_minor > 0`, `value_bps = 0`
  - `free_trial`: no immediate cash discount
- Promo discount math (`applyPromoMath`) clamps to subtotal; `min_subtotal_minor`
  gating enforced server-side.
- `ppm_promo_redemptions` is **append-only** (Postgres trigger blocks
  `UPDATE/DELETE`) and unique on `(promotion_id, order_ref)` so quote
  acceptance is idempotent.
- `redeemed_count` incremented atomically only after a successful append; per-user
  cap enforced via `countRedemptionsByUser`.
- Default price book uniqueness enforced by partial unique index
  `uniq_ppm_books_default WHERE is_default = TRUE`.

## Promo evaluation reasons

`evaluatePromo()` returns one of: `not_found`, `inactive`, `not_started`,
`expired`, `currency_mismatch`, `cap_reached`, `min_subtotal_not_met`,
`not_applicable`, `per_user_limit`, or `valid`.

## Role-aware view matrix

- **User / Customer**: `usePpmPreview` (checkout calculator),
  `usePpmQuotes('customer')` (review + accept), public package browsing.
- **Professional / Creator**: `usePpmPriceBooks`, `usePpmPriceEntries`,
  `usePpmPackages`, `usePpmPromotions`, `usePpmQuotes('owner')`.
- **Enterprise**: same as Professional plus tier='enterprise' price entries
  and `appliesTo='package'` promotions targeting enterprise SKUs.
- **Internal / Admin**: read all via owner-scoped queries; refunds and
  manual overrides flow through Domain 63 ledger writes.

## Analytics

- `apps/analytics-python/app/pricing_promotions_monetization.py`:
  - `POST /insights` — operational insights (`no_active_package`,
    `single_package`, `no_promo`, `promo_no_redemptions`, `healthy`) with
    deterministic NestJS fallback (2s timeout).

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/pricing_promotions_monetization/`:
- Sticky KPI header (Active Packages, Active Promos, Redemptions).
- Tabs: Packages | Promotions | Quotes.
- Pull-to-refresh on each tab.
- Money formatted from minor units; promo value rendered for percent/fixed/trial.

## Tests

- Playwright smoke: `tests/playwright/pricing-promotions-monetization.spec.ts`.
- Recommended Jest coverage:
  - `applyPromoMath` (percent, fixed, free_trial, min subtotal, clamp to subtotal).
  - All state-machine valid/invalid transitions across price books, packages,
    promos, quotes.
  - Quote DB CHECK rejects `total != subtotal - discount + tax` and
    `discount > subtotal`.
  - `evaluatePromo` returns each reason code at the correct boundary
    (currency, dates, per-user, cap, min subtotal, applies_to package/sku).
  - Idempotent quote acceptance: re-accepting the same quote does not double
    `redeemed_count` (unique `(promotion_id, order_ref)`).
  - Append-only redemption trigger rejects `UPDATE/DELETE`.
  - Cross-tenant 403 on every mutation (other owner's book/package/promo/quote).
  - Customer cannot transition own quote to `sent/cancelled`; owner cannot
    transition to `accepted`.
  - Quote acceptance after `valid_until` is rejected.
  - `is_default` price book uniqueness — flipping default clears prior default.
