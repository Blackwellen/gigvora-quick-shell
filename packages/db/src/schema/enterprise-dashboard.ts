/**
 * Domain 53 — Enterprise & Company Dashboard, Hiring, Procurement, Team Operations.
 * Owner: apps/api-nest/src/modules/enterprise-dashboard/
 *
 * State machines:
 *   ed_requisitions.status:    draft → open → on_hold | filled | cancelled
 *   ed_purchase_orders.status: draft → submitted → approved | rejected → received | cancelled
 *   ed_team_tasks.status:      todo ↔ in_progress → blocked | done
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, index, date } from 'drizzle-orm/pg-core';

export const edRequisitions = pgTable('ed_requisitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  enterpriseIdentityId: uuid('enterprise_identity_id').notNull(),
  title: text('title').notNull(),
  department: text('department'),
  location: text('location'),
  seniority: text('seniority').notNull().default('mid'),
  headcount: integer('headcount').notNull().default(1),
  status: text('status').notNull().default('open'), // draft|open|on_hold|filled|cancelled
  budgetCents: integer('budget_cents').notNull().default(0),
  applicants: integer('applicants').notNull().default(0),
  ownerIdentityId: uuid('owner_identity_id'),
  openedOn: date('opened_on'),
  targetFillBy: date('target_fill_by'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byEnt: index('idx_ed_req_ent').on(t.enterpriseIdentityId, t.status),
}));

export const edPurchaseOrders = pgTable('ed_purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  enterpriseIdentityId: uuid('enterprise_identity_id').notNull(),
  poNumber: text('po_number').notNull(),
  vendorName: text('vendor_name').notNull(),
  vendorIdentityId: uuid('vendor_identity_id'),
  category: text('category'), // software|services|hardware|other
  status: text('status').notNull().default('draft'), // draft|submitted|approved|rejected|received|cancelled
  amountCents: integer('amount_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  requesterIdentityId: uuid('requester_identity_id'),
  approverIdentityId: uuid('approver_identity_id'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  receivedOn: date('received_on'),
  notes: text('notes'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byEnt: index('idx_ed_po_ent').on(t.enterpriseIdentityId, t.status),
}));

export const edTeamMembers = pgTable('ed_team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  enterpriseIdentityId: uuid('enterprise_identity_id').notNull(),
  memberIdentityId: uuid('member_identity_id').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role'),
  department: text('department'),
  managerIdentityId: uuid('manager_identity_id'),
  status: text('status').notNull().default('active'), // active|onboarding|offboarding|inactive
  startedOn: date('started_on'),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  byEnt: index('idx_ed_member_ent').on(t.enterpriseIdentityId, t.status),
}));

export const edTeamTasks = pgTable('ed_team_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  enterpriseIdentityId: uuid('enterprise_identity_id').notNull(),
  title: text('title').notNull(),
  status: text('status').notNull().default('todo'), // todo|in_progress|blocked|done
  priority: text('priority').notNull().default('normal'), // low|normal|high|urgent
  category: text('category'), // hiring|procurement|ops|compliance|finance
  assigneeIdentityId: uuid('assignee_identity_id'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  blockedReason: text('blocked_reason'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byEnt: index('idx_ed_task_ent').on(t.enterpriseIdentityId, t.status),
}));

export const edSpendLedger = pgTable('ed_spend_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  enterpriseIdentityId: uuid('enterprise_identity_id').notNull(),
  occurredOn: date('occurred_on').notNull(),
  category: text('category').notNull(), // hiring|procurement|payroll|software|services|other
  amountCents: integer('amount_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  vendorName: text('vendor_name'),
  refType: text('ref_type'),
  refId: uuid('ref_id'),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  byEnt: index('idx_ed_spend_ent').on(t.enterpriseIdentityId, t.occurredOn),
}));

export const edEvents = pgTable('ed_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  enterpriseIdentityId: uuid('enterprise_identity_id').notNull(),
  actorIdentityId: uuid('actor_identity_id'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byEnt: index('idx_ed_events_ent').on(t.enterpriseIdentityId, t.createdAt),
}));
