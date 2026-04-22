/**
 * Domain 22 — Job Application Flow.
 * Candidate-facing application lifecycle: application sessions, multi-step
 * answers, attached docs, and status transitions through the recruiter funnel.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const jobApplications = pgTable('job_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobPostingId: uuid('job_posting_id').notNull(),
  candidateId: uuid('candidate_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  source: text('source').notNull().default('direct'), // direct | referral | search | agency | imported
  status: text('status').notNull().default('draft'), // draft | submitted | screening | advanced | offered | hired | rejected | withdrawn
  currentStage: text('current_stage'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
  rejectedReason: text('rejected_reason'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('jap_job_candidate_idx').on(t.jobPostingId, t.candidateId),
  candIdx: index('jap_candidate_idx').on(t.candidateId, t.status),
  tenantIdx: index('jap_tenant_status_idx').on(t.tenantId, t.status),
}));

export const jobApplicationAnswers = pgTable('job_application_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull(),
  questionKey: text('question_key').notNull(),
  questionLabel: text('question_label').notNull(),
  answer: jsonb('answer').notNull().default({}),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('jaa_app_question_idx').on(t.applicationId, t.questionKey),
}));

export const jobApplicationDocuments = pgTable('job_application_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull(),
  kind: text('kind').notNull(), // resume | cover_letter | portfolio | transcript | other
  storageKey: text('storage_key').notNull(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull().default(0),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  appIdx: index('jad_app_idx').on(t.applicationId, t.kind),
}));

export const jobApplicationEvents = pgTable('job_application_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull(),
  kind: text('kind').notNull(), // submitted | advanced | rejected | withdrawn | message_sent | document_added | viewed
  fromStage: text('from_stage'),
  toStage: text('to_stage'),
  actor: text('actor').notNull(),
  detail: jsonb('detail').notNull().default({}),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  appIdx: index('jae_app_idx').on(t.applicationId, t.at),
}));
