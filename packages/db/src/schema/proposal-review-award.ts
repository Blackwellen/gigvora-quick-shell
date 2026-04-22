/**
 * Domain 31 — Proposal Review, Compare, Shortlist & Award.
 * Buyer-side surfaces: review queues, scorecards, comparisons, shortlists,
 * award decisions, and the escrow handoff record (escrow itself owned by D34).
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const proposalReviews = pgTable('proposal_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').notNull(),
  projectId: uuid('project_id').notNull(),
  reviewerId: uuid('reviewer_id').notNull(),
  decision: text('decision').notNull().default('pending'), // pending | shortlisted | rejected | hold
  rationale: text('rationale'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('prr_prop_reviewer_idx').on(t.proposalId, t.reviewerId),
  projIdx: index('prr_project_idx').on(t.projectId, t.decision),
}));

export const proposalScorecards = pgTable('proposal_scorecards', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').notNull(),
  reviewerId: uuid('reviewer_id').notNull(),
  rubricId: text('rubric_id').notNull().default('default'),
  scores: jsonb('scores').notNull().default({}), // {criterion: 0-5}
  weightedTotal: integer('weighted_total').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('psc_prop_reviewer_idx').on(t.proposalId, t.reviewerId),
}));

export const proposalShortlists = pgTable('proposal_shortlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  ownerId: uuid('owner_id').notNull(),
  name: text('name').notNull().default('Shortlist'),
  proposalIds: jsonb('proposal_ids').notNull().default([]),
  pinned: boolean('pinned').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  projIdx: index('psl_project_idx').on(t.projectId),
}));

export const proposalComparisons = pgTable('proposal_comparisons', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  ownerId: uuid('owner_id').notNull(),
  proposalIds: jsonb('proposal_ids').notNull().default([]),
  axes: jsonb('axes').notNull().default([]), // ['price','duration','rating','match']
  snapshot: jsonb('snapshot').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  projIdx: index('pcm_project_idx').on(t.projectId, t.createdAt),
}));

export const proposalAwards = pgTable('proposal_awards', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  proposalId: uuid('proposal_id').notNull(),
  awardedBy: uuid('awarded_by').notNull(),
  awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
  status: text('status').notNull().default('pending'), // pending | accepted | declined | rescinded | escrow_held
  escrowHoldId: uuid('escrow_hold_id'),
  contractId: uuid('contract_id'),
  amountCents: integer('amount_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  metadata: jsonb('metadata').notNull().default({}),
}, (t) => ({
  uniqProp: uniqueIndex('paw_proposal_idx').on(t.proposalId),
  projIdx: index('paw_project_status_idx').on(t.projectId, t.status),
}));

export const proposalReviewEvents = pgTable('proposal_review_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  proposalId: uuid('proposal_id'),
  actorId: uuid('actor_id').notNull(),
  event: text('event').notNull(), // viewed | scored | shortlisted | rejected | compared | awarded | rescinded
  detail: jsonb('detail').notNull().default({}),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  projIdx: index('pre_project_idx').on(t.projectId, t.at),
  propIdx: index('pre_proposal_idx').on(t.proposalId, t.at),
}));
