import { pgTable, text, jsonb, integer, boolean, timestamp, uuid, primaryKey, index } from 'drizzle-orm/pg-core';

/**
 * Domain 13 — Agency Pages, Service Presence & Public Proof Surfaces.
 *
 * Drizzle schema for production swap. The NestJS in-memory repository
 * mirrors these columns one-for-one so binding the real driver requires
 * only swapping the repository implementation.
 */

export const agencies = pgTable('agencies', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  ownerId:            uuid('owner_id').notNull(),
  slug:               text('slug').notNull().unique(),
  name:               text('name').notNull(),
  tagline:            text('tagline'),
  industry:           text('industry'),
  size:               text('size'),
  founded:            text('founded'),
  headquarters:       text('headquarters'),
  website:            text('website'),
  about:              text('about'),
  logoUrl:            text('logo_url'),
  coverUrl:           text('cover_url'),
  specialties:        jsonb('specialties').$type<string[]>().default([]).notNull(),
  languages:          jsonb('languages').$type<string[]>().default([]).notNull(),
  engagementModels:   jsonb('engagement_models').$type<string[]>().default([]).notNull(),
  values:             jsonb('values').$type<string[]>().default([]).notNull(),
  status:             text('status').notNull().default('draft'),     // draft|active|paused|archived
  visibility:         text('visibility').notNull().default('public'),// public|network|private
  verified:           boolean('verified').notNull().default(false),
  acceptingProjects:  boolean('accepting_projects').notNull().default(true),
  followerCount:      integer('follower_count').notNull().default(0),
  ratingAvg:          integer('rating_avg').notNull().default(0),    // x100 to avoid float
  ratingCount:        integer('rating_count').notNull().default(0),
  completedProjects:  integer('completed_projects').notNull().default(0),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugIdx:    index('agencies_slug_idx').on(t.slug),
  statusIdx:  index('agencies_status_idx').on(t.status),
  ownerIdx:   index('agencies_owner_idx').on(t.ownerId),
}));

export const agencyServices = pgTable('agency_services', {
  id:               uuid('id').defaultRandom().primaryKey(),
  agencyId:         uuid('agency_id').notNull(),
  name:             text('name').notNull(),
  description:      text('description'),
  priceFromCents:   integer('price_from_cents'),
  priceToCents:     integer('price_to_cents'),
  currency:         text('currency').notNull().default('USD'),
  duration:         text('duration'),
  popular:          boolean('popular').notNull().default(false),
  status:           text('status').notNull().default('active'),
  position:         integer('position').notNull().default(0),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ agencyIdx: index('agency_services_agency_idx').on(t.agencyId) }));

export const agencyTeam = pgTable('agency_team', {
  id:           uuid('id').defaultRandom().primaryKey(),
  agencyId:     uuid('agency_id').notNull(),
  identityId:   uuid('identity_id'),
  name:         text('name').notNull(),
  role:         text('role').notNull(),
  skills:       jsonb('skills').$type<string[]>().default([]).notNull(),
  available:    boolean('available').notNull().default(true),
  badge:        text('badge'),
  avatarUrl:    text('avatar_url'),
  position:     integer('position').notNull().default(0),
}, (t) => ({ agencyIdx: index('agency_team_agency_idx').on(t.agencyId) }));

export const agencyCaseStudies = pgTable('agency_case_studies', {
  id:           uuid('id').defaultRandom().primaryKey(),
  agencyId:     uuid('agency_id').notNull(),
  title:        text('title').notNull(),
  client:       text('client'),
  outcome:      text('outcome'),
  body:         text('body'),
  coverUrl:     text('cover_url'),
  tags:         jsonb('tags').$type<string[]>().default([]).notNull(),
  status:       text('status').notNull().default('draft'),  // draft|pending|published|archived
  views:        integer('views').notNull().default(0),
  publishedAt:  timestamp('published_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  agencyIdx: index('agency_case_studies_agency_idx').on(t.agencyId),
  statusIdx: index('agency_case_studies_status_idx').on(t.status),
}));

export const agencyReviews = pgTable('agency_reviews', {
  id:             uuid('id').defaultRandom().primaryKey(),
  agencyId:       uuid('agency_id').notNull(),
  authorId:       uuid('author_id'),
  authorName:     text('author_name'),
  authorCompany:  text('author_company'),
  rating:         integer('rating').notNull(),
  title:          text('title'),
  body:           text('body'),
  pros:           text('pros'),
  cons:           text('cons'),
  status:         text('status').notNull().default('visible'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ agencyIdx: index('agency_reviews_agency_idx').on(t.agencyId) }));

export const agencyProofs = pgTable('agency_proofs', {
  id:           uuid('id').defaultRandom().primaryKey(),
  agencyId:     uuid('agency_id').notNull(),
  kind:         text('kind').notNull(), // certification|award|press|security|compliance|partnership
  label:        text('label').notNull(),
  issuer:       text('issuer'),
  evidenceUrl:  text('evidence_url'),
  issuedAt:     timestamp('issued_at', { withTimezone: true }),
  expiresAt:    timestamp('expires_at', { withTimezone: true }),
  verified:     boolean('verified').notNull().default(false),
  verifiedAt:   timestamp('verified_at', { withTimezone: true }),
}, (t) => ({ agencyIdx: index('agency_proofs_agency_idx').on(t.agencyId) }));

export const agencyInquiries = pgTable('agency_inquiries', {
  id:             uuid('id').defaultRandom().primaryKey(),
  agencyId:       uuid('agency_id').notNull(),
  serviceId:      uuid('service_id'),
  contactName:    text('contact_name').notNull(),
  contactEmail:   text('contact_email').notNull(),
  company:        text('company'),
  budget:         text('budget'),
  message:        text('message').notNull(),
  status:         text('status').notNull().default('new'),
  consent:        jsonb('consent').$type<{ marketing?: boolean }>().default({}),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ agencyIdx: index('agency_inquiries_agency_idx').on(t.agencyId) }));

export const agencyFollowers = pgTable('agency_followers', {
  agencyId:    uuid('agency_id').notNull(),
  followerId:  uuid('follower_id').notNull(),
  followedAt:  timestamp('followed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.agencyId, t.followerId] }) }));

export const agencyViews = pgTable('agency_views', {
  id:         uuid('id').defaultRandom().primaryKey(),
  agencyId:   uuid('agency_id').notNull(),
  viewerId:   uuid('viewer_id'),
  ip:         text('ip'),
  ua:         text('ua'),
  at:         timestamp('at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ agencyIdx: index('agency_views_agency_idx').on(t.agencyId) }));
