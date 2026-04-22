-- FD-17 — Master Settings backbone (site/finance/notify/CMS/mobile/logo/SMTP/connectors/API/DB)
-- Includes: pending-change ledger (two-person rule), legal docs + consent ledger,
-- KPI definitions + snapshots, portal entitlement matrix, internal admin accounts,
-- and kill-switch matrix.

CREATE TABLE IF NOT EXISTS master_settings_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace     TEXT NOT NULL,
  key           TEXT NOT NULL,
  environment   TEXT NOT NULL DEFAULT 'production',
  scope         TEXT NOT NULL DEFAULT 'platform',
  value         JSONB NOT NULL,
  is_secret     BOOLEAN NOT NULL DEFAULT FALSE,
  version       INTEGER NOT NULL DEFAULT 1,
  updated_by    UUID,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (namespace, key, environment)
);
CREATE INDEX IF NOT EXISTS mse_ns_env_idx ON master_settings_entries (namespace, environment);

CREATE TABLE IF NOT EXISTS master_settings_pending_changes (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace              TEXT NOT NULL,
  key                    TEXT NOT NULL,
  environment            TEXT NOT NULL,
  proposed_by            UUID NOT NULL,
  reason                 TEXT NOT NULL DEFAULT '',
  diff                   JSONB NOT NULL DEFAULT '{}'::jsonb,
  next_value             JSONB NOT NULL,
  required_approver_role TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'pending',
  rejection_reason       TEXT,
  proposed_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at             TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours',
  committed_at           TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS mspc_status_idx ON master_settings_pending_changes (status);

CREATE TABLE IF NOT EXISTS master_legal_docs (
  slug                TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  version             TEXT NOT NULL,
  effective_at        TIMESTAMPTZ NOT NULL,
  body_markdown       TEXT NOT NULL,
  change_summary      TEXT NOT NULL DEFAULT '',
  requires_reconsent  BOOLEAN NOT NULL DEFAULT FALSE,
  published_by        UUID,
  published_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS master_consent_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  doc_slug      TEXT NOT NULL,
  doc_version   TEXT NOT NULL,
  accepted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip            INET,
  user_agent    TEXT,
  withdrawn_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS mcl_user_idx ON master_consent_ledger (user_id);
CREATE INDEX IF NOT EXISTS mcl_doc_idx  ON master_consent_ledger (doc_slug, doc_version);

-- Append-only protection on consent ledger.
CREATE OR REPLACE FUNCTION master_consent_immutable() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'master_consent_ledger is append-only'; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS master_consent_no_update ON master_consent_ledger;
CREATE TRIGGER master_consent_no_update BEFORE UPDATE OR DELETE ON master_consent_ledger
FOR EACH ROW EXECUTE FUNCTION master_consent_immutable();

CREATE TABLE IF NOT EXISTS master_kpi_definitions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal       TEXT NOT NULL,
  metric       TEXT NOT NULL,
  target       NUMERIC NOT NULL,
  unit         TEXT NOT NULL,
  direction    TEXT NOT NULL,
  window_days  INTEGER NOT NULL DEFAULT 30,
  owner_role   TEXT NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkd_portal_idx ON master_kpi_definitions (portal);

CREATE TABLE IF NOT EXISTS master_kpi_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id      UUID NOT NULL REFERENCES master_kpi_definitions(id) ON DELETE CASCADE,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  value       NUMERIC NOT NULL,
  status      TEXT NOT NULL,
  trend       TEXT NOT NULL DEFAULT 'flat'
);
CREATE INDEX IF NOT EXISTS mks_kpi_idx ON master_kpi_snapshots (kpi_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS master_portal_entitlements (
  portal                    TEXT PRIMARY KEY,
  roles                     JSONB NOT NULL DEFAULT '[]'::jsonb,
  can_read                  BOOLEAN NOT NULL DEFAULT TRUE,
  can_write                 BOOLEAN NOT NULL DEFAULT FALSE,
  requires_second_approver  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS master_internal_accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  display_name   TEXT NOT NULL,
  roles          JSONB NOT NULL DEFAULT '[]'::jsonb,
  status         TEXT NOT NULL DEFAULT 'active',
  mfa_enrolled   BOOLEAN NOT NULL DEFAULT FALSE,
  last_signin_at TIMESTAMPTZ,
  frozen_at      TIMESTAMPTZ,
  frozen_by      UUID,
  freeze_reason  TEXT,
  minted_by      UUID,
  minted_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS master_kill_switches (
  domain                  TEXT PRIMARY KEY,
  active                  BOOLEAN NOT NULL DEFAULT FALSE,
  reason                  TEXT,
  activated_by            UUID,
  activated_at            TIMESTAMPTZ,
  expected_cleared_at     TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
