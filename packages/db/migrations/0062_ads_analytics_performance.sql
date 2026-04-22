-- Domain 61 — Ads Analytics, CPC/CPM/CPI/CPA Reporting & Creative Performance.
-- Append-only daily facts; computed creative scores; saved reports / alerts /
-- export jobs / anomalies / audit. Layers on Domain 60 (amb_campaigns / amb_creatives).

CREATE TABLE IF NOT EXISTS aap_daily_facts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID NOT NULL,
  campaign_id         UUID NOT NULL,
  ad_group_id         UUID,
  creative_id         UUID,
  date                DATE NOT NULL,
  country             TEXT CHECK (country IS NULL OR length(country) = 2),
  device              TEXT CHECK (device IS NULL OR device IN ('desktop','mobile','tablet','tv','other')),
  placement           TEXT CHECK (placement IS NULL OR length(placement) <= 80),
  impressions         INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks              INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  installs            INTEGER NOT NULL DEFAULT 0 CHECK (installs >= 0),
  conversions         INTEGER NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  spend_minor         INTEGER NOT NULL DEFAULT 0 CHECK (spend_minor >= 0),
  revenue_minor       INTEGER NOT NULL DEFAULT 0 CHECK (revenue_minor >= 0),
  video_views_25      INTEGER NOT NULL DEFAULT 0 CHECK (video_views_25 >= 0),
  video_views_50      INTEGER NOT NULL DEFAULT 0 CHECK (video_views_50 >= 0),
  video_views_75      INTEGER NOT NULL DEFAULT 0 CHECK (video_views_75 >= 0),
  video_views_100     INTEGER NOT NULL DEFAULT 0 CHECK (video_views_100 >= 0),
  captured_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT uniq_aap_daily_fact UNIQUE (campaign_id, ad_group_id, creative_id, date, country, device, placement),
  CHECK (clicks <= impressions),
  CHECK (installs <= clicks),
  CHECK (conversions <= clicks),
  CHECK (video_views_50 <= video_views_25),
  CHECK (video_views_75 <= video_views_50),
  CHECK (video_views_100 <= video_views_75)
);
CREATE INDEX IF NOT EXISTS idx_aap_facts_owner ON aap_daily_facts(owner_identity_id, date);
CREATE INDEX IF NOT EXISTS idx_aap_facts_campaign ON aap_daily_facts(campaign_id, date);
CREATE INDEX IF NOT EXISTS idx_aap_facts_creative ON aap_daily_facts(creative_id, date);

-- Append-only fact table (no UPDATE/DELETE).
CREATE OR REPLACE FUNCTION aap_facts_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'aap_daily_facts is append-only';
END $$;
DROP TRIGGER IF EXISTS trg_aap_facts_no_update ON aap_daily_facts;
CREATE TRIGGER trg_aap_facts_no_update BEFORE UPDATE OR DELETE ON aap_daily_facts
  FOR EACH ROW EXECUTE FUNCTION aap_facts_immutable();

CREATE TABLE IF NOT EXISTS aap_creative_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID NOT NULL,
  creative_id         UUID NOT NULL,
  window_days         INTEGER NOT NULL DEFAULT 7 CHECK (window_days IN (7,14,30)),
  ctr                 REAL NOT NULL DEFAULT 0 CHECK (ctr >= 0 AND ctr <= 1),
  cvr                 REAL NOT NULL DEFAULT 0 CHECK (cvr >= 0 AND cvr <= 1),
  cpc_minor           INTEGER NOT NULL DEFAULT 0 CHECK (cpc_minor >= 0),
  cpm_minor           INTEGER NOT NULL DEFAULT 0 CHECK (cpm_minor >= 0),
  cpi_minor           INTEGER NOT NULL DEFAULT 0 CHECK (cpi_minor >= 0),
  cpa_minor           INTEGER NOT NULL DEFAULT 0 CHECK (cpa_minor >= 0),
  fatigue_score       REAL NOT NULL DEFAULT 0 CHECK (fatigue_score >= 0 AND fatigue_score <= 1),
  performance_score   REAL NOT NULL DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 1),
  band                TEXT NOT NULL DEFAULT 'unknown'
                      CHECK (band IN ('unknown','top','strong','average','weak','poor')),
  explanation         JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_aap_creative_score UNIQUE (creative_id, window_days)
);
CREATE INDEX IF NOT EXISTS idx_aap_creative_scores_owner ON aap_creative_scores(owner_identity_id, band);

CREATE TABLE IF NOT EXISTS aap_saved_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID NOT NULL,
  name                TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
  filters             JSONB NOT NULL DEFAULT '{}'::jsonb,
  group_by            JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics             JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aap_saved_reports_owner ON aap_saved_reports(owner_identity_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS aap_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID NOT NULL,
  name                TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','paused','triggered','acknowledged','archived')),
  metric              TEXT NOT NULL CHECK (metric IN ('ctr','cvr','cpc','cpm','cpi','cpa','spend','roas')),
  comparator          TEXT NOT NULL CHECK (comparator IN ('gt','lt','gte','lte','change_pct')),
  threshold           REAL NOT NULL,
  window_hours        INTEGER NOT NULL DEFAULT 24 CHECK (window_hours BETWEEN 1 AND 720),
  scope               JSONB NOT NULL DEFAULT '{}'::jsonb,
  channel             TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email','webhook','in_app')),
  channel_target      TEXT CHECK (channel_target IS NULL OR length(channel_target) <= 500),
  last_triggered_at   TIMESTAMPTZ,
  cooldown_minutes    INTEGER NOT NULL DEFAULT 60 CHECK (cooldown_minutes BETWEEN 0 AND 10080),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aap_alerts_owner ON aap_alerts(owner_identity_id, status);

CREATE TABLE IF NOT EXISTS aap_alert_events (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id                    UUID NOT NULL REFERENCES aap_alerts(id) ON DELETE CASCADE,
  triggered_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  observed_value              REAL NOT NULL,
  threshold                   REAL NOT NULL,
  payload                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_by_identity_id UUID,
  acknowledged_at             TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_aap_alert_events ON aap_alert_events(alert_id, triggered_at DESC);

CREATE TABLE IF NOT EXISTS aap_export_jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID NOT NULL,
  format              TEXT NOT NULL CHECK (format IN ('csv','json','xlsx')),
  status              TEXT NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  filters             JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_count           INTEGER CHECK (row_count IS NULL OR row_count >= 0),
  file_url            TEXT CHECK (file_url IS NULL OR length(file_url) <= 2000),
  error               TEXT CHECK (error IS NULL OR length(error) <= 2000),
  started_at          TIMESTAMPTZ,
  finished_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aap_exports_owner ON aap_export_jobs(owner_identity_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS aap_anomalies (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id           UUID NOT NULL,
  scope                       JSONB NOT NULL DEFAULT '{}'::jsonb,
  metric                      TEXT NOT NULL,
  observed_value              REAL NOT NULL,
  expected_value              REAL NOT NULL,
  zscore                      REAL NOT NULL,
  severity                    TEXT NOT NULL CHECK (severity IN ('info','warn','critical')),
  status                      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  rationale                   TEXT NOT NULL CHECK (length(rationale) BETWEEN 1 AND 1000),
  detected_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at                 TIMESTAMPTZ,
  acknowledged_by_identity_id UUID
);
CREATE INDEX IF NOT EXISTS idx_aap_anomalies_owner ON aap_anomalies(owner_identity_id, status, detected_at DESC);

CREATE TABLE IF NOT EXISTS aap_audit_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID,
  actor_identity_id   UUID,
  actor_role          TEXT,
  action              TEXT NOT NULL,
  target_type         TEXT,
  target_id           UUID,
  diff                JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip                  TEXT,
  user_agent          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aap_audit_owner ON aap_audit_events(owner_identity_id, created_at DESC);

-- ─── Seed (layered on Domain 60 fixtures) ──────────────────
INSERT INTO aap_daily_facts (owner_identity_id, campaign_id, ad_group_id, creative_id, date, country, device, placement,
                             impressions, clicks, installs, conversions, spend_minor, revenue_minor,
                             video_views_25, video_views_50, video_views_75, video_views_100)
VALUES
  ('00000000-0000-0000-0000-0000000000e1'::uuid,
   '00000000-0000-0000-0000-000000006001'::uuid,
   '00000000-0000-0000-0000-000000006201'::uuid,
   '00000000-0000-0000-0000-000000006101'::uuid,
   CURRENT_DATE - INTERVAL '1 day', 'GB', 'desktop', 'feed',
   12000, 360, 0, 18, 540_00, 1200_00, 0,0,0,0),
  ('00000000-0000-0000-0000-0000000000e1'::uuid,
   '00000000-0000-0000-0000-000000006001'::uuid,
   '00000000-0000-0000-0000-000000006201'::uuid,
   '00000000-0000-0000-0000-000000006101'::uuid,
   CURRENT_DATE - INTERVAL '2 day', 'GB', 'mobile', 'feed',
   18500, 520, 0, 22, 780_00, 1450_00, 0,0,0,0)
ON CONFLICT DO NOTHING;

INSERT INTO aap_creative_scores (owner_identity_id, creative_id, window_days, ctr, cvr,
                                  cpc_minor, cpm_minor, cpi_minor, cpa_minor,
                                  fatigue_score, performance_score, band, explanation)
VALUES (
  '00000000-0000-0000-0000-0000000000e1'::uuid,
  '00000000-0000-0000-0000-000000006101'::uuid,
  7, 0.0288, 0.0455, 150, 4324, 0, 3300, 0.18, 0.78, 'strong',
  '{"top_factor":"high_ctr","caveat":"sample_size_limited"}'::jsonb
) ON CONFLICT DO NOTHING;
