/**
 * Domain 56 — Resource Planning, Utilization, Capacity, and Assignment Dashboards.
 * Owner: apps/api-nest/src/modules/resource-planning-utilization/
 *
 * State machines:
 *   rpu_resources.status:    active ↔ inactive
 *   rpu_assignments.status:  draft → proposed → confirmed → active → completed
 *                            (any → cancelled, confirmed/active → on_hold ↔ active)
 */
import { pgTable, uuid, text, timestamp, jsonb, integer, numeric, date, index, unique } from 'drizzle-orm/pg-core';

export const rpuResources = pgTable('rpu_resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdentityId: uuid('org_identity_id').notNull(),
  identityId: uuid('identity_id'), // optional link to a person identity
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull(), // engineer, designer, pm, etc.
  team: text('team'),
  location: text('location'),
  timezone: text('timezone').notNull().default('UTC'),
  costRate: numeric('cost_rate', { precision: 10, scale: 2 }), // hourly cost
  billRate: numeric('bill_rate', { precision: 10, scale: 2 }), // hourly bill
  weeklyCapacityHours: integer('weekly_capacity_hours').notNull().default(40),
  skills: jsonb('skills').notNull().default([]),
  status: text('status').notNull().default('active'), // active|inactive
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOrg: index('idx_rpu_resources_org').on(t.orgIdentityId, t.status),
  uniqEmail: unique('uniq_rpu_resources_org_email').on(t.orgIdentityId, t.email),
}));

export const rpuProjects = pgTable('rpu_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdentityId: uuid('org_identity_id').notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  clientName: text('client_name'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  budgetHours: integer('budget_hours'),
  status: text('status').notNull().default('active'), // active|paused|completed|archived
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOrg: index('idx_rpu_projects_org').on(t.orgIdentityId, t.status),
  uniqCode: unique('uniq_rpu_projects_org_code').on(t.orgIdentityId, t.code),
}));

export const rpuAssignments = pgTable('rpu_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdentityId: uuid('org_identity_id').notNull(),
  resourceId: uuid('resource_id').notNull(),
  projectId: uuid('project_id').notNull(),
  role: text('role'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  hoursPerWeek: numeric('hours_per_week', { precision: 5, scale: 2 }).notNull(),
  status: text('status').notNull().default('draft'),
  // draft|proposed|confirmed|active|on_hold|completed|cancelled
  notes: text('notes'),
  cancelledReason: text('cancelled_reason'),
  proposedAt: timestamp('proposed_at', { withTimezone: true }),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOrg: index('idx_rpu_assignments_org').on(t.orgIdentityId, t.status),
  byResource: index('idx_rpu_assignments_resource').on(t.resourceId, t.startDate, t.endDate),
  byProject: index('idx_rpu_assignments_project').on(t.projectId, t.status),
}));

export const rpuTimeOff = pgTable('rpu_time_off', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdentityId: uuid('org_identity_id').notNull(),
  resourceId: uuid('resource_id').notNull(),
  kind: text('kind').notNull().default('pto'), // pto|sick|holiday|other
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  hoursPerDay: numeric('hours_per_day', { precision: 4, scale: 2 }).notNull().default('8.00'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byResource: index('idx_rpu_time_off_resource').on(t.resourceId, t.startDate),
}));

export const rpuAuditEvents = pgTable('rpu_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdentityId: uuid('org_identity_id').notNull(),
  actorIdentityId: uuid('actor_identity_id'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOrg: index('idx_rpu_audit_org').on(t.orgIdentityId, t.createdAt),
}));
