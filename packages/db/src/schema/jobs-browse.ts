/**
 * Domain 24 — Jobs Browse & Discovery.
 * Read-side surface for candidate-facing job search: saved searches, viewed
 * postings, application intents, and per-posting engagement counters that
 * feed ranking models. Source-of-truth for postings stays in D23.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const jobSavedSearches = pgTable('job_saved_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  query: jsonb('query').notNull().default({}), // {keywords, locations, employmentType, salaryMin, workMode, ...}
  alertCadence: text('alert_cadence').notNull().default('daily'), // off | instant | daily | weekly
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  resultsLastRun: integer('results_last_run').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('jss_user_idx').on(t.userId, t.lastRunAt),
}));

export const jobBookmarks = pgTable('job_bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  postingId: uuid('posting_id').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('jb_user_posting_idx').on(t.userId, t.postingId),
}));

export const jobViews = pgTable('job_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'), // nullable for anon
  postingId: uuid('posting_id').notNull(),
  source: text('source').notNull().default('browse'), // browse | search | recommendation | external | direct
  dwellMs: integer('dwell_ms').notNull().default(0),
  applied: boolean('applied').notNull().default(false),
  viewedAt: timestamp('viewed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  postIdx: index('jv_posting_idx').on(t.postingId, t.viewedAt),
  userIdx: index('jv_user_idx').on(t.userId, t.viewedAt),
}));

export const jobPostingStats = pgTable('job_posting_stats', {
  postingId: uuid('posting_id').primaryKey(),
  views: integer('views').notNull().default(0),
  uniqueViewers: integer('unique_viewers').notNull().default(0),
  bookmarks: integer('bookmarks').notNull().default(0),
  applies: integer('applies').notNull().default(0),
  ctrBp: integer('ctr_bp').notNull().default(0), // basis points
  rankingScore: integer('ranking_score').notNull().default(0),
  recomputedAt: timestamp('recomputed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jobBrowseFeedback = pgTable('job_browse_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  postingId: uuid('posting_id').notNull(),
  signal: text('signal').notNull(), // not_relevant | wrong_location | salary_too_low | seniority_mismatch | other
  detail: text('detail'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  postIdx: index('jbf_posting_idx').on(t.postingId, t.signal),
}));
