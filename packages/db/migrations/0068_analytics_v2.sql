-- Domain — Analytics v2
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  identity_id uuid,
  anonymous_id text,
  session_id uuid,
  event_name text NOT NULL CHECK (length(event_name) BETWEEN 1 AND 128),
  event_category text,
  surface text,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  ingested_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_tenant_time_idx ON analytics_events(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_name_idx ON analytics_events(tenant_id, event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_identity_idx ON analytics_events(identity_id, occurred_at DESC) WHERE identity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON analytics_events(session_id) WHERE session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  identity_id uuid,
  anonymous_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_sec integer NOT NULL DEFAULT 0 CHECK (duration_sec >= 0),
  pageview_count integer NOT NULL DEFAULT 0 CHECK (pageview_count >= 0),
  device text,
  os text,
  browser text,
  country text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS analytics_sessions_tenant_idx ON analytics_sessions(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_identity_idx ON analytics_sessions(identity_id, started_at DESC) WHERE identity_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS analytics_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 128),
  steps jsonb NOT NULL,
  window_sec integer NOT NULL DEFAULT 86400 CHECK (window_sec BETWEEN 60 AND 2592000),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_funnels_tenant_idx ON analytics_funnels(tenant_id);

CREATE TABLE IF NOT EXISTS analytics_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL,
  definition jsonb NOT NULL,
  member_count integer NOT NULL DEFAULT 0 CHECK (member_count >= 0),
  refreshed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_cohorts_tenant_idx ON analytics_cohorts(tenant_id);

CREATE TABLE IF NOT EXISTS analytics_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  metric_key text NOT NULL CHECK (length(metric_key) BETWEEN 1 AND 64),
  day text NOT NULL CHECK (day ~ '^\d{4}-\d{2}-\d{2}$'),
  value real NOT NULL,
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, metric_key, day, dimensions)
);
CREATE INDEX IF NOT EXISTS analytics_metrics_daily_lookup_idx ON analytics_metrics_daily(tenant_id, metric_key, day DESC);
