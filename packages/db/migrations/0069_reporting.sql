-- Domain — Reporting
CREATE TABLE IF NOT EXISTS report_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  owner_identity_id uuid NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  description text,
  kind text NOT NULL DEFAULT 'table' CHECK (kind IN ('table','chart','dashboard')),
  query jsonb NOT NULL,
  visualization jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','team','public')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_defs_tenant_idx ON report_definitions(tenant_id, owner_identity_id);

CREATE TABLE IF NOT EXISTS report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  cron_expr text NOT NULL CHECK (length(cron_expr) BETWEEN 9 AND 128),
  timezone text NOT NULL DEFAULT 'UTC',
  enabled boolean NOT NULL DEFAULT true,
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  format text NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf','csv','xlsx','json')),
  last_run_at timestamptz,
  next_run_at timestamptz
);
CREATE INDEX IF NOT EXISTS report_schedules_next_idx ON report_schedules(next_run_at) WHERE enabled;

CREATE TABLE IF NOT EXISTS report_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES report_schedules(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed')),
  started_at timestamptz,
  completed_at timestamptz,
  row_count integer CHECK (row_count IS NULL OR row_count >= 0),
  artifact_url text,
  error_message text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS report_runs_report_idx ON report_runs(report_id, started_at DESC);

CREATE TABLE IF NOT EXISTS report_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email','in_app','slack')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, identity_id, channel)
);
