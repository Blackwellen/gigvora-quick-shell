/**
 * Domain — Reporting (saved reports, scheduled runs, distribution).
 * Owner: apps/api-nest/src/modules/reporting/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const reportDefinitions = pgTable('report_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  kind: text('kind').notNull().default('table'),    // table|chart|dashboard
  query: jsonb('query').notNull(),                  // structured query DSL
  visualization: jsonb('visualization').notNull().default({}),
  visibility: text('visibility').notNull().default('private'), // private|team|public
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reportSchedules = pgTable('report_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull(),
  cronExpr: text('cron_expr').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  enabled: boolean('enabled').notNull().default(true),
  recipients: jsonb('recipients').$type<Array<{ kind: 'email' | 'webhook' | 'slack'; target: string }>>().notNull().default([]),
  format: text('format').notNull().default('pdf'),  // pdf|csv|xlsx|json
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
});

export const reportRuns = pgTable('report_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull(),
  scheduleId: uuid('schedule_id'),
  status: text('status').notNull().default('queued'), // queued|running|succeeded|failed
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  rowCount: integer('row_count'),
  artifactUrl: text('artifact_url'),
  errorMessage: text('error_message'),
  meta: jsonb('meta').notNull().default({}),
});

export const reportSubscriptions = pgTable('report_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  channel: text('channel').notNull().default('email'), // email|in_app|slack
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
