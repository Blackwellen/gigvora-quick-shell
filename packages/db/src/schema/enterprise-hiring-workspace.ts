/**
 * Domain 20 — Enterprise Hiring Workspace.
 * Top-level container that groups requisitions, pipelines, hiring teams,
 * approval policies and weekly hiring metrics for an enterprise tenant.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const hiringWorkspaces = pgTable('hiring_workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  ownerId: uuid('owner_id').notNull(),
  status: text('status').notNull().default('active'), // active | archived
  defaultPipelineId: uuid('default_pipeline_id'),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugIdx: uniqueIndex('hw_tenant_slug_idx').on(t.tenantId, t.slug),
}));

export const hiringWorkspaceMembers = pgTable('hiring_workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  memberId: uuid('member_id').notNull(),
  role: text('role').notNull().default('recruiter'), // owner | admin | recruiter | hiring_manager | interviewer | viewer
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('hw_member_unique_idx').on(t.workspaceId, t.memberId),
  memberIdx: index('hw_member_idx').on(t.memberId),
}));

export const hiringPipelines = pgTable('hiring_pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  name: text('name').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  stages: jsonb('stages').notNull().default([]), // [{key,name,slaHours,kind}]
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  wsIdx: index('hp_workspace_idx').on(t.workspaceId),
}));

export const hiringApprovalPolicies = pgTable('hiring_approval_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  name: text('name').notNull(),
  scope: text('scope').notNull(), // requisition | offer | budget
  rules: jsonb('rules').notNull().default([]), // [{whenAmountGt, approvers:[{role,count}]}]
  active: boolean('active').notNull().default(true),
}, (t) => ({
  wsIdx: index('hap_workspace_idx').on(t.workspaceId, t.scope),
}));

export const hiringMetrics = pgTable('hiring_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  weekStart: timestamp('week_start', { withTimezone: true }).notNull(),
  openReqs: integer('open_reqs').notNull().default(0),
  newApps: integer('new_apps').notNull().default(0),
  hires: integer('hires').notNull().default(0),
  avgTimeToHireDays: integer('avg_time_to_hire_days').notNull().default(0),
  funnelSnapshot: jsonb('funnel_snapshot').notNull().default({}),
}, (t) => ({
  uniq: uniqueIndex('hm_workspace_week_idx').on(t.workspaceId, t.weekStart),
}));
