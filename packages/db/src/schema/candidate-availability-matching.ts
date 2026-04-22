/**
 * Domain 19 — Candidate Availability & Matching.
 * Owns recurring availability windows, time-off blocks, and ML-scored
 * matches between candidates and open requisitions/projects.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, date, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const candidateAvailabilityProfiles = pgTable('candidate_availability_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  candidateId: uuid('candidate_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  hoursPerWeek: integer('hours_per_week').notNull().default(40),
  noticeDays: integer('notice_days').notNull().default(14),
  remotePref: text('remote_pref').notNull().default('hybrid'), // remote | hybrid | onsite
  travelPct: integer('travel_pct').notNull().default(0),
  status: text('status').notNull().default('open'), // open | passive | closed
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  candidateIdx: uniqueIndex('cap_candidate_idx').on(t.candidateId),
  tenantIdx: index('cap_tenant_status_idx').on(t.tenantId, t.status),
}));

export const candidateAvailabilityWindows = pgTable('candidate_availability_windows', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6
  startMinute: integer('start_minute').notNull(), // 0-1439
  endMinute: integer('end_minute').notNull(),
  effectiveFrom: date('effective_from'),
  effectiveTo: date('effective_to'),
}, (t) => ({
  profileIdx: index('cap_windows_profile_idx').on(t.profileId, t.dayOfWeek),
}));

export const candidateTimeOff = pgTable('candidate_time_off', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  reason: text('reason'),
}, (t) => ({
  profileIdx: index('cap_timeoff_profile_idx').on(t.profileId, t.startsAt),
}));

export const candidateMatches = pgTable('candidate_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  candidateId: uuid('candidate_id').notNull(),
  targetKind: text('target_kind').notNull(), // requisition | project | gig
  targetId: uuid('target_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  score: integer('score').notNull().default(0), // 0-100
  scoreBreakdown: jsonb('score_breakdown').notNull().default({}),
  modelVersion: text('model_version').notNull().default('cap.match.v1'),
  status: text('status').notNull().default('proposed'), // proposed | viewed | shortlisted | dismissed | matched
  recomputedAt: timestamp('recomputed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('cap_match_unique_idx').on(t.candidateId, t.targetKind, t.targetId),
  tenantIdx: index('cap_match_tenant_idx').on(t.tenantId, t.status, t.score),
}));

export const candidateMatchEvents = pgTable('candidate_match_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').notNull(),
  kind: text('kind').notNull(),
  actor: text('actor').notNull(),
  detail: jsonb('detail').notNull().default({}),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  matchIdx: index('cap_match_events_match_idx').on(t.matchId, t.at),
}));
