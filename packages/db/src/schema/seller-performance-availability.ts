/**
 * Domain 46 — Seller Performance, Capacity, Availability, and Offer Optimization
 * Tracks seller working hours, queue limits, vacation mode, per-gig pause states,
 * performance snapshots, and offer optimization suggestions.
 */
import {
  pgTable, uuid, text, integer, jsonb, timestamp, boolean, date, numeric, index,
} from 'drizzle-orm/pg-core';

export const sellerAvailability = pgTable('seller_availability', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').notNull().unique(),
  status: text('status').notNull().default('online'), // online | away | vacation | paused
  workingHours: jsonb('working_hours').notNull().default({}), // { mon: {start,end,enabled}, ... }
  timezone: text('timezone').notNull().default('UTC'),
  maxConcurrentOrders: integer('max_concurrent_orders').notNull().default(5),
  autoPauseThreshold: integer('auto_pause_threshold').notNull().default(8),
  responseTargetHours: integer('response_target_hours').notNull().default(2),
  vacationStart: date('vacation_start'),
  vacationEnd: date('vacation_end'),
  vacationMessage: text('vacation_message'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sellerIdx: index('seller_availability_seller_idx').on(t.sellerId),
}));

export const sellerGigCapacity = pgTable('seller_gig_capacity', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').notNull(),
  gigId: uuid('gig_id').notNull(),
  status: text('status').notNull().default('active'), // active | paused | archived
  queueDepth: integer('queue_depth').notNull().default(0),
  maxQueue: integer('max_queue').notNull().default(5),
  pausedAt: timestamp('paused_at', { withTimezone: true }),
  pausedReason: text('paused_reason'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sellerGigIdx: index('seller_gig_capacity_seller_gig_idx').on(t.sellerId, t.gigId),
}));

export const sellerPerformanceSnapshots = pgTable('seller_performance_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  ordersCompleted: integer('orders_completed').notNull().default(0),
  ordersCancelled: integer('orders_cancelled').notNull().default(0),
  onTimeRate: numeric('on_time_rate', { precision: 5, scale: 4 }).notNull().default('0'),
  responseRate: numeric('response_rate', { precision: 5, scale: 4 }).notNull().default('0'),
  avgResponseMinutes: integer('avg_response_minutes').notNull().default(0),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  repeatBuyerRate: numeric('repeat_buyer_rate', { precision: 5, scale: 4 }).notNull().default('0'),
  earnings: numeric('earnings', { precision: 12, scale: 2 }).notNull().default('0'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sellerPeriodIdx: index('seller_perf_seller_period_idx').on(t.sellerId, t.periodStart),
}));

export const sellerOfferOptimizations = pgTable('seller_offer_optimizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').notNull(),
  gigId: uuid('gig_id'),
  suggestionType: text('suggestion_type').notNull(), // pricing | packaging | media | description | response_time | availability
  severity: text('severity').notNull().default('info'), // info | warning | critical
  title: text('title').notNull(),
  detail: text('detail').notNull(),
  expectedLift: numeric('expected_lift', { precision: 5, scale: 4 }),
  status: text('status').notNull().default('open'), // open | dismissed | applied
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  appliedAt: timestamp('applied_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sellerStatusIdx: index('seller_offer_opt_seller_status_idx').on(t.sellerId, t.status),
}));

export const sellerAvailabilityEvents = pgTable('seller_availability_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').notNull(),
  eventType: text('event_type').notNull(), // status_changed | gig_paused | gig_resumed | vacation_scheduled | vacation_ended | capacity_updated
  payload: jsonb('payload').notNull().default({}),
  actorId: uuid('actor_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sellerIdx: index('seller_avail_events_seller_idx').on(t.sellerId, t.createdAt),
}));
