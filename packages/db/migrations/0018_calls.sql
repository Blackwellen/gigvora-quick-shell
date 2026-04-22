-- Domain 18 — Calls.
-- Live voice/video sessions: persistent rooms, per-call participant timeline,
-- recordings, post-call transcripts/summaries, append-only audit trail.
-- Source of truth: packages/db/src/schema/calls.ts
-- Owner runtime: apps/api-nest/src/modules/calls/

CREATE TABLE IF NOT EXISTS call_rooms (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           text NOT NULL,
  owner_id            uuid NOT NULL,
  kind                text NOT NULL DEFAULT 'adhoc'
                      CHECK (kind IN ('adhoc','scheduled','broadcast','webinar')),
  topic               text,
  provider            text NOT NULL DEFAULT 'internal'
                      CHECK (provider IN ('internal','livekit','twilio','daily','zoom')),
  external_room_id    text,
  capacity            integer NOT NULL DEFAULT 8 CHECK (capacity > 0),
  recording_enabled   boolean NOT NULL DEFAULT false,
  transcript_enabled  boolean NOT NULL DEFAULT false,
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS call_rooms_tenant_idx ON call_rooms(tenant_id, kind);
CREATE INDEX IF NOT EXISTS call_rooms_owner_idx  ON call_rooms(owner_id);

CREATE TABLE IF NOT EXISTS calls (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id           uuid NOT NULL REFERENCES call_rooms(id) ON DELETE CASCADE,
  tenant_id         text NOT NULL,
  initiator_id      uuid NOT NULL,
  status            text NOT NULL DEFAULT 'ringing'
                    CHECK (status IN ('ringing','live','ended','missed','failed')),
  started_at        timestamptz,
  ended_at          timestamptz,
  duration_seconds  integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  ended_reason      text,
  quality_score     integer CHECK (quality_score IS NULL OR quality_score BETWEEN 0 AND 100),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX IF NOT EXISTS calls_room_idx   ON calls(room_id, started_at);
CREATE INDEX IF NOT EXISTS calls_tenant_idx ON calls(tenant_id, status);

CREATE TABLE IF NOT EXISTS call_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id         uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  participant_id  uuid NOT NULL,
  role            text NOT NULL DEFAULT 'participant'
                  CHECK (role IN ('host','participant','observer')),
  joined_at       timestamptz,
  left_at         timestamptz,
  audio_muted     boolean NOT NULL DEFAULT false,
  video_off       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (left_at IS NULL OR joined_at IS NULL OR left_at >= joined_at)
);
CREATE INDEX        IF NOT EXISTS call_participants_call_idx        ON call_participants(call_id);
CREATE INDEX        IF NOT EXISTS call_participants_participant_idx ON call_participants(participant_id);
CREATE UNIQUE INDEX IF NOT EXISTS call_participants_unique_idx      ON call_participants(call_id, participant_id);

CREATE TABLE IF NOT EXISTS call_recordings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id           uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  storage_key       text NOT NULL,
  mime_type         text NOT NULL DEFAULT 'video/mp4',
  duration_seconds  integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  size_bytes        integer NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  status            text NOT NULL DEFAULT 'processing'
                    CHECK (status IN ('processing','ready','failed','expired')),
  expires_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS call_recordings_call_idx ON call_recordings(call_id);

CREATE TABLE IF NOT EXISTS call_transcripts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id     uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  language    text NOT NULL DEFAULT 'en',
  status      text NOT NULL DEFAULT 'processing'
              CHECK (status IN ('processing','ready','failed')),
  segments    jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS call_transcripts_call_idx ON call_transcripts(call_id);

CREATE TABLE IF NOT EXISTS call_events (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id   uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  kind      text NOT NULL,
  actor     text NOT NULL,
  detail    jsonb NOT NULL DEFAULT '{}'::jsonb,
  at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS call_events_call_idx ON call_events(call_id, at);
