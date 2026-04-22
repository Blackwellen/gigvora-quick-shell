/**
 * Domain — Referrals & Affiliate (codes → attribution → conversions → payouts).
 * Owner: apps/api-nest/src/modules/referrals-affiliate/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const referralCodes = pgTable('referral_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  code: text('code').notNull().unique(),
  programType: text('program_type').notNull().default('user'), // user|affiliate|partner
  rewardType: text('reward_type').notNull().default('flat'), // flat|percentage|tiered
  rewardValue: integer('reward_value').notNull().default(0),
  rewardCurrency: text('reward_currency').notNull().default('USD'),
  active: text('active').notNull().default('yes'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const referralVisits = pgTable('referral_visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeId: uuid('code_id').notNull(),
  visitorFingerprint: text('visitor_fingerprint').notNull(),
  source: text('source'),
  utm: jsonb('utm').notNull().default({}),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});

export const referralConversions = pgTable('referral_conversions', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeId: uuid('code_id').notNull(),
  convertedIdentityId: uuid('converted_identity_id').notNull(),
  conversionType: text('conversion_type').notNull(), // signup|first_purchase|subscription|gig_purchase
  amountCents: integer('amount_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  rewardCents: integer('reward_cents').notNull().default(0),
  status: text('status').notNull().default('pending'), // pending|approved|paid|reversed
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});

export const affiliatePayouts = pgTable('affiliate_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('pending'), // pending|approved|paid
  paidAt: timestamp('paid_at', { withTimezone: true }),
});
