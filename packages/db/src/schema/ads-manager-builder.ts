/**
 * Domain 60 — Ads Manager: Campaign List, Builder, Creative Library & Routing.
 * Owner: apps/api-nest/src/modules/ads-manager-builder/
 *
 * State machines:
 *   amb_campaigns.status:    draft → in_review → approved → active ↔ paused
 *                            approved → archived; active/paused → completed | archived
 *                            in_review → rejected → draft (resubmit)
 *   amb_creatives.status:    draft → in_review → approved → archived
 *                            in_review → rejected → draft
 *   amb_ad_groups.status:    draft → active ↔ paused → archived
 *
 * Money in minor units (GBP default). Append-only metric snapshots.
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, index, unique, real } from 'drizzle-orm/pg-core';

export const ambCampaigns = pgTable('amb_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  name: text('name').notNull(),
  objective: text('objective').notNull(), // awareness|traffic|leads|conversions|app_installs|engagement
  status: text('status').notNull().default('draft'),
  // draft|in_review|approved|active|paused|completed|archived|rejected
  budgetMinor: integer('budget_minor').notNull().default(0),
  dailyBudgetMinor: integer('daily_budget_minor').notNull().default(0),
  spentMinor: integer('spent_minor').notNull().default(0),
  currency: text('currency').notNull().default('GBP'),
  startAt: timestamp('start_at', { withTimezone: true }),
  endAt: timestamp('end_at', { withTimezone: true }),
  routingRules: jsonb('routing_rules').notNull().default({}),
  // { geos: string[], languages: string[], deviceTypes: string[], audiences: string[],
  //   schedule: { dow: number[], hours: number[] }, frequencyCap: { impressions: number, period: 'day'|'week' } }
  qualityScore: real('quality_score'),
  rejectionReason: text('rejection_reason'),
  approvedByIdentityId: uuid('approved_by_identity_id'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_amb_campaigns_owner').on(t.ownerIdentityId, t.status, t.createdAt),
  byStatus: index('idx_amb_campaigns_status').on(t.status, t.createdAt),
}));

export const ambAdGroups = pgTable('amb_ad_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'), // draft|active|paused|archived
  bidStrategy: text('bid_strategy').notNull().default('cpc'), // cpc|cpm|cpa|target_cpa
  bidAmountMinor: integer('bid_amount_minor').notNull().default(0),
  targeting: jsonb('targeting').notNull().default({}),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCampaign: index('idx_amb_adgroups_campaign').on(t.campaignId, t.status),
}));

export const ambCreatives = pgTable('amb_creatives', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  name: text('name').notNull(),
  format: text('format').notNull(), // image|video|carousel|html5|text
  status: text('status').notNull().default('draft'), // draft|in_review|approved|rejected|archived
  assetUrl: text('asset_url'),
  thumbnailUrl: text('thumbnail_url'),
  headline: text('headline'),
  body: text('body'),
  cta: text('cta'),
  destinationUrl: text('destination_url'),
  width: integer('width'),
  height: integer('height'),
  durationSec: integer('duration_sec'),
  fileSizeBytes: integer('file_size_bytes'),
  moderationScore: real('moderation_score'),
  moderationFlags: jsonb('moderation_flags').notNull().default([]),
  rejectionReason: text('rejection_reason'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_amb_creatives_owner').on(t.ownerIdentityId, t.status, t.createdAt),
  byFormat: index('idx_amb_creatives_format').on(t.format, t.status),
}));

export const ambAdGroupCreatives = pgTable('amb_ad_group_creatives', {
  id: uuid('id').primaryKey().defaultRandom(),
  adGroupId: uuid('ad_group_id').notNull(),
  creativeId: uuid('creative_id').notNull(),
  weight: integer('weight').notNull().default(100),
  status: text('status').notNull().default('active'), // active|paused
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: unique('uniq_amb_adgroup_creative').on(t.adGroupId, t.creativeId),
  byAdGroup: index('idx_amb_adgroup_creatives_adgroup').on(t.adGroupId, t.status),
}));

export const ambRoutingRules = pgTable('amb_routing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  priority: integer('priority').notNull().default(100),
  conditionType: text('condition_type').notNull(), // geo|device|language|audience|time|placement
  conditionValue: jsonb('condition_value').notNull(),
  action: text('action').notNull(), // include|exclude|boost|cap
  actionValue: jsonb('action_value').notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCampaign: index('idx_amb_routing_campaign').on(t.campaignId, t.priority),
}));

export const ambMetricSnapshots = pgTable('amb_metric_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  adGroupId: uuid('ad_group_id'),
  creativeId: uuid('creative_id'),
  date: text('date').notNull(), // YYYY-MM-DD
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  conversions: integer('conversions').notNull().default(0),
  spendMinor: integer('spend_minor').notNull().default(0),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  uniq: unique('uniq_amb_metric_snapshot').on(t.campaignId, t.adGroupId, t.creativeId, t.date),
  byCampaign: index('idx_amb_metrics_campaign').on(t.campaignId, t.date),
}));

export const ambModerationReviews = pgTable('amb_moderation_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  subjectType: text('subject_type').notNull(), // campaign|creative
  subjectId: uuid('subject_id').notNull(),
  reviewerIdentityId: uuid('reviewer_identity_id'),
  decision: text('decision').notNull(), // approved|rejected|needs_changes
  rationale: text('rationale').notNull(),
  flags: jsonb('flags').notNull().default([]),
  modelScore: real('model_score'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  bySubject: index('idx_amb_moderation_subject').on(t.subjectType, t.subjectId, t.reviewedAt),
}));

export const ambSearchIndex = pgTable('amb_search_index', {
  id: uuid('id').primaryKey().defaultRandom(),
  subjectType: text('subject_type').notNull(), // campaign|creative
  subjectId: uuid('subject_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  searchText: text('search_text').notNull(),
  facets: jsonb('facets').notNull().default({}),
  // { status, format, objective, geos, languages, deviceTypes, tags }
  rankingScore: real('ranking_score').notNull().default(0),
  indexedAt: timestamp('indexed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: unique('uniq_amb_search').on(t.subjectType, t.subjectId),
  byOwner: index('idx_amb_search_owner').on(t.ownerIdentityId, t.subjectType),
}));

export const ambWebhookDeliveries = pgTable('amb_webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  eventId: text('event_id').notNull(),
  eventType: text('event_type').notNull(),
  signatureValid: boolean('signature_valid').notNull().default(true),
  status: text('status').notNull().default('processed'), // processed|skipped|failed
  payload: jsonb('payload').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniq: unique('uniq_amb_webhook').on(t.provider, t.eventId) }));

export const ambAuditEvents = pgTable('amb_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id'),
  actorIdentityId: uuid('actor_identity_id'),
  actorRole: text('actor_role'), // owner|admin|operator|moderator|system
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOwner: index('idx_amb_audit_owner').on(t.ownerIdentityId, t.createdAt) }));
