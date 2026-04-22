-- Domain 73 — Verification, Compliance, and Identity Review Dashboard.

CREATE TABLE IF NOT EXISTS vc_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       TEXT NOT NULL UNIQUE,
  subject_id      UUID NOT NULL,                                    -- user/org being verified
  subject_kind    TEXT NOT NULL CHECK (subject_kind IN ('user','professional','enterprise','agency')),
  program         TEXT NOT NULL CHECK (program IN ('kyc','kyb','aml','sanctions','address','tax','accreditation','right_to_work','professional_licence')),
  jurisdiction    TEXT NOT NULL DEFAULT 'GB',                        -- ISO country
  risk_score      INT NOT NULL DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
  risk_band       TEXT NOT NULL DEFAULT 'normal' CHECK (risk_band IN ('normal','elevated','high','critical')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','holding','approved','rejected','escalated','expired','archived')),
  queue           TEXT NOT NULL DEFAULT 'triage' CHECK (queue IN ('triage','review','escalation','closed')),
  assigned_to     UUID,
  sla_due_at      TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  reasons         JSONB NOT NULL DEFAULT '[]'::jsonb,
  flags           JSONB NOT NULL DEFAULT '[]'::jsonb,                -- [{code, severity, source}]
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vc_cases_status   ON vc_cases(status, risk_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vc_cases_queue    ON vc_cases(queue, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_vc_cases_assignee ON vc_cases(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_vc_cases_subject  ON vc_cases(subject_id, subject_kind);
CREATE INDEX IF NOT EXISTS idx_vc_cases_program  ON vc_cases(program, jurisdiction);

CREATE TABLE IF NOT EXISTS vc_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID NOT NULL REFERENCES vc_cases(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('passport','national_id','driving_licence','utility_bill','bank_statement','selfie','company_reg','tax_id','licence','other')),
  filename      TEXT NOT NULL,
  storage_url   TEXT NOT NULL,
  mime_type     TEXT,
  bytes         BIGINT,
  hash_sha256   TEXT,
  ocr_text      TEXT,                                                -- redacted before display
  ocr_fields    JSONB NOT NULL DEFAULT '{}'::jsonb,
  liveness_score NUMERIC(5,2),
  match_score   NUMERIC(5,2),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by   UUID,
  reviewed_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_vc_docs_case ON vc_documents(case_id, uploaded_at DESC);

CREATE TABLE IF NOT EXISTS vc_checks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID NOT NULL REFERENCES vc_cases(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,                                       -- 'onfido','sumsub','companies_house','hmrc','sanctions_xyz','manual'
  check_type    TEXT NOT NULL CHECK (check_type IN ('document','facial_similarity','watchlist','pep','sanctions','address','company_reg','aml','tax','adverse_media')),
  result        TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pending','clear','consider','rejected','error')),
  score         NUMERIC(5,2),
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,                  -- raw provider response (redacted)
  external_id   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_vc_checks_case  ON vc_checks(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vc_checks_extid ON vc_checks(provider, external_id);

CREATE TABLE IF NOT EXISTS vc_decisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES vc_cases(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL,
  decision    TEXT NOT NULL CHECK (decision IN
              ('approve','reject','request_more_info','step_up','hold','escalate','dismiss','expire','renew')),
  rationale   TEXT NOT NULL,
  duration_days INT,                                                 -- for renew / expire-in
  appealable  TEXT NOT NULL DEFAULT 'yes' CHECK (appealable IN ('yes','no')),
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vc_dec_case ON vc_decisions(case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS vc_watchlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  UUID NOT NULL,
  subject_kind TEXT NOT NULL CHECK (subject_kind IN ('user','professional','enterprise','agency')),
  reason      TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'normal' CHECK (severity IN ('low','normal','high','critical')),
  added_by    UUID,
  expires_at  TIMESTAMPTZ,
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject_id, subject_kind, reason)
);
CREATE INDEX IF NOT EXISTS idx_vc_wl_subject ON vc_watchlist(subject_id, subject_kind);

-- Append-only audit ledger (UK GDPR / FCA evidence trail).
CREATE TABLE IF NOT EXISTS vc_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      UUID REFERENCES vc_cases(id) ON DELETE CASCADE,
  subject_id   UUID,
  actor_id     UUID,
  action       TEXT NOT NULL,
  from_state   TEXT,
  to_state     TEXT,
  diff         JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip           INET,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vc_evt_case    ON vc_events(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vc_evt_subject ON vc_events(subject_id, created_at DESC);

CREATE OR REPLACE FUNCTION vc_events_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'vc_events is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_vc_evt_no_update ON vc_events;
CREATE TRIGGER trg_vc_evt_no_update BEFORE UPDATE OR DELETE ON vc_events
  FOR EACH ROW EXECUTE FUNCTION vc_events_immutable();

-- Seeds: realistic verification cases across programs.
INSERT INTO vc_cases
 (reference, subject_id, subject_kind, program, jurisdiction, risk_score, risk_band, status, queue,
  sla_due_at, expires_at, reasons, flags) VALUES
 ('VC-001','11111111-1111-1111-1111-111111111111','user',         'kyc',      'GB', 22,'normal',  'pending',  'triage',     now()+interval '24 hours', now()+interval '365 days',
  '["new_signup"]'::jsonb,
  '[]'::jsonb),
 ('VC-002','22222222-2222-2222-2222-222222222222','professional', 'right_to_work','GB', 18,'normal',  'reviewing','review',     now()+interval '12 hours', now()+interval '365 days',
  '["share_code_required"]'::jsonb,
  '[]'::jsonb),
 ('VC-003','33333333-3333-3333-3333-333333333333','enterprise',   'kyb',      'GB', 65,'high',    'reviewing','review',     now()+interval '6 hours',  NULL,
  '["incorporation_under_12_months","beneficial_owner_overseas"]'::jsonb,
  '[{"code":"bo_overseas","severity":"high","source":"rules"}]'::jsonb),
 ('VC-004','44444444-4444-4444-4444-444444444444','user',         'aml',      'GB', 88,'critical','escalated','escalation', now()+interval '2 hours',  NULL,
  '["pep_match","adverse_media"]'::jsonb,
  '[{"code":"pep","severity":"critical","source":"watchlist"},{"code":"adverse_media","severity":"high","source":"news"}]'::jsonb),
 ('VC-005','55555555-5555-5555-5555-555555555555','agency',       'sanctions','GB', 95,'critical','escalated','escalation', now()-interval '1 hours',  NULL,
  '["sanctions_hit"]'::jsonb,
  '[{"code":"sanctions","severity":"critical","source":"ofac"}]'::jsonb),
 ('VC-006','66666666-6666-6666-6666-666666666666','professional', 'professional_licence','GB', 12,'normal','approved','closed', NULL, now()+interval '730 days',
  '[]'::jsonb,
  '[]'::jsonb),
 ('VC-007','77777777-7777-7777-7777-777777777777','user',         'address',  'GB', 35,'elevated','holding',  'review',     now()+interval '8 hours',  NULL,
  '["doc_quality_low"]'::jsonb,
  '[{"code":"low_quality_doc","severity":"normal","source":"ocr"}]'::jsonb)
ON CONFLICT (reference) DO NOTHING;

INSERT INTO vc_documents (case_id, kind, filename, storage_url, mime_type, bytes, hash_sha256, ocr_fields, liveness_score, match_score, status)
SELECT id, 'passport', 'passport.jpg', 'storage://vc/passport-001.jpg', 'image/jpeg', 412380, repeat('a',64),
       '{"surname":"Smith","given":"Alice","dob":"1990-03-14","nationality":"GBR"}'::jsonb,
       97.20, 96.50, 'pending'
FROM vc_cases WHERE reference='VC-001'
ON CONFLICT DO NOTHING;

INSERT INTO vc_documents (case_id, kind, filename, storage_url, mime_type, bytes, hash_sha256, ocr_fields, status)
SELECT id, 'company_reg', 'incorporation.pdf', 'storage://vc/inc-003.pdf', 'application/pdf', 220011, repeat('b',64),
       '{"company_name":"Acme Ltd","number":"12345678","incorporated_on":"2024-08-12"}'::jsonb,
       'pending'
FROM vc_cases WHERE reference='VC-003'
ON CONFLICT DO NOTHING;

INSERT INTO vc_checks (case_id, provider, check_type, result, score, payload)
SELECT id, 'onfido', 'document', 'clear', 0.92, '{"breakdown":{"image_integrity":"clear","visual_authenticity":"clear"}}'::jsonb
FROM vc_cases WHERE reference='VC-001'
ON CONFLICT DO NOTHING;

INSERT INTO vc_checks (case_id, provider, check_type, result, score, payload)
SELECT id, 'companies_house', 'company_reg', 'consider', 0.55, '{"reason":"director_appointed_recently"}'::jsonb
FROM vc_cases WHERE reference='VC-003'
ON CONFLICT DO NOTHING;

INSERT INTO vc_checks (case_id, provider, check_type, result, score, payload)
SELECT id, 'sanctions_xyz', 'sanctions', 'rejected', 0.99, '{"list":"OFAC SDN","matched_name":"Subject 5"}'::jsonb
FROM vc_cases WHERE reference='VC-005'
ON CONFLICT DO NOTHING;

INSERT INTO vc_watchlist (subject_id, subject_kind, reason, severity) VALUES
 ('44444444-4444-4444-4444-444444444444','user',  'PEP — domestic political exposure', 'high'),
 ('55555555-5555-5555-5555-555555555555','agency','Sanctions list match (OFAC SDN)',   'critical')
ON CONFLICT DO NOTHING;
