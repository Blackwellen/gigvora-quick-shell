import { pgTable, uuid, text, integer, jsonb, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const searchDocuments = pgTable('search_documents', {
  id: text('id').notNull(),
  indexName: text('index_name').notNull(),
  title: text('title').notNull().default(''),
  body: text('body').notNull().default(''),
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  url: text('url'),
  ownerId: uuid('owner_id'),
  orgId: uuid('org_id'),
  visibility: text('visibility').notNull().default('public'),
  status: text('status'),
  region: text('region'),
  meta: jsonb('meta').notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: uniqueIndex('search_documents_pk').on(t.indexName, t.id),
  visIdx: index('search_documents_vis_idx').on(t.visibility, t.indexName),
  updatedIdx: index('search_documents_updated_idx').on(t.updatedAt),
  visCheck: sql`CHECK (visibility IN ('public','private','org','internal'))`,
}));

export const searchHistory = pgTable('search_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id'),
  query: text('query').notNull(),
  scope: text('scope').notNull().default('all'),
  resultCount: integer('result_count').notNull().default(0),
  clickedId: text('clicked_id'),
  clickedIndex: text('clicked_index'),
  ms: integer('ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byIdentity: index('search_history_identity_idx').on(t.identityId, t.createdAt),
  byQuery: index('search_history_query_idx').on(t.query, t.createdAt),
}));

export const savedSearches = pgTable('saved_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  name: text('name').notNull(),
  query: text('query').notNull().default(''),
  filters: jsonb('filters').notNull().default({}),
  scope: text('scope').notNull().default('all'),
  status: text('status').notNull().default('active'),
  pinned: boolean('pinned').notNull().default(false),
  notify: boolean('notify').notNull().default(false),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  lastCount: integer('last_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byIdentity: index('saved_searches_identity_idx').on(t.identityId, t.status, t.updatedAt),
}));

export const savedSearchRuns = pgTable('saved_search_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  savedSearchId: uuid('saved_search_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  hitCount: integer('hit_count').notNull().default(0),
  sample: jsonb('sample').notNull().default([]),
  ranForHours: integer('ran_for_hours').notNull().default(24),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  bySavedSearch: index('saved_search_runs_saved_idx').on(t.savedSearchId, t.createdAt),
}));

export const searchIndexJobs = pgTable('search_index_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  indexName: text('index_name').notNull(),
  docId: text('doc_id').notNull(),
  op: text('op').notNull(),
  status: text('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  payload: jsonb('payload').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (t) => ({
  byStatus: index('search_index_jobs_status_idx').on(t.status, t.createdAt),
}));

export type SearchDocumentRow = typeof searchDocuments.$inferSelect;
export type SearchHistoryRow = typeof searchHistory.$inferSelect;
export type SavedSearchRow = typeof savedSearches.$inferSelect;