/**
 * Domain 52 — Agency Management Dashboard, Delivery Ops, Utilization, and Client Portfolio.
 * Owner: apps/api-nest/src/modules/agency-management-dashboard/
 *
 * State machines:
 *   amd_engagements.status:   draft → active → at_risk | on_hold | completed | cancelled
 *   amd_deliverables.status:  todo → in_progress → review → done | blocked
 *   amd_invoices.status:      draft → sent → paid | overdue | written_off
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, numeric, index, date } from 'drizzle-orm/pg-core';

export const amdEngagements = pgTable('amd_engagements', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyIdentityId: uuid('agency_identity_id').notNull(),
  clientIdentityId: uuid('client_identity_id').notNull(),
  clientName: text('client_name').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'), // draft|active|at_risk|on_hold|completed|cancelled
  healthScore: integer('health_score').notNull().default(75), // 0-100
  budgetCents: integer('budget_cents').notNull().default(0),
  spentCents: integer('spent_cents').notNull().default(0),
  startsOn: date('starts_on'),
  endsOn: date('ends_on'),
  ownerIdentityId: uuid('owner_identity_id'),
  tags: jsonb('tags').notNull().default([]),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byAgency: index('idx_amd_eng_agency').on(t.agencyIdentityId, t.status),
  byClient: index('idx_amd_eng_client').on(t.clientIdentityId),
}));

export const amdDeliverables = pgTable('amd_deliverables', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyIdentityId: uuid('agency_identity_id').notNull(),
  engagementId: uuid('engagement_id').notNull(),
  title: text('title').notNull(),
  status: text('status').notNull().default('todo'), // todo|in_progress|review|done|blocked
  priority: text('priority').notNull().default('normal'), // low|normal|high|urgent
  assigneeIdentityId: uuid('assignee_identity_id'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  blockedReason: text('blocked_reason'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byAgency: index('idx_amd_deliv_agency').on(t.agencyIdentityId, t.status),
  byEngagement: index('idx_amd_deliv_eng').on(t.engagementId),
}));

export const amdUtilization = pgTable('amd_utilization', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyIdentityId: uuid('agency_identity_id').notNull(),
  memberIdentityId: uuid('member_identity_id').notNull(),
  memberName: text('member_name').notNull(),
  role: text('role'),
  capturedOn: date('captured_on').notNull(),
  capacityHours: numeric('capacity_hours', { precision: 6, scale: 2 }).notNull().default('40'),
  billableHours: numeric('billable_hours', { precision: 6, scale: 2 }).notNull().default('0'),
  nonBillableHours: numeric('non_billable_hours', { precision: 6, scale: 2 }).notNull().default('0'),
  utilizationRate: numeric('utilization_rate', { precision: 5, scale: 4 }).notNull().default('0'),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  byAgency: index('idx_amd_util_agency').on(t.agencyIdentityId, t.capturedOn),
  byMember: index('idx_amd_util_member').on(t.memberIdentityId, t.capturedOn),
}));

export const amdInvoices = pgTable('amd_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyIdentityId: uuid('agency_identity_id').notNull(),
  engagementId: uuid('engagement_id'),
  clientIdentityId: uuid('client_identity_id').notNull(),
  number: text('number').notNull(),
  status: text('status').notNull().default('draft'), // draft|sent|paid|overdue|written_off
  amountCents: integer('amount_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  issuedOn: date('issued_on'),
  dueOn: date('due_on'),
  paidOn: date('paid_on'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byAgency: index('idx_amd_inv_agency').on(t.agencyIdentityId, t.status),
}));

export const amdEvents = pgTable('amd_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyIdentityId: uuid('agency_identity_id').notNull(),
  actorIdentityId: uuid('actor_identity_id'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byAgency: index('idx_amd_events_agency').on(t.agencyIdentityId, t.createdAt),
}));
