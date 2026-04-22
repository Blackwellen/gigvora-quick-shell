-- ============================================================
-- 0090_kpi_registry_and_reporting.sql — FD-13 closure
--
-- Super-admin custom-KPI registry (the headline missing piece):
--   title / target_type / value_mode / unset_state — the four
--   binding fields the FD-13 audit called out as "entirely unbuilt".
-- Reporting tables (report_definitions/schedules/runs/subscriptions)
-- already exist in 0069 — this migration is additive and idempotent.
-- ============================================================

-- ---- KPI registry --------------------------------------------------------

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       text NOT NULL DEFAULT 'global',
  -- The four FD-13 binding fields:
  title           text NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  target_type     text NOT NULL CHECK (target_type IN
                    ('count','sum','avg','ratio','duration_ms','currency','percent')),
  value_mode      text NOT NULL CHECK (value_mode IN
                    ('absolute','delta','rolling_avg','target_progress','signed_change')),
  unset_state     text NOT NULL DEFAULT 'placeholder' CHECK (unset_state IN
                    ('placeholder','hide','zero','dash','last_known')),
  -- Body
  description     text,
  metric_key      text NOT NULL,                      -- canonical metric (e.g. 'jobs.applications')
  source          text NOT NULL DEFAULT 'analytics_rollups' CHECK (source IN
                    ('analytics_rollups','analytics_events','sql','custom')),
  source_query    text,                                -- only for source='sql' (read-only views)
  unit            text,                                -- '$', '%', 'ms', 's', null
  format          text NOT NULL DEFAULT 'number' CHECK (format IN ('number','currency','percent','duration')),
  decimals        int NOT NULL DEFAULT 0 CHECK (decimals BETWEEN 0 AND 6),
  target_value    numeric,                             -- optional goal for target_progress
  filters         jsonb NOT NULL DEFAULT '{}'::jsonb,
  schedule_cron   text,                                -- when to evaluate; null = on-demand
  status          text NOT NULL DEFAULT 'live' CHECK (status IN ('draft','live','paused','retired')),
  owner_id        uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kpi_defs_tenant ON kpi_definitions (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_kpi_defs_metric ON kpi_definitions (metric_key);

-- Where the KPI is rendered (which admin portal / dashboard slot)
CREATE TABLE IF NOT EXISTS kpi_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id          uuid NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  portal          text NOT NULL CHECK (portal IN
                    ('moderation','admin_ops','disputes','finance','verification','cs',
                     'marketing','super','user','professional','enterprise')),
  position        int NOT NULL DEFAULT 0,
  visibility      text NOT NULL DEFAULT 'all' CHECK (visibility IN ('all','admins','owners')),
  assigned_by     uuid,
  assigned_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kpi_id, portal)
);
CREATE INDEX IF NOT EXISTS idx_kpi_assign_portal ON kpi_assignments (portal, position);

-- Time-series snapshot (worker writes these; admin UI reads them)
CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id              bigserial PRIMARY KEY,
  kpi_id          uuid NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  bucket_at       timestamptz NOT NULL,
  bucket          text NOT NULL CHECK (bucket IN ('minute','hour','day','week','month')),
  value           numeric NOT NULL,
  prev_value      numeric,
  delta_pct       numeric,
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kpi_id, bucket, bucket_at)
);
CREATE INDEX IF NOT EXISTS idx_kpi_snap_lookup ON kpi_snapshots (kpi_id, bucket_at DESC);

-- Append-only audit (every create/update/retire/assign)
CREATE TABLE IF NOT EXISTS kpi_audit (
  id          bigserial PRIMARY KEY,
  kpi_id      uuid,
  actor_id    uuid,
  action      text NOT NULL,
  before_doc  jsonb,
  after_doc   jsonb,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kpi_audit_kpi ON kpi_audit (kpi_id, created_at DESC);

CREATE OR REPLACE FUNCTION kpi_audit_block_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'kpi_audit is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_kpi_audit_block ON kpi_audit;
CREATE TRIGGER trg_kpi_audit_block BEFORE UPDATE OR DELETE ON kpi_audit
  FOR EACH ROW EXECUTE FUNCTION kpi_audit_block_update();

-- updated_at trigger for kpi_definitions
CREATE OR REPLACE FUNCTION kpi_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_kpi_defs_touch ON kpi_definitions;
CREATE TRIGGER trg_kpi_defs_touch BEFORE UPDATE ON kpi_definitions
  FOR EACH ROW EXECUTE FUNCTION kpi_touch_updated_at();

-- ---- Seed canonical KPIs (idempotent) ----------------------------------

INSERT INTO kpi_definitions (id, title, target_type, value_mode, unset_state, metric_key, source, format, unit, decimals, status, description) VALUES
  (gen_random_uuid(), 'Open moderation queue', 'count',  'absolute', 'placeholder', 'mod.queue.open',           'analytics_rollups', 'number',   NULL, 0, 'live', 'Pending items in the global moderation queue'),
  (gen_random_uuid(), 'SLA breached',          'count',  'absolute', 'zero',        'mod.sla.breached',         'analytics_rollups', 'number',   NULL, 0, 'live', 'Moderation items past SLA'),
  (gen_random_uuid(), 'Open admin tickets',    'count',  'absolute', 'placeholder', 'ops.tickets.open',         'analytics_rollups', 'number',   NULL, 0, 'live', 'Open ops tickets across all portals'),
  (gen_random_uuid(), 'Active sessions',       'count',  'absolute', 'last_known',  'sessions.active',          'analytics_events',  'number',   NULL, 0, 'live', 'Live authenticated sessions (last 5m)'),
  (gen_random_uuid(), 'Open disputes',         'count',  'absolute', 'placeholder', 'disputes.open',            'analytics_rollups', 'number',   NULL, 0, 'live', NULL),
  (gen_random_uuid(), 'Pending refunds',       'currency','absolute','dash',        'finance.refunds.pending',  'analytics_rollups', 'currency', '$',  2, 'live', NULL),
  (gen_random_uuid(), 'Verification queue',    'count',  'absolute', 'placeholder', 'verif.queue.open',         'analytics_rollups', 'number',   NULL, 0, 'live', NULL),
  (gen_random_uuid(), 'Apply rate',            'percent','rolling_avg','dash',      'jobs.apply_rate',          'analytics_rollups', 'percent',  '%',  1, 'live', 'Applications / Views over rolling 30d'),
  (gen_random_uuid(), 'Time to hire (days)',   'avg',    'rolling_avg','dash',      'jobs.time_to_hire_days',   'analytics_rollups', 'duration', NULL, 1, 'live', NULL),
  (gen_random_uuid(), 'Cost per hire',         'currency','rolling_avg','dash',     'jobs.cost_per_hire',       'analytics_rollups', 'currency', '$',  0, 'live', NULL)
ON CONFLICT DO NOTHING;
