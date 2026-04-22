/**
 * Domain 57 — Wallet, Credits, Packages, and Purchase Flows.
 * Owner: apps/api-nest/src/modules/wallet-credits-packages/
 *
 * State machines:
 *   wcp_packages.status:    draft → active ↔ paused → archived
 *   wcp_purchases.status:   pending → succeeded → (refunded | partially_refunded)
 *                           pending → failed | cancelled
 *   wcp_payouts.status:     pending → processing → paid | failed
 *
 * Ledger discipline:
 *   wcp_ledger_entries is append-only. Reversals create new entries that
 *   reference the original via reverses_entry_id; rows are never updated.
 */
import { pgTable, uuid, text, timestamp, jsonb, integer, numeric, index, unique } from 'drizzle-orm/pg-core';

// Wallet — one row per (org or user) identity, currency-scoped.
export const wcpWallets = pgTable('wcp_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  currency: text('currency').notNull().default('GBP'), // ISO-4217
  // Cached balances (kept in sync with ledger via service writes; reconciled by job).
  cashBalanceMinor: integer('cash_balance_minor').notNull().default(0),
  creditBalance: integer('credit_balance').notNull().default(0),
  heldBalanceMinor: integer('held_balance_minor').notNull().default(0),
  status: text('status').notNull().default('active'), // active|frozen
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: unique('uniq_wcp_wallets_owner_ccy').on(t.ownerIdentityId, t.currency),
}));

// Packages — sellable credit/feature bundles.
export const wcpPackages = pgTable('wcp_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(), // seller (org or pro)
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  kind: text('kind').notNull().default('credits'), // credits|subscription|one_time|service_pack
  priceMinor: integer('price_minor').notNull(),
  currency: text('currency').notNull().default('GBP'),
  creditsGranted: integer('credits_granted').notNull().default(0),
  billingInterval: text('billing_interval'), // null|month|year (subscription only)
  trialDays: integer('trial_days').notNull().default(0),
  vatRateBp: integer('vat_rate_bp').notNull().default(2000), // 20.00% = 2000bp
  status: text('status').notNull().default('draft'), // draft|active|paused|archived
  features: jsonb('features').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqSlug: unique('uniq_wcp_packages_owner_slug').on(t.ownerIdentityId, t.slug),
  byStatus: index('idx_wcp_packages_status').on(t.ownerIdentityId, t.status),
}));

// Purchases — one per checkout intent.
export const wcpPurchases = pgTable('wcp_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerIdentityId: uuid('buyer_identity_id').notNull(),
  packageId: uuid('package_id'),
  packageSnapshot: jsonb('package_snapshot').notNull().default({}),
  amountMinor: integer('amount_minor').notNull(),
  vatMinor: integer('vat_minor').notNull().default(0),
  currency: text('currency').notNull().default('GBP'),
  creditsGranted: integer('credits_granted').notNull().default(0),
  status: text('status').notNull().default('pending'),
  // pending|succeeded|failed|cancelled|refunded|partially_refunded
  refundedMinor: integer('refunded_minor').notNull().default(0),
  provider: text('provider').notNull().default('stripe'),
  providerRef: text('provider_ref'), // payment intent / charge id
  providerClientSecret: text('provider_client_secret'),
  failureReason: text('failure_reason'),
  receiptUrl: text('receipt_url'),
  invoiceNumber: text('invoice_number'),
  succeededAt: timestamp('succeeded_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  idempotencyKey: text('idempotency_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byBuyer: index('idx_wcp_purchases_buyer').on(t.buyerIdentityId, t.status, t.createdAt),
  uniqIdem: unique('uniq_wcp_purchases_buyer_idem').on(t.buyerIdentityId, t.idempotencyKey),
}));

// Payouts — withdrawals from the wallet.
export const wcpPayouts = pgTable('wcp_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull(),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull().default('GBP'),
  status: text('status').notNull().default('pending'), // pending|processing|paid|failed
  provider: text('provider').notNull().default('stripe'),
  providerRef: text('provider_ref'),
  failureReason: text('failure_reason'),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byWallet: index('idx_wcp_payouts_wallet').on(t.walletId, t.status),
}));

// Append-only ledger.
export const wcpLedgerEntries = pgTable('wcp_ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull(),
  kind: text('kind').notNull(),
  // purchase|refund|credit_grant|credit_spend|payout|payout_reversal|hold|release|adjustment
  amountMinor: integer('amount_minor').notNull().default(0), // signed
  credits: integer('credits').notNull().default(0),           // signed
  currency: text('currency').notNull().default('GBP'),
  reference: text('reference'), // e.g. purchase:<uuid>, payout:<uuid>
  reversesEntryId: uuid('reverses_entry_id'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byWallet: index('idx_wcp_ledger_wallet').on(t.walletId, t.createdAt),
  byRef: index('idx_wcp_ledger_ref').on(t.reference),
}));

// Audit (admin overrides, anomaly flags, manual adjustments).
export const wcpAuditEvents = pgTable('wcp_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id'),
  actorIdentityId: uuid('actor_identity_id'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_wcp_audit_owner').on(t.ownerIdentityId, t.createdAt),
}));

// Provider webhook deliveries (idempotency + replay).
export const wcpWebhookDeliveries = pgTable('wcp_webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  eventId: text('event_id').notNull(),
  eventType: text('event_type').notNull(),
  signatureValid: text('signature_valid').notNull().default('true'),
  status: text('status').notNull().default('processed'), // processed|skipped|failed
  payload: jsonb('payload').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqEvent: unique('uniq_wcp_webhook_provider_event').on(t.provider, t.eventId),
}));
