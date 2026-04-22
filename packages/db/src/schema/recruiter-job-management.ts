/**
 * Domain — Recruiter Job Management (Recruiter Pro workspace).
 *
 * The recruiter-side counterpart to D17 (Job Posting Studio) and D14
 * (Job Application Flow). Owns recruiter-private artefacts:
 *   - Pipelines (named workflow templates per role/team)
 *   - Stages within a pipeline (ordered, with SLA + scorecard pointer)
 *   - Candidate-to-stage assignments (the kanban cards)
 *   - Recruiter notes (private; never surfaced to candidates)
 *   - Hiring decisions (offer/reject/hold) with audit trail
 *   - Pipeline-level analytics snapshots (time-in-stage, conversion)
 */
import { pgTable, uuid, text, integer, jsonb, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const recruiterPipelines = pgTable('recruiter_pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  ownerId: uuid('owner_id').notNull(),
  jobId: uuid('job_id'),                               // null = template
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  isTemplate: boolean('is_template').notNull().default(false),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tenantOwnerIdx: index('rp_tenant_owner_idx').on(t.tenantId, t.ownerId),
  jobIdx: index('rp_job_idx').on(t.jobId),
}));

export const recruiterPipelineStages = pgTable('recruiter_pipeline_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull(),
  position: integer('position').notNull(),
  name: text('name').notNull(),
  kind: text('kind').notNull().default('review'),      // sourced|applied|review|interview|offer|hired|rejected|withdrawn
  slaHours: integer('sla_hours').notNull().default(72),
  scorecardId: uuid('scorecard_id'),
  autoAdvance: boolean('auto_advance').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqPos: uniqueIndex('rps_pipeline_pos_idx').on(t.pipelineId, t.position),
  kindCheck: sql`CHECK (kind IN ('sourced','applied','review','interview','offer','hired','rejected','withdrawn'))`,
}));

export const recruiterCandidateAssignments = pgTable('recruiter_candidate_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull(),
  stageId: uuid('stage_id').notNull(),
  candidateIdentityId: uuid('candidate_identity_id').notNull(),
  applicationId: uuid('application_id'),               // links to job_application_flow
  position: integer('position').notNull().default(0),
  enteredStageAt: timestamp('entered_stage_at', { withTimezone: true }).notNull().defaultNow(),
  assignedRecruiterId: uuid('assigned_recruiter_id'),
  status: text('status').notNull().default('active'),  // active|on_hold|withdrawn|hired|rejected
  rating: integer('rating').notNull().default(0),       // 0-5 aggregate
  metadata: jsonb('metadata').notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqAssign: uniqueIndex('rca_unique_idx').on(t.pipelineId, t.candidateIdentityId),
  stageIdx: index('rca_stage_idx').on(t.stageId, t.position),
  recruiterIdx: index('rca_recruiter_idx').on(t.assignedRecruiterId, t.status),
  statusCheck: sql`CHECK (status IN ('active','on_hold','withdrawn','hired','rejected'))`,
  ratingCheck: sql`CHECK (rating BETWEEN 0 AND 5)`,
}));

export const recruiterNotes = pgTable('recruiter_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignmentId: uuid('assignment_id').notNull(),
  authorId: uuid('author_id').notNull(),
  body: text('body').notNull(),
  visibility: text('visibility').notNull().default('team'),  // private|team|hiring_manager
  pinned: boolean('pinned').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  assignIdx: index('rn_assign_idx').on(t.assignmentId, t.createdAt),
  visCheck: sql`CHECK (visibility IN ('private','team','hiring_manager'))`,
}));

export const recruiterHiringDecisions = pgTable('recruiter_hiring_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignmentId: uuid('assignment_id').notNull(),
  decisionMakerId: uuid('decision_maker_id').notNull(),
  outcome: text('outcome').notNull(),                  // offer|reject|hold|advance
  reason: text('reason'),
  rationale: jsonb('rationale').notNull().default({}),
  decidedAt: timestamp('decided_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  assignDecIdx: index('rhd_assign_idx').on(t.assignmentId, t.decidedAt),
  outcomeCheck: sql`CHECK (outcome IN ('offer','reject','hold','advance'))`,
}));

export const recruiterPipelineSnapshots = pgTable('recruiter_pipeline_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull(),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
  metrics: jsonb('metrics').notNull().default({}),     // {timeInStageP50, conversion, throughput}
}, (t) => ({
  pipelineSnapIdx: index('rps_snap_idx').on(t.pipelineId, t.capturedAt),
}));

export type RecruiterPipelineRow = typeof recruiterPipelines.$inferSelect;
export type RecruiterPipelineStageRow = typeof recruiterPipelineStages.$inferSelect;
export type RecruiterCandidateAssignmentRow = typeof recruiterCandidateAssignments.$inferSelect;
export type RecruiterNoteRow = typeof recruiterNotes.$inferSelect;
export type RecruiterHiringDecisionRow = typeof recruiterHiringDecisions.$inferSelect;
