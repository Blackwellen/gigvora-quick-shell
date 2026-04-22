// Domain 48 — User Dashboard, Personal Overview, and Guided Next Actions
import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, index } from 'drizzle-orm/pg-core';

export const dashboardWidgets = pgTable('dashboard_widgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  role: text('role').notNull().default('user'), // user | professional | enterprise
  widgetKey: text('widget_key').notNull(), // e.g. earnings, opportunities, saved
  position: integer('position').notNull().default(0),
  size: text('size').notNull().default('md'), // sm | md | lg | xl
  visible: boolean('visible').notNull().default(true),
  config: jsonb('config').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byUser: index('dashboard_widgets_user_idx').on(t.userId, t.role),
}));

export const dashboardSnapshots = pgTable('dashboard_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  role: text('role').notNull().default('user'),
  payload: jsonb('payload').notNull().default({}), // KPIs cache
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  staleAt: timestamp('stale_at', { withTimezone: true }),
}, (t) => ({
  byUser: index('dashboard_snapshots_user_idx').on(t.userId, t.role, t.computedAt),
}));

export const dashboardActions = pgTable('dashboard_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  role: text('role').notNull().default('user'),
  kind: text('kind').notNull(), // complete_profile | accept_offer | review_order | renew | etc
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  href: text('href'),
  priority: integer('priority').notNull().default(50), // 0..100
  status: text('status').notNull().default('pending'), // pending | snoozed | done | dismissed
  dueAt: timestamp('due_at', { withTimezone: true }),
  snoozeUntil: timestamp('snooze_until', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byUser: index('dashboard_actions_user_idx').on(t.userId, t.status, t.priority),
}));

export const dashboardEvents = pgTable('dashboard_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  actorId: uuid('actor_id'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  meta: jsonb('meta').notNull().default({}),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byUser: index('dashboard_events_user_idx').on(t.userId, t.occurredAt),
}));
