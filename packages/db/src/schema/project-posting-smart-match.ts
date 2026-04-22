/**
 * Domain 32 — Project Posting Studio, Smart Match & Invite Flows.
 * Source-of-truth for projects, candidate suggestion runs, invites, multi-step
 * approval workflow, boost-credit wallet+ledger, and outbound webhook log.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  ownerId: uuid('owner_id').notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  summary: text('summary').notNull().default(''),
  description: text('description').notNull().default(''),
  category: text('category'),
  skills: jsonb('skills').notNull().default([]),
  budgetType: text('budget_type').notNull().default('fixed'), // fixed | hourly | range
  budgetMinCents: integer('budget_min_cents').notNull().default(0),
  budgetMaxCents: integer('budget_max_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  durationDays: integer('duration_days').notNull().default(0),
  workMode: text('work_mode').notNull().default('remote'), // remote | hybrid | onsite
  location: text('location'),
  status: text('status').notNull().default('draft'), // draft | pending_approval | published | paused | closed | archived
  visibility: text('visibility').notNull().default('public'), // public | invite_only | private
  approvalState: text('approval_state').notNull().default('none'), // none | requested | approved | rejected
  publishedAt: timestamp('published_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqSlug: uniqueIndex('pj_tenant_slug_idx').on(t.tenantId, t.slug),
  statusIdx: index('pj_tenant_status_idx').on(t.tenantId, t.status),
}));

export const projectApprovals = pgTable('project_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  step: integer('step').notNull(),
  approverId: uuid('approver_id').notNull(),
  decision: text('decision').notNull().default('pending'), // pending | approved | rejected
  rationale: text('rationale'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('pja_project_step_idx').on(t.projectId, t.step),
}));

export const projectMatchRuns = pgTable('project_match_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  modelVersion: text('model_version').notNull().default('fallback-v1'),
  diversifyEnabled: boolean('diversify_enabled').notNull().default(true),
  candidateCount: integer('candidate_count').notNull().default(0),
  ranAt: timestamp('ran_at', { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb('metadata').notNull().default({}),
}, (t) => ({
  projIdx: index('pmr_project_idx').on(t.projectId, t.ranAt),
}));

export const projectMatchCandidates = pgTable('project_match_candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => projectMatchRuns.id, { onDelete: 'cascade' }),
  candidateId: uuid('candidate_id').notNull(),
  score: integer('score').notNull().default(0), // 0-1000
  rank: integer('rank').notNull().default(0),
  reasons: jsonb('reasons').notNull().default([]),
}, (t) => ({
  runIdx: index('pmc_run_rank_idx').on(t.runId, t.rank),
}));

export const projectInvites = pgTable('project_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  inviterId: uuid('inviter_id').notNull(),
  candidateId: uuid('candidate_id').notNull(),
  status: text('status').notNull().default('sent'), // sent | viewed | accepted | declined | expired | withdrawn
  message: text('message'),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (t) => ({
  uniq: uniqueIndex('pin_project_candidate_idx').on(t.projectId, t.candidateId),
  candIdx: index('pin_candidate_idx').on(t.candidateId, t.status),
}));

export const projectBoostWallets = pgTable('project_boost_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  balance: integer('balance').notNull().default(0),
  lifetimePurchased: integer('lifetime_purchased').notNull().default(0),
  lifetimeConsumed: integer('lifetime_consumed').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('pbw_owner_idx').on(t.ownerId, t.tenantId),
}));

export const projectBoostLedger = pgTable('project_boost_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => projectBoostWallets.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // purchase | consume | refund | adjust
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  projectId: uuid('project_id'),
  reference: text('reference'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  walletIdx: index('pbl_wallet_idx').on(t.walletId, t.createdAt),
}));

export const projectBoostPurchases = pgTable('project_boost_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => projectBoostWallets.id, { onDelete: 'cascade' }),
  packId: text('pack_id').notNull(),
  credits: integer('credits').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('pending'), // pending | confirmed | failed | refunded
  idempotencyKey: text('idempotency_key').notNull(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('pbp_idemp_idx').on(t.idempotencyKey),
}));

export const projectOutboundWebhooks = pgTable('project_outbound_webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  event: text('event').notNull(), // pps.project.published, pps.invite.sent, ...
  targetUrl: text('target_url').notNull(),
  payload: jsonb('payload').notNull().default({}),
  status: text('status').notNull().default('queued'), // queued | sent | failed | dead
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  statusIdx: index('pow_status_idx').on(t.status, t.createdAt),
  eventIdx: index('pow_event_idx').on(t.tenantId, t.event),
}));
