-- Domain 03 — Identity, Authentication, Verification & Onboarding
-- State machines:
--   identities:        active | locked | disabled | deleted
--   email_verifications: pending | verified | expired | revoked
--   password_resets:   pending | used | expired | revoked
--   mfa_factors:       unverified | active | revoked
--   sessions:          active | revoked | expired
--   onboarding:        not_started | in_progress | completed | skipped
--   verifications (KYC): pending | approved | rejected | escalated

CREATE TABLE IF NOT EXISTS identities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL UNIQUE,
  email_verified  boolean NOT NULL DEFAULT false,
  password_hash   text,
  display_name    text,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','locked','disabled','deleted')),
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  last_login_at   timestamptz,
  last_login_ip   inet,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_identities_status ON identities(status);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  provider      text NOT NULL CHECK (provider IN ('google','linkedin','apple','microsoft','github')),
  provider_uid  text NOT NULL,
  email         text,
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  linked_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_uid)
);
CREATE INDEX IF NOT EXISTS idx_oauth_identity ON oauth_accounts(identity_id);

CREATE TABLE IF NOT EXISTS email_verifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  email        text NOT NULL,
  token        text NOT NULL UNIQUE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','expired','revoked')),
  expires_at   timestamptz NOT NULL,
  verified_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_verif_identity ON email_verifications(identity_id);

CREATE TABLE IF NOT EXISTS password_resets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  token        text NOT NULL UNIQUE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','used','expired','revoked')),
  expires_at   timestamptz NOT NULL,
  used_at      timestamptz,
  ip           inet,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_password_resets_identity ON password_resets(identity_id);

CREATE TABLE IF NOT EXISTS mfa_factors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('totp','sms','webauthn','recovery')),
  label         text,
  secret        text,                       -- encrypted at rest in real deploy
  status        text NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified','active','revoked')),
  last_used_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mfa_identity ON mfa_factors(identity_id);

CREATE TABLE IF NOT EXISTS recovery_codes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  code_hash     text NOT NULL,
  used_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_identity ON recovery_codes(identity_id);

CREATE TABLE IF NOT EXISTS sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  refresh_hash    text NOT NULL UNIQUE,
  user_agent      text,
  ip              inet,
  device_label    text,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  expires_at      timestamptz NOT NULL,
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_identity_status ON sessions(identity_id, status);

CREATE TABLE IF NOT EXISTS login_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid REFERENCES identities(id) ON DELETE SET NULL,
  email       text NOT NULL,
  outcome     text NOT NULL CHECK (outcome IN ('success','bad_password','locked','mfa_required','mfa_failed','blocked')),
  ip          inet,
  user_agent  text,
  risk_score  integer,
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created ON login_attempts(lower(email), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created ON login_attempts(ip, created_at DESC);

CREATE TABLE IF NOT EXISTS onboarding_progress (
  identity_id   uuid PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed','skipped')),
  current_step  text,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,   -- {profile, expertise, goals, preferences}
  completed_at  timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('id_document','address','company','badge_professional','badge_enterprise')),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','escalated')),
  evidence      jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewer_id   uuid,
  reviewer_note text,
  decided_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);
CREATE INDEX IF NOT EXISTS idx_verifications_identity_kind ON verifications(identity_id, kind);

CREATE TABLE IF NOT EXISTS identity_audit (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid REFERENCES identities(id) ON DELETE SET NULL,
  actor_id    uuid,
  action      text NOT NULL,
  ip          inet,
  user_agent  text,
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_identity_audit_identity ON identity_audit(identity_id, created_at DESC);
