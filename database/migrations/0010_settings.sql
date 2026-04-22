-- Domain 08 — Settings, Preferences, Localization, Accessibility, Profile Controls
-- Stores per-identity preferences across general, locale, accessibility,
-- privacy, profile control, and connected-account namespaces. Supports per-org
-- overrides for enterprise-managed settings.

CREATE TYPE setting_scope AS ENUM ('user','org','device');

-- One row per (identity, scope, namespace, key). Values are jsonb to support
-- strings, numbers, booleans, arrays, and structured objects without schema
-- churn for every new preference.
CREATE TABLE IF NOT EXISTS settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid,                   -- null for org-only settings
  org_id        uuid,                   -- null for personal settings
  scope         setting_scope NOT NULL DEFAULT 'user',
  namespace     text NOT NULL,          -- 'general','locale','accessibility','privacy','profile','connections'
  key           text NOT NULL,
  value         jsonb NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid,
  UNIQUE NULLS NOT DISTINCT (identity_id, org_id, scope, namespace, key)
);
CREATE INDEX settings_identity_idx  ON settings(identity_id, namespace);
CREATE INDEX settings_org_idx       ON settings(org_id, namespace) WHERE org_id IS NOT NULL;

-- Locale defaults catalogue (used by selectors). Seeded with realistic data.
CREATE TABLE IF NOT EXISTS locales (
  code          text PRIMARY KEY,       -- 'en-GB','en-US','fr-FR','de-DE'
  label         text NOT NULL,
  native_label  text NOT NULL,
  enabled       boolean NOT NULL DEFAULT true,
  rtl           boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS timezones (
  code          text PRIMARY KEY,       -- 'Europe/London'
  label         text NOT NULL,
  utc_offset    text NOT NULL,
  enabled       boolean NOT NULL DEFAULT true
);

-- Connected accounts (Google, Apple, GitHub, Slack, etc.) — distinct from
-- the OAuth providers used for sign-in; these are linked-account rows the
-- user manages from the Settings → Connections page.
CREATE TABLE IF NOT EXISTS connected_accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid NOT NULL,
  provider      text NOT NULL,          -- 'google','github','slack','linkedin'
  external_id   text NOT NULL,
  display_name  text,
  scopes        text[] NOT NULL DEFAULT '{}',
  connected_at  timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (identity_id, provider, external_id)
);
CREATE INDEX connected_accounts_identity_idx ON connected_accounts(identity_id) WHERE revoked_at IS NULL;

-- Per-identity audit log of every settings change. Frontend Settings page
-- shows a "Recent changes" panel powered by this table.
CREATE TABLE IF NOT EXISTS settings_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid NOT NULL,
  actor_id      uuid,                   -- who made the change (user themself or admin)
  namespace     text NOT NULL,
  key           text NOT NULL,
  old_value     jsonb,
  new_value     jsonb,
  source        text NOT NULL DEFAULT 'web', -- 'web','mobile','admin','api'
  occurred_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX settings_audit_identity_idx ON settings_audit(identity_id, occurred_at DESC);

-- Data export / erasure requests (GDPR, UK posture).
CREATE TYPE data_request_kind   AS ENUM ('export','erasure','rectification');
CREATE TYPE data_request_status AS ENUM ('pending','processing','ready','delivered','failed','cancelled');

CREATE TABLE IF NOT EXISTS data_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid NOT NULL,
  kind          data_request_kind NOT NULL,
  status        data_request_status NOT NULL DEFAULT 'pending',
  requested_at  timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  download_url  text,
  reason        text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX data_requests_identity_idx ON data_requests(identity_id, requested_at DESC);
