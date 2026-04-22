import { pgTable, text, jsonb, integer, boolean, timestamp, uuid, primaryKey, index } from 'drizzle-orm/pg-core';

/**
 * Domain 14 — Groups, Community Hubs & Member Conversations.
 *
 * Drizzle schema for production swap. The NestJS in-memory repository
 * mirrors these columns one-for-one so binding the real driver requires
 * only swapping the repository implementation.
 */

export const groups = pgTable('groups', {
  id:             uuid('id').defaultRandom().primaryKey(),
  ownerId:        uuid('owner_id').notNull(),
  slug:           text('slug').notNull().unique(),
  name:           text('name').notNull(),
  category:       text('category'),
  description:    text('description'),
  rules:          text('rules'),
  type:           text('type').notNull().default('public'),         // public|private|secret
  status:         text('status').notNull().default('active'),       // draft|active|paused|archived
  coverUrl:       text('cover_url'),
  iconUrl:        text('icon_url'),
  tags:           jsonb('tags').$type<string[]>().default([]).notNull(),
  joinPolicy:     text('join_policy').notNull().default('open'),    // open|request|invite_only
  postingPolicy:  text('posting_policy').notNull().default('members'), // anyone|members|mods_only
  memberCount:    integer('member_count').notNull().default(0),
  postsLast7d:    integer('posts_last_7d').notNull().default(0),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugIdx:     index('groups_slug_idx').on(t.slug),
  statusIdx:   index('groups_status_idx').on(t.status),
  categoryIdx: index('groups_category_idx').on(t.category),
}));

export const groupMembers = pgTable('group_members', {
  groupId:     uuid('group_id').notNull(),
  identityId:  uuid('identity_id').notNull(),
  role:        text('role').notNull().default('member'),  // owner|admin|moderator|member
  status:      text('status').notNull().default('active'),// active|pending|invited|banned|left
  displayName: text('display_name'),
  avatarUrl:   text('avatar_url'),
  joinedAt:    timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk:        primaryKey({ columns: [t.groupId, t.identityId] }),
  identIdx:  index('group_members_identity_idx').on(t.identityId),
  statusIdx: index('group_members_status_idx').on(t.status),
}));

export const groupJoinRequests = pgTable('group_join_requests', {
  id:          uuid('id').defaultRandom().primaryKey(),
  groupId:     uuid('group_id').notNull(),
  identityId:  uuid('identity_id').notNull(),
  message:     text('message'),
  status:      text('status').notNull().default('pending'), // pending|approved|rejected
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  decidedAt:   timestamp('decided_at', { withTimezone: true }),
}, (t) => ({ groupIdx: index('group_join_requests_group_idx').on(t.groupId) }));

export const groupChannels = pgTable('group_channels', {
  id:          uuid('id').defaultRandom().primaryKey(),
  groupId:     uuid('group_id').notNull(),
  name:        text('name').notNull(),
  slug:        text('slug').notNull(),
  description: text('description'),
  type:        text('type').notNull().default('discussion'), // discussion|announcement|voice|event
  position:    integer('position').notNull().default(0),
  private:     boolean('private').notNull().default(false),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ groupIdx: index('group_channels_group_idx').on(t.groupId) }));

export const groupPosts = pgTable('group_posts', {
  id:            uuid('id').defaultRandom().primaryKey(),
  groupId:       uuid('group_id').notNull(),
  channelId:     uuid('channel_id'),
  authorId:      uuid('author_id').notNull(),
  body:          text('body').notNull(),
  attachments:   jsonb('attachments').$type<Array<{ url: string; kind: string; name?: string }>>().default([]).notNull(),
  status:        text('status').notNull().default('active'), // active|pending|hidden|deleted
  pinned:        boolean('pinned').notNull().default(false),
  locked:        boolean('locked').notNull().default(false),
  reactionCount: integer('reaction_count').notNull().default(0),
  commentCount:  integer('comment_count').notNull().default(0),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  groupIdx:   index('group_posts_group_idx').on(t.groupId),
  authorIdx:  index('group_posts_author_idx').on(t.authorId),
  statusIdx:  index('group_posts_status_idx').on(t.status),
}));

export const groupComments = pgTable('group_comments', {
  id:        uuid('id').defaultRandom().primaryKey(),
  postId:    uuid('post_id').notNull(),
  authorId:  uuid('author_id').notNull(),
  parentId:  uuid('parent_id'),
  body:      text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ postIdx: index('group_comments_post_idx').on(t.postId) }));

export const groupReactions = pgTable('group_reactions', {
  postId:   uuid('post_id').notNull(),
  userId:   uuid('user_id').notNull(),
  emoji:    text('emoji').notNull(),
  reactedAt: timestamp('reacted_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.postId, t.userId, t.emoji] }) }));

export const groupEvents = pgTable('group_events', {
  id:          uuid('id').defaultRandom().primaryKey(),
  groupId:     uuid('group_id').notNull(),
  title:       text('title').notNull(),
  description: text('description'),
  startsAt:    timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt:      timestamp('ends_at', { withTimezone: true }),
  location:    text('location'),
  link:        text('link'),
  capacity:    integer('capacity'),
  status:      text('status').notNull().default('scheduled'), // scheduled|live|completed|cancelled
  rsvpCount:   integer('rsvp_count').notNull().default(0),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ groupIdx: index('group_events_group_idx').on(t.groupId) }));

export const groupRsvps = pgTable('group_rsvps', {
  eventId:    uuid('event_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  status:     text('status').notNull().default('going'), // going|interested|declined
  rsvpedAt:   timestamp('rsvped_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.eventId, t.identityId] }) }));

export const groupInvites = pgTable('group_invites', {
  id:          uuid('id').defaultRandom().primaryKey(),
  groupId:     uuid('group_id').notNull(),
  identityId:  uuid('identity_id'),
  email:       text('email'),
  message:     text('message'),
  invitedBy:   uuid('invited_by').notNull(),
  status:      text('status').notNull().default('sent'), // sent|accepted|declined|expired
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ groupIdx: index('group_invites_group_idx').on(t.groupId) }));

export const groupReports = pgTable('group_reports', {
  id:          uuid('id').defaultRandom().primaryKey(),
  groupId:     uuid('group_id').notNull(),
  reporterId:  uuid('reporter_id').notNull(),
  targetType:  text('target_type').notNull(), // post|comment|member
  targetId:    uuid('target_id').notNull(),
  reason:      text('reason').notNull(),
  notes:       text('notes'),
  status:      text('status').notNull().default('open'),  // open|resolved|dismissed
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt:  timestamp('resolved_at', { withTimezone: true }),
}, (t) => ({ groupIdx: index('group_reports_group_idx').on(t.groupId) }));
