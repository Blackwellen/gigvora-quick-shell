/**
 * Domain 64 — Pricing, Promotions, Offer Packaging & Monetization Surfaces.
 *
 * Tables (`ppm_*`):
 *   ppm_price_books     — owner-scoped price book (currency + status)
 *   ppm_price_entries   — versioned price rows (sku/key + tier + minor units)
 *   ppm_offer_packages  — bundled packages (Starter/Pro/Enterprise style)
 *   ppm_promotions      — discount codes / automatic promos with usage caps
 *   ppm_promo_redemptions — append-only redemption log (idempotent per code+order)
 *   ppm_quotes          — quote (computed totals, expiry, accepted/expired)
 *   ppm_audit_events    — audit trail
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, index, unique } from 'drizzle-orm/pg-core';

export const ppmPriceBooks = pgTable('ppm_price_books', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  name: text('name').notNull(),
  currency: text('currency').notNull().default('GBP'),
  status: text('status').notNull().default('draft'), // draft|active|archived
  isDefault: boolean('is_default').notNull().default(false),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_ppm_books_owner').on(t.ownerIdentityId, t.status),
}));

export const ppmPriceEntries = pgTable('ppm_price_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  priceBookId: uuid('price_book_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  sku: text('sku').notNull(),
  tier: text('tier').notNull().default('standard'), // standard|starter|pro|enterprise|custom
  unitMinor: integer('unit_minor').notNull(),
  currency: text('currency').notNull(),
  minQuantity: integer('min_quantity').notNull().default(1),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull().defaultNow(),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  byBook: index('idx_ppm_entries_book').on(t.priceBookId, t.sku, t.tier),
  uniqLive: unique('uniq_ppm_entry_live').on(t.priceBookId, t.sku, t.tier, t.validFrom),
}));

export const ppmOfferPackages = pgTable('ppm_offer_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  tier: text('tier').notNull().default('standard'),
  status: text('status').notNull().default('draft'), // draft|active|paused|archived
  priceMinor: integer('price_minor').notNull(),
  currency: text('currency').notNull().default('GBP'),
  billingInterval: text('billing_interval').notNull().default('one_time'), // one_time|month|year
  features: jsonb('features').notNull().default([]),
  highlight: boolean('highlight').notNull().default(false),
  position: integer('position').notNull().default(0),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_ppm_packages_owner').on(t.ownerIdentityId, t.status, t.position),
  uniqSlug: unique('uniq_ppm_package_slug').on(t.ownerIdentityId, t.slug),
}));

export const ppmPromotions = pgTable('ppm_promotions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  code: text('code').notNull(),
  status: text('status').notNull().default('draft'), // draft|active|paused|expired|archived
  kind: text('kind').notNull().default('percent'), // percent|fixed|free_trial
  valueBps: integer('value_bps').notNull().default(0), // for percent (basis points)
  valueMinor: integer('value_minor').notNull().default(0), // for fixed
  currency: text('currency').notNull().default('GBP'),
  appliesTo: text('applies_to').notNull().default('any'), // any|package|sku|first_purchase
  appliesToRefs: jsonb('applies_to_refs').notNull().default([]),
  maxRedemptions: integer('max_redemptions'), // null = unlimited
  perUserLimit: integer('per_user_limit').notNull().default(1),
  redeemedCount: integer('redeemed_count').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  minSubtotalMinor: integer('min_subtotal_minor').notNull().default(0),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_ppm_promos_owner').on(t.ownerIdentityId, t.status),
  uniqCode: unique('uniq_ppm_promo_code').on(t.ownerIdentityId, t.code),
}));

export const ppmPromoRedemptions = pgTable('ppm_promo_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  promotionId: uuid('promotion_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  redeemedByIdentityId: uuid('redeemed_by_identity_id').notNull(),
  orderRef: text('order_ref'),
  discountMinor: integer('discount_minor').notNull(),
  currency: text('currency').notNull(),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  byPromo: index('idx_ppm_redempt_promo').on(t.promotionId, t.redeemedAt),
  byUser: index('idx_ppm_redempt_user').on(t.redeemedByIdentityId, t.promotionId),
  uniqOrder: unique('uniq_ppm_redempt_order').on(t.promotionId, t.orderRef),
}));

export const ppmQuotes = pgTable('ppm_quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  customerIdentityId: uuid('customer_identity_id'),
  status: text('status').notNull().default('draft'), // draft|sent|accepted|expired|cancelled
  subtotalMinor: integer('subtotal_minor').notNull(),
  discountMinor: integer('discount_minor').notNull().default(0),
  taxMinor: integer('tax_minor').notNull().default(0),
  totalMinor: integer('total_minor').notNull(),
  currency: text('currency').notNull().default('GBP'),
  promoCode: text('promo_code'),
  lineItems: jsonb('line_items').notNull().default([]),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_ppm_quotes_owner').on(t.ownerIdentityId, t.status, t.createdAt),
  byCustomer: index('idx_ppm_quotes_customer').on(t.customerIdentityId, t.status),
}));

export const ppmAuditEvents = pgTable('ppm_audit_events', {
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
}, (t) => ({ byOwner: index('idx_ppm_audit_owner').on(t.ownerIdentityId, t.createdAt) }));
