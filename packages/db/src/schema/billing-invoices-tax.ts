/**
 * Domain 58 — Billing, Invoices, Tax, Subscriptions & Commercial Setup.
 * Owner: apps/api-nest/src/modules/billing-invoices-tax/
 *
 * State machines:
 *   bit_invoices.status:        draft → open → paid | partially_paid → paid
 *                               draft → void; open → uncollectible; paid → refunded
 *   bit_subscriptions.status:   trialing → active ↔ past_due → cancelled | paused → active
 *   bit_dunning_attempts.status: scheduled → succeeded | failed | skipped
 *   bit_disputes.status:        opened → under_review → won | lost | accepted
 *
 * Ledger: bit_invoice_events is append-only.
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, numeric, index, unique } from 'drizzle-orm/pg-core';

export const bitCommercialProfiles = pgTable('bit_commercial_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull().unique(),
  legalName: text('legal_name').notNull(),
  tradingName: text('trading_name'),
  taxId: text('tax_id'),                       // VAT, EIN, UTR, …
  taxScheme: text('tax_scheme').notNull().default('GB-VAT'),
  defaultCurrency: text('default_currency').notNull().default('GBP'),
  billingEmail: text('billing_email').notNull(),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: text('city').notNull(),
  region: text('region'),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull().default('GB'),
  invoicePrefix: text('invoice_prefix').notNull().default('INV'),
  nextInvoiceSeq: integer('next_invoice_seq').notNull().default(1),
  paymentTermsDays: integer('payment_terms_days').notNull().default(14),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bitTaxRates = pgTable('bit_tax_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  jurisdiction: text('jurisdiction').notNull(), // GB, EU-DE, US-CA …
  category: text('category').notNull().default('standard'), // standard|reduced|zero|exempt|reverse_charge
  rateBp: integer('rate_bp').notNull(),         // 2000 = 20.00%
  appliesFrom: timestamp('applies_from', { withTimezone: true }).notNull().defaultNow(),
  appliesTo: timestamp('applies_to', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({ byOwner: index('idx_bit_tax_rates_owner').on(t.ownerIdentityId, t.jurisdiction, t.category) }));

export const bitInvoices = pgTable('bit_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  customerIdentityId: uuid('customer_identity_id'),
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name').notNull(),
  number: text('number').notNull(),             // INV-2026-00012
  currency: text('currency').notNull().default('GBP'),
  subtotalMinor: integer('subtotal_minor').notNull().default(0),
  taxMinor: integer('tax_minor').notNull().default(0),
  discountMinor: integer('discount_minor').notNull().default(0),
  totalMinor: integer('total_minor').notNull().default(0),
  paidMinor: integer('paid_minor').notNull().default(0),
  refundedMinor: integer('refunded_minor').notNull().default(0),
  status: text('status').notNull().default('draft'),
  // draft|open|partially_paid|paid|void|uncollectible|refunded|partially_refunded
  issueDate: timestamp('issue_date', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  poNumber: text('po_number'),
  notes: text('notes'),
  pdfUrl: text('pdf_url'),
  reverseCharge: boolean('reverse_charge').notNull().default(false),
  taxJurisdiction: text('tax_jurisdiction'),
  subscriptionId: uuid('subscription_id'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqNumber: unique('uniq_bit_invoices_owner_number').on(t.ownerIdentityId, t.number),
  byOwner: index('idx_bit_invoices_owner').on(t.ownerIdentityId, t.status, t.dueDate),
  byCustomer: index('idx_bit_invoices_customer').on(t.customerIdentityId, t.status),
}));

export const bitInvoiceLineItems = pgTable('bit_invoice_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 14, scale: 4 }).notNull().default('1'),
  unitPriceMinor: integer('unit_price_minor').notNull().default(0),
  taxRateBp: integer('tax_rate_bp').notNull().default(0),
  amountMinor: integer('amount_minor').notNull().default(0),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({ byInvoice: index('idx_bit_invoice_lines_invoice').on(t.invoiceId) }));

export const bitInvoicePayments = pgTable('bit_invoice_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull(),
  provider: text('provider').notNull().default('stripe'),
  providerRef: text('provider_ref'),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull().default('GBP'),
  status: text('status').notNull().default('succeeded'), // pending|succeeded|failed|refunded
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({ byInvoice: index('idx_bit_invoice_payments_invoice').on(t.invoiceId, t.status) }));

export const bitCreditNotes = pgTable('bit_credit_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull(),
  number: text('number').notNull(),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull().default('GBP'),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('issued'), // issued|voided
  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqNum: unique('uniq_bit_credit_notes_number').on(t.number) }));

export const bitSubscriptions = pgTable('bit_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  customerIdentityId: uuid('customer_identity_id').notNull(),
  productKey: text('product_key').notNull(),
  planName: text('plan_name').notNull(),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull().default('GBP'),
  interval: text('interval').notNull().default('month'), // day|week|month|year
  intervalCount: integer('interval_count').notNull().default(1),
  status: text('status').notNull().default('trialing'),
  // trialing|active|past_due|paused|cancelled|incomplete
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAt: timestamp('cancel_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  pausedAt: timestamp('paused_at', { withTimezone: true }),
  externalProvider: text('external_provider'),
  externalSubscriptionId: text('external_subscription_id'),
  autoRenew: boolean('auto_renew').notNull().default(true),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOwner: index('idx_bit_subs_owner').on(t.ownerIdentityId, t.status), byCust: index('idx_bit_subs_customer').on(t.customerIdentityId, t.status) }));

export const bitDunningAttempts = pgTable('bit_dunning_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull(),
  attemptNumber: integer('attempt_number').notNull().default(1),
  status: text('status').notNull().default('scheduled'), // scheduled|succeeded|failed|skipped
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({ byInvoice: index('idx_bit_dunning_invoice').on(t.invoiceId, t.attemptNumber) }));

export const bitDisputes = pgTable('bit_disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull(),
  amountMinor: integer('amount_minor').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('opened'), // opened|under_review|won|lost|accepted
  evidenceUrl: text('evidence_url'),
  externalRef: text('external_ref'),
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({ byInvoice: index('idx_bit_disputes_invoice').on(t.invoiceId, t.status) }));

export const bitInvoiceEvents = pgTable('bit_invoice_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull(),
  kind: text('kind').notNull(),
  // created|issued|paid|partially_paid|voided|refunded|reminded|disputed|note|status_changed
  actorIdentityId: uuid('actor_identity_id'),
  amountMinor: integer('amount_minor').notNull().default(0),
  currency: text('currency').notNull().default('GBP'),
  reference: text('reference'),
  diff: jsonb('diff').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byInvoice: index('idx_bit_invoice_events_invoice').on(t.invoiceId, t.createdAt) }));

export const bitWebhookDeliveries = pgTable('bit_webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  eventId: text('event_id').notNull(),
  eventType: text('event_type').notNull(),
  signatureValid: text('signature_valid').notNull().default('true'),
  status: text('status').notNull().default('processed'), // processed|skipped|failed
  payload: jsonb('payload').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniq: unique('uniq_bit_webhook_provider_event').on(t.provider, t.eventId) }));

export const bitAuditEvents = pgTable('bit_audit_events', {
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
}, (t) => ({ byOwner: index('idx_bit_audit_owner').on(t.ownerIdentityId, t.createdAt) }));
