-- Domain 26 — Media Viewer.
-- Owner: apps/api-nest/src/modules/media-viewer/
-- Source of truth: packages/db/src/schema/media-viewer.ts

CREATE TABLE IF NOT EXISTS media_playback_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          uuid NOT NULL,
  viewer_id         uuid,
  tenant_id         text NOT NULL,
  surface           text NOT NULL DEFAULT 'web' CHECK (surface IN ('web','ios','android','embed','reels')),
  client            text,
  started_at        timestamptz NOT NULL DEFAULT now(),
  ended_at          timestamptz,
  watched_seconds   integer NOT NULL DEFAULT 0 CHECK (watched_seconds >= 0),
  completed_pct     integer NOT NULL DEFAULT 0 CHECK (completed_pct BETWEEN 0 AND 100),
  exit_reason       text CHECK (exit_reason IS NULL OR exit_reason IN ('ended','swipe','nav','error','tab_hidden')),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX IF NOT EXISTS mps_asset_idx  ON media_playback_sessions(asset_id, started_at);
CREATE INDEX IF NOT EXISTS mps_viewer_idx ON media_playback_sessions(viewer_id, started_at);

CREATE TABLE IF NOT EXISTS media_playback_segments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES media_playback_sessions(id) ON DELETE CASCADE,
  start_ms      integer NOT NULL CHECK (start_ms >= 0),
  end_ms        integer NOT NULL CHECK (end_ms > start_ms),
  speed         integer NOT NULL DEFAULT 100 CHECK (speed BETWEEN 25 AND 400),
  buffering_ms  integer NOT NULL DEFAULT 0 CHECK (buffering_ms >= 0)
);
CREATE INDEX IF NOT EXISTS mpsg_session_idx ON media_playback_segments(session_id, start_ms);

CREATE TABLE IF NOT EXISTS media_qoe_samples (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL REFERENCES media_playback_sessions(id) ON DELETE CASCADE,
  bitrate_kbps    integer NOT NULL DEFAULT 0 CHECK (bitrate_kbps >= 0),
  resolution      text,
  dropped_frames  integer NOT NULL DEFAULT 0 CHECK (dropped_frames >= 0),
  rebuffer_ms     integer NOT NULL DEFAULT 0 CHECK (rebuffer_ms >= 0),
  startup_ms      integer NOT NULL DEFAULT 0 CHECK (startup_ms >= 0),
  at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mqoe_session_idx ON media_qoe_samples(session_id, at);

CREATE TABLE IF NOT EXISTS media_asset_stats (
  asset_id            uuid PRIMARY KEY,
  views               integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  unique_viewers      integer NOT NULL DEFAULT 0 CHECK (unique_viewers >= 0),
  avg_watch_seconds   integer NOT NULL DEFAULT 0 CHECK (avg_watch_seconds >= 0),
  completion_rate_bp  integer NOT NULL DEFAULT 0 CHECK (completion_rate_bp BETWEEN 0 AND 10000),
  recomputed_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_viewer_reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES media_playback_sessions(id) ON DELETE CASCADE,
  asset_id    uuid NOT NULL,
  viewer_id   uuid,
  kind        text NOT NULL CHECK (kind IN ('like','save','share','report','timestamp_comment')),
  at_ms       integer NOT NULL DEFAULT 0 CHECK (at_ms >= 0),
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mvr_asset_idx ON media_viewer_reactions(asset_id, kind);
