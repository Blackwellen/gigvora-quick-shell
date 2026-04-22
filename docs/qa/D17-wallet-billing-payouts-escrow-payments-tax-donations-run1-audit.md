# D17 — Wallet, Billing, Payouts, Escrow, Payments, Tax & Donation Flows — Run 1 Audit

Date: 2026-04-18 · Group: G5 (D17/4) · Status: Run 1 (Audit) complete.

## Inventory

### Frontend pages (12 surfaces, 4,995 LOC)
- `src/pages/finance/`: WalletPage **739** · PayoutsPage **755** · BillingPage **698** · FinanceHubPage **641** · CommercePatronagePage **582** · InvoicesPage **547** · PricingMonetizationPage **542** · EscrowLedgerPage 107.
- `src/pages/escrow/`: RefundRequestPage 106 · ReleaseFundsPage 94.
- `src/pages/donations/DonationsPage.tsx` 94. `src/pages/purchases/PurchasesPage.tsx` 90.
- Admin: `src/pages/admin/FinanceAdminPage.tsx` (separate, FinanceAdmin SDK).

### Mock / router debt
- **6 of 12 pages** still on `react-router-dom`/MOCK_: WalletPage, PayoutsPage, BillingPage, CommercePatronagePage, PricingMonetizationPage, PurchasesPage. The 4 largest pages (>540 LOC) are on mock data — full refactor required.

### Backend (5 NestJS modules — full controller/service/repository/dto each)
- `wallet-credits-packages`, `billing-invoices-tax`, `payouts-escrow-finops`, `donations-purchases-commerce`, `finance-admin`.

### SDK
- ✅ `finance-admin.ts`, `proposal-builder-bid-credits.ts`.
- ❌ Missing: `wallet-credits-packages.ts`, `billing-invoices-tax.ts`, `payouts-escrow-finops.ts`, `donations-purchases-commerce.ts` (hooks exist but lack typed contracts).

### Hooks
- ✅ `useWalletCreditsPackages`, `useBillingInvoicesTax`, `usePayoutsEscrowFinops`, `useDonationsPurchasesCommerce`.

### Migrations
- ✅ 0030 bid credits · 0057 wallet/credits/packages · 0058 billing/invoices/tax · 0059 payouts v2 · 0060 payouts/escrow/finops · 0064 donations/purchases/commerce · 0065 billing/invoices · 0066 tax compliance.
- ⚠️ Likely-missing durable tables: `payment_methods` (saved cards + 3DS mandate refs), `stripe_webhook_events` (idempotent receipt log), `refund_requests`/`disputes`, `chargebacks`, `tax_registrations` (multi-jurisdiction VAT/GST IDs), `1099_forms`/`fee_summaries`, `kyc_verifications` (Stripe Identity), `wallet_transfers` (intra-platform), `gift_cards`/`promo_codes`.

### ML / Python
- ✅ `wallet_credits_packages.py`, `billing_invoices_tax.py`, `finance_admin.py`.
- ❌ Missing: `payouts_fraud.py` (anomaly detection), `donations_recommend.py`, `tax_classify.py`, `chargeback_predict.py`.

### Mobile (Flutter) + Tests
- ✅ Mobile features for billing, donations, payouts, wallet. ✅ Playwright specs for all 4 (probe-level).

### Integrations / Provider posture
- ✅ `apps/integrations/src/payments/stripe.ts` — official Stripe SDK adapter, registered, with healthcheck. Lone payment provider; comment notes "WE CAN ALSO SETUP ESCROW.COM, PAYPAL ESCROW TOO ETC if necessary".
- ❌ **No Stripe webhook receiver** (no `/api/stripe/webhook` route, no signature verification, no idempotency table).
- ❌ **No Stripe Connect** (Express/Standard accounts) for payouts to creators — current escrow/payout flow is therefore not actually wired to a payout rail.
- ❌ **No Stripe Tax / Stripe Identity / Stripe Radar** integration.
- ❌ **No Lovable Cloud built-in payments** enabled (`recommend_payment_provider` not yet run).

## Gaps (24 total — 8 P0 / 8 P1 / 6 P2 / 2 P3)

### P0
1. **No Stripe webhook receiver + idempotency table** — `payment_intent.succeeded`, `charge.refunded`, `payout.paid`, `account.updated`, `radar.early_fraud_warning`, `charge.dispute.created` all dropped. Money state in DB will drift from Stripe state. Needs `/api/stripe/webhook` server route with `stripe.webhooks.constructEvent` + `stripe_webhook_events` table for at-most-once processing.
2. **No Stripe Connect** — payouts to creators/vendors require Connect accounts (Express recommended). Current `payouts-escrow-finops` module has no `accounts.create`, no onboarding link, no `transfers.create`, no `payouts.create`. Escrow release is therefore a DB-only ledger entry, not an actual payout.
3. **4 largest pages on `react-router-dom`/MOCK_** (WalletPage 739, PayoutsPage 755, BillingPage 698, CommercePatronagePage 582 — total **2,774 LOC**) — must be migrated to TanStack + SDK calls.
4. **4 missing SDK files** (`wallet-credits-packages.ts`, `billing-invoices-tax.ts`, `payouts-escrow-finops.ts`, `donations-purchases-commerce.ts`) — frontend integration relies on hooks calling raw fetch instead of typed contract.
5. **No PCI-safe payment method capture** — no Stripe Elements / Payment Element mounted anywhere; `payment_methods` table absent. Adding a card is currently impossible end-to-end.
6. **No tax calculation** — no Stripe Tax / TaxJar / Avalara wiring; invoices in 0058/0066 schema cannot compute UK VAT, EU VAT MOSS, US sales tax, or GST. P0 because `tax_compliance` migration exists but is unused.
7. **No KYC / sanctions screening** — escrow holds + payouts without KYC are FCA/AML non-compliant. Needs Stripe Identity (or Persona/Sumsub) and OFAC/UK-sanctions screening before first payout.
8. **No idempotency keys on money-mutating endpoints** — wallet top-up, escrow release, refund, donation capture must accept `Idempotency-Key` header (Stripe-style) to prevent double-charges on retry.

### P1
9. **No 3DS / SCA flow** — required for EU/UK customers; needs PaymentIntent confirmation handling + `next_action` redirect.
10. **No saved cards / wallet (Apple Pay / Google Pay / Link)** — Express Checkout Element absent.
11. **No invoice PDF rendering** — InvoicesPage shows DB rows but has no PDF generator (puppeteer/sharp not Worker-safe → use react-pdf or external service).
12. **No subscription lifecycle** — no `customer.subscription.*` webhook handling, no proration, no dunning emails on `invoice.payment_failed`.
13. **No dispute/chargeback workflow** — `charge.dispute.created` not handled, no evidence-submission UI.
14. **No payout schedule controls** — daily/weekly/monthly cadence, minimum payout threshold, hold period.
15. **No multi-currency** — display + settlement currency separation absent; FX conversion not modelled.
16. **No fraud signals on donations/purchases** — no Radar rules, no velocity checks (e.g. >5 attempts/hr from same IP).

### P2
17. **No gift cards / promo codes / referral credits** — wallet has no inflow path other than top-up.
18. **No 1099 / annual statement generator** — required for US payouts >$600/yr.
19. **No Open Banking / direct-debit (BACS / SEPA)** — Stripe-card-only.
20. **No reconciliation report** — Stripe Balance vs platform ledger drift report absent.
21. **PricingMonetizationPage (542 LOC) on mock** — pricing tiers should be config-driven, not hard-coded.
22. **No regional payment methods** — no iDEAL / SOFORT / Bancontact / UPI.

### P3
23. **Playwright specs are probe-only** — need full top-up → escrow hold → release → payout → refund → dispute flow with Stripe test mode.
24. **Mobile parity** — Flutter features exist but verify Apple Pay / Google Pay native sheet integration.

## Recommended Run 2 (Build) priorities
1. **Run `recommend_payment_provider`** then **enable Lovable Cloud built-in Stripe payments** (`enable_stripe_payments`) — gives webhook receiver, Connect, Tax, Identity, idempotent events, and PCI-safe Elements out of the box without rebuilding the entire stack.
2. Add SDK files: `wallet-credits-packages.ts`, `billing-invoices-tax.ts`, `payouts-escrow-finops.ts`, `donations-purchases-commerce.ts`.
3. Migrate the 4 largest pages off `react-router-dom`/MOCK_ → TanStack + SDK (WalletPage, PayoutsPage, BillingPage, CommercePatronagePage). Split each (>540 LOC) into per-tab routes.
4. Migration `0083_payments_compliance.sql`: `payment_methods`, `stripe_webhook_events` (idempotency), `refund_requests`, `disputes`, `chargebacks`, `tax_registrations`, `kyc_verifications`, `wallet_transfers`, `payout_schedules`, `gift_cards`, `promo_codes`, `annual_statements_1099`.
5. Wire Stripe Connect Express onboarding + payout in `payouts-escrow-finops`.
6. Wire Stripe Tax on invoice creation; surface VAT/GST line items on InvoicesPage + invoice PDF.
7. Add Stripe Identity for KYC pre-payout + OFAC sanctions screening worker.
8. Add `Idempotency-Key` header support on all money-mutating endpoints.
9. Mount Stripe Payment Element + Express Checkout Element (Apple/Google Pay/Link) in WalletPage top-up + DonationsPage + PurchasesPage; handle 3DS/SCA `next_action`.
10. Add `payouts_fraud.py` (anomaly detection) and `donations_recommend.py`.
11. Subscription lifecycle: dunning emails via Lovable Emails on `invoice.payment_failed`.
12. Expand Playwright with Stripe test mode end-to-end (top-up → escrow → release → payout → refund → dispute).

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.
