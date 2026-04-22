/**
 * Domain 21 — Interview Planning.
 * Loops, panels, scheduled slots, scorecards and calibration sessions.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const interviewLoops = pgTable('interview_loops', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  requisitionId: uuid('requisition_id').notNull(),
  candidateId: uuid('candidate_id').notNull(),
  stageKey: text('stage_key').notNull(),
  status: text('status').notNull().default('planning'), // planning | scheduled | in_progress | completed | withdrawn | cancelled
  targetCompletionAt: timestamp('target_completion_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  candIdx: index('il_candidate_idx').on(t.candidateId),
  reqIdx:  index('il_req_idx').on(t.requisitionId, t.status),
}));

export const interviewSlots = pgTable('interview_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  loopId: uuid('loop_id').notNull(),
  kind: text('kind').notNull().default('panel'), // phone | tech | panel | onsite | culture | system_design
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  location: text('location'),
  meetingLink: text('meeting_link'),
  status: text('status').notNull().default('scheduled'), // scheduled | confirmed | completed | no_show | cancelled
  metadata: jsonb('metadata').notNull().default({}),
}, (t) => ({
  loopIdx: index('is_loop_idx').on(t.loopId, t.startsAt),
}));

export const interviewPanelists = pgTable('interview_panelists', {
  id: uuid('id').primaryKey().defaultRandom(),
  slotId: uuid('slot_id').notNull(),
  interviewerId: uuid('interviewer_id').notNull(),
  role: text('role').notNull().default('interviewer'), // lead | interviewer | shadow
  responseStatus: text('response_status').notNull().default('pending'), // pending | accepted | declined | tentative
}, (t) => ({
  uniq: uniqueIndex('ip_slot_interviewer_idx').on(t.slotId, t.interviewerId),
}));

export const interviewScorecards = pgTable('interview_scorecards', {
  id: uuid('id').primaryKey().defaultRandom(),
  slotId: uuid('slot_id').notNull(),
  interviewerId: uuid('interviewer_id').notNull(),
  loopId: uuid('loop_id').notNull(),
  status: text('status').notNull().default('draft'), // draft | submitted | withdrawn
  recommendation: text('recommendation'), // strong_yes | yes | mixed | no | strong_no
  scores: jsonb('scores').notNull().default({}), // {competencyKey: 1-4}
  notes: text('notes'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('isc_slot_interviewer_idx').on(t.slotId, t.interviewerId),
  loopIdx: index('isc_loop_idx').on(t.loopId, t.status),
}));

export const interviewCalibrations = pgTable('interview_calibrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  loopId: uuid('loop_id').notNull(),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  decision: text('decision'), // advance | reject | hold | rehouse
  rationale: text('rationale'),
  participants: jsonb('participants').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  loopIdx: index('icl_loop_idx').on(t.loopId, t.decidedAt),
}));
