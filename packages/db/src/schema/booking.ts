/**
 * Domain 16 — Booking (calendar slots, holds, confirmed bookings).
 *
 * Tables:
 *   booking_resources    — bookable entity (person, room, gig, service tier)
 *   booking_availability — recurring availability windows per resource
 *   booking_slots        — concrete time slots derived from availability
 *   booking_holds        — soft locks during checkout / scheduling flow
 *   bookings             — confirmed bookings (immutable once captured)
 *   booking_events       — append-only audit trail per booking
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const bookingResources = pgTable('booking_resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  ownerId: uuid('owner_id').notNull(),
  kind: text('kind').notNull(),          // person | room | gig | service-tier
  refId: text('ref_id').notNull(),       // FK pointer into source domain (loose)
  name: text('name').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  active: boolean('active').notNull().default(true),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tenantIdx: index('booking_resources_tenant_idx').on(t.tenantId, t.kind, t.active),
  refIdx:    index('booking_resources_ref_idx').on(t.kind, t.refId),
}));

export const bookingAvailability = pgTable('booking_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceId: uuid('resource_id').notNull(),
  weekday: integer('weekday').notNull(),               // 0=Sunday … 6=Saturday
  startMinutes: integer('start_minutes').notNull(),    // minute-of-day
  endMinutes: integer('end_minutes').notNull(),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  resIdx: index('booking_availability_resource_idx').on(t.resourceId, t.weekday),
}));

export const bookingSlots = pgTable('booking_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceId: uuid('resource_id').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  capacity: integer('capacity').notNull().default(1),
  bookedCount: integer('booked_count').notNull().default(0),
  status: text('status').notNull().default('open'),    // open | held | full | cancelled
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  rangeIdx:   index('booking_slots_range_idx').on(t.resourceId, t.startsAt),
  uniqueSlot: uniqueIndex('booking_slots_unique_idx').on(t.resourceId, t.startsAt),
}));

export const bookingHolds = pgTable('booking_holds', {
  id: uuid('id').primaryKey().defaultRandom(),
  slotId: uuid('slot_id').notNull(),
  holderId: uuid('holder_id').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  expiresIdx: index('booking_holds_expires_idx').on(t.expiresAt),
  slotIdx:    index('booking_holds_slot_idx').on(t.slotId),
}));

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  resourceId: uuid('resource_id').notNull(),
  slotId: uuid('slot_id').notNull(),
  bookerId: uuid('booker_id').notNull(),
  status: text('status').notNull().default('confirmed'), // confirmed | cancelled | no-show | completed
  amountCents: integer('amount_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  notes: text('notes'),
  metadata: jsonb('metadata').notNull().default({}),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tenantIdx:   index('bookings_tenant_idx').on(t.tenantId, t.status),
  bookerIdx:   index('bookings_booker_idx').on(t.bookerId),
  resourceIdx: index('bookings_resource_idx').on(t.resourceId, t.confirmedAt),
}));

export const bookingEvents = pgTable('booking_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull(),
  kind: text('kind').notNull(),
  actor: text('actor').notNull(),
  detail: jsonb('detail').notNull().default({}),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  bookingIdx: index('booking_events_booking_idx').on(t.bookingId, t.at),
}));
