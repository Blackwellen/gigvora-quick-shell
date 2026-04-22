/**
 * Domain 59 — Payouts, Escrow, Finance Operations & Hold Management.
 * Owner: apps/api-nest/src/modules/payouts-escrow-finops/
 *
 * State machines:
 *   pef_payouts.status:    pending → processing → paid | failed | cancelled
 *                          failed → processing (retry); pending → cancelled
 *   pef_escrows.status:    held → released | refunded | disputed
 *                          disputed → released | refunded
 *   pef_holds.status:      open → released | escalated | converted_to_dispute
 *   pef_disputes.status:   opened → under_review → resolved | rejected
 *
 * Ledger: pef_ledger_entries is append-only (DB trigger).
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, index, unique } from 'drizzle-orm/pg-core';

export const pefPayoutAccounts = pgTable('pef_payout_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  rail: text('rail').notNull(), // bank|stripe_connect|paypal|wise|crypto
  currency: text('currency').notNull().default('GBP'),
  countryCode: text('country_code').notNull().default('GB'),
  externalAccountId: text('external_account_id').notNull(),
  displayName: text('display_name').notNull(),
  status: text('status').notNull().default('pending_verification'), // pending_verification|active|disabled
  isDefault: boolean('is_default').notNull().default(false),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: unique('uniq_pef_payout_acct').on(t.ownerIdentityId, t.rail, t.externalAccountId),
  byOwner: index('idx_pef_payout_acct_owner').on(t.ownerIdentityId, t.status),
}));

export const pefPayouts = pgTable('pef_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  accountId: uuid('account_id').notNull(),
  amountMinor: integer('amount_minor').notNull(),
  feeMinor: integer('fee_minor').notNull().default(0),
  netAmountMinor: integer('net_amount_minor').notNull(),
  currency: text('currency').notNull().default('GBP'),
  status: text('status').notNull().default('pending'),
  // pending|processing|paid|failed|cancelled
  reference: text('reference').notNull(),
  initiatedAt: timestamp('initiated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  externalProvider: text('external_provider'),
  externalRef: text('external_ref'),
  retryCount: integer('retry_count').notNull().default(0),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  uniqRef: unique('uniq_pef_payout_ref').on(t.reference),
  byOwner: index('idx_pef_payouts_owner').on(t.ownerIdentityId, t.initiatedAt),
  byStatus: index('idx_pef_payouts_status').on(t.status, t.initiatedAt),
}));

export const pefPayoutSchedules = pgTable('pef_payout_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull().unique(),
  cadence: text('cadence').notNull().default('manual'), // manual|daily|weekly|monthly
  minAmountMinor: integer('min_amount_minor').notNull().default(5000),
  defaultAccountId: uuid('default_account_id'),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
});

export const pefEscrows = pgTable('pef_escrows', {
  id: uuid('id').primaryKey().defaultRandom(),
  payerIdentityId: uuid('payer_identity_id').notNull(),
  payeeIdentityId: uuid('payee_identity_id').notNull(),
  contextType: text('context_type').notNull(),  // project|gig|service|booking|award
  contextId: uuid('context_id').notNull(),
  amountMinor: integer('amount_minor').notNull(),
  releasedMinor: integer('released_minor').notNull().default(0),
  refundedMinor: integer('refunded_minor').notNull().default(0),
  currency: text('currency').notNull().default('GBP'),
  status: text('status').notNull().default('held'),
  // held|released|refunded|disputed|partially_released
  heldAt: timestamp('held_at', { withTimezone: true }).notNull().defaultNow(),
  releasedAt: timestamp('released_at', { withTimezone: true }),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  reference: text('reference').notNull(),
  externalProvider: text('external_provider'),
  externalRef: text('external_ref'),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  uniqRef: unique('uniq_pef_escrow_ref').on(t.reference),
  byContext: index('idx_pef_escrows_context').on(t.contextType, t.contextId),
  byPayee: index('idx_pef_escrows_payee').on(t.payeeIdentityId, t.status),
}));

export const pefHolds = pgTable('pef_holds', {
  id: uuid('id').primaryKey().defaultRandom(),
  subjectType: text('subject_type').notNull(), // payout|escrow|invoice|account
  subjectId: uuid('subject_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  reasonCode: text('reason_code').notNull(),
  // risk_review|kyc_pending|provider_block|dispute|manual|chargeback_risk|sanctions
  reasonDetail: text('reason_detail'),
  status: text('status').notNull().default('open'),
  // open|released|escalated|converted_to_dispute
  amountMinor: integer('amount_minor').notNull().default(0),
  currency: text('currency').notNull().default('GBP'),
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  openedByIdentityId: uuid('opened_by_identity_id'),
  resolvedByIdentityId: uuid('resolved_by_identity_id'),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  bySubject: index('idx_pef_holds_subject').on(t.subjectType, t.subjectId),
  byStatus: index('idx_pef_holds_status').on(t.status, t.openedAt),
}));

export const pefDisputes = pgTable('pef_disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  escrowId: uuid('escrow_id'),
  payoutId: uuid('payout_id'),
  raisedByIdentityId: uuid('raised_by_identity_id').notNull(),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull().default('GBP'),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('opened'),
  // opened|under_review|resolved|rejected
  evidenceUrl: text('evidence_url'),
  resolution: text('resolution'),
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({ byStatus: index('idx_pef_disputes_status').on(t.status, t.openedAt) }));

export const pefLedgerEntries = pgTable('pef_ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  entryType: text('entry_type').notNull(),
  // credit|debit|reserve|release|refund|fee|adjustment|hold|hold_release
  refType: text('ref_type'),  // payout|escrow|hold|dispute|adjustment
  refId: uuid('ref_id'),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull().default('GBP'),
  description: text('description').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({ byOwner: index('idx_pef_ledger_owner').on(t.ownerIdentityId, t.occurredAt) }));

export const pefReconciliationRuns = pgTable('pef_reconciliation_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('pending'),
  // pending|reconciled|partial|failed
  matchedCount: integer('matched_count').notNull().default(0),
  unmatchedCount: integer('unmatched_count').notNull().default(0),
  diffMinor: integer('diff_minor').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
});

export const pefWebhookDeliveries = pgTable('pef_webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  eventId: text('event_id').notNull(),
  eventType: text('event_type').notNull(),
  signatureValid: boolean('signature_valid').notNull().default(true),
  status: text('status').notNull().default('processed'),
  payload: jsonb('payload').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniq: unique('uniq_pef_webhook').on(t.provider, t.eventId) }));

export const pefAuditEvents = pgTable('pef_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id'),
  actorIdentityId: uuid('actor_identity_id'),
  actorRole: text('actor_role'),  // owner|admin|operator|system
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOwner: index('idx_pef_audit_owner').on(t.ownerIdentityId, t.createdAt) }));
