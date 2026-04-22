-- Domain: Integrations (BYOK + OAuth)
CREATE TABLE IF NOT EXISTS integration_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('ai','payments','crm','comms','storage','analytics','hr','other')),
  auth_kind text NOT NULL CHECK (auth_kind IN ('oauth2','apikey','webhook','hmac')),
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  icon_url text,
  docs_url text,
  enabled boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS intp_slug_idx ON integration_providers(slug);

CREATE TABLE IF NOT EXISTS integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  owner_identity_id uuid NOT NULL,
  owner_org_id uuid,
  provider_id uuid NOT NULL REFERENCES integration_providers(id) ON DELETE RESTRICT,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','expired','revoked','error')),
  external_account_id text,
  scopes_granted jsonb NOT NULL DEFAULT '[]'::jsonb,
  secret_ciphertext text,
  secret_kms_key_id text,
  refresh_token_ciphertext text,
  expires_at timestamptz,
  last_used_at timestamptz,
  last_error_at timestamptz,
  last_error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS intc_owner_idx ON integration_connections(tenant_id, owner_identity_id, status);
CREATE INDEX IF NOT EXISTS intc_org_idx ON integration_connections(owner_org_id, provider_id);
CREATE UNIQUE INDEX IF NOT EXISTS intc_unique_account_idx ON integration_connections(provider_id, owner_identity_id, external_account_id);

CREATE TABLE IF NOT EXISTS integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inte_conn_idx ON integration_events(connection_id, occurred_at);

CREATE TABLE IF NOT EXISTS integration_usage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  day timestamptz NOT NULL,
  call_count jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_count jsonb NOT NULL DEFAULT '{}'::jsonb,
  bytes_in bigint NOT NULL DEFAULT 0,
  bytes_out bigint NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS intu_day_idx ON integration_usage_daily(connection_id, day);
