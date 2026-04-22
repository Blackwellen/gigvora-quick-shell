-- Domain: Auth (credentials, sessions, OAuth, MFA, resets, issued tokens)
CREATE TABLE IF NOT EXISTS auth_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  password_hash text,
  password_updated_at timestamptz,
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until timestamptz,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ac_identity_idx ON auth_credentials(identity_id);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  refresh_token_hash text,
  user_agent text,
  ip_address text,
  device jsonb NOT NULL DEFAULT '{}'::jsonb,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_reason text
);
CREATE UNIQUE INDEX IF NOT EXISTS as_token_idx ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS as_identity_idx ON auth_sessions(identity_id, expires_at);

CREATE TABLE IF NOT EXISTS auth_oauth_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google','github','microsoft','linkedin','apple')),
  provider_subject text NOT NULL,
  email text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  scopes_granted jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz,
  linked_at timestamptz NOT NULL DEFAULT now(),
  unlinked_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS aoc_provider_subject_idx ON auth_oauth_connections(provider, provider_subject);
CREATE INDEX IF NOT EXISTS aoc_identity_idx ON auth_oauth_connections(identity_id, provider);

CREATE TABLE IF NOT EXISTS auth_mfa_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('totp','webauthn','sms','backup_code')),
  label text NOT NULL DEFAULT '',
  secret_ciphertext text,
  public_key text,
  counter integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','disabled')),
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS amf_identity_idx ON auth_mfa_factors(identity_id, status);

CREATE TABLE IF NOT EXISTS auth_password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  ip_address text
);
CREATE UNIQUE INDEX IF NOT EXISTS apr_token_idx ON auth_password_resets(token_hash);
CREATE INDEX IF NOT EXISTS apr_identity_idx ON auth_password_resets(identity_id, requested_at);

CREATE TABLE IF NOT EXISTS auth_issued_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('api_key','personal_access_token','service_token')),
  label text NOT NULL,
  token_hash text NOT NULL,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ait_token_idx ON auth_issued_tokens(token_hash);
CREATE INDEX IF NOT EXISTS ait_identity_idx ON auth_issued_tokens(identity_id, kind);
