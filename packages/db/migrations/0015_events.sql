-- Domain 15 — Events, Networking Sessions, RSVPs & Social Meetups
-- Mirrors packages/db/src/schema/events.ts. Lives in the user's codebase
-- only — never run against the Lovable Cloud Supabase project.
-- See mem://tech/no-domain-code-in-supabase.

BEGIN;

CREATE TABLE IF NOT EXISTS events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id         uuid NOT NULL,
  group_id        uuid,
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  type            text NOT NULL CHECK (type IN ('webinar','meetup','conference','workshop','networking','roundtable','briefing','summit','live_room','speed_networking')),
  format          text NOT NULL DEFAULT 'virtual'   CHECK (format IN ('virtual','in_person','hybrid')),
  status          text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft','scheduled','live','completed','cancelled','archived')),
  visibility      text NOT NULL DEFAULT 'public'    CHECK (visibility IN ('public','unlisted','private','enterprise_only')),
  description     text,
  agenda          jsonb NOT NULL DEFAULT '[]'::jsonb,
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz,
  timezone        text NOT NULL DEFAULT 'UTC',
  location        text,
  meeting_url     text,
  cover_url       text,
  tags            jsonb NOT NULL DEFAULT '[]'::jsonb,
  capacity        integer,
  price_cents     integer NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'USD',
  rsvp_count      integer NOT NULL DEFAULT 0,
  attended_count  integer NOT NULL DEFAULT 0,
  recording_url   text,
  meeting_handle_id uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_slug_idx       ON events(slug);
CREATE INDEX IF NOT EXISTS events_status_idx     ON events(status);
CREATE INDEX IF NOT EXISTS events_starts_at_idx  ON events(starts_at);
CREATE INDEX IF NOT EXISTS events_host_idx       ON events(host_id);
CREATE INDEX IF NOT EXISTS events_group_idx      ON events(group_id);

CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  identity_id  uuid NOT NULL,
  status       text NOT NULL DEFAULT 'going' CHECK (status IN ('going','interested','waitlist','cancelled','attended','no_show')),
  display_name text,
  email        text,
  notes        text,
  source       text,
  rsvped_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, identity_id)
);
CREATE INDEX IF NOT EXISTS event_rsvps_status_idx ON event_rsvps(event_id, status);

CREATE TABLE IF NOT EXISTS event_waitlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  position    integer NOT NULL,
  promoted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, identity_id)
);
CREATE INDEX IF NOT EXISTS event_waitlist_event_idx ON event_waitlist(event_id, position);

CREATE TABLE IF NOT EXISTS event_speakers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  identity_id uuid,
  name        text NOT NULL,
  title       text,
  bio         text,
  avatar_url  text,
  position    integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS event_speakers_event_idx ON event_speakers(event_id);

CREATE TABLE IF NOT EXISTS event_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  starts_at     timestamptz NOT NULL,
  duration_min  integer NOT NULL DEFAULT 30,
  speaker_id    uuid REFERENCES event_speakers(id) ON DELETE SET NULL,
  position      integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS event_sessions_event_idx ON event_sessions(event_id);

CREATE TABLE IF NOT EXISTS event_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  channel     text NOT NULL DEFAULT 'lobby' CHECK (channel IN ('lobby','live','qa','backstage')),
  author_id   uuid NOT NULL,
  body        text NOT NULL,
  status      text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden','deleted')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_messages_event_idx ON event_messages(event_id, channel, created_at DESC);

CREATE TABLE IF NOT EXISTS event_checkins (
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  method      text NOT NULL DEFAULT 'manual' CHECK (method IN ('manual','qr','auto','badge')),
  at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, identity_id)
);

CREATE TABLE IF NOT EXISTS event_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  nps         integer CHECK (nps BETWEEN 0 AND 10),
  rating      integer CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, identity_id)
);
CREATE INDEX IF NOT EXISTS event_feedback_event_idx ON event_feedback(event_id);

DROP TRIGGER IF EXISTS events_touch ON events;
CREATE TRIGGER events_touch BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMIT;
