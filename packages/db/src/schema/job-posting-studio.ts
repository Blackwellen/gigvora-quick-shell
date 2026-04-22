/**
 * Domain 23 — Job Posting Studio.
 * Multi-step posting builder: drafts, versions, multi-board distribution,
 * AI rewrite suggestions, and scheduled publish/expiry windows.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const jobPostings = pgTable('job_postings', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  authorId: uuid('author_id').notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  status: text('status').notNull().default('draft'), // draft | review | scheduled | published | paused | archived
  employmentType: text('employment_type').notNull().default('full_time'),
  workMode: text('work_mode').notNull().default('hybrid'), // remote | hybrid | onsite
  locationCity: text('location_city'),
  locationCountry: text('location_country'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  salaryCurrency: text('salary_currency').notNull().default('GBP'),
  description: text('description').notNull().default(''),
  responsibilities: jsonb('responsibilities').notNull().default([]),
  requirements: jsonb('requirements').notNull().default([]),
  perks: jsonb('perks').notNull().default([]),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  scheduledPublishAt: timestamp('scheduled_publish_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqSlug: uniqueIndex('jps_tenant_slug_idx').on(t.tenantId, t.slug),
  wsStatusIdx: index('jps_workspace_status_idx').on(t.workspaceId, t.status),
}));

export const jobPostingVersions = pgTable('job_posting_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  postingId: uuid('posting_id').notNull(),
  version: integer('version').notNull(),
  authorId: uuid('author_id').notNull(),
  diff: jsonb('diff').notNull().default({}),
  snapshot: jsonb('snapshot').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('jpv_posting_version_idx').on(t.postingId, t.version),
}));

export const jobPostingDistributions = pgTable('job_posting_distributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  postingId: uuid('posting_id').notNull(),
  channel: text('channel').notNull(), // gigvora | linkedin | indeed | wellfound | careers_site | x | partner_api
  externalId: text('external_id'),
  status: text('status').notNull().default('pending'), // pending | live | failed | expired | removed
  publishedAt: timestamp('published_at', { withTimezone: true }),
  removedAt: timestamp('removed_at', { withTimezone: true }),
  cost: integer('cost').notNull().default(0),
  metadata: jsonb('metadata').notNull().default({}),
}, (t) => ({
  uniq: uniqueIndex('jpd_posting_channel_idx').on(t.postingId, t.channel),
}));

export const jobPostingSuggestions = pgTable('job_posting_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  postingId: uuid('posting_id').notNull(),
  kind: text('kind').notNull(), // rewrite | bias_check | seo | inclusivity | salary_benchmark
  modelVersion: text('model_version').notNull().default('jps.suggest.v1'),
  payload: jsonb('payload').notNull().default({}),
  accepted: boolean('accepted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  postIdx: index('jpsg_posting_kind_idx').on(t.postingId, t.kind),
}));
