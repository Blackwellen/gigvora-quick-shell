-- Domain 60 — Ads Manager: Campaign List, Builder, Creative Library & Routing.
-- State machines:
--   amb_campaigns: draft → in_review → approved → active ↔ paused → completed | archived
--                  in_review → rejected → draft; approved → archived
--   amb_creatives: draft → in_review → approved → archived; in_review → rejected → draft
--   amb_ad_groups: draft → active ↔ paused → archived

CREATE TABLE IF NOT EXISTS amb_campaigns (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id           UUID NOT NULL,
  name                        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  objective                   TEXT NOT NULL
                              CHECK (objective IN ('awareness','traffic','leads','conversions','app_installs','engagement')),
  status                      TEXT NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','in_review','approved','active','paused','completed','archived','rejected')),
  budget_minor                INTEGER NOT NULL DEFAULT 0 CHECK (budget_minor >= 0),
  daily_budget_minor          INTEGER NOT NULL DEFAULT 0 CHECK (daily_budget_minor >= 0),
  spent_minor                 INTEGER NOT NULL DEFAULT 0 CHECK (spent_minor >= 0),
  currency                    TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  start_at                    TIMESTAMPTZ,
  end_at                      TIMESTAMPTZ,
  routing_rules               JSONB NOT NULL DEFAULT '{}'::jsonb,
  quality_score               REAL CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1)),
  rejection_reason            TEXT,
  approved_by_identity_id     UUID,
  approved_at                 TIMESTAMPTZ,
  meta                        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at IS NULL OR start_at IS NULL OR end_at >= start_at),
  CHECK (spent_minor <= budget_minor + 100000)  -- soft 1k GBP overspend grace
);
CREATE INDEX IF NOT EXISTS idx_amb_campaigns_owner ON amb_campaigns(owner_identity_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_amb_campaigns_status ON amb_campaigns(status, created_at DESC);

CREATE TABLE IF NOT EXISTS amb_ad_groups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID NOT NULL REFERENCES amb_campaigns(id) ON DELETE CASCADE,
  name                TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','active','paused','archived')),
  bid_strategy        TEXT NOT NULL DEFAULT 'cpc'
                      CHECK (bid_strategy IN ('cpc','cpm','cpa','target_cpa')),
  bid_amount_minor    INTEGER NOT NULL DEFAULT 0 CHECK (bid_amount_minor >= 0),
  targeting           JSONB NOT NULL DEFAULT '{}'::jsonb,
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amb_adgroups_campaign ON amb_ad_groups(campaign_id, status);

CREATE TABLE IF NOT EXISTS amb_creatives (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id    UUID NOT NULL,
  name                 TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  format               TEXT NOT NULL CHECK (format IN ('image','video','carousel','html5','text')),
  status               TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','in_review','approved','rejected','archived')),
  asset_url            TEXT CHECK (asset_url IS NULL OR length(asset_url) <= 2000),
  thumbnail_url        TEXT CHECK (thumbnail_url IS NULL OR length(thumbnail_url) <= 2000),
  headline             TEXT CHECK (headline IS NULL OR length(headline) <= 200),
  body                 TEXT CHECK (body IS NULL OR length(body) <= 1000),
  cta                  TEXT CHECK (cta IS NULL OR length(cta) <= 60),
  destination_url      TEXT CHECK (destination_url IS NULL OR length(destination_url) <= 2000),
  width                INTEGER CHECK (width IS NULL OR (width > 0 AND width <= 10000)),
  height               INTEGER CHECK (height IS NULL OR (height > 0 AND height <= 10000)),
  duration_sec         INTEGER CHECK (duration_sec IS NULL OR (duration_sec >= 0 AND duration_sec <= 600)),
  file_size_bytes      INTEGER CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  moderation_score     REAL CHECK (moderation_score IS NULL OR (moderation_score >= 0 AND moderation_score <= 1)),
  moderation_flags     JSONB NOT NULL DEFAULT '[]'::jsonb,
  rejection_reason     TEXT,
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amb_creatives_owner ON amb_creatives(owner_identity_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_amb_creatives_format ON amb_creatives(format, status);

CREATE TABLE IF NOT EXISTS amb_ad_group_creatives (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_group_id   UUID NOT NULL REFERENCES amb_ad_groups(id) ON DELETE CASCADE,
  creative_id   UUID NOT NULL REFERENCES amb_creatives(id) ON DELETE RESTRICT,
  weight        INTEGER NOT NULL DEFAULT 100 CHECK (weight >= 0 AND weight <= 10000),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_amb_adgroup_creative UNIQUE (ad_group_id, creative_id)
);
CREATE INDEX IF NOT EXISTS idx_amb_adgroup_creatives_adgroup ON amb_ad_group_creatives(ad_group_id, status);

CREATE TABLE IF NOT EXISTS amb_routing_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES amb_campaigns(id) ON DELETE CASCADE,
  priority        INTEGER NOT NULL DEFAULT 100 CHECK (priority >= 0 AND priority <= 10000),
  condition_type  TEXT NOT NULL CHECK (condition_type IN ('geo','device','language','audience','time','placement')),
  condition_value JSONB NOT NULL,
  action          TEXT NOT NULL CHECK (action IN ('include','exclude','boost','cap')),
  action_value    JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amb_routing_campaign ON amb_routing_rules(campaign_id, priority);

CREATE TABLE IF NOT EXISTS amb_metric_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES amb_campaigns(id) ON DELETE CASCADE,
  ad_group_id     UUID REFERENCES amb_ad_groups(id) ON DELETE CASCADE,
  creative_id     UUID REFERENCES amb_creatives(id) ON DELETE SET NULL,
  date            TEXT NOT NULL CHECK (date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  impressions     INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks          INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions     INTEGER NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  spend_minor     INTEGER NOT NULL DEFAULT 0 CHECK (spend_minor >= 0),
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT uniq_amb_metric_snapshot UNIQUE (campaign_id, ad_group_id, creative_id, date),
  CHECK (clicks <= impressions),
  CHECK (conversions <= clicks)
);
CREATE INDEX IF NOT EXISTS idx_amb_metrics_campaign ON amb_metric_snapshots(campaign_id, date);

-- Append-only metric snapshots (UPDATE/DELETE blocked).
CREATE OR REPLACE FUNCTION amb_metric_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'amb_metric_snapshots is append-only';
END $$;
DROP TRIGGER IF EXISTS trg_amb_metric_no_update ON amb_metric_snapshots;
CREATE TRIGGER trg_amb_metric_no_update BEFORE UPDATE OR DELETE ON amb_metric_snapshots
  FOR EACH ROW EXECUTE FUNCTION amb_metric_immutable();

CREATE TABLE IF NOT EXISTS amb_moderation_reviews (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type             TEXT NOT NULL CHECK (subject_type IN ('campaign','creative')),
  subject_id               UUID NOT NULL,
  reviewer_identity_id     UUID,
  decision                 TEXT NOT NULL CHECK (decision IN ('approved','rejected','needs_changes')),
  rationale                TEXT NOT NULL CHECK (length(rationale) BETWEEN 1 AND 1000),
  flags                    JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_score              REAL CHECK (model_score IS NULL OR (model_score >= 0 AND model_score <= 1)),
  reviewed_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amb_moderation_subject ON amb_moderation_reviews(subject_type, subject_id, reviewed_at DESC);

CREATE TABLE IF NOT EXISTS amb_search_index (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type         TEXT NOT NULL CHECK (subject_type IN ('campaign','creative')),
  subject_id           UUID NOT NULL,
  owner_identity_id    UUID NOT NULL,
  search_text          TEXT NOT NULL,
  facets               JSONB NOT NULL DEFAULT '{}'::jsonb,
  ranking_score        REAL NOT NULL DEFAULT 0,
  indexed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_amb_search UNIQUE (subject_type, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_amb_search_owner ON amb_search_index(owner_identity_id, subject_type);
CREATE INDEX IF NOT EXISTS idx_amb_search_text ON amb_search_index USING gin(to_tsvector('english', search_text));

CREATE TABLE IF NOT EXISTS amb_webhook_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL,
  event_id        TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT true,
  status          TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed','skipped','failed')),
  payload         JSONB NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_amb_webhook UNIQUE (provider, event_id)
);

CREATE TABLE IF NOT EXISTS amb_audit_events (
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
CREATE INDEX IF NOT EXISTS idx_amb_audit_owner ON amb_audit_events(owner_identity_id, created_at DESC);

-- ─── Seed ────────────────────────────────────────────
INSERT INTO amb_campaigns (id, owner_identity_id, name, objective, status, budget_minor, daily_budget_minor, currency, routing_rules)
VALUES (
  '00000000-0000-0000-0000-000000006001'::uuid,
  '00000000-0000-0000-0000-0000000000e1'::uuid,
  'Spring talent push (UK)', 'leads', 'active', 5000_00, 250_00, 'GBP',
  '{"geos":["GB"],"languages":["en"],"deviceTypes":["desktop","mobile"],"audiences":["uk-tech"],"frequencyCap":{"impressions":3,"period":"day"}}'::jsonb
) ON CONFLICT DO NOTHING;

INSERT INTO amb_creatives (id, owner_identity_id, name, format, status, headline, body, cta, destination_url, width, height)
VALUES (
  '00000000-0000-0000-0000-000000006101'::uuid,
  '00000000-0000-0000-0000-0000000000e1'::uuid,
  'Hero — talent platform', 'image', 'approved',
  'Hire faster with Gigvora', 'Vetted talent, ready to start this week.',
  'Get started', 'https://gigvora.com/hire', 1200, 628
) ON CONFLICT DO NOTHING;

INSERT INTO amb_ad_groups (id, campaign_id, name, status, bid_strategy, bid_amount_minor)
VALUES (
  '00000000-0000-0000-0000-000000006201'::uuid,
  '00000000-0000-0000-0000-000000006001'::uuid,
  'UK desktop — high intent', 'active', 'cpc', 1_50
) ON CONFLICT DO NOTHING;

INSERT INTO amb_ad_group_creatives (ad_group_id, creative_id, weight, status)
VALUES (
  '00000000-0000-0000-0000-000000006201'::uuid,
  '00000000-0000-0000-0000-000000006101'::uuid,
  100, 'active'
) ON CONFLICT DO NOTHING;

INSERT INTO amb_search_index (subject_type, subject_id, owner_identity_id, search_text, facets, ranking_score)
VALUES (
  'campaign', '00000000-0000-0000-0000-000000006001'::uuid,
  '00000000-0000-0000-0000-0000000000e1'::uuid,
  'spring talent push uk leads active', '{"status":"active","objective":"leads","geos":["GB"]}'::jsonb, 0.8
), (
  'creative', '00000000-0000-0000-0000-000000006101'::uuid,
  '00000000-0000-0000-0000-0000000000e1'::uuid,
  'hero talent platform image approved hire faster', '{"status":"approved","format":"image"}'::jsonb, 0.7
) ON CONFLICT DO NOTHING;
