-- Domain — Calendar v2
CREATE TABLE IF NOT EXISTS calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  color text NOT NULL DEFAULT '#0066ff',
  timezone text NOT NULL DEFAULT 'UTC',
  is_default boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','org','public')),
  external_provider text CHECK (external_provider IN ('google','outlook','ical') OR external_provider IS NULL),
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_identity_id, name)
);
CREATE INDEX IF NOT EXISTS calendars_owner_idx ON calendars(owner_identity_id);

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'UTC',
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('tentative','confirmed','cancelled')),
  visibility text NOT NULL DEFAULT 'default' CHECK (visibility IN ('default','public','private','confidential')),
  recurrence_rule text,
  recurrence_parent_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  meeting_url text,
  meeting_provider text CHECK (meeting_provider IN ('jitsi','zoom','meet','teams','whereby') OR meeting_provider IS NULL),
  reminders jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at >= starts_at)
);
CREATE INDEX IF NOT EXISTS cal_events_calendar_idx ON calendar_events(calendar_id, starts_at);
CREATE INDEX IF NOT EXISTS cal_events_organizer_idx ON calendar_events(organizer_id, starts_at);
CREATE INDEX IF NOT EXISTS cal_events_window_idx ON calendar_events(starts_at, ends_at);

CREATE TABLE IF NOT EXISTS calendar_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  identity_id uuid,
  email text,
  name text,
  rsvp text NOT NULL DEFAULT 'pending' CHECK (rsvp IN ('pending','accepted','declined','tentative')),
  is_organizer boolean NOT NULL DEFAULT false,
  responded_at timestamptz,
  CHECK (identity_id IS NOT NULL OR email IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS cal_attendees_event_idx ON calendar_attendees(event_id);
CREATE INDEX IF NOT EXISTS cal_attendees_identity_idx ON calendar_attendees(identity_id) WHERE identity_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS scheduling_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  slug text NOT NULL UNIQUE CHECK (length(slug) BETWEEN 3 AND 64),
  title text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30 CHECK (duration_minutes BETWEEN 5 AND 1440),
  buffer_minutes integer NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
  window_days integer NOT NULL DEFAULT 30 CHECK (window_days BETWEEN 1 AND 365),
  availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sched_links_owner_idx ON scheduling_links(owner_identity_id, active);
