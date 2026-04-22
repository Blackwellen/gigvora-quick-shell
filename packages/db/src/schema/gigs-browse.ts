/**
 * Domain 41 — Gigs Browse, Search, and Marketplace Discovery (Drizzle schema).
 *
 * Tables:
 *   gigs                       — productized service listing (the "gig")
 *   gig_packages               — Basic / Standard / Premium tiers
 *   gig_addons                 — paid add-ons (extra fast, source files, etc.)
 *   gig_media                  — gallery images / video / pdf
 *   gig_skills                 — skill tags (FK index for facet queries)
 *   gigs_browse_saved_searches — alert-capable saved discovery query
 *   gigs_browse_bookmarks      — per-identity gig bookmarks
 *   gigs_browse_ranking_signals— hourly aggregate fed into the ranker
 *   gigs_browse_view_events    — raw clickstream for ranker training
 *
 * State machine for gigs:
 *   draft → pending_review → active ↔ paused → archived
 *   active → escalated (moderation) → active|archived
 *
 * State machine for saved searches:
 *   inactive ↔ active → snoozed → active → archived
 */
import {
  pgTable, uuid, text, integer, boolean, jsonb, timestamp, index, uniqueIndex, primaryKey, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const gigs = pgTable('gigs', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull(),
  companyId: uuid('company_id'),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  category: text('category').notNull(),         // e.g. 'design'
  subcategory: text('subcategory'),
  description: text('description').notNull().default(''),
  searchVector: text('search_vector').notNull().default(''), // denormalised lower(title|tags|skills)
  thumbnailUrl: text('thumbnail_url'),
  status: text('status').notNull().default('draft'),  // draft|pending_review|active|paused|archived|escalated
  visibility: text('visibility').notNull().default('public'), // public|unlisted|private
  source: text('source').notNull().default('internal'), // internal|imported|syndicated
  pricingFromCents: integer('pricing_from_cents').notNull().default(0),
  currency: text('currency').notNull().default('GBP'),
  deliveryDaysMin: integer('delivery_days_min').notNull().default(1),
  deliveryDaysMax: integer('delivery_days_max').notNull().default(7),
  ratingAvg: integer('rating_avg').notNull().default(0), // ×100 (e.g. 487 = 4.87)
  ratingCount: integer('rating_count').notNull().default(0),
  ordersCount: integer('orders_count').notNull().default(0),
  viewsCount: integer('views_count').notNull().default(0),
  conversionBp: integer('conversion_bp').notNull().default(0), // basis points × 100
  isFeatured: boolean('is_featured').notNull().default(false),
  isProSeller: boolean('is_pro_seller').notNull().default(false),
  hasFastDelivery: boolean('has_fast_delivery').notNull().default(false),
  acceptsRevisions: boolean('accepts_revisions').notNull().default(true),
  languages: jsonb('languages').notNull().default(sql`'[]'::jsonb`), // string[]
  industries: jsonb('industries').notNull().default(sql`'[]'::jsonb`),
  metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byStatus: index('gigs_status_idx').on(t.status),
  byCategory: index('gigs_category_idx').on(t.category),
  byOwner: index('gigs_owner_idx').on(t.ownerId),
  bySlug: uniqueIndex('gigs_slug_uidx').on(t.slug),
  byPrice: index('gigs_price_idx').on(t.pricingFromCents),
  byRating: index('gigs_rating_idx').on(t.ratingAvg),
  statusCheck: check('gigs_status_chk', sql`${t.status} IN ('draft','pending_review','active','paused','archived','escalated')`),
  visibilityCheck: check('gigs_visibility_chk', sql`${t.visibility} IN ('public','unlisted','private')`),
  priceCheck: check('gigs_price_chk', sql`${t.pricingFromCents} >= 0`),
  deliveryCheck: check('gigs_delivery_chk', sql`${t.deliveryDaysMin} <= ${t.deliveryDaysMax}`),
}));

export const gigPackages = pgTable('gig_packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  gigId: uuid('gig_id').notNull().references(() => gigs.id, { onDelete: 'cascade' }),
  tier: text('tier').notNull(), // basic|standard|premium
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  priceCents: integer('price_cents').notNull(),
  deliveryDays: integer('delivery_days').notNull(),
  revisions: integer('revisions').notNull().default(1),
  features: jsonb('features').notNull().default(sql`'[]'::jsonb`),
  isPopular: boolean('is_popular').notNull().default(false),
  position: integer('position').notNull().default(0),
}, (t) => ({
  byGig: index('gig_packages_gig_idx').on(t.gigId),
  uniq: uniqueIndex('gig_packages_gig_tier_uidx').on(t.gigId, t.tier),
  tierCheck: check('gig_packages_tier_chk', sql`${t.tier} IN ('basic','standard','premium','custom')`),
  priceCheck: check('gig_packages_price_chk', sql`${t.priceCents} >= 0`),
}));

export const gigAddons = pgTable('gig_addons', {
  id: uuid('id').defaultRandom().primaryKey(),
  gigId: uuid('gig_id').notNull().references(() => gigs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  extraDeliveryDays: integer('extra_delivery_days').notNull().default(0),
  position: integer('position').notNull().default(0),
}, (t) => ({
  byGig: index('gig_addons_gig_idx').on(t.gigId),
  priceCheck: check('gig_addons_price_chk', sql`${t.priceCents} >= 0`),
}));

export const gigMedia = pgTable('gig_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  gigId: uuid('gig_id').notNull().references(() => gigs.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // image|video|pdf|audio
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  caption: text('caption'),
  position: integer('position').notNull().default(0),
  bytes: integer('bytes'),
  scanStatus: text('scan_status').notNull().default('pending'), // pending|clean|infected|skipped
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byGig: index('gig_media_gig_idx').on(t.gigId),
  kindCheck: check('gig_media_kind_chk', sql`${t.kind} IN ('image','video','pdf','audio')`),
  scanCheck: check('gig_media_scan_chk', sql`${t.scanStatus} IN ('pending','clean','infected','skipped')`),
}));

export const gigSkills = pgTable('gig_skills', {
  gigId: uuid('gig_id').notNull().references(() => gigs.id, { onDelete: 'cascade' }),
  skill: text('skill').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.gigId, t.skill] }),
  bySkill: index('gig_skills_skill_idx').on(t.skill),
}));

export const gigsBrowseSavedSearches = pgTable('gigs_browse_saved_searches', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull(),
  label: text('label').notNull(),
  filters: jsonb('filters').notNull().default(sql`'{}'::jsonb`),
  state: text('state').notNull().default('active'), // inactive|active|snoozed|archived
  alertsEnabled: boolean('alerts_enabled').notNull().default(false),
  alertCadence: text('alert_cadence').notNull().default('off'), // off|realtime|daily|weekly
  channel: text('channel').notNull().default('inapp'),          // inapp|email|inapp+email
  pinned: boolean('pinned').notNull().default(false),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('gigs_saved_owner_idx').on(t.ownerId),
  uniqLabel: uniqueIndex('gigs_saved_owner_label_uidx').on(t.ownerId, t.label),
  stateCheck: check('gigs_saved_state_chk', sql`${t.state} IN ('inactive','active','snoozed','archived')`),
  cadenceCheck: check('gigs_saved_cadence_chk', sql`${t.alertCadence} IN ('off','realtime','daily','weekly')`),
}));

export const gigsBrowseBookmarks = pgTable('gigs_browse_bookmarks', {
  ownerId: uuid('owner_id').notNull(),
  gigId: uuid('gig_id').notNull().references(() => gigs.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.ownerId, t.gigId] }),
  byGig: index('gigs_bookmarks_gig_idx').on(t.gigId),
}));

export const gigsBrowseRankingSignals = pgTable('gigs_browse_ranking_signals', {
  gigId: uuid('gig_id').notNull().references(() => gigs.id, { onDelete: 'cascade' }),
  bucketHour: timestamp('bucket_hour', { withTimezone: true }).notNull(),
  views: integer('views').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  bookmarks: integer('bookmarks').notNull().default(0),
  orders: integer('orders').notNull().default(0),
  refunds: integer('refunds').notNull().default(0),
  ctr: integer('ctr').notNull().default(0), // basis points × 100
}, (t) => ({
  pk: primaryKey({ columns: [t.gigId, t.bucketHour] }),
  byHour: index('gigs_signals_hour_idx').on(t.bucketHour),
}));

export const gigsBrowseViewEvents = pgTable('gigs_browse_view_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  gigId: uuid('gig_id').notNull().references(() => gigs.id, { onDelete: 'cascade' }),
  identityId: uuid('identity_id'),
  source: text('source').notNull().default('browse'), // browse|search|saved|recommend|external
  query: text('query'),
  position: integer('position'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byGig: index('gigs_view_events_gig_idx').on(t.gigId),
  byIdentity: index('gigs_view_events_identity_idx').on(t.identityId),
  byTime: index('gigs_view_events_time_idx').on(t.createdAt),
}));
