/**
 * Domain 22 — Webinars: Discovery, Live Rooms, Replays, Sales & Donations.
 *
 * Drizzle schema mirrors WebinarsRepository (in-memory) so production swap is
 * a one-line provider change. State machines:
 *   webinar:    draft → scheduled ↔ cancelled, scheduled → live → ended → archived
 *   purchase:   pending → confirmed → paid | failed → refunded
 *   donation:   pending → captured | failed → refunded
 */
import { pgTable, text, jsonb, integer, boolean, timestamp, uuid, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';

export const webinars = pgTable('webinars', {
  id:                uuid('id').defaultRandom().primaryKey(),
  hostId:            uuid('host_id').notNull(),
  hostName:          text('host_name').notNull(),
  title:             text('title').notNull(),
  description:       text('description').notNull().default(''),
  startsAt:          timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt:            timestamp('ends_at', { withTimezone: true }),
  durationMinutes:   integer('duration_minutes').notNull().default(60),
  topics:            jsonb('topics').$type<string[]>().default([]).notNull(),
  thumbnailUrl:      text('thumbnail_url'),
  status:            text('status').notNull().default('scheduled'),   // draft|scheduled|live|ended|archived|cancelled
  ticketKind:        text('ticket_kind').notNull().default('free'),   // free|paid|donation|enterprise
  priceCents:        integer('price_cents').notNull().default(0),
  currency:          text('currency').notNull().default('GBP'),
  capacity:          integer('capacity').notNull().default(500),
  registrations:     integer('registrations').notNull().default(0),
  donationsEnabled:  boolean('donations_enabled').notNull().default(true),
  jitsiRoom:         text('jitsi_room').notNull(),
  replayUrl:         text('replay_url'),
  visibility:        text('visibility').notNull().default('public'),  // public|unlisted|private|enterprise_only
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  startsAtIdx:  index('webinars_starts_at_idx').on(t.startsAt),
  hostIdx:      index('webinars_host_idx').on(t.hostId),
  statusIdx:    index('webinars_status_idx').on(t.status),
  visibIdx:     index('webinars_visibility_idx').on(t.visibility),
}));

export const webinarRegistrations = pgTable('webinar_registrations', {
  webinarId:   uuid('webinar_id').notNull(),
  identityId:  uuid('identity_id').notNull(),
  email:       text('email'),
  status:      text('status').notNull().default('registered'), // registered|attended|no_show|cancelled
  registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
  attendedAt:  timestamp('attended_at', { withTimezone: true }),
}, (t) => ({
  pk: primaryKey({ columns: [t.webinarId, t.identityId] }),
  identIdx: index('webreg_ident_idx').on(t.identityId),
  statusIdx: index('webreg_status_idx').on(t.status),
}));

export const webinarPurchases = pgTable('webinar_purchases', {
  id:            uuid('id').defaultRandom().primaryKey(),
  webinarId:     uuid('webinar_id').notNull(),
  identityId:    uuid('identity_id').notNull(),
  quantity:      integer('quantity').notNull().default(1),
  amountCents:   integer('amount_cents').notNull(),
  currency:      text('currency').notNull().default('GBP'),
  status:        text('status').notNull().default('pending'),  // pending|confirmed|paid|failed|refunded
  paymentMethod: text('payment_method'),
  providerRef:   text('provider_ref'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedAt:   timestamp('confirmed_at', { withTimezone: true }),
  refundedAt:    timestamp('refunded_at', { withTimezone: true }),
}, (t) => ({
  webIdx:    index('webpur_web_idx').on(t.webinarId),
  identIdx:  index('webpur_ident_idx').on(t.identityId),
  statusIdx: index('webpur_status_idx').on(t.status),
}));

export const webinarDonations = pgTable('webinar_donations', {
  id:           uuid('id').defaultRandom().primaryKey(),
  webinarId:    uuid('webinar_id').notNull(),
  identityId:   uuid('identity_id'),
  amountCents:  integer('amount_cents').notNull(),
  currency:     text('currency').notNull().default('GBP'),
  message:      text('message'),
  anonymous:    boolean('anonymous').notNull().default(false),
  status:       text('status').notNull().default('pending'),   // pending|captured|failed|refunded
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  capturedAt:   timestamp('captured_at', { withTimezone: true }),
  refundedAt:   timestamp('refunded_at', { withTimezone: true }),
}, (t) => ({
  webIdx:    index('webdon_web_idx').on(t.webinarId),
  identIdx:  index('webdon_ident_idx').on(t.identityId),
  statusIdx: index('webdon_status_idx').on(t.status),
}));

export const webinarChatMessages = pgTable('webinar_chat_messages', {
  id:         uuid('id').defaultRandom().primaryKey(),
  webinarId:  uuid('webinar_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  body:       text('body').notNull(),
  pinned:     boolean('pinned').notNull().default(false),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ webIdx: index('webchat_web_idx').on(t.webinarId, t.createdAt) }));

export const webinarReplays = pgTable('webinar_replays', {
  webinarId:    uuid('webinar_id').primaryKey(),
  replayUrl:    text('replay_url').notNull(),
  durationSec:  integer('duration_sec').notNull().default(0),
  views:        integer('views').notNull().default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
