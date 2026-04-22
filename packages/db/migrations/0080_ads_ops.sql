-- Domain 72 — Ads Ops / Policy Review / Geo+Keyword Moderation / Campaign Controls.

CREATE TABLE IF NOT EXISTS ads_ops_policy_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       TEXT NOT NULL UNIQUE,
  campaign_id     TEXT NOT NULL,
  advertiser_id   TEXT NOT NULL,
  creative_kind   TEXT NOT NULL CHECK (creative_kind IN ('image','video','carousel','text','native','audio')),
  headline        TEXT,
  body            TEXT,
  landing_url     TEXT,
  geos            JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords        JSONB NOT NULL DEFAULT '[]'::jsonb,
  policy_score    INT NOT NULL DEFAULT 50 CHECK (policy_score BETWEEN 0 AND 100),
  policy_band     TEXT NOT NULL DEFAULT 'normal' CHECK (policy_band IN ('normal','elevated','high','critical')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected','holding','escalated','archived')),
  queue           TEXT NOT NULL DEFAULT 'triage' CHECK (queue IN ('triage','review','escalation','closed')),
  assigned_to     UUID,
  sla_due_at      TIMESTAMPTZ,
  flags           JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{code, severity, source}]
  reasons         JSONB NOT NULL DEFAULT '[]'::jsonb,
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ads_ops_pr_status   ON ads_ops_policy_reviews(status, policy_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_ops_pr_queue    ON ads_ops_policy_reviews(queue, policy_score DESC);
CREATE INDEX IF NOT EXISTS idx_ads_ops_pr_assignee ON ads_ops_policy_reviews(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_ads_ops_pr_camp     ON ads_ops_policy_reviews(campaign_id);

CREATE TABLE IF NOT EXISTS ads_ops_decisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID NOT NULL REFERENCES ads_ops_policy_reviews(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL,
  decision    TEXT NOT NULL CHECK (decision IN
              ('approve','approve_with_edits','reject','request_changes','hold','escalate','dismiss',
               'pause_campaign','resume_campaign','disable_creative','geo_restrict','keyword_restrict')),
  rationale   TEXT NOT NULL,
  edits       JSONB NOT NULL DEFAULT '{}'::jsonb,        -- e.g. {removeGeos:[],removeKeywords:[]}
  appealable  TEXT NOT NULL DEFAULT 'yes' CHECK (appealable IN ('yes','no')),
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ads_ops_dec_review ON ads_ops_decisions(review_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ads_ops_geo_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope       TEXT NOT NULL CHECK (scope IN ('global','advertiser','campaign')),
  scope_id    TEXT,
  geo_code    TEXT NOT NULL,                              -- ISO country / region
  rule        TEXT NOT NULL CHECK (rule IN ('block','allow','restrict_age','restrict_category')),
  category    TEXT,
  reason      TEXT NOT NULL,
  added_by    UUID,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope, scope_id, geo_code, rule, category)
);
CREATE INDEX IF NOT EXISTS idx_ads_ops_geo_scope ON ads_ops_geo_rules(scope, scope_id);

CREATE TABLE IF NOT EXISTS ads_ops_keyword_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope       TEXT NOT NULL CHECK (scope IN ('global','advertiser','campaign')),
  scope_id    TEXT,
  keyword     TEXT NOT NULL,
  match       TEXT NOT NULL DEFAULT 'phrase' CHECK (match IN ('exact','phrase','regex','substring')),
  rule        TEXT NOT NULL CHECK (rule IN ('block','review','allow')),
  severity    TEXT NOT NULL DEFAULT 'normal' CHECK (severity IN ('low','normal','high','critical')),
  reason      TEXT NOT NULL,
  added_by    UUID,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope, scope_id, keyword, match)
);
CREATE INDEX IF NOT EXISTS idx_ads_ops_kw_scope ON ads_ops_keyword_rules(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_ads_ops_kw_kw    ON ads_ops_keyword_rules(keyword);

-- Campaign controls (operator overlay on campaigns living in Domain 60).
CREATE TABLE IF NOT EXISTS ads_ops_campaign_controls (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','disabled','restricted')),
  reason       TEXT,
  set_by       UUID,
  set_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta         JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Append-only audit ledger.
CREATE TABLE IF NOT EXISTS ads_ops_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    UUID REFERENCES ads_ops_policy_reviews(id) ON DELETE CASCADE,
  campaign_id  TEXT,
  actor_id     UUID,
  action       TEXT NOT NULL,
  from_state   TEXT,
  to_state     TEXT,
  diff         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ads_ops_evt_review ON ads_ops_events(review_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_ops_evt_camp   ON ads_ops_events(campaign_id, created_at DESC);

CREATE OR REPLACE FUNCTION ads_ops_events_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'ads_ops_events is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_ads_ops_evt_no_update ON ads_ops_events;
CREATE TRIGGER trg_ads_ops_evt_no_update BEFORE UPDATE OR DELETE ON ads_ops_events
  FOR EACH ROW EXECUTE FUNCTION ads_ops_events_immutable();

-- Seeds: realistic policy reviews + rules.
INSERT INTO ads_ops_policy_reviews
 (reference, campaign_id, advertiser_id, creative_kind, headline, body, landing_url, geos, keywords,
  policy_score, policy_band, status, queue, sla_due_at, flags, reasons) VALUES
 ('AO-PR-001','camp_1001','adv_201','image','Free Bitcoin doubler!','Send 0.1 BTC and receive 0.2 BTC instantly.',
  'https://btc-double.example.io',
  '["GB","US","DE"]'::jsonb,'["bitcoin","double","free"]'::jsonb,
  92,'critical','pending','escalation', now()+interval '2 hours',
  '[{"code":"financial_scam","severity":"critical","source":"keyword"},{"code":"unverified_url","severity":"high","source":"url"}]'::jsonb,
  '["financial_scam keyword pattern","landing url not verified"]'::jsonb),

 ('AO-PR-002','camp_1002','adv_202','video','Win at sports betting','New AI predicts wins. Sign up now.',
  'https://sportsbet.example.com',
  '["GB","FR"]'::jsonb,'["betting","gambling"]'::jsonb,
  68,'high','reviewing','review', now()+interval '6 hours',
  '[{"code":"gambling","severity":"high","source":"keyword"}]'::jsonb,
  '["gambling keyword - geo-restricted in some markets"]'::jsonb),

 ('AO-PR-003','camp_1003','adv_203','text','Hire London developers fast','Top 1% engineers ready in 48 hours.',
  'https://gigvora.com/talent',
  '["GB"]'::jsonb,'["hire","developer","london"]'::jsonb,
  18,'normal','pending','triage', now()+interval '24 hours',
  '[]'::jsonb,'[]'::jsonb),

 ('AO-PR-004','camp_1004','adv_204','carousel','Lose 10kg in 7 days','Doctors hate this miracle pill.',
  'https://miracle-pill.example.org',
  '["GB","US"]'::jsonb,'["weight loss","miracle","pill"]'::jsonb,
  84,'critical','holding','review', now()+interval '4 hours',
  '[{"code":"misleading_health","severity":"critical","source":"keyword"}]'::jsonb,
  '["misleading health claim"]'::jsonb),

 ('AO-PR-005','camp_1005','adv_205','image','Hire a creative agency in Berlin','Branding, design and motion in 2 weeks.',
  'https://berlin-creatives.example.com',
  '["DE","AT","CH"]'::jsonb,'["agency","branding","berlin"]'::jsonb,
  22,'normal','approved','closed', NULL,
  '[]'::jsonb,'[]'::jsonb)
ON CONFLICT (reference) DO NOTHING;

INSERT INTO ads_ops_geo_rules (scope, scope_id, geo_code, rule, category, reason) VALUES
 ('global', NULL, 'IR', 'block', NULL, 'Sanctioned region.'),
 ('global', NULL, 'KP', 'block', NULL, 'Sanctioned region.'),
 ('global', NULL, 'GB', 'restrict_category', 'gambling', 'Gambling requires UKGC compliance.'),
 ('global', NULL, 'US', 'restrict_category', 'crypto', 'Securities-style messaging restricted.')
ON CONFLICT DO NOTHING;

INSERT INTO ads_ops_keyword_rules (scope, scope_id, keyword, match, rule, severity, reason) VALUES
 ('global', NULL, 'bitcoin doubler',  'phrase',    'block',  'critical', 'Crypto scam pattern.'),
 ('global', NULL, 'miracle pill',     'phrase',    'block',  'critical', 'Misleading health pattern.'),
 ('global', NULL, 'guaranteed win',   'phrase',    'block',  'high',     'Gambling guarantee pattern.'),
 ('global', NULL, 'free btc',         'substring', 'review', 'high',     'Crypto giveaway pattern.'),
 ('global', NULL, 'lose .{1,3}kg',    'regex',     'review', 'high',     'Weight loss claim pattern.'),
 ('global', NULL, 'sports betting',   'phrase',    'review', 'normal',   'Gambling category requires geo-gating.')
ON CONFLICT DO NOTHING;

INSERT INTO ads_ops_campaign_controls (campaign_id, status, reason) VALUES
 ('camp_1004','paused','Holding for misleading health review.')
ON CONFLICT (campaign_id) DO NOTHING;
