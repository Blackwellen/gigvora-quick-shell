/**
 * Domain 63 — Donations, Purchases, Creator Commerce & Patronage Flows.
 *
 * Tables (all `dpc_*`):
 *   dpc_storefronts       — creator storefront (one per owner)
 *   dpc_products          — purchasable items (digital/physical/service/tip)
 *   dpc_patronage_tiers   — recurring patronage tiers
 *   dpc_pledges           — patron→creator recurring pledges
 *   dpc_orders            — one-time purchases (with line items in jsonb)
 *   dpc_donations         — one-off donations / tips
 *   dpc_ledger            — append-only money ledger (debit/credit/refund/fee/payout)
 *   dpc_audit_events      — domain audit trail
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, index, unique } from 'drizzle-orm/pg-core';

export const dpcStorefronts = pgTable('dpc_storefronts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull().unique(),
  handle: text('handle').notNull().unique(),
  displayName: text('display_name').notNull(),
  status: text('status').notNull().default('draft'), // draft|active|paused|archived
  acceptDonations: boolean('accept_donations').notNull().default(true),
  acceptPatronage: boolean('accept_patronage').notNull().default(true),
  currency: text('currency').notNull().default('GBP'),
  payoutAccountId: uuid('payout_account_id'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const dpcProducts = pgTable('dpc_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  storefrontId: uuid('storefront_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  kind: text('kind').notNull(), // digital|physical|service|tip
  status: text('status').notNull().default('draft'), // draft|active|paused|archived
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  priceMinor: integer('price_minor').notNull(), // pence; 0 allowed for "name your price"
  currency: text('currency').notNull().default('GBP'),
  taxCategory: text('tax_category').notNull().default('standard'), // standard|reduced|zero|exempt
  inventoryRemaining: integer('inventory_remaining'), // null = unlimited
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byStore: index('idx_dpc_products_store').on(t.storefrontId, t.status),
  byOwner: index('idx_dpc_products_owner').on(t.ownerIdentityId, t.kind),
}));

export const dpcPatronageTiers = pgTable('dpc_patronage_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  storefrontId: uuid('storefront_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  status: text('status').notNull().default('active'), // draft|active|archived
  name: text('name').notNull(),
  monthlyPriceMinor: integer('monthly_price_minor').notNull(),
  currency: text('currency').notNull().default('GBP'),
  perks: jsonb('perks').notNull().default([]),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byStore: index('idx_dpc_tiers_store').on(t.storefrontId, t.status) }));

export const dpcPledges = pgTable('dpc_pledges', {
  id: uuid('id').primaryKey().defaultRandom(),
  storefrontId: uuid('storefront_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(), // creator
  patronIdentityId: uuid('patron_identity_id').notNull(),
  tierId: uuid('tier_id').notNull(),
  status: text('status').notNull().default('active'), // active|paused|cancelled|past_due
  monthlyPriceMinor: integer('monthly_price_minor').notNull(),
  currency: text('currency').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  nextChargeAt: timestamp('next_charge_at', { withTimezone: true }),
  providerSubscriptionId: text('provider_subscription_id'),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  byPatron: index('idx_dpc_pledges_patron').on(t.patronIdentityId, t.status),
  byCreator: index('idx_dpc_pledges_creator').on(t.ownerIdentityId, t.status),
  uniqActive: unique('uniq_dpc_pledge_active').on(t.patronIdentityId, t.tierId),
}));

export const dpcOrders = pgTable('dpc_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  storefrontId: uuid('storefront_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(), // creator (recipient)
  buyerIdentityId: uuid('buyer_identity_id').notNull(),
  status: text('status').notNull().default('pending'), // pending|paid|fulfilled|refunded|failed|cancelled
  subtotalMinor: integer('subtotal_minor').notNull(),
  taxMinor: integer('tax_minor').notNull().default(0),
  feeMinor: integer('fee_minor').notNull().default(0),
  totalMinor: integer('total_minor').notNull(),
  netToCreatorMinor: integer('net_to_creator_minor').notNull(),
  currency: text('currency').notNull(),
  taxRegion: text('tax_region'), // e.g. 'GB'
  vatRateBps: integer('vat_rate_bps').notNull().default(0), // basis points
  lineItems: jsonb('line_items').notNull().default([]),
  providerRef: text('provider_ref'),
  providerStatus: text('provider_status'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),
  idempotencyKey: text('idempotency_key').unique(),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byBuyer: index('idx_dpc_orders_buyer').on(t.buyerIdentityId, t.status, t.createdAt),
  byCreator: index('idx_dpc_orders_creator').on(t.ownerIdentityId, t.status, t.createdAt),
}));

export const dpcDonations = pgTable('dpc_donations', {
  id: uuid('id').primaryKey().defaultRandom(),
  storefrontId: uuid('storefront_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(), // creator
  donorIdentityId: uuid('donor_identity_id'),
  donorDisplayName: text('donor_display_name'),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  status: text('status').notNull().default('pending'), // pending|paid|refunded|failed
  amountMinor: integer('amount_minor').notNull(),
  feeMinor: integer('fee_minor').notNull().default(0),
  netMinor: integer('net_minor').notNull(),
  currency: text('currency').notNull(),
  message: text('message'),
  providerRef: text('provider_ref'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  idempotencyKey: text('idempotency_key').unique(),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_dpc_donations_creator').on(t.ownerIdentityId, t.status, t.createdAt),
  byDonor: index('idx_dpc_donations_donor').on(t.donorIdentityId, t.createdAt),
}));

export const dpcLedger = pgTable('dpc_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  storefrontId: uuid('storefront_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  entryType: text('entry_type').notNull(), // credit|debit|refund|fee|payout|reversal
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull(),
  description: text('description').notNull(),
  sourceType: text('source_type').notNull(), // order|donation|pledge|adjustment|payout
  sourceId: uuid('source_id'),
  providerRef: text('provider_ref'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  byOwner: index('idx_dpc_ledger_owner').on(t.ownerIdentityId, t.occurredAt),
  bySource: index('idx_dpc_ledger_source').on(t.sourceType, t.sourceId),
}));

export const dpcAuditEvents = pgTable('dpc_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id'),
  actorIdentityId: uuid('actor_identity_id'),
  actorRole: text('actor_role'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOwner: index('idx_dpc_audit_owner').on(t.ownerIdentityId, t.createdAt) }));
