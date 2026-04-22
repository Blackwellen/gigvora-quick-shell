-- Domain 08 — Settings, Preferences, Connections & GDPR Requests.
-- Mirrors packages/db/src/schema/settings.ts. Owned by
-- apps/api-nest/src/modules/settings/. Never run against Lovable Cloud Supabase.

CREATE TABLE IF NOT EXISTS settings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid NOT NULL,
  namespace    text NOT NULL CHECK (namespace IN ('appearance','privacy','notifications','locale','timezone','accessibility','security','integrations')),
  key          text NOT NULL CHECK (length(key) BETWEEN 1 AND 80),
  value        jsonb NOT NULL DEFAULT '{}'::jsonb,
  scope        text NOT NULL DEFAULT 'user' CHECK (scope IN ('user','tenant')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX        IF NOT EXISTS settings_ident_ns_idx     ON settings(identity_id, namespace);
CREATE UNIQUE INDEX IF NOT EXISTS settings_ident_ns_key_uq  ON settings(identity_id, namespace, key);

CREATE TABLE IF NOT EXISTS settings_connected_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     uuid NOT NULL,
  provider        text NOT NULL CHECK (length(provider) BETWEEN 1 AND 60),
  external_id     text NOT NULL CHECK (length(external_id) BETWEEN 1 AND 255),
  display_name    text,
  scopes          jsonb NOT NULL DEFAULT '[]'::jsonb,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  connected_at    timestamptz NOT NULL DEFAULT now(),
  last_synced_at  timestamptz,
  revoked_at      timestamptz
);
CREATE INDEX        IF NOT EXISTS sca_ident_idx                   ON settings_connected_accounts(identity_id);
CREATE UNIQUE INDEX IF NOT EXISTS sca_ident_provider_external_uq  ON settings_connected_accounts(identity_id, provider, external_id);

CREATE TABLE IF NOT EXISTS settings_data_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid NOT NULL,
  kind          text NOT NULL CHECK (kind IN ('export','delete','rectify','restrict','portability')),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected','failed')),
  requested_at  timestamptz NOT NULL DEFAULT now(),
  fulfilled_at  timestamptz,
  reason        text,
  result_uri    text,
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS sdr_ident_idx  ON settings_data_requests(identity_id);
CREATE INDEX IF NOT EXISTS sdr_status_idx ON settings_data_requests(status);

CREATE TABLE IF NOT EXISTS settings_catalogue (
  kind    text NOT NULL CHECK (kind IN ('locale','timezone','currency')),
  code    text NOT NULL,
  label   text NOT NULL,
  active  boolean NOT NULL DEFAULT true,
  meta    jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (kind, code)
);
