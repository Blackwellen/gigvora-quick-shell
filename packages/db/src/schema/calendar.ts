/**
 * Domain 17 — Calendar (personal + shared calendars, events, attendees, RSVPs).
 *
 * Distinct from D16 (Booking): Booking owns transactional bookable inventory
 * (slots/holds/payments). Calendar owns the *user's* time view: personal
 * calendars, free/busy, meeting events, attendees, recurrence rules, and
 * external provider sync state (Google/Microsoft/iCal).
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const calendars = pgTable('calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  ownerId: uuid('owner_id').notNull(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#3B82F6'),
  timezone: text('timezone').notNull().default('UTC'),
  isPrimary: boolean('is_primary').notNull().default(false),
  visibility: text('visibility').notNull().default('private'),     // private | team | tenant | public
  provider: text('provider').notNull().default('internal'),        // internal | google | microsoft | ical
  externalId: text('external_id'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ownerIdx:   index('calendars_owner_idx').on(t.ownerId),
  tenantIdx:  index('calendars_tenant_idx').on(t.tenantId, t.visibility),
  primaryIdx: uniqueIndex('calendars_primary_idx').on(t.ownerId, t.isPrimary),
}));

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  calendarId: uuid('calendar_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  organizerId: uuid('organizer_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  meetingUrl: text('meeting_url'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  allDay: boolean('all_day').notNull().default(false),
  timezone: text('timezone').notNull().default('UTC'),
  recurrenceRule: text('recurrence_rule'),                 // RFC-5545 RRULE
  recurrenceParentId: uuid('recurrence_parent_id'),        // links instances to series
  status: text('status').notNull().default('confirmed'),   // confirmed | tentative | cancelled
  visibility: text('visibility').notNull().default('default'),
  busy: boolean('busy').notNull().default(true),
  externalId: text('external_id'),
  externalEtag: text('external_etag'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  calRangeIdx:    index('calendar_events_cal_range_idx').on(t.calendarId, t.startsAt),
  tenantRangeIdx: index('calendar_events_tenant_range_idx').on(t.tenantId, t.startsAt),
  organizerIdx:   index('calendar_events_organizer_idx').on(t.organizerId, t.startsAt),
  recurrenceIdx:  index('calendar_events_recurrence_idx').on(t.recurrenceParentId),
}));

export const calendarAttendees = pgTable('calendar_attendees', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull(),
  attendeeId: uuid('attendee_id'),
  email: text('email'),
  displayName: text('display_name'),
  role: text('role').notNull().default('required'),         // required | optional | resource
  rsvp: text('rsvp').notNull().default('pending'),          // pending | accepted | declined | tentative
  rsvpAt: timestamp('rsvp_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  eventIdx:    index('calendar_attendees_event_idx').on(t.eventId),
  attendeeIdx: index('calendar_attendees_attendee_idx').on(t.attendeeId, t.rsvp),
  uniqueAtt:   uniqueIndex('calendar_attendees_unique_idx').on(t.eventId, t.email),
}));

export const calendarShares = pgTable('calendar_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  calendarId: uuid('calendar_id').notNull(),
  granteeId: uuid('grantee_id').notNull(),
  scope: text('scope').notNull().default('free-busy'),      // free-busy | read | write | admin
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueShare: uniqueIndex('calendar_shares_unique_idx').on(t.calendarId, t.granteeId),
  granteeIdx:  index('calendar_shares_grantee_idx').on(t.granteeId),
}));

export const calendarSyncState = pgTable('calendar_sync_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  calendarId: uuid('calendar_id').notNull(),
  provider: text('provider').notNull(),                     // google | microsoft | ical
  syncToken: text('sync_token'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueSync: uniqueIndex('calendar_sync_state_unique_idx').on(t.calendarId, t.provider),
}));
