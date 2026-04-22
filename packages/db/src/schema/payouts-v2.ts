/**
 * Domain — Payouts v2 (multi-rail: bank/card/wallet/crypto).
 * Owner: apps/api-nest/src/modules/payouts-v2/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const payoutAccounts = pgTable('payout_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  rail: text('rail').notNull(), // bank|card|wallet|stripe_connect|paypal|crypto
  currency: text('currency').notNull().default('USD'),
  countryCode: text('country_code').notNull(),
  externalAccountId: text('external_account_id').notNull(),
  displayName: text('display_name').notNull(),
  status: text('status').notNull().default('pending_verification'), // pending_verification|active|disabled
  isDefault: boolean('is_default').notNull().default(false),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  accountId: uuid('account_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull(),
  status: text('status').notNull().default('pending'), // pending|processing|paid|failed|cancelled
  reference: text('reference').notNull().unique(),
  initiatedAt: timestamp('initiated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  feeAmountCents: integer('fee_amount_cents').notNull().default(0),
  netAmountCents: integer('net_amount_cents').notNull(),
  meta: jsonb('meta').notNull().default({}),
});

export const payoutLedger = pgTable('payout_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  payoutId: uuid('payout_id'),
  entryType: text('entry_type').notNull(), // credit|debit|reserve|release|fee
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull(),
  description: text('description').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});

export const payoutSchedules = pgTable('payout_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull().unique(),
  cadence: text('cadence').notNull().default('manual'), // manual|daily|weekly|monthly
  minAmountCents: integer('min_amount_cents').notNull().default(5000),
  defaultAccountId: uuid('default_account_id'),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
});
