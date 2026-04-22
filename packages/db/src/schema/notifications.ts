/**
 * Domain 27 — Notifications.
 * Per-user inbox feed, channel preferences, delivery attempts and digest
 * windows. Backs the in-app bell, push/email/SMS fan-out, and analytics.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  category: text('category').notNull(), // hiring | messaging | billing | system | social | calendar | media
  topic: text('topic').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  link: text('link'),
  priority: text('priority').notNull().default('normal'), // low | normal | high | urgent
  status: text('status').notNull().default('unread'), // unread | read | archived
  payload: jsonb('payload').notNull().default({}),
  groupKey: text('group_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp('read_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (t) => ({
  userStatusIdx: index('n_user_status_idx').on(t.userId, t.status, t.createdAt),
  groupIdx: index('n_group_idx').on(t.userId, t.groupKey),
}));

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  category: text('category').notNull(),
  inappEnabled: boolean('inapp_enabled').notNull().default(true),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  pushEnabled: boolean('push_enabled').notNull().default(true),
  smsEnabled: boolean('sms_enabled').notNull().default(false),
  digestCadence: text('digest_cadence').notNull().default('off'), // off | hourly | daily | weekly
  quietHoursStart: integer('quiet_hours_start'), // minutes from midnight
  quietHoursEnd: integer('quiet_hours_end'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('np_user_category_idx').on(t.userId, t.category),
}));

export const notificationDeliveries = pgTable('notification_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  notificationId: uuid('notification_id').notNull(),
  channel: text('channel').notNull(), // inapp | email | push | sms | webhook
  target: text('target'), // address/device token/url
  status: text('status').notNull().default('queued'), // queued | sent | delivered | failed | suppressed
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
}, (t) => ({
  notifIdx: index('nd_notification_idx').on(t.notificationId, t.channel),
  statusIdx: index('nd_status_idx').on(t.status, t.sentAt),
}));

export const notificationDigests = pgTable('notification_digests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  cadence: text('cadence').notNull(), // hourly | daily | weekly
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
  itemCount: integer('item_count').notNull().default(0),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  summary: jsonb('summary').notNull().default({}),
}, (t) => ({
  uniq: uniqueIndex('nd_user_window_idx').on(t.userId, t.cadence, t.windowStart),
}));

export const notificationDevices = pgTable('notification_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  platform: text('platform').notNull(), // ios | android | web
  token: text('token').notNull(),
  active: boolean('active').notNull().default(true),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('ndv_user_token_idx').on(t.userId, t.token),
}));
