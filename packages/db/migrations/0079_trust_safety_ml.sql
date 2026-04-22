-- Domain 71 — Trust & Safety / ML Review / Fraud Signals / Risk Decisions.

CREATE TABLE IF NOT EXISTS tsml_signals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source       TEXT NOT NULL CHECK (source IN
               ('payment','login','signup','message','listing','review','device','velocity','geo','identity','external_webhook','manual')),
  subject_kind TEXT NOT NULL CHECK (subject_kind IN ('user','company','agency','order','listing','transaction','device','ip','session')),
  subject_id   TEXT NOT NULL,
  signal_code  TEXT NOT NULL,
  severity     TEXT NOT NULL DEFAULT 'normal' CHECK (severity IN ('low','normal','high','critical')),
  ml_score     INT  NOT NULL DEFAULT 50 CHECK (ml_score BETWEEN 0 AND 100),
  ml_band      TEXT NOT NULL DEFAULT 'normal' CHECK (ml_band IN ('normal','elevated','high','critical')),
  features     JSONB NOT NULL DEFAULT '{}'::jsonb,
  reasons      JSONB NOT NULL DEFAULT '[]'::jsonb,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','actioned','dismissed','suppressed','expired')),
  meta         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tsml_signals_status  ON tsml_signals(status, ml_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tsml_signals_subject ON tsml_signals(subject_kind, subject_id);
CREATE INDEX IF NOT EXISTS idx_tsml_signals_band    ON tsml_signals(ml_band, status);

CREATE TABLE IF NOT EXISTS tsml_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       TEXT NOT NULL UNIQUE,
  subject_kind    TEXT NOT NULL,
  subject_id      TEXT NOT NULL,
  case_kind       TEXT NOT NULL CHECK (case_kind IN ('fraud','abuse','identity','payment_risk','content','compliance','other')),
  risk_score      INT  NOT NULL DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
  risk_band       TEXT NOT NULL DEFAULT 'normal' CHECK (risk_band IN ('normal','elevated','high','critical')),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','holding','escalated','decided','closed')),
  queue           TEXT NOT NULL DEFAULT 'triage' CHECK (queue IN ('triage','review','escalation','closed')),
  assigned_to     UUID,
  sla_due_at      TIMESTAMPTZ,
  signals         JSONB NOT NULL DEFAULT '[]'::jsonb,   -- linked signal ids + summaries
  features        JSONB NOT NULL DEFAULT '{}'::jsonb,
  reasons         JSONB NOT NULL DEFAULT '[]'::jsonb,
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tsml_cases_status   ON tsml_cases(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tsml_cases_queue    ON tsml_cases(queue, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_tsml_cases_assignee ON tsml_cases(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tsml_cases_subject  ON tsml_cases(subject_kind, subject_id);

CREATE TABLE IF NOT EXISTS tsml_decisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES tsml_cases(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL,
  decision    TEXT NOT NULL CHECK (decision IN
              ('allow','allow_with_friction','step_up_kyc','hold_funds','release_funds','block_payment','restrict_account',
               'suspend','ban','refund','chargeback_accept','chargeback_dispute','escalate_legal','escalate_compliance',
               'whitelist','blacklist','dismiss','none')),
  rationale   TEXT NOT NULL,
  duration_h  INT,
  appealable  TEXT NOT NULL DEFAULT 'yes' CHECK (appealable IN ('yes','no')),
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tsml_dec_case ON tsml_decisions(case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tsml_ml_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID REFERENCES tsml_cases(id) ON DELETE CASCADE,
  signal_id   UUID REFERENCES tsml_signals(id) ON DELETE SET NULL,
  model       TEXT NOT NULL,
  version     TEXT NOT NULL DEFAULT 'v1',
  score       INT  NOT NULL CHECK (score BETWEEN 0 AND 100),
  band        TEXT NOT NULL,
  features    JSONB NOT NULL DEFAULT '{}'::jsonb,
  reasons     JSONB NOT NULL DEFAULT '[]'::jsonb,
  agreed      BOOLEAN,                   -- operator agreed with model after review
  reviewer_id UUID,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tsml_mlrev_case ON tsml_ml_reviews(case_id, created_at DESC);

-- Append-only audit ledger.
CREATE TABLE IF NOT EXISTS tsml_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID REFERENCES tsml_cases(id) ON DELETE CASCADE,
  signal_id   UUID REFERENCES tsml_signals(id) ON DELETE CASCADE,
  actor_id    UUID,
  action      TEXT NOT NULL,
  from_state  TEXT,
  to_state    TEXT,
  diff        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tsml_evt_case ON tsml_events(case_id, created_at DESC);

CREATE OR REPLACE FUNCTION tsml_events_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'tsml_events is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_tsml_evt_no_update ON tsml_events;
CREATE TRIGGER trg_tsml_evt_no_update BEFORE UPDATE OR DELETE ON tsml_events
  FOR EACH ROW EXECUTE FUNCTION tsml_events_immutable();

-- Watchlists / allowlists.
CREATE TABLE IF NOT EXISTS tsml_watchlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_kind   TEXT NOT NULL CHECK (list_kind IN ('blocklist','allowlist','watchlist')),
  subject_kind TEXT NOT NULL,
  subject_id  TEXT NOT NULL,
  reason      TEXT NOT NULL,
  added_by    UUID,
  expires_at  TIMESTAMPTZ,
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (list_kind, subject_kind, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_tsml_watch_subject ON tsml_watchlist(subject_kind, subject_id);

-- Seeds: realistic mix of signals + cases.
INSERT INTO tsml_signals (source, subject_kind, subject_id, signal_code, severity, ml_score, ml_band, reasons) VALUES
 ('payment',  'transaction','txn-1001','velocity_spike',     'high',    82,'high',    '["3x baseline in 5m","new device"]'::jsonb),
 ('login',    'session',    'ses-2002','impossible_travel',  'critical',93,'critical','["UK->BR in 18m","new IP ASN"]'::jsonb),
 ('signup',   'user',       'usr-3003','disposable_email',   'normal',  55,'elevated','["mailinator.com domain"]'::jsonb),
 ('message',  'user',       'usr-4004','phishing_pattern',   'high',    77,'high',    '["link to known phish host"]'::jsonb),
 ('identity', 'user',       'usr-5005','kyc_mismatch',       'high',    71,'high',    '["doc name != stated name"]'::jsonb),
 ('device',   'device',     'dev-6006','known_fraud_finger', 'critical',96,'critical','["fingerprint on blocklist"]'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO tsml_cases (reference, subject_kind, subject_id, case_kind, risk_score, risk_band, status, queue, sla_due_at, reasons) VALUES
 ('TS-DEMO01','transaction','txn-1001','payment_risk', 82,'high',    'open',     'review',     now()+interval '2 hours','["velocity_spike","new device"]'::jsonb),
 ('TS-DEMO02','session',    'ses-2002','fraud',        93,'critical','open',     'escalation', now()+interval '1 hour', '["impossible_travel"]'::jsonb),
 ('TS-DEMO03','user',       'usr-5005','identity',     71,'high',    'reviewing','review',     now()+interval '6 hours','["kyc_mismatch"]'::jsonb),
 ('TS-DEMO04','device',     'dev-6006','fraud',        96,'critical','escalated','escalation', now()+interval '1 hour', '["device on blocklist"]'::jsonb),
 ('TS-DEMO05','user',       'usr-3003','compliance',   55,'elevated','open',     'triage',     now()+interval '24 hours','["disposable_email"]'::jsonb)
ON CONFLICT (reference) DO NOTHING;

INSERT INTO tsml_ml_reviews (case_id, model, version, score, band, reasons)
SELECT id, 'fraud-risk-v1', 'v1', risk_score, risk_band, reasons FROM tsml_cases
ON CONFLICT DO NOTHING;

INSERT INTO tsml_watchlist (list_kind, subject_kind, subject_id, reason) VALUES
 ('blocklist','device','dev-6006','known_fraud_finger'),
 ('watchlist','user',  'usr-3003','disposable_email signup pattern')
ON CONFLICT DO NOTHING;
