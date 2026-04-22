/**
 * Domain 30 — Proposal Builder & Bid Credits.
 * Owns proposal drafts, submissions, attachments, and the bid-credit ledger
 * (purchase, hold, refund, consume) that gates proposal sends.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  projectId: uuid('project_id').notNull(),
  authorId: uuid('author_id').notNull(),
  status: text('status').notNull().default('draft'), // draft | submitted | shortlisted | awarded | declined | withdrawn
  coverLetter: text('cover_letter').notNull().default(''),
  bidAmountCents: integer('bid_amount_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  durationDays: integer('duration_days').notNull().default(0),
  milestones: jsonb('milestones').notNull().default([]),
  creditsHeld: integer('credits_held').notNull().default(0),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  projIdx: index('pp_project_status_idx').on(t.projectId, t.status),
  authorIdx: index('pp_author_idx').on(t.authorId, t.status),
}));

export const proposalAttachments = pgTable('proposal_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').notNull().references(() => proposals.id, { onDelete: 'cascade' }),
  fileKey: text('file_key').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull().default('application/octet-stream'),
  sizeBytes: integer('size_bytes').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  propIdx: index('pa_proposal_idx').on(t.proposalId),
}));

export const proposalRevisions = pgTable('proposal_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').notNull().references(() => proposals.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  snapshot: jsonb('snapshot').notNull().default({}),
  authorId: uuid('author_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('pr_prop_version_idx').on(t.proposalId, t.version),
}));

export const bidCreditWallets = pgTable('bid_credit_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  balance: integer('balance').notNull().default(0),
  held: integer('held').notNull().default(0),
  lifetimePurchased: integer('lifetime_purchased').notNull().default(0),
  lifetimeConsumed: integer('lifetime_consumed').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('bcw_owner_idx').on(t.ownerId, t.tenantId),
}));

export const bidCreditLedger = pgTable('bid_credit_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => bidCreditWallets.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // purchase | hold | release | consume | refund | adjust
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  heldAfter: integer('held_after').notNull(),
  proposalId: uuid('proposal_id'),
  reference: text('reference'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  walletIdx: index('bcl_wallet_idx').on(t.walletId, t.createdAt),
  propIdx: index('bcl_proposal_idx').on(t.proposalId),
}));

export const bidCreditPurchases = pgTable('bid_credit_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => bidCreditWallets.id, { onDelete: 'cascade' }),
  packId: text('pack_id').notNull(),
  credits: integer('credits').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('pending'), // pending | confirmed | failed | refunded
  idempotencyKey: text('idempotency_key').notNull(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('bcp_idemp_idx').on(t.idempotencyKey),
}));
