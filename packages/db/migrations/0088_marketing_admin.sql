-- ============================================================
-- 0088_marketing_admin.sql
-- FD-15 closure — Marketing Admin Portal backend.
-- Tables: ads moderation queue, traffic events, IP intel,
-- SEO audit, marketing tasks/notices/internal-comms/emails.
-- ============================================================

-- ── Ads moderation queue ───────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_ads_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       text UNIQUE NOT NULL,
  advertiser      text NOT NULL,
  title           text NOT NULL,
  description     text,
  format          text NOT NULL DEFAULT 'image' CHECK (format IN ('image','video','text')),
  preview         text,
  landing_url     text,
  audience        text,
  placement       text,
  budget_cents    bigint NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'GBP',
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','needs_changes','flagged')),
  risk            text NOT NULL DEFAULT 'low' CHECK (risk IN ('low','medium','high','critical')),
  risk_score      int  NOT NULL DEFAULT 0,
  flags           jsonb NOT NULL DEFAULT '[]'::jsonb,
  ml_components   jsonb NOT NULL DEFAULT '{}'::jsonb,  -- breakdown from ml-python
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  decided_at      timestamptz,
  decided_by      uuid,
  decision_reason text,
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_maq_status_risk ON marketing_ads_queue (status, risk DESC, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_maq_advertiser ON marketing_ads_queue (advertiser);

-- ── Traffic events (ingest sink for analytics-python) ──────
CREATE TABLE IF NOT EXISTS marketing_traffic_events (
  id           bigserial PRIMARY KEY,
  ts           timestamptz NOT NULL DEFAULT now(),
  visitor_id   text,
  session_id   text,
  ip           inet,
  country      text,
  region       text,
  city         text,
  ua           text,
  source       text,                 -- direct|organic|paid|referral|social|email
  medium       text,
  campaign     text,
  page         text,
  event_type   text NOT NULL DEFAULT 'pageview'
    CHECK (event_type IN ('pageview','click','signup','convert','bot')),
  duration_ms  int,
  is_bot       boolean NOT NULL DEFAULT false,
  bot_score    numeric(4,3) NOT NULL DEFAULT 0,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_mte_ts      ON marketing_traffic_events (ts DESC);
CREATE INDEX IF NOT EXISTS idx_mte_country ON marketing_traffic_events (country, ts DESC);
CREATE INDEX IF NOT EXISTS idx_mte_source  ON marketing_traffic_events (source, ts DESC);
CREATE INDEX IF NOT EXISTS idx_mte_ip      ON marketing_traffic_events (ip, ts DESC);

-- ── IP intelligence ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_ip_intel (
  ip            inet PRIMARY KEY,
  reputation    numeric(4,3) NOT NULL DEFAULT 0,    -- 0 clean .. 1 bad
  status        text NOT NULL DEFAULT 'unknown'
    CHECK (status IN ('unknown','clean','watch','blocked')),
  flags         jsonb NOT NULL DEFAULT '[]'::jsonb, -- ['proxy','tor','datacenter','asn_spam']
  asn           int,
  asn_org       text,
  country       text,
  hits_24h      int  NOT NULL DEFAULT 0,
  unique_visitors_24h int NOT NULL DEFAULT 0,
  last_seen_at  timestamptz,
  last_action_by uuid,
  notes         text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mii_status_rep ON marketing_ip_intel (status, reputation DESC);

-- ── SEO audit snapshots ────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_seo_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url           text NOT NULL,
  title         text,
  meta_desc     text,
  h1_count      int  NOT NULL DEFAULT 0,
  word_count    int  NOT NULL DEFAULT 0,
  indexable     boolean NOT NULL DEFAULT true,
  score         int  NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  issues        jsonb NOT NULL DEFAULT '[]'::jsonb,
  audited_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mse_url ON marketing_seo_audit (url, audited_at DESC);

-- ── Marketing tasks (delegation queue) ─────────────────────
CREATE TABLE IF NOT EXISTS marketing_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference    text UNIQUE NOT NULL,
  title        text NOT NULL,
  detail       text,
  assignee_id  uuid,
  created_by   uuid,
  campaign_ref text,
  priority     text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  status       text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','blocked','done','cancelled')),
  due_at       timestamptz,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mt_status   ON marketing_tasks (status, priority, due_at);
CREATE INDEX IF NOT EXISTS idx_mt_assignee ON marketing_tasks (assignee_id, status);

-- ── Notices (policy/announcement) ──────────────────────────
CREATE TABLE IF NOT EXISTS marketing_notices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference   text UNIQUE NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  audience    text NOT NULL DEFAULT 'public' CHECK (audience IN ('public','operators','advertisers','partners')),
  severity    text NOT NULL DEFAULT 'info'   CHECK (severity IN ('info','warning','critical')),
  status      text NOT NULL DEFAULT 'draft'  CHECK (status IN ('draft','published','expired','retracted')),
  published_at timestamptz,
  expires_at   timestamptz,
  author_id    uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mn_status ON marketing_notices (status, severity, published_at DESC);

-- ── Internal team chat ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_threads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  campaign_ref text,
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_thread_messages (
  id          bigserial PRIMARY KEY,
  thread_id   uuid NOT NULL REFERENCES marketing_threads(id) ON DELETE CASCADE,
  author_id   uuid,
  author_name text,
  body        text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mtm_thread ON marketing_thread_messages (thread_id, created_at DESC);

-- ── Outbound email console (admin-side; reuses email_send_log if present) ─
CREATE TABLE IF NOT EXISTS marketing_email_blasts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference     text UNIQUE NOT NULL,
  subject       text NOT NULL,
  template_name text NOT NULL,
  audience      text NOT NULL DEFAULT 'newsletter',
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','sending','sent','failed')),
  recipients    int  NOT NULL DEFAULT 0,
  sent          int  NOT NULL DEFAULT 0,
  failed        int  NOT NULL DEFAULT 0,
  open_rate     numeric(5,4),
  click_rate    numeric(5,4),
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  created_by    uuid,
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Append-only audit ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_admin_audit (
  id          bigserial PRIMARY KEY,
  entity      text NOT NULL,
  entity_id   text NOT NULL,
  actor_id    uuid,
  action      text NOT NULL,
  before      jsonb,
  after       jsonb,
  ip          text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_maa_entity ON marketing_admin_audit (entity, entity_id, created_at DESC);

CREATE OR REPLACE FUNCTION marketing_admin_audit_lock() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'marketing_admin_audit is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_maa_lock ON marketing_admin_audit;
CREATE TRIGGER trg_maa_lock BEFORE UPDATE OR DELETE ON marketing_admin_audit
  FOR EACH ROW EXECUTE FUNCTION marketing_admin_audit_lock();

-- ── Idempotent dev seed ────────────────────────────────────
INSERT INTO marketing_ads_queue (reference, advertiser, title, format, status, risk, risk_score, flags, budget_cents, audience, placement)
VALUES
  ('CR-2901','PixelCraft Studio','Spring promo: 30% off all gigs','image','pending','low',12,'[]'::jsonb,84000,'UK + EU, 25–44, designers','Feed + Discovery'),
  ('CR-2900','GrowthLab','2x ROI in 14 days — sales coaching','video','pending','high',78,'["unsubstantiated_claim","guaranteed_returns"]'::jsonb,320000,'Global, 25–55, sales pros','Reels + Feed'),
  ('CR-2899','TalentRush','Hire pre-vetted devs in 48h','text','pending','medium',45,'["competing_marketplace"]'::jsonb,140000,'US + UK, hiring managers','Search results')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO marketing_ip_intel (ip, reputation, status, flags, country, hits_24h, unique_visitors_24h, last_seen_at)
VALUES
  ('185.220.101.5'::inet, 0.92, 'blocked',  '["tor","datacenter"]'::jsonb, 'NL', 4180,  12, now()),
  ('45.155.205.18'::inet, 0.78, 'watch',    '["proxy","asn_spam"]'::jsonb, 'RU',  920,   8, now() - interval '20 minutes'),
  ('165.227.84.99'::inet, 0.61, 'watch',    '["datacenter"]'::jsonb,       'US',  610,  44, now() - interval '1 hour')
ON CONFLICT (ip) DO NOTHING;

INSERT INTO marketing_tasks (reference, title, priority, status)
VALUES
  ('MTSK-DEMO-1','Q4 SEO audit + sitemap regeneration','high','open'),
  ('MTSK-DEMO-2','Approve holiday creative batch','urgent','in_progress'),
  ('MTSK-DEMO-3','Brief copywriter on landing v2','normal','open')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO marketing_notices (reference, title, body, audience, severity, status, published_at)
VALUES
  ('NT-0042','Holiday delivery delays','Some carriers report 2–4 day delays through 02 Jan.','public','warning','published', now() - interval '2 hours'),
  ('NT-0043','Updated ad policy: financial promotions','Crypto + speculative finance ads require new disclosure templates.','advertisers','critical','published', now() - interval '1 day')
ON CONFLICT (reference) DO NOTHING;
