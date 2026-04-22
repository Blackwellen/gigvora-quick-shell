/**
 * Domain 16 — Ratings, Reviews, Trust Badges & Social Proof.
 *
 * Drizzle schema mirrors apps/api-nest/src/modules/trust/*. State machines:
 *   reviews:        draft → pending → published | rejected | disputed → archived
 *   references:     pending → verified | expired | declined
 *   verifications:  not_started → pending → verified | failed
 */
import { pgTable, text, jsonb, integer, boolean, timestamp, uuid, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';

export const reviews = pgTable('reviews', {
  id:           uuid('id').defaultRandom().primaryKey(),
  authorId:     uuid('author_id').notNull(),
  authorName:   text('author_name'),
  authorAvatarKey: text('author_avatar_key'),
  authorRole:   text('author_role'),
  subjectKind:  text('subject_kind').notNull(),                  // user|agency|company|gig|service|project|job
  subjectId:    text('subject_id').notNull(),
  rating:       integer('rating').notNull(),                     // 1..5 enforced via trigger (CHECK can stay)
  title:        text('title').notNull(),
  body:         text('body').notNull(),
  pros:         jsonb('pros').$type<string[]>().default([]).notNull(),
  cons:         jsonb('cons').$type<string[]>().default([]).notNull(),
  projectRef:   text('project_ref'),
  status:       text('status').notNull().default('pending'),     // draft|pending|published|disputed|rejected|archived
  helpfulCount: integer('helpful_count').notNull().default(0),
  reportCount:  integer('report_count').notNull().default(0),
  responseId:   uuid('response_id'),
  contactEmail: text('contact_email'),
  publishedAt:  timestamp('published_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  subjectIdx:   index('reviews_subject_idx').on(t.subjectKind, t.subjectId),
  authorIdx:    index('reviews_author_idx').on(t.authorId),
  statusIdx:    index('reviews_status_idx').on(t.status),
  ratingIdx:    index('reviews_rating_idx').on(t.rating),
}));

export const reviewResponses = pgTable('review_responses', {
  id:         uuid('id').defaultRandom().primaryKey(),
  reviewId:   uuid('review_id').notNull(),
  authorId:   uuid('author_id').notNull(),
  body:       text('body').notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ reviewIdx: index('review_responses_review_idx').on(t.reviewId) }));

export const reviewReactions = pgTable('review_reactions', {
  reviewId:  uuid('review_id').notNull(),
  actorId:   uuid('actor_id').notNull(),
  kind:      text('kind').notNull().default('helpful'),       // helpful|not_helpful|report
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.reviewId, t.actorId, t.kind] }) }));

export const reviewModeration = pgTable('review_moderation', {
  id:        uuid('id').defaultRandom().primaryKey(),
  reviewId:  uuid('review_id').notNull(),
  action:    text('action').notNull(),                        // hold|approve|reject|flag|restore
  reason:    text('reason'),
  actorId:   uuid('actor_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ revIdx: index('review_moderation_review_idx').on(t.reviewId) }));

export const trustBadges = pgTable('trust_badges', {
  id:           uuid('id').defaultRandom().primaryKey(),
  subjectKind:  text('subject_kind').notNull(),
  subjectId:    text('subject_id').notNull(),
  badgeKey:     text('badge_key').notNull(),                  // top_rated|verified_pro|fast_responder|...
  awardedAt:    timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt:    timestamp('expires_at', { withTimezone: true }),
  meta:         jsonb('meta').default({} as any).notNull(),
}, (t) => ({
  uniq:        uniqueIndex('trust_badges_subject_badge_uq').on(t.subjectKind, t.subjectId, t.badgeKey),
  subjectIdx:  index('trust_badges_subject_idx').on(t.subjectKind, t.subjectId),
}));

export const references = pgTable('references_t', {
  id:           uuid('id').defaultRandom().primaryKey(),
  subjectId:    text('subject_id').notNull(),
  contactName:  text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  relationship: text('relationship').notNull(),
  status:       text('status').notNull().default('pending'),  // pending|verified|expired|declined
  requestedAt:  timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  respondedAt:  timestamp('responded_at', { withTimezone: true }),
  payload:      jsonb('payload').default({} as any).notNull(),
}, (t) => ({ subjectIdx: index('references_subject_idx').on(t.subjectId) }));

export const verifications = pgTable('trust_verifications', {
  id:          uuid('id').defaultRandom().primaryKey(),
  subjectId:   text('subject_id').notNull(),
  kind:        text('kind').notNull(),                        // identity|email|phone|skills|background|portfolio|payment|address
  status:      text('status').notNull().default('not_started'),
  startedAt:   timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt:   timestamp('expires_at', { withTimezone: true }),
  payload:     jsonb('payload').default({} as any).notNull(),
}, (t) => ({
  uniq:       uniqueIndex('trust_verifications_subject_kind_uq').on(t.subjectId, t.kind),
  statusIdx:  index('trust_verifications_status_idx').on(t.status),
}));

export const trustScores = pgTable('trust_scores', {
  subjectKind:  text('subject_kind').notNull(),
  subjectId:    text('subject_id').notNull(),
  score:        integer('score').notNull().default(0),         // 0..100
  band:         text('band').notNull().default('emerging'),    // emerging|trusted|verified|elite
  components:   jsonb('components').default({} as any).notNull(),
  computedAt:   timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.subjectKind, t.subjectId] }) }));
