/**
 * Domain 51 — Recruiter Dashboard, Pipelines, Response Rates, and Hiring Velocity.
 * Owner: apps/api-nest/src/modules/recruiter-dashboard/
 *
 * State machines:
 *   recruiter_dashboard_pipelines.status: draft → active → paused → archived
 *   recruiter_dashboard_outreach.status:  queued → sent → opened → replied → bounced | unsubscribed
 *   recruiter_dashboard_velocity_snapshots: append-only daily snapshots
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, numeric, index, uniqueIndex, date } from 'drizzle-orm/pg-core';

export const recruiterDashboardPipelines = pgTable('recruiter_dashboard_pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  recruiterIdentityId: uuid('recruiter_identity_id').notNull(),
  orgId: uuid('org_id'),
  jobId: uuid('job_id'),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'), // draft|active|paused|archived
  totalCandidates: integer('total_candidates').notNull().default(0),
  activeCandidates: integer('active_candidates').notNull().default(0),
  hiredCount: integer('hired_count').notNull().default(0),
  rejectedCount: integer('rejected_count').notNull().default(0),
  withdrawnCount: integer('withdrawn_count').notNull().default(0),
  stageCounts: jsonb('stage_counts').notNull().default({}), // { sourced: 12, screen: 5, ... }
  averageDaysToFill: numeric('average_days_to_fill', { precision: 6, scale: 2 }),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byRecruiter: index('idx_rd_pipelines_recruiter').on(t.recruiterIdentityId, t.status),
}));

export const recruiterDashboardOutreach = pgTable('recruiter_dashboard_outreach', {
  id: uuid('id').primaryKey().defaultRandom(),
  recruiterIdentityId: uuid('recruiter_identity_id').notNull(),
  pipelineId: uuid('pipeline_id'),
  candidateIdentityId: uuid('candidate_identity_id').notNull(),
  channel: text('channel').notNull().default('email'), // email|inmail|sms|call
  subject: text('subject'),
  status: text('status').notNull().default('queued'), // queued|sent|opened|replied|bounced|unsubscribed
  sentAt: timestamp('sent_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  repliedAt: timestamp('replied_at', { withTimezone: true }),
  responseTimeHours: numeric('response_time_hours', { precision: 8, scale: 2 }),
  templateId: uuid('template_id'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byRecruiter: index('idx_rd_outreach_recruiter').on(t.recruiterIdentityId, t.status),
  byPipeline: index('idx_rd_outreach_pipeline').on(t.pipelineId),
}));

export const recruiterDashboardVelocity = pgTable('recruiter_dashboard_velocity', {
  id: uuid('id').primaryKey().defaultRandom(),
  recruiterIdentityId: uuid('recruiter_identity_id').notNull(),
  pipelineId: uuid('pipeline_id'),
  capturedOn: date('captured_on').notNull(),
  daysToFirstResponse: numeric('days_to_first_response', { precision: 6, scale: 2 }),
  daysToShortlist: numeric('days_to_shortlist', { precision: 6, scale: 2 }),
  daysToOffer: numeric('days_to_offer', { precision: 6, scale: 2 }),
  daysToHire: numeric('days_to_hire', { precision: 6, scale: 2 }),
  responseRate: numeric('response_rate', { precision: 5, scale: 4 }), // 0-1
  conversionRate: numeric('conversion_rate', { precision: 5, scale: 4 }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('uq_rd_velocity').on(t.recruiterIdentityId, t.pipelineId, t.capturedOn),
}));

export const recruiterDashboardTasks = pgTable('recruiter_dashboard_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  recruiterIdentityId: uuid('recruiter_identity_id').notNull(),
  pipelineId: uuid('pipeline_id'),
  candidateIdentityId: uuid('candidate_identity_id'),
  kind: text('kind').notNull(), // followup|review|interview|offer|reference|admin
  title: text('title').notNull(),
  priority: text('priority').notNull().default('normal'), // low|normal|high|urgent
  status: text('status').notNull().default('open'), // open|in_progress|done|snoozed|dismissed
  dueAt: timestamp('due_at', { withTimezone: true }),
  snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byRecruiter: index('idx_rd_tasks_recruiter').on(t.recruiterIdentityId, t.status),
}));

export const recruiterDashboardEvents = pgTable('recruiter_dashboard_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  recruiterIdentityId: uuid('recruiter_identity_id').notNull(),
  actorIdentityId: uuid('actor_identity_id'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byRecruiter: index('idx_rd_events_recruiter').on(t.recruiterIdentityId, t.createdAt),
}));
