import { pgTable, uuid, text, jsonb, timestamp, integer, boolean, index, primaryKey } from 'drizzle-orm/pg-core';

/** Domain 09 — Feed posts (status machine: draft → published → archived). */
export const feedPosts = pgTable(
  'feed_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id').notNull(),
    /** 'identity' | 'company' | 'system' */
    authorKind: text('author_kind').notNull().default('identity'),
    body: text('body').notNull(),
    media: jsonb('media').$type<Array<Record<string, unknown>>>().notNull().default([]),
    /** 'public' | 'connections' | 'private' */
    visibility: text('visibility').notNull().default('public'),
    /** 'draft' | 'published' | 'archived' | 'flagged' */
    status: text('status').notNull().default('published'),
    reactionCount: integer('reaction_count').notNull().default(0),
    commentCount: integer('comment_count').notNull().default(0),
    /** Optional opportunity card payload (job/gig/service teaser). */
    opportunity: jsonb('opportunity').$type<Record<string, unknown> | null>(),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    /** Optimistic concurrency. */
    version: integer('version').notNull().default(1),
  },
  (t) => ({
    byAuthor: index('feed_author_idx').on(t.authorId, t.publishedAt),
    byStatus: index('feed_status_idx').on(t.status, t.publishedAt),
  }),
);

export const feedReactions = pgTable(
  'feed_reactions',
  {
    postId: uuid('post_id').notNull(),
    actorId: uuid('actor_id').notNull(),
    kind: text('kind').notNull().default('like'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.postId, t.actorId, t.kind] }) }),
);

export const feedComments = pgTable(
  'feed_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id').notNull(),
    authorId: uuid('author_id').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({ byPost: index('feed_comments_post_idx').on(t.postId, t.createdAt) }),
);

export type FeedPostRow = typeof feedPosts.$inferSelect;
export type NewFeedPost = typeof feedPosts.$inferInsert;
