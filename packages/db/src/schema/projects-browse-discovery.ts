/**
 * Domain 29 — Projects Browse & Discovery.
 * Read-side surface for freelancer-facing project search: saved searches,
 * project views, bookmark intents, and per-project engagement counters that
 * feed ranking models. Source-of-truth for projects stays in D33.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const projectSavedSearches = pgTable('project_saved_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  query: jsonb('query').notNull().default({}), // {keywords, skills, budgetMin, budgetMax, durationDays, ...}
  alertCadence: text('alert_cadence').notNull().default('daily'), // off | instant | daily | weekly
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  resultsLastRun: integer('results_last_run').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('pjss_user_idx').on(t.userId, t.lastRunAt),
}));

export const projectBookmarks = pgTable('project_bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('pjbm_user_project_idx').on(t.userId, t.projectId),
}));

export const projectViews = pgTable('project_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  projectId: uuid('project_id').notNull(),
  source: text('source').notNull().default('browse'), // browse | search | recommendation | invite | external
  dwellMs: integer('dwell_ms').notNull().default(0),
  proposed: boolean('proposed').notNull().default(false),
  viewedAt: timestamp('viewed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  projIdx: index('pjv_project_idx').on(t.projectId, t.viewedAt),
  userIdx: index('pjv_user_idx').on(t.userId, t.viewedAt),
}));

export const projectStats = pgTable('project_stats', {
  projectId: uuid('project_id').primaryKey(),
  views: integer('views').notNull().default(0),
  uniqueViewers: integer('unique_viewers').notNull().default(0),
  bookmarks: integer('bookmarks').notNull().default(0),
  proposals: integer('proposals').notNull().default(0),
  invitesSent: integer('invites_sent').notNull().default(0),
  rankingScore: integer('ranking_score').notNull().default(0),
  recomputedAt: timestamp('recomputed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projectBrowseFeedback = pgTable('project_browse_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id').notNull(),
  signal: text('signal').notNull(), // not_relevant | budget_too_low | scope_mismatch | timeline | other
  detail: text('detail'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  projIdx: index('pjbf_project_idx').on(t.projectId, t.signal),
}));
