/**
 * Domain 61 — Ads Analytics, CPC/CPM/CPI/CPA Reporting & Creative Performance.
 * Owner: apps/api-nest/src/modules/ads-analytics-performance/
 *
 * Read-mostly analytics domain layered on Domain 60 (amb_*) campaigns/creatives.
 *
 * State machines:
 *   aap_saved_reports.status:  draft → active → archived
 *   aap_alerts.status:         active ↔ paused → archived; active → triggered → acknowledged → active
 *   aap_export_jobs.status:    queued → running → succeeded | failed | cancelled
 *   aap_anomalies.status:      open → acknowledged → resolved
 *
 * Money in minor units (GBP default). Daily fact rollups are append-only
 * (Postgres trigger blocks UPDATE/DELETE).
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, index, unique, real, date } from 'drizzle-orm/pg-core';

export const aapDailyFacts = pgTable('aap_daily_facts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  campaignId: uuid('campaign_id').notNull(),
  adGroupId: uuid('ad_group_id'),
  creativeId: uuid('creative_id'),
  date: date('date').notNull(),
  // Dimensions (denormalised for fast slice/dice)
  country: text('country'),
  device: text('device'),
  placement: text('placement'),
  // Atomic counters
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  installs: integer('installs').notNull().default(0),
  conversions: integer('conversions').notNull().default(0),
  spendMinor: integer('spend_minor').notNull().default(0),
  revenueMinor: integer('revenue_minor').notNull().default(0),
  videoViews25: integer('video_views_25').notNull().default(0),
  videoViews50: integer('video_views_50').notNull().default(0),
  videoViews75: integer('video_views_75').notNull().default(0),
  videoViews100: integer('video_views_100').notNull().default(0),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  uniq: unique('uniq_aap_daily_fact').on(t.campaignId, t.adGroupId, t.creativeId, t.date, t.country, t.device, t.placement),
  byOwner: index('idx_aap_facts_owner').on(t.ownerIdentityId, t.date),
  byCampaign: index('idx_aap_facts_campaign').on(t.campaignId, t.date),
  byCreative: index('idx_aap_facts_creative').on(t.creativeId, t.date),
}));

export const aapCreativeScores = pgTable('aap_creative_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  creativeId: uuid('creative_id').notNull(),
  windowDays: integer('window_days').notNull().default(7), // 7|14|30
  ctr: real('ctr').notNull().default(0),
  cvr: real('cvr').notNull().default(0),
  cpcMinor: integer('cpc_minor').notNull().default(0),
  cpmMinor: integer('cpm_minor').notNull().default(0),
  cpiMinor: integer('cpi_minor').notNull().default(0),
  cpaMinor: integer('cpa_minor').notNull().default(0),
  fatigueScore: real('fatigue_score').notNull().default(0),  // 0..1, 1 = highly fatigued
  performanceScore: real('performance_score').notNull().default(0), // 0..1
  band: text('band').notNull().default('unknown'), // top|strong|average|weak|poor
  explanation: jsonb('explanation').notNull().default({}),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: unique('uniq_aap_creative_score').on(t.creativeId, t.windowDays),
  byOwner: index('idx_aap_creative_scores_owner').on(t.ownerIdentityId, t.band),
}));

export const aapSavedReports = pgTable('aap_saved_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'), // draft|active|archived
  filters: jsonb('filters').notNull().default({}),
  // { campaignIds?, creativeIds?, country?, device?, placement?, dateFrom, dateTo, granularity }
  groupBy: jsonb('group_by').notNull().default([]), // ['date','campaign','creative','country','device','placement']
  metrics: jsonb('metrics').notNull().default([]),  // ['impressions','clicks','spend','ctr','cpc','cpm','cpi','cpa','roas']
  sort: jsonb('sort').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_aap_saved_reports_owner').on(t.ownerIdentityId, t.status, t.updatedAt),
}));

export const aapAlerts = pgTable('aap_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'), // active|paused|triggered|acknowledged|archived
  metric: text('metric').notNull(), // ctr|cvr|cpc|cpm|cpi|cpa|spend|roas
  comparator: text('comparator').notNull(), // gt|lt|gte|lte|change_pct
  threshold: real('threshold').notNull(),
  windowHours: integer('window_hours').notNull().default(24),
  scope: jsonb('scope').notNull().default({}), // { campaignId?, creativeId? }
  channel: text('channel').notNull().default('email'), // email|webhook|in_app
  channelTarget: text('channel_target'),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  cooldownMinutes: integer('cooldown_minutes').notNull().default(60),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_aap_alerts_owner').on(t.ownerIdentityId, t.status),
}));

export const aapAlertEvents = pgTable('aap_alert_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  alertId: uuid('alert_id').notNull(),
  triggeredAt: timestamp('triggered_at', { withTimezone: true }).notNull().defaultNow(),
  observedValue: real('observed_value').notNull(),
  threshold: real('threshold').notNull(),
  payload: jsonb('payload').notNull().default({}),
  acknowledgedByIdentityId: uuid('acknowledged_by_identity_id'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
}, (t) => ({ byAlert: index('idx_aap_alert_events').on(t.alertId, t.triggeredAt) }));

export const aapExportJobs = pgTable('aap_export_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  format: text('format').notNull(), // csv|json|xlsx
  status: text('status').notNull().default('queued'), // queued|running|succeeded|failed|cancelled
  filters: jsonb('filters').notNull().default({}),
  rowCount: integer('row_count'),
  fileUrl: text('file_url'),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOwner: index('idx_aap_exports_owner').on(t.ownerIdentityId, t.status, t.createdAt) }));

export const aapAnomalies = pgTable('aap_anomalies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  scope: jsonb('scope').notNull().default({}), // { campaignId?, creativeId?, dimension? }
  metric: text('metric').notNull(),
  observedValue: real('observed_value').notNull(),
  expectedValue: real('expected_value').notNull(),
  zscore: real('zscore').notNull(),
  severity: text('severity').notNull(), // info|warn|critical
  status: text('status').notNull().default('open'), // open|acknowledged|resolved
  rationale: text('rationale').notNull(),
  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  acknowledgedByIdentityId: uuid('acknowledged_by_identity_id'),
}, (t) => ({ byOwner: index('idx_aap_anomalies_owner').on(t.ownerIdentityId, t.status, t.detectedAt) }));

export const aapAuditEvents = pgTable('aap_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id'),
  actorIdentityId: uuid('actor_identity_id'),
  actorRole: text('actor_role'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOwner: index('idx_aap_audit_owner').on(t.ownerIdentityId, t.createdAt) }));
