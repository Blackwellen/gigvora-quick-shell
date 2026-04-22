/**
 * Domain 50 — Client and Buyer Dashboard, Spend, Proposals, and Project Oversight.
 * Owner: apps/api-nest/src/modules/client-dashboard/
 *
 * State machines:
 *   client_proposals.status: received → shortlisted → accepted | rejected | withdrawn | expired
 *   client_oversight_projects.status: planning → active → at_risk | on_hold | completed | cancelled
 *   client_spend_ledger.status: pending → cleared | refunded | disputed
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const clientSpendLedger = pgTable('client_spend_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientIdentityId: uuid('client_identity_id').notNull(),
  orgId: uuid('org_id'),
  category: text('category').notNull(), // gig|service|project|subscription|fee|tax|refund
  vendorIdentityId: uuid('vendor_identity_id'),
  vendorName: text('vendor_name'),
  referenceType: text('reference_type'), // order|invoice|milestone|subscription
  referenceId: uuid('reference_id'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('pending'), // pending|cleared|refunded|disputed
  spendAt: timestamp('spend_at', { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byClient: index('idx_client_spend_client').on(t.clientIdentityId, t.spendAt),
  byCategory: index('idx_client_spend_category').on(t.category),
}));

export const clientProposals = pgTable('client_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientIdentityId: uuid('client_identity_id').notNull(),
  projectId: uuid('project_id'),
  vendorIdentityId: uuid('vendor_identity_id').notNull(),
  vendorName: text('vendor_name'),
  title: text('title').notNull(),
  summary: text('summary'),
  amountCents: integer('amount_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  durationDays: integer('duration_days'),
  status: text('status').notNull().default('received'), // received|shortlisted|accepted|rejected|withdrawn|expired
  matchScore: numeric('match_score', { precision: 6, scale: 3 }), // 0-1 from ML
  decisionAt: timestamp('decision_at', { withTimezone: true }),
  decisionReason: text('decision_reason'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byClient: index('idx_client_proposals_client').on(t.clientIdentityId, t.status),
  byProject: index('idx_client_proposals_project').on(t.projectId),
}));

export const clientOversightProjects = pgTable('client_oversight_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientIdentityId: uuid('client_identity_id').notNull(),
  orgId: uuid('org_id'),
  title: text('title').notNull(),
  vendorIdentityId: uuid('vendor_identity_id'),
  vendorName: text('vendor_name'),
  status: text('status').notNull().default('planning'), // planning|active|at_risk|on_hold|completed|cancelled
  healthScore: integer('health_score').notNull().default(70), // 0-100
  budgetCents: integer('budget_cents').notNull().default(0),
  spentCents: integer('spent_cents').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }),
  dueAt: timestamp('due_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byClient: index('idx_client_oversight_client').on(t.clientIdentityId, t.status),
}));

export const clientSavedItems = pgTable('client_saved_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientIdentityId: uuid('client_identity_id').notNull(),
  itemType: text('item_type').notNull(), // gig|service|professional|company|project
  itemId: uuid('item_id').notNull(),
  label: text('label'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('uq_client_saved').on(t.clientIdentityId, t.itemType, t.itemId),
}));

export const clientApprovals = pgTable('client_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientIdentityId: uuid('client_identity_id').notNull(),
  orgId: uuid('org_id'),
  kind: text('kind').notNull(), // proposal|milestone|invoice|change_order|hire
  referenceId: uuid('reference_id').notNull(),
  title: text('title').notNull(),
  amountCents: integer('amount_cents'),
  currency: text('currency').default('USD'),
  status: text('status').notNull().default('pending'), // pending|approved|rejected|escalated
  requestedBy: uuid('requested_by'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  decisionNote: text('decision_note'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byClient: index('idx_client_approvals_client').on(t.clientIdentityId, t.status),
}));

export const clientDashboardEvents = pgTable('client_dashboard_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientIdentityId: uuid('client_identity_id').notNull(),
  actorIdentityId: uuid('actor_identity_id'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byClient: index('idx_client_events_client').on(t.clientIdentityId, t.createdAt),
}));
