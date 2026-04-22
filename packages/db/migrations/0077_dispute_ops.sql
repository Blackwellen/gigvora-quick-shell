-- Domain 69 — Dispute Operations Dashboard, Case Routing, Arbitration Desk.

CREATE TABLE IF NOT EXISTS dop_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       TEXT NOT NULL UNIQUE CHECK (reference ~ '^DOP-[A-Z0-9]{6,12}$'),
  subject         TEXT NOT NULL CHECK (length(subject) BETWEEN 3 AND 240),
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'service_quality' CHECK (category IN
                  ('service_quality','non_delivery','scope','payment','refund','ip','fraud','chargeback','other')),
  severity        TEXT NOT NULL DEFAULT 'normal' CHECK (severity IN ('low','normal','high','critical')),
  amount_minor    BIGINT NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  currency        TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  claimant_id     UUID NOT NULL,
  respondent_id   UUID,
  source_kind     TEXT,    -- order|contract|gig|service|project|invoice
  source_id       UUID,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
                  ('draft','pending','triaged','mediation','arbitration','awaiting_response','resolved','dismissed','escalated','closed')),
  outcome         TEXT CHECK (outcome IN
                  ('refund_full','refund_partial','rework','dismissed','split','goodwill','reversed','none')),
  outcome_amount_minor BIGINT,
  assignee_id     UUID,
  queue           TEXT NOT NULL DEFAULT 'triage' CHECK (queue IN ('triage','mediation','arbitration','escalation','closed')),
  priority_score  INT NOT NULL DEFAULT 50 CHECK (priority_score BETWEEN 0 AND 100),
  sla_due_at      TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dop_cases_status ON dop_cases(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dop_cases_queue  ON dop_cases(queue, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_dop_cases_assignee ON dop_cases(assignee_id, status);

CREATE TABLE IF NOT EXISTS dop_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES dop_cases(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('claimant','respondent','mediator','arbitrator','operator','system')),
  body        TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 8000),
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  visibility  TEXT NOT NULL DEFAULT 'parties' CHECK (visibility IN ('parties','internal','arbitration')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dop_messages_case ON dop_messages(case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS dop_evidence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES dop_cases(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  party       TEXT NOT NULL CHECK (party IN ('claimant','respondent','operator','arbitrator')),
  kind        TEXT NOT NULL CHECK (kind IN ('file','link','message','transaction','screenshot','contract','other')),
  label       TEXT NOT NULL,
  url         TEXT,
  bytes       BIGINT,
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dop_evidence_case ON dop_evidence(case_id, created_at DESC);

-- Append-only audit/event ledger.
CREATE TABLE IF NOT EXISTS dop_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID REFERENCES dop_cases(id) ON DELETE CASCADE,
  actor_id    UUID,
  action      TEXT NOT NULL,    -- case.create|case.transition|case.assign|case.outcome|message.post|evidence.add|escalate
  from_state  TEXT,
  to_state    TEXT,
  diff        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dop_events_case ON dop_events(case_id, created_at DESC);

CREATE OR REPLACE FUNCTION dop_events_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'dop_events is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_dop_events_no_update ON dop_events;
CREATE TRIGGER trg_dop_events_no_update BEFORE UPDATE OR DELETE ON dop_events
  FOR EACH ROW EXECUTE FUNCTION dop_events_immutable();

-- Arbitration panels + decisions.
CREATE TABLE IF NOT EXISTS dop_arbitration (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID NOT NULL REFERENCES dop_cases(id) ON DELETE CASCADE,
  panel           JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{userId, role}]
  opened_by       UUID NOT NULL,
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at      TIMESTAMPTZ,
  decided_by      UUID,
  decision        TEXT CHECK (decision IN ('refund_full','refund_partial','rework','dismissed','split','goodwill')),
  decision_amount_minor BIGINT,
  rationale       TEXT,
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_dop_arbitration_case ON dop_arbitration(case_id);

-- Seeds.
INSERT INTO dop_cases (reference, subject, category, severity, amount_minor, claimant_id, respondent_id, status, queue, priority_score, sla_due_at)
VALUES
  ('DOP-DEMO01','Incomplete delivery — Logo Design',     'non_delivery',   'high',     75000,  gen_random_uuid(), gen_random_uuid(), 'pending',         'triage',      80, now()+interval '2 days'),
  ('DOP-DEMO02','Scope disagreement — Web Dev',          'scope',          'normal',   420000, gen_random_uuid(), gen_random_uuid(), 'mediation',       'mediation',   65, now()+interval '5 days'),
  ('DOP-DEMO03','Quality standards not met',             'service_quality','high',     280000, gen_random_uuid(), gen_random_uuid(), 'arbitration',     'arbitration', 75, now()+interval '7 days'),
  ('DOP-DEMO04','Late delivery penalty',                 'service_quality','normal',   150000, gen_random_uuid(), gen_random_uuid(), 'awaiting_response','mediation',  55, now()+interval '3 days'),
  ('DOP-DEMO05','Chargeback — duplicate payment',        'chargeback',     'critical', 19900,  gen_random_uuid(), NULL,               'escalated',       'escalation',  95, now()+interval '1 day'),
  ('DOP-DEMO06','IP ownership conflict',                 'ip',             'high',     500000, gen_random_uuid(), gen_random_uuid(), 'pending',         'triage',      70, now()+interval '4 days')
ON CONFLICT (reference) DO NOTHING;
