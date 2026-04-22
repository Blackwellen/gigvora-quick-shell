/**
 * Domain 33 — Project Workspaces & Handover.
 * Auto-minted from D36 (csa.contract.activated). Owns workspaces, milestones,
 * deliverables, handover checklist, and the final report. Escrow release stays
 * in D34 + delivery + dispute domains.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const projectWorkspaces = pgTable('project_workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  projectId: uuid('project_id').notNull(),
  contractId: uuid('contract_id').notNull(),
  buyerId: uuid('buyer_id').notNull(),
  providerId: uuid('provider_id').notNull(),
  title: text('title').notNull(),
  status: text('status').notNull().default('active'), // active | paused | handover | completed | cancelled
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqContract: uniqueIndex('pw_contract_idx').on(t.contractId),
  projIdx: index('pw_project_idx').on(t.projectId),
}));

export const projectMilestones = pgTable('project_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => projectWorkspaces.id, { onDelete: 'cascade' }),
  ordering: integer('ordering').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  amountCents: integer('amount_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  status: text('status').notNull().default('pending'), // pending | in_progress | submitted | approved | rejected | released
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  releasedAt: timestamp('released_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('pms_workspace_order_idx').on(t.workspaceId, t.ordering),
  statusIdx: index('pms_workspace_status_idx').on(t.workspaceId, t.status),
}));

export const projectDeliverables = pgTable('project_deliverables', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => projectWorkspaces.id, { onDelete: 'cascade' }),
  milestoneId: uuid('milestone_id').references(() => projectMilestones.id, { onDelete: 'set null' }),
  uploaderId: uuid('uploader_id').notNull(),
  fileKey: text('file_key').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull().default('application/octet-stream'),
  sizeBytes: integer('size_bytes').notNull().default(0),
  status: text('status').notNull().default('submitted'), // submitted | accepted | rejected | revised
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  wsIdx: index('pd_workspace_idx').on(t.workspaceId, t.createdAt),
  msIdx: index('pd_milestone_idx').on(t.milestoneId),
}));

export const projectHandoverChecklists = pgTable('project_handover_checklists', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => projectWorkspaces.id, { onDelete: 'cascade' }),
  ordering: integer('ordering').notNull(),
  label: text('label').notNull(),
  required: boolean('required').notNull().default(true),
  done: boolean('done').notNull().default(false),
  doneBy: uuid('done_by'),
  doneAt: timestamp('done_at', { withTimezone: true }),
}, (t) => ({
  uniq: uniqueIndex('phc_workspace_order_idx').on(t.workspaceId, t.ordering),
}));

export const projectFinalReports = pgTable('project_final_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => projectWorkspaces.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull(),
  summary: text('summary').notNull().default(''),
  outcomes: jsonb('outcomes').notNull().default([]),
  ratings: jsonb('ratings').notNull().default({}),
  status: text('status').notNull().default('draft'), // draft | submitted | acknowledged
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('pfr_workspace_idx').on(t.workspaceId),
}));

export const projectWorkspaceEvents = pgTable('project_workspace_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => projectWorkspaces.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id'),
  event: text('event').notNull(), // workspace.minted | milestone.submitted | milestone.approved | deliverable.uploaded | handover.completed | report.submitted
  detail: jsonb('detail').notNull().default({}),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  wsIdx: index('pwe_workspace_idx').on(t.workspaceId, t.at),
}));
