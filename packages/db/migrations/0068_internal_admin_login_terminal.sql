-- Domain 65 — Internal Admin Login Terminal, Secure Entry & Environment Selection.

CREATE TABLE IF NOT EXISTS ialt_environments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_-]{1,30}$'),
  label               TEXT NOT NULL CHECK (length(label) BETWEEN 1 AND 80),
  risk_band           TEXT NOT NULL DEFAULT 'low' CHECK (risk_band IN ('low','medium','high','critical')),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  requires_step_up    BOOLEAN NOT NULL DEFAULT FALSE,
  ip_allowlist        JSONB NOT NULL DEFAULT '[]'::jsonb,
  banner_text         TEXT,
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_ialt_env_slug UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS ialt_operators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     UUID NOT NULL,
  email           TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role            TEXT NOT NULL DEFAULT 'operator'
                  CHECK (role IN ('operator','moderator','finance','trust_safety','super_admin')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','revoked')),
  mfa_enrolled    BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_envs    JSONB NOT NULL DEFAULT '["sandbox"]'::jsonb,
  last_login_at   TIMESTAMPTZ,
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_ialt_op_identity UNIQUE (identity_id),
  CONSTRAINT uniq_ialt_op_email    UNIQUE (email)
);
CREATE INDEX IF NOT EXISTS idx_ialt_op_role ON ialt_operators(role, status);

CREATE TABLE IF NOT EXISTS ialt_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id           UUID NOT NULL REFERENCES ialt_operators(id) ON DELETE CASCADE,
  environment_slug      TEXT NOT NULL REFERENCES ialt_environments(slug) ON DELETE RESTRICT,
  status                TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','stepup_pending','expired','revoked')),
  step_up_verified_at   TIMESTAMPTZ,
  ip                    TEXT,
  user_agent            TEXT,
  issued_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at            TIMESTAMPTZ NOT NULL CHECK (expires_at > issued_at),
  revoked_at            TIMESTAMPTZ,
  meta                  JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_ialt_sess_op ON ialt_sessions(operator_id, status, expires_at DESC);

CREATE TABLE IF NOT EXISTS ialt_login_attempts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id         UUID,
  email               TEXT,
  environment_slug    TEXT,
  outcome             TEXT NOT NULL CHECK (outcome IN
                      ('success','invalid_credentials','mfa_failed','locked','env_forbidden','ip_forbidden','inactive','unknown')),
  ip                  TEXT,
  user_agent          TEXT,
  reason              TEXT,
  attempted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_ialt_att_identity ON ialt_login_attempts(identity_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ialt_att_ip       ON ialt_login_attempts(ip, attempted_at DESC);

-- Append-only attempts log
CREATE OR REPLACE FUNCTION ialt_attempts_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'ialt_login_attempts is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_ialt_att_no_update ON ialt_login_attempts;
CREATE TRIGGER trg_ialt_att_no_update BEFORE UPDATE OR DELETE ON ialt_login_attempts
  FOR EACH ROW EXECUTE FUNCTION ialt_attempts_immutable();

CREATE TABLE IF NOT EXISTS ialt_lockouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope           TEXT NOT NULL CHECK (scope IN ('identity','ip')),
  scope_key       TEXT NOT NULL,
  reason          TEXT NOT NULL,
  failed_count    INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  locked_until    TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_ialt_lock_scope UNIQUE (scope, scope_key)
);
CREATE INDEX IF NOT EXISTS idx_ialt_lock_until ON ialt_lockouts(locked_until);

CREATE TABLE IF NOT EXISTS ialt_audit_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id         UUID,
  identity_id         UUID,
  action              TEXT NOT NULL,
  environment_slug    TEXT,
  target_type         TEXT,
  target_id           UUID,
  diff                JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip                  TEXT,
  user_agent          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ialt_audit_op ON ialt_audit_events(operator_id, created_at DESC);

-- Seed environments
INSERT INTO ialt_environments (slug, label, risk_band, status, requires_step_up, banner_text)
VALUES
  ('prod',     'Production', 'critical', 'active', TRUE,  'PRODUCTION — every action is audited.'),
  ('staging',  'Staging',    'medium',   'active', FALSE, 'Pre-release testing environment.'),
  ('sandbox',  'Sandbox',    'low',      'active', FALSE, 'Safe to experiment.'),
  ('dev',      'Dev',        'low',      'active', FALSE, NULL)
ON CONFLICT (slug) DO NOTHING;

-- Seed a default super-admin operator (identity must exist elsewhere)
INSERT INTO ialt_operators (id, identity_id, email, role, status, mfa_enrolled, allowed_envs)
VALUES ('00000000-0000-0000-0000-000000007001'::uuid,
        '00000000-0000-0000-0000-0000000000a1'::uuid,
        'admin@gigvora.local', 'super_admin', 'active', TRUE,
        '["prod","staging","sandbox","dev"]'::jsonb)
ON CONFLICT DO NOTHING;
