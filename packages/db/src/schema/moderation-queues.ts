/**
 * Domain — Moderation Queues (T&S reports → triage → decision → audit).
 * Owner: apps/api-nest/src/modules/moderation-queues/
 */
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const moderationReports = pgTable('moderation_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id'),
  targetType: text('target_type').notNull(), // post|profile|message|media|comment|review
  targetId: text('target_id').notNull(),
  reasonCode: text('reason_code').notNull(), // spam|harassment|hate|csam|illegal|other
  reasonDetail: text('reason_detail'),
  evidence: jsonb('evidence').notNull().default([]),
  status: text('status').notNull().default('open'), // open|triaging|escalated|resolved|dismissed
  priority: text('priority').notNull().default('normal'), // low|normal|high|critical
  assignedTo: uuid('assigned_to'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const moderationDecisions = pgTable('moderation_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id'),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  decidedBy: uuid('decided_by').notNull(),
  action: text('action').notNull(), // none|warn|hide|remove|suspend|ban|escalate_legal
  rationale: text('rationale').notNull(),
  appealable: text('appealable').notNull().default('yes'),
  decidedAt: timestamp('decided_at', { withTimezone: true }).notNull().defaultNow(),
});

export const moderationAppeals = pgTable('moderation_appeals', {
  id: uuid('id').primaryKey().defaultRandom(),
  decisionId: uuid('decision_id').notNull(),
  appellantId: uuid('appellant_id').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('pending'), // pending|upheld|overturned
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const moderationAudit = pgTable('moderation_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id'),
  decisionId: uuid('decision_id'),
  actorId: uuid('actor_id'),
  event: text('event').notNull(),
  detail: jsonb('detail').notNull().default({}),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});
