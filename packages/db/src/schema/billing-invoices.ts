/**
 * Domain — Billing & Invoices.
 * Owner: apps/api-nest/src/modules/billing-invoices/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, numeric } from 'drizzle-orm/pg-core';

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: text('number').notNull().unique(), // INV-2025-000123
  issuerIdentityId: uuid('issuer_identity_id').notNull(),
  customerIdentityId: uuid('customer_identity_id'),
  customerEmail: text('customer_email'),
  customerName: text('customer_name'),
  currency: text('currency').notNull().default('USD'),
  subtotalCents: integer('subtotal_cents').notNull().default(0),
  taxCents: integer('tax_cents').notNull().default(0),
  discountCents: integer('discount_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull().default(0),
  amountPaidCents: integer('amount_paid_cents').notNull().default(0),
  status: text('status').notNull().default('draft'), // draft|open|paid|partial|void|uncollectible|refunded
  issueDate: timestamp('issue_date', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  notes: text('notes'),
  poNumber: text('po_number'),
  pdfUrl: text('pdf_url'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const invoiceLineItems = pgTable('invoice_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 14, scale: 4 }).notNull().default('1'),
  unitPriceCents: integer('unit_price_cents').notNull().default(0),
  taxRateBps: integer('tax_rate_bps').notNull().default(0), // 2000 = 20%
  amountCents: integer('amount_cents').notNull().default(0),
  meta: jsonb('meta').notNull().default({}),
});

export const invoicePayments = pgTable('invoice_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull(),
  provider: text('provider').notNull(), // stripe|paddle|wire|cash|other
  externalRef: text('external_ref'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('succeeded'), // pending|succeeded|failed|refunded
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb('meta').notNull().default({}),
});

export const recurringSubscriptions = pgTable('recurring_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerIdentityId: uuid('customer_identity_id').notNull(),
  productKey: text('product_key').notNull(),
  interval: text('interval').notNull().default('month'), // day|week|month|year
  intervalCount: integer('interval_count').notNull().default(1),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('active'), // trialing|active|past_due|cancelled|paused
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAt: timestamp('cancel_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  externalSubscriptionId: text('external_subscription_id'),
  externalProvider: text('external_provider'), // stripe|paddle
  autoRenew: boolean('auto_renew').notNull().default(true),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const creditNotes = pgTable('credit_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull(),
  number: text('number').notNull().unique(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('issued'), // issued|voided
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
