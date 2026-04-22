import { pgTable, text, jsonb, integer, boolean, timestamp, uuid, primaryKey, index } from 'drizzle-orm/pg-core';

/**
 * Domain 15 — Events, Networking Sessions, RSVPs & Social Meetups.
 *
 * Drizzle schema for production swap. EventsRepository's in-memory shape
 * mirrors these columns one-for-one so binding the real driver is a
 * single repository swap. Indexed for discovery, host dashboards, and
 * search-export denormalization.
 */

export const events = pgTable('events', {
  id:              uuid('id').defaultRandom().primaryKey(),
  hostId:          uuid('host_id').notNull(),
  groupId:         uuid('group_id'),
  slug:            text('slug').notNull().unique(),
  title:           text('title').notNull(),
  type:            text('type').notNull(),                              // webinar|meetup|conference|workshop|networking|roundtable|briefing|summit|live_room|speed_networking
  format:          text('format').notNull().default('virtual'),         // virtual|in_person|hybrid
  status:          text('status').notNull().default('scheduled'),       // draft|scheduled|live|completed|cancelled|archived
  visibility:      text('visibility').notNull().default('public'),      // public|unlisted|private|enterprise_only
  description:     text('description'),
  agenda:          jsonb('agenda').$type<Array<{ title: string; startsAt: string; durationMin: number; speaker?: string }>>().default([]).notNull(),
  startsAt:        timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt:          timestamp('ends_at', { withTimezone: true }),
  timezone:        text('timezone').notNull().default('UTC'),
  location:        text('location'),
  meetingUrl:      text('meeting_url'),
  coverUrl:        text('cover_url'),
  tags:            jsonb('tags').$type<string[]>().default([]).notNull(),
  capacity:        integer('capacity'),
  priceCents:      integer('price_cents').notNull().default(0),
  currency:        text('currency').notNull().default('USD'),
  recordingPolicy: text('recording_policy').notNull().default('opt_in'),// none|auto|opt_in
  waitlistEnabled: boolean('waitlist_enabled').notNull().default(true),
  rsvpCount:       integer('rsvp_count').notNull().default(0),
  attendedCount:   integer('attended_count').notNull().default(0),
  waitlistCount:   integer('waitlist_count').notNull().default(0),
  statusChangedAt: timestamp('status_changed_at', { withTimezone: true }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugIdx:       index('events_slug_idx').on(t.slug),
  startsAtIdx:   index('events_starts_at_idx').on(t.startsAt),
  hostIdx:       index('events_host_idx').on(t.hostId),
  groupIdx:      index('events_group_idx').on(t.groupId),
  statusIdx:     index('events_status_idx').on(t.status),
  visibilityIdx: index('events_visibility_idx').on(t.visibility),
}));

export const eventRsvps = pgTable('event_rsvps', {
  eventId:    uuid('event_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  status:     text('status').notNull().default('going'),  // going|interested|waitlist|declined|attended|no_show
  guests:     integer('guests').notNull().default(0),
  note:       text('note'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk:        primaryKey({ columns: [t.eventId, t.identityId] }),
  identIdx:  index('event_rsvps_identity_idx').on(t.identityId),
  statusIdx: index('event_rsvps_status_idx').on(t.status),
}));

export const eventWaitlist = pgTable('event_waitlist', {
  eventId:    uuid('event_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  position:   integer('position').notNull(),
  joinedAt:   timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.eventId, t.identityId] }) }));

export const eventSpeakers = pgTable('event_speakers', {
  id:         uuid('id').defaultRandom().primaryKey(),
  eventId:    uuid('event_id').notNull(),
  identityId: uuid('identity_id'),
  name:       text('name').notNull(),
  role:       text('role').notNull().default('speaker'), // host|cohost|speaker|moderator|attendee
  title:      text('title'),
  bio:        text('bio'),
  avatarUrl:  text('avatar_url'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ eventIdx: index('event_speakers_event_idx').on(t.eventId) }));

export const eventSessions = pgTable('event_sessions', {
  id:           uuid('id').defaultRandom().primaryKey(),
  eventId:      uuid('event_id').notNull(),
  title:        text('title').notNull(),
  type:         text('type').notNull().default('talk'),  // talk|panel|breakout|speed_round|q_and_a
  startsAt:     timestamp('starts_at', { withTimezone: true }).notNull(),
  durationMin:  integer('duration_min').notNull(),
  capacity:     integer('capacity'),
  speakerIds:   jsonb('speaker_ids').$type<string[]>().default([]).notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ eventIdx: index('event_sessions_event_idx').on(t.eventId) }));

export const eventMessages = pgTable('event_messages', {
  id:        uuid('id').defaultRandom().primaryKey(),
  eventId:   uuid('event_id').notNull(),
  authorId:  uuid('author_id').notNull(),
  channel:   text('channel').notNull().default('lobby'), // lobby|live|qa
  body:      text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ eventIdx: index('event_messages_event_idx').on(t.eventId) }));

export const eventCheckins = pgTable('event_checkins', {
  eventId:     uuid('event_id').notNull(),
  identityId:  uuid('identity_id').notNull(),
  method:      text('method').notNull().default('manual'), // qr|manual|auto
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.eventId, t.identityId] }) }));

export const eventFeedback = pgTable('event_feedback', {
  id:         uuid('id').defaultRandom().primaryKey(),
  eventId:    uuid('event_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  rating:     integer('rating').notNull(),
  comment:    text('comment'),
  npsLikely:  integer('nps_likely'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ eventIdx: index('event_feedback_event_idx').on(t.eventId) }));
