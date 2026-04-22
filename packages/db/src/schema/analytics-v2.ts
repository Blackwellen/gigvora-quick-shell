/**
 * Domain — Analytics v2 (event ingestion, sessions, funnels, cohorts).
 * Owner: apps/api-nest/src/modules/analytics-v2/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, bigint, real } from 'drizzle-orm/pg-core';

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  identityId: uuid('identity_id'),
  anonymousId: text('anonymous_id'),
  sessionId: uuid('session_id'),
  eventName: text('event_name').notNull(),       // page_view | click | form_submit | …
  eventCategory: text('event_category'),
  surface: text('surface'),                       // route or screen name
  properties: jsonb('properties').notNull().default({}),
  context: jsonb('context').notNull().default({}),// ua, locale, ip-hash, geo
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsSessions = pgTable('analytics_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  identityId: uuid('identity_id'),
  anonymousId: text('anonymous_id'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationSec: integer('duration_sec').notNull().default(0),
  pageviewCount: integer('pageview_count').notNull().default(0),
  device: text('device'),
  os: text('os'),
  browser: text('browser'),
  country: text('country'),
  utm: jsonb('utm').notNull().default({}),
});

export const analyticsFunnels = pgTable('analytics_funnels', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  steps: jsonb('steps').$type<Array<{ name: string; eventName: string; filter?: Record<string, unknown> }>>().notNull(),
  windowSec: integer('window_sec').notNull().default(86400),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsCohorts = pgTable('analytics_cohorts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  definition: jsonb('definition').notNull(),       // filter tree
  memberCount: integer('member_count').notNull().default(0),
  refreshedAt: timestamp('refreshed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsMetricsDaily = pgTable('analytics_metrics_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  metricKey: text('metric_key').notNull(),         // dau | mau | revenue_cents | …
  day: text('day').notNull(),                      // YYYY-MM-DD
  value: real('value').notNull(),
  dimensions: jsonb('dimensions').notNull().default({}),
});
