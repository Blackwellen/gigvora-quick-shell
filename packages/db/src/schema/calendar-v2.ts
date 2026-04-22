/**
 * Domain — Calendar v2 (calendars, events, RSVPs, recurrence, scheduling links).
 * Owner: apps/api-nest/src/modules/calendar-v2/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const calendars = pgTable('calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#0066ff'),
  timezone: text('timezone').notNull().default('UTC'),
  isDefault: boolean('is_default').notNull().default(false),
  visibility: text('visibility').notNull().default('private'), // private|org|public
  externalProvider: text('external_provider'), // google|outlook|ical
  externalId: text('external_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  calendarId: uuid('calendar_id').notNull(),
  organizerId: uuid('organizer_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  allDay: boolean('all_day').notNull().default(false),
  timezone: text('timezone').notNull().default('UTC'),
  status: text('status').notNull().default('confirmed'), // tentative|confirmed|cancelled
  visibility: text('visibility').notNull().default('default'), // default|public|private|confidential
  recurrenceRule: text('recurrence_rule'), // RRULE string
  recurrenceParentId: uuid('recurrence_parent_id'),
  meetingUrl: text('meeting_url'),
  meetingProvider: text('meeting_provider'), // jitsi|zoom|meet|teams|whereby
  reminders: jsonb('reminders').notNull().default([]), // [{ minutesBefore, channel }]
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const calendarAttendees = pgTable('calendar_attendees', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull(),
  identityId: uuid('identity_id'),
  email: text('email'),
  name: text('name'),
  rsvp: text('rsvp').notNull().default('pending'), // pending|accepted|declined|tentative
  isOrganizer: boolean('is_organizer').notNull().default(false),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
});

export const schedulingLinks = pgTable('scheduling_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  bufferMinutes: integer('buffer_minutes').notNull().default(0),
  windowDays: integer('window_days').notNull().default(30),
  availability: jsonb('availability').notNull().default({}), // { mon:[[09,17]], … }
  active: boolean('active').notNull().default(true),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
