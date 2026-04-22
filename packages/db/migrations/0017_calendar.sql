-- Domain 17 — Calendar.
-- Personal/shared calendars, events with recurrence + attendees + RSVPs,
-- ACL via calendar_shares, external provider sync state.
-- Source of truth: packages/db/src/schema/calendar.ts
-- Owner runtime: apps/api-nest/src/modules/calendar/

CREATE TABLE IF NOT EXISTS calendars (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   text NOT NULL,
  owner_id    uuid NOT NULL,
  name        text NOT NULL,
  color       text NOT NULL DEFAULT '#3B82F6',
  timezone    text NOT NULL DEFAULT 'UTC',
  is_primary  boolean NOT NULL DEFAULT false,
  visibility  text NOT NULL DEFAULT 'private'
              CHECK (visibility IN ('private','team','tenant','public')),
  provider    text NOT NULL DEFAULT 'internal'
              CHECK (provider IN ('internal','google','microsoft','ical')),
  external_id text,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX        IF NOT EXISTS calendars_owner_idx   ON calendars(owner_id);
CREATE INDEX        IF NOT EXISTS calendars_tenant_idx  ON calendars(tenant_id, visibility);
-- Only one *primary* calendar per owner.
CREATE UNIQUE INDEX IF NOT EXISTS calendars_primary_idx ON calendars(owner_id) WHERE is_primary;

CREATE TABLE IF NOT EXISTS calendar_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id           uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  tenant_id             text NOT NULL,
  organizer_id          uuid NOT NULL,
  title                 text NOT NULL,
  description           text,
  location              text,
  meeting_url           text,
  starts_at             timestamptz NOT NULL,
  ends_at               timestamptz NOT NULL,
  all_day               boolean NOT NULL DEFAULT false,
  timezone              text NOT NULL DEFAULT 'UTC',
  recurrence_rule       text,
  recurrence_parent_id  uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  status                text NOT NULL DEFAULT 'confirmed'
                        CHECK (status IN ('confirmed','tentative','cancelled')),
  visibility            text NOT NULL DEFAULT 'default'
                        CHECK (visibility IN ('default','public','private','confidential')),
  busy                  boolean NOT NULL DEFAULT true,
  external_id           text,
  external_etag         text,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS calendar_events_cal_range_idx    ON calendar_events(calendar_id, starts_at);
CREATE INDEX IF NOT EXISTS calendar_events_tenant_range_idx ON calendar_events(tenant_id, starts_at);
CREATE INDEX IF NOT EXISTS calendar_events_organizer_idx    ON calendar_events(organizer_id, starts_at);
CREATE INDEX IF NOT EXISTS calendar_events_recurrence_idx   ON calendar_events(recurrence_parent_id);

CREATE TABLE IF NOT EXISTS calendar_attendees (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  attendee_id   uuid,
  email         text,
  display_name  text,
  role          text NOT NULL DEFAULT 'required'
                CHECK (role IN ('required','optional','resource')),
  rsvp          text NOT NULL DEFAULT 'pending'
                CHECK (rsvp IN ('pending','accepted','declined','tentative')),
  rsvp_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (attendee_id IS NOT NULL OR email IS NOT NULL)
);
CREATE INDEX        IF NOT EXISTS calendar_attendees_event_idx    ON calendar_attendees(event_id);
CREATE INDEX        IF NOT EXISTS calendar_attendees_attendee_idx ON calendar_attendees(attendee_id, rsvp);
CREATE UNIQUE INDEX IF NOT EXISTS calendar_attendees_unique_idx   ON calendar_attendees(event_id, email)
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS calendar_shares (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id  uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  grantee_id   uuid NOT NULL,
  scope        text NOT NULL DEFAULT 'free-busy'
               CHECK (scope IN ('free-busy','read','write','admin')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS calendar_shares_unique_idx  ON calendar_shares(calendar_id, grantee_id);
CREATE INDEX        IF NOT EXISTS calendar_shares_grantee_idx ON calendar_shares(grantee_id);

CREATE TABLE IF NOT EXISTS calendar_sync_state (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id     uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  provider        text NOT NULL CHECK (provider IN ('google','microsoft','ical')),
  sync_token      text,
  last_synced_at  timestamptz,
  last_error      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS calendar_sync_state_unique_idx ON calendar_sync_state(calendar_id, provider);
