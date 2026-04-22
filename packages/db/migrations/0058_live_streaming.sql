-- Domain — Live Streaming (RTMP/SRT/WHIP ingest → HLS/LL-HLS playback)
CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  tenant_id text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','cancelled')),
  ingest_protocol text NOT NULL DEFAULT 'rtmp' CHECK (ingest_protocol IN ('rtmp','srt','whip')),
  ingest_url text NOT NULL,
  stream_key text NOT NULL,
  playback_url text,
  hls_url text,
  ll_hls_url text,
  dash_url text,
  thumbnail_url text,
  max_resolution text NOT NULL DEFAULT '1080p' CHECK (max_resolution IN ('720p','1080p','4k','8k')),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  peak_viewers integer NOT NULL DEFAULT 0 CHECK (peak_viewers >= 0),
  total_viewers integer NOT NULL DEFAULT 0 CHECK (total_viewers >= 0),
  recording_enabled boolean NOT NULL DEFAULT true,
  recording_url text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX IF NOT EXISTS live_streams_owner_idx ON live_streams(owner_identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS live_streams_status_idx ON live_streams(status, scheduled_at);

CREATE TABLE IF NOT EXISTS live_stream_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  viewer_id uuid,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  watch_seconds integer NOT NULL DEFAULT 0 CHECK (watch_seconds >= 0),
  device text,
  resolution_watched text
);
CREATE INDEX IF NOT EXISTS lsv_stream_idx ON live_stream_viewers(stream_id, joined_at);

CREATE TABLE IF NOT EXISTS live_stream_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lsc_stream_idx ON live_stream_chat(stream_id, created_at DESC);
