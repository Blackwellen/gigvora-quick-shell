/**
 * Domain — Inbox (1:1 + group messaging, threaded conversations).
 *
 * Distinct from D17 (Calls) and D-notifications: Inbox owns persistent
 * text/attachment threads. Messages have read receipts, typing indicators,
 * delivery state, and per-thread participant settings.
 */
import { pgTable, uuid, text, integer, jsonb, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const inboxThreads = pgTable('inbox_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  kind: text('kind').notNull().default('direct'),     // direct|group|broadcast|support|system
  title: text('title'),
  createdById: uuid('created_by_id').notNull(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
  lastMessagePreview: text('last_message_preview').notNull().default(''),
  participantCount: integer('participant_count').notNull().default(0),
  archived: boolean('archived').notNull().default(false),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tenantRecentIdx: index('inbox_thread_tenant_recent_idx').on(t.tenantId, t.lastMessageAt),
  kindCheck: sql`CHECK (kind IN ('direct','group','broadcast','support','system'))`,
}));

export const inboxParticipants = pgTable('inbox_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  role: text('role').notNull().default('member'),     // owner|admin|member|guest
  mutedUntil: timestamp('muted_until', { withTimezone: true }),
  lastReadAt: timestamp('last_read_at', { withTimezone: true }),
  lastReadMessageId: uuid('last_read_message_id'),
  unreadCount: integer('unread_count').notNull().default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  leftAt: timestamp('left_at', { withTimezone: true }),
}, (t) => ({
  uniqMember: uniqueIndex('inbox_part_unique_idx').on(t.threadId, t.identityId),
  byIdentity: index('inbox_part_identity_idx').on(t.identityId, t.unreadCount),
  roleCheck: sql`CHECK (role IN ('owner','admin','member','guest'))`,
}));

export const inboxMessages = pgTable('inbox_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  senderId: uuid('sender_id').notNull(),
  body: text('body').notNull().default(''),
  contentType: text('content_type').notNull().default('text'), // text|markdown|html|system
  attachments: jsonb('attachments').notNull().default([]),     // [{kind,url,size,mime}]
  replyToId: uuid('reply_to_id'),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deliveryState: text('delivery_state').notNull().default('sent'), // queued|sent|delivered|failed
  reactions: jsonb('reactions').notNull().default({}),         // {emoji: [identityId,...]}
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  threadTimeIdx: index('inbox_msg_thread_time_idx').on(t.threadId, t.createdAt),
  senderIdx: index('inbox_msg_sender_idx').on(t.senderId, t.createdAt),
  contentCheck: sql`CHECK (content_type IN ('text','markdown','html','system'))`,
  deliveryCheck: sql`CHECK (delivery_state IN ('queued','sent','delivered','failed'))`,
}));

export const inboxReadReceipts = pgTable('inbox_read_receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqReceipt: uniqueIndex('inbox_receipt_unique_idx').on(t.messageId, t.identityId),
  byMessage: index('inbox_receipt_message_idx').on(t.messageId),
}));

export const inboxTypingPings = pgTable('inbox_typing_pings', {
  threadId: uuid('thread_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (t) => ({
  pk: uniqueIndex('inbox_typing_pk').on(t.threadId, t.identityId),
}));

export type InboxThreadRow = typeof inboxThreads.$inferSelect;
export type InboxParticipantRow = typeof inboxParticipants.$inferSelect;
export type InboxMessageRow = typeof inboxMessages.$inferSelect;
export type InboxReadReceiptRow = typeof inboxReadReceipts.$inferSelect;
