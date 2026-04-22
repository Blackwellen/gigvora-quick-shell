-- Domain 68 — Sales Navigator
-- Reuses existing public.companies for account/company intel (NEVER duplicates).
-- Adds sales-only signal table + lead workspace + outreach + seat mgmt.

-- ============================================================
-- Sales-only enrichment overlay on existing companies
-- ============================================================
CREATE TABLE IF NOT EXISTS sn_sales_signals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN (
                  'funding','hiring_surge','exec_change','tech_adoption',
                  'office_expansion','layoffs','acquisition','partnership',
                  'product_launch','press_mention','intent_score','geo_expansion')),
  severity      INTEGER NOT NULL DEFAULT 50 CHECK (severity BETWEEN 0 AND 100),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  source_url    TEXT,
  source_label  TEXT,
  detected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sn_signals_company ON sn_sales_signals(company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_sn_signals_kind ON sn_sales_signals(kind, severity DESC);

-- ============================================================
-- Leads (people-level) — workspace-scoped
-- ============================================================
CREATE TABLE IF NOT EXISTS sn_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  workspace_id    UUID,
  full_name       TEXT NOT NULL,
  headline        TEXT NOT NULL DEFAULT '',
  email           TEXT,
  phone           TEXT,
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name    TEXT,
  title           TEXT,
  seniority       TEXT CHECK (seniority IN ('intern','ic','senior','lead','manager','director','vp','c_level','founder') OR seniority IS NULL),
  function_area   TEXT,
  industry        TEXT,
  hq_country      TEXT,
  hq_city         TEXT,
  region          TEXT,
  linkedin_url    TEXT,
  source          TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','search','import','enrichment','signal','referral')),
  intent_score    INTEGER NOT NULL DEFAULT 0 CHECK (intent_score BETWEEN 0 AND 100),
  fit_score       INTEGER NOT NULL DEFAULT 0 CHECK (fit_score BETWEEN 0 AND 100),
  tags            TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
                    'new','researching','contacted','engaged','qualified',
                    'opportunity','won','lost','unresponsive','disqualified')),
  saved           BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT NOT NULL DEFAULT '',
  enrichment      JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_activity_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sn_leads_owner ON sn_leads(owner_identity_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sn_leads_company ON sn_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_sn_leads_saved ON sn_leads(owner_identity_id, saved) WHERE saved = true;
CREATE INDEX IF NOT EXISTS idx_sn_leads_intent ON sn_leads(owner_identity_id, intent_score DESC);

-- ============================================================
-- Smart lead lists (saved searches / dynamic queries)
-- ============================================================
CREATE TABLE IF NOT EXISTS sn_lead_lists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  workspace_id    UUID,
  name            TEXT NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'static' CHECK (kind IN ('static','smart','saved_search')),
  query           JSONB NOT NULL DEFAULT '{}'::jsonb,
  member_count    INTEGER NOT NULL DEFAULT 0,
  pinned          BOOLEAN NOT NULL DEFAULT false,
  shared_with     UUID[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sn_lists_owner ON sn_lead_lists(owner_identity_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS sn_lead_list_members (
  list_id   UUID NOT NULL REFERENCES sn_lead_lists(id) ON DELETE CASCADE,
  lead_id   UUID NOT NULL REFERENCES sn_leads(id) ON DELETE CASCADE,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, lead_id)
);

-- ============================================================
-- Outreach workspace (sequences + activities)
-- ============================================================
CREATE TABLE IF NOT EXISTS sn_outreach_sequences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  workspace_id    UUID,
  name            TEXT NOT NULL,
  channel         TEXT NOT NULL DEFAULT 'mixed' CHECK (channel IN ('email','linkedin','call','sms','mixed')),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  steps           JSONB NOT NULL DEFAULT '[]'::jsonb,
  goal            TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sn_outreach_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id     UUID REFERENCES sn_outreach_sequences(id) ON DELETE SET NULL,
  lead_id         UUID NOT NULL REFERENCES sn_leads(id) ON DELETE CASCADE,
  owner_identity_id UUID NOT NULL,
  step_index      INTEGER NOT NULL DEFAULT 0,
  channel         TEXT NOT NULL CHECK (channel IN ('email','linkedin','call','sms','note','meeting')),
  direction       TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound')),
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
                    'queued','sent','delivered','opened','replied','bounced','failed','completed','skipped')),
  subject         TEXT,
  body            TEXT,
  provider        TEXT,
  provider_id     TEXT,
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  reply_at        TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sn_activities_lead ON sn_outreach_activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sn_activities_owner ON sn_outreach_activities(owner_identity_id, status, created_at DESC);

-- ============================================================
-- Relationship goals
-- ============================================================
CREATE TABLE IF NOT EXISTS sn_relationship_goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  lead_id         UUID REFERENCES sn_leads(id) ON DELETE SET NULL,
  account_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  cadence_days    INTEGER NOT NULL DEFAULT 30 CHECK (cadence_days BETWEEN 1 AND 365),
  next_touch_at   TIMESTAMPTZ,
  last_touch_at   TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','abandoned')),
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Seat management
-- ============================================================
CREATE TABLE IF NOT EXISTS sn_seats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  identity_id     UUID NOT NULL,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','manager','member','viewer')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','revoked')),
  invited_by      UUID,
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at    TIMESTAMPTZ,
  last_active_at  TIMESTAMPTZ,
  monthly_credit_quota INTEGER NOT NULL DEFAULT 1000,
  monthly_credit_used  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (workspace_id, identity_id)
);
CREATE INDEX IF NOT EXISTS idx_sn_seats_ws ON sn_seats(workspace_id, status);

-- ============================================================
-- Append-only audit
-- ============================================================
CREATE TABLE IF NOT EXISTS sn_audit (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   UUID NOT NULL,
  workspace_id  UUID,
  action        TEXT NOT NULL,
  entity_kind   TEXT NOT NULL,
  entity_id     UUID,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip            TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sn_audit_actor ON sn_audit(identity_id, created_at DESC);

CREATE OR REPLACE FUNCTION sn_audit_append_only() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'sn_audit is append-only';
END;
$$;
DROP TRIGGER IF EXISTS sn_audit_no_update ON sn_audit;
CREATE TRIGGER sn_audit_no_update BEFORE UPDATE OR DELETE ON sn_audit
  FOR EACH ROW EXECUTE FUNCTION sn_audit_append_only();

-- updated_at triggers
CREATE OR REPLACE FUNCTION sn_touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS sn_leads_touch ON sn_leads;
CREATE TRIGGER sn_leads_touch BEFORE UPDATE ON sn_leads FOR EACH ROW EXECUTE FUNCTION sn_touch_updated_at();

DROP TRIGGER IF EXISTS sn_lists_touch ON sn_lead_lists;
CREATE TRIGGER sn_lists_touch BEFORE UPDATE ON sn_lead_lists FOR EACH ROW EXECUTE FUNCTION sn_touch_updated_at();

DROP TRIGGER IF EXISTS sn_seq_touch ON sn_outreach_sequences;
CREATE TRIGGER sn_seq_touch BEFORE UPDATE ON sn_outreach_sequences FOR EACH ROW EXECUTE FUNCTION sn_touch_updated_at();
