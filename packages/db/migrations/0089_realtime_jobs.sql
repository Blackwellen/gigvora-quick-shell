-- ============================================================
-- 0089_realtime_jobs.sql — FD-14 closure
-- Tables backing real BullMQ workers, cron registry, realtime
-- counter broker, and append-only job audit.
-- ============================================================

-- Job execution audit (every BullMQ job lands here on completion/failure)
CREATE TABLE IF NOT EXISTS job_runs (
  id              bigserial PRIMARY KEY,
  queue           text NOT NULL,
  job_id          text NOT NULL,
  job_name        text NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  result          jsonb,
  status          text NOT NULL CHECK (status IN ('completed','failed','cancelled')),
  duration_ms     int,
  attempts_made   int NOT NULL DEFAULT 1,
  failed_reason   text,
  started_at      timestamptz NOT NULL,
  finished_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_runs_queue_time ON job_runs (queue, finished_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_runs_status     ON job_runs (status, finished_at DESC);

-- Cron registry (Nest schedule jobs declared here for visibility/manual trigger)
CREATE TABLE IF NOT EXISTS cron_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text UNIQUE NOT NULL,
  cron          text NOT NULL,                 -- e.g. '*/5 * * * *'
  queue         text NOT NULL,
  job_name      text NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled       boolean NOT NULL DEFAULT true,
  last_run_at   timestamptz,
  last_status   text CHECK (last_status IN ('completed','failed','running','idle')),
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Realtime counters (single source for badges across the app)
CREATE TABLE IF NOT EXISTS realtime_counters (
  scope         text NOT NULL,                  -- 'global' | 'user' | 'org'
  scope_id      text NOT NULL DEFAULT 'global', -- e.g. identityId / orgId
  key           text NOT NULL,                  -- 'inbox.unread' | 'feed.new' | 'queue.depth.notifications'
  value         bigint NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, scope_id, key)
);
CREATE INDEX IF NOT EXISTS idx_rtc_scope ON realtime_counters (scope, scope_id);

-- Outbound webhook delivery log (used by webhooks-out worker)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id            bigserial PRIMARY KEY,
  endpoint_url  text NOT NULL,
  event         text NOT NULL,
  payload       jsonb NOT NULL,
  status_code   int,
  attempt       int NOT NULL DEFAULT 1,
  delivered     boolean NOT NULL DEFAULT false,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wd_event ON webhook_deliveries (event, created_at DESC);

-- Analytics rollup output (analytics-rollup worker writes here)
CREATE TABLE IF NOT EXISTS analytics_rollups (
  id           bigserial PRIMARY KEY,
  bucket       text NOT NULL,           -- 'hour' | 'day' | 'week'
  metric       text NOT NULL,
  bucket_at    timestamptz NOT NULL,
  value        numeric NOT NULL DEFAULT 0,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, metric, bucket_at)
);
CREATE INDEX IF NOT EXISTS idx_ar_metric ON analytics_rollups (metric, bucket_at DESC);

-- Idempotent cron seed (matches CronRegistryService declarations)
INSERT INTO cron_jobs (name, cron, queue, job_name, payload, description) VALUES
  ('analytics.rollup.hourly',   '0 * * * *', 'analytics-rollup', 'rollup.hour',  '{"bucket":"hour"}'::jsonb, 'Hourly metric rollups'),
  ('analytics.rollup.daily',    '5 0 * * *', 'analytics-rollup', 'rollup.day',   '{"bucket":"day"}'::jsonb,  'Daily metric rollups (00:05)'),
  ('billing.reconcile.nightly', '15 2 * * *','billing',          'reconcile',    '{}'::jsonb,                'Nightly billing reconciliation (02:15)'),
  ('webhooks.retry.sweep',      '*/5 * * * *','webhooks-out',    'retry.sweep',  '{}'::jsonb,                'Retry webhook deliveries every 5m'),
  ('ml.batch.embeddings',       '*/15 * * * *','ml-batch',       'embeddings.refresh','{}'::jsonb,           'Refresh embeddings every 15m'),
  ('counters.recompute',        '*/2 * * * *','analytics-rollup','counters.recompute','{}'::jsonb,           'Recompute realtime counters every 2m')
ON CONFLICT (name) DO NOTHING;
