import { pgTable, uuid, text, jsonb, timestamp, integer, boolean, real, index, primaryKey } from 'drizzle-orm/pg-core';

/** Domain 11 — Profile, professional identity, reputation. */
export const profileExtended = pgTable('profile_extended', {
  identityId: uuid('identity_id').primaryKey(),
  headline: text('headline').notNull().default(''),
  about: text('about').notNull().default(''),
  location: text('location'),
  website: text('website'),
  pronouns: text('pronouns'),
  availability: text('availability'),
  hourlyRate: integer('hourly_rate_cents'),
  currency: text('currency').default('GBP'),
  languages: jsonb('languages').$type<string[]>().notNull().default([]),
  links: jsonb('links').$type<Array<{ kind: string; url: string }>>().notNull().default([]),
  visibility: text('visibility').notNull().default('public'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profileExperience = pgTable('profile_experience', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  isCurrent: boolean('is_current').notNull().default(false),
  description: text('description'),
  position: integer('position').notNull().default(0),
});

export const profileEducation = pgTable('profile_education', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  school: text('school').notNull(),
  degree: text('degree'),
  fieldOfStudy: text('field_of_study'),
  startYear: integer('start_year'),
  endYear: integer('end_year'),
  position: integer('position').notNull().default(0),
});

export const profileSkills = pgTable(
  'profile_skills',
  {
    identityId: uuid('identity_id').notNull(),
    skill: text('skill').notNull(),
    endorsementCount: integer('endorsement_count').notNull().default(0),
    isFeatured: boolean('is_featured').notNull().default(false),
  },
  (t) => ({ pk: primaryKey({ columns: [t.identityId, t.skill] }) }),
);

export const profileEndorsements = pgTable(
  'profile_endorsements',
  {
    endorserId: uuid('endorser_id').notNull(),
    identityId: uuid('identity_id').notNull(),
    skill: text('skill').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.endorserId, t.identityId, t.skill] }) }),
);

export const profilePortfolio = pgTable('profile_portfolio', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  url: text('url'),
  coverUrl: text('cover_url'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  position: integer('position').notNull().default(0),
});

export const profileReviews = pgTable('profile_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  reviewerId: uuid('reviewer_id').notNull(),
  rating: integer('rating').notNull(),
  body: text('body'),
  contextType: text('context_type'),
  contextId: text('context_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profileBadges = pgTable(
  'profile_badges',
  {
    identityId: uuid('identity_id').notNull(),
    badge: text('badge').notNull(),
    awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
    issuer: text('issuer'),
  },
  (t) => ({ pk: primaryKey({ columns: [t.identityId, t.badge] }) }),
);

export const profileVerifications = pgTable('profile_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  kind: text('kind').notNull(), // 'email' | 'gov_id' | 'employer' | 'education'
  status: text('status').notNull().default('pending'),
  evidenceUrl: text('evidence_url'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profileReputation = pgTable('profile_reputation', {
  identityId: uuid('identity_id').primaryKey(),
  score: real('score').notNull().default(0),
  band: text('band').notNull().default('new'),
  components: jsonb('components').$type<Record<string, number>>().notNull().default({}),
  recomputedAt: timestamp('recomputed_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ProfileExtendedRow = typeof profileExtended.$inferSelect;
