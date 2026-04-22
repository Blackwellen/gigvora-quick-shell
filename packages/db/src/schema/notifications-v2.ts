/**
 * Domain — Notifications v2 (push/email/in-app + scheduling + preferences).
 * Owner: apps/api-nest/src/modules/notifications-v2/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const notificationChannels = pgTable('notification_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  channel: text('channel').notNull(), // push|email|sms|in_app|webhook
  destination: text('destination').notNull(), // device token, email, phone, url
  verified: boolean('verified').notNull().default(false),
  active: boolean('active').notNull().default(true),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  channel: text('channel').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  variables: jsonb('variables').notNull().default([]),
  locale: text('locale').notNull().default('en'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  category: text('category').notNull(), // mention|message|payment|system|opportunity|reminder
  templateKey: text('template_key'),
  channel: text('channel').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  data: jsonb('data').notNull().default({}),
  status: text('status').notNull().default('queued'), // queued|sent|delivered|read|failed|cancelled
  priority: text('priority').notNull().default('normal'), // low|normal|high|urgent
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  readAt: timestamp('read_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  category: text('category').notNull(),
  channelPush: boolean('channel_push').notNull().default(true),
  channelEmail: boolean('channel_email').notNull().default(true),
  channelSms: boolean('channel_sms').notNull().default(false),
  channelInApp: boolean('channel_in_app').notNull().default(true),
  quietHoursStart: text('quiet_hours_start'), // 22:00
  quietHoursEnd: text('quiet_hours_end'),     // 07:00
  timezone: text('timezone').notNull().default('UTC'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
