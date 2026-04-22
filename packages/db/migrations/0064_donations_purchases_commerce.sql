-- Domain 63 — Donations, Purchases, Creator Commerce & Patronage Flows.

CREATE TABLE IF NOT EXISTS dpc_storefronts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID NOT NULL UNIQUE,
  handle              TEXT NOT NULL UNIQUE CHECK (length(handle) BETWEEN 3 AND 40 AND handle ~ '^[a-z0-9][a-z0-9_-]*$'),
  display_name        TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 120),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  accept_donations    BOOLEAN NOT NULL DEFAULT TRUE,
  accept_patronage    BOOLEAN NOT NULL DEFAULT TRUE,
  currency            TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  payout_account_id   UUID,
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dpc_products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id       UUID NOT NULL REFERENCES dpc_storefronts(id) ON DELETE CASCADE,
  owner_identity_id   UUID NOT NULL,
  kind                TEXT NOT NULL CHECK (kind IN ('digital','physical','service','tip')),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  title               TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description         TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 5000),
  price_minor         INTEGER NOT NULL CHECK (price_minor >= 0),
  currency            TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  tax_category        TEXT NOT NULL DEFAULT 'standard' CHECK (tax_category IN ('standard','reduced','zero','exempt')),
  inventory_remaining INTEGER CHECK (inventory_remaining IS NULL OR inventory_remaining >= 0),
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dpc_products_store ON dpc_products(storefront_id, status);
CREATE INDEX IF NOT EXISTS idx_dpc_products_owner ON dpc_products(owner_identity_id, kind);

CREATE TABLE IF NOT EXISTS dpc_patronage_tiers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id        UUID NOT NULL REFERENCES dpc_storefronts(id) ON DELETE CASCADE,
  owner_identity_id    UUID NOT NULL,
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
  name                 TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  monthly_price_minor  INTEGER NOT NULL CHECK (monthly_price_minor >= 100 AND monthly_price_minor <= 100000000),
  currency             TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  perks                JSONB NOT NULL DEFAULT '[]'::jsonb,
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dpc_tiers_store ON dpc_patronage_tiers(storefront_id, status);

CREATE TABLE IF NOT EXISTS dpc_pledges (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id            UUID NOT NULL REFERENCES dpc_storefronts(id) ON DELETE CASCADE,
  owner_identity_id        UUID NOT NULL,
  patron_identity_id       UUID NOT NULL,
  tier_id                  UUID NOT NULL REFERENCES dpc_patronage_tiers(id) ON DELETE RESTRICT,
  status                   TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','past_due')),
  monthly_price_minor      INTEGER NOT NULL CHECK (monthly_price_minor >= 100),
  currency                 TEXT NOT NULL CHECK (length(currency) = 3),
  started_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at             TIMESTAMPTZ,
  next_charge_at           TIMESTAMPTZ,
  provider_subscription_id TEXT,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT uniq_dpc_pledge_active UNIQUE (patron_identity_id, tier_id)
);
CREATE INDEX IF NOT EXISTS idx_dpc_pledges_patron  ON dpc_pledges(patron_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_dpc_pledges_creator ON dpc_pledges(owner_identity_id, status);

CREATE TABLE IF NOT EXISTS dpc_orders (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id          UUID NOT NULL REFERENCES dpc_storefronts(id) ON DELETE RESTRICT,
  owner_identity_id      UUID NOT NULL,
  buyer_identity_id      UUID NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','fulfilled','refunded','failed','cancelled')),
  subtotal_minor         INTEGER NOT NULL CHECK (subtotal_minor >= 0),
  tax_minor              INTEGER NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  fee_minor              INTEGER NOT NULL DEFAULT 0 CHECK (fee_minor >= 0),
  total_minor            INTEGER NOT NULL CHECK (total_minor >= 0),
  net_to_creator_minor   INTEGER NOT NULL CHECK (net_to_creator_minor >= 0),
  currency               TEXT NOT NULL CHECK (length(currency) = 3),
  tax_region             TEXT CHECK (tax_region IS NULL OR length(tax_region) = 2),
  vat_rate_bps           INTEGER NOT NULL DEFAULT 0 CHECK (vat_rate_bps >= 0 AND vat_rate_bps <= 5000),
  line_items             JSONB NOT NULL DEFAULT '[]'::jsonb,
  provider_ref           TEXT,
  provider_status        TEXT,
  paid_at                TIMESTAMPTZ,
  fulfilled_at           TIMESTAMPTZ,
  refunded_at            TIMESTAMPTZ,
  cancel_reason          TEXT CHECK (cancel_reason IS NULL OR length(cancel_reason) <= 500),
  idempotency_key        TEXT UNIQUE,
  meta                   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (total_minor = subtotal_minor + tax_minor)
);
CREATE INDEX IF NOT EXISTS idx_dpc_orders_buyer   ON dpc_orders(buyer_identity_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dpc_orders_creator ON dpc_orders(owner_identity_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS dpc_donations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id        UUID NOT NULL REFERENCES dpc_storefronts(id) ON DELETE RESTRICT,
  owner_identity_id    UUID NOT NULL,
  donor_identity_id    UUID,
  donor_display_name   TEXT CHECK (donor_display_name IS NULL OR length(donor_display_name) <= 80),
  is_anonymous         BOOLEAN NOT NULL DEFAULT FALSE,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','failed')),
  amount_minor         INTEGER NOT NULL CHECK (amount_minor >= 100 AND amount_minor <= 100000000),
  fee_minor            INTEGER NOT NULL DEFAULT 0 CHECK (fee_minor >= 0),
  net_minor            INTEGER NOT NULL CHECK (net_minor >= 0),
  currency             TEXT NOT NULL CHECK (length(currency) = 3),
  message              TEXT CHECK (message IS NULL OR length(message) <= 500),
  provider_ref         TEXT,
  paid_at              TIMESTAMPTZ,
  refunded_at          TIMESTAMPTZ,
  idempotency_key      TEXT UNIQUE,
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dpc_donations_creator ON dpc_donations(owner_identity_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dpc_donations_donor   ON dpc_donations(donor_identity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS dpc_ledger (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id       UUID NOT NULL,
  owner_identity_id   UUID NOT NULL,
  entry_type          TEXT NOT NULL CHECK (entry_type IN ('credit','debit','refund','fee','payout','reversal')),
  amount_minor        INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency            TEXT NOT NULL CHECK (length(currency) = 3),
  description         TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 500),
  source_type         TEXT NOT NULL CHECK (source_type IN ('order','donation','pledge','adjustment','payout')),
  source_id           UUID,
  provider_ref        TEXT,
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_dpc_ledger_owner  ON dpc_ledger(owner_identity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_dpc_ledger_source ON dpc_ledger(source_type, source_id);

-- Append-only ledger
CREATE OR REPLACE FUNCTION dpc_ledger_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'dpc_ledger is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_dpc_ledger_no_update ON dpc_ledger;
CREATE TRIGGER trg_dpc_ledger_no_update BEFORE UPDATE OR DELETE ON dpc_ledger
  FOR EACH ROW EXECUTE FUNCTION dpc_ledger_immutable();

CREATE TABLE IF NOT EXISTS dpc_audit_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID,
  actor_identity_id   UUID,
  actor_role          TEXT,
  action              TEXT NOT NULL,
  target_type         TEXT,
  target_id           UUID,
  diff                JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip                  TEXT,
  user_agent          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dpc_audit_owner ON dpc_audit_events(owner_identity_id, created_at DESC);

-- Seed
INSERT INTO dpc_storefronts (id, owner_identity_id, handle, display_name, status, currency)
VALUES ('00000000-0000-0000-0000-000000006501'::uuid,
        '00000000-0000-0000-0000-0000000000e1'::uuid,
        'demo-creator', 'Demo Creator', 'active', 'GBP')
ON CONFLICT DO NOTHING;

INSERT INTO dpc_patronage_tiers (id, storefront_id, owner_identity_id, name, monthly_price_minor, currency, perks)
VALUES
  ('00000000-0000-0000-0000-000000006601'::uuid,
   '00000000-0000-0000-0000-000000006501'::uuid,
   '00000000-0000-0000-0000-0000000000e1'::uuid,
   'Supporter', 500, 'GBP', '["Name in credits"]'::jsonb),
  ('00000000-0000-0000-0000-000000006602'::uuid,
   '00000000-0000-0000-0000-000000006501'::uuid,
   '00000000-0000-0000-0000-0000000000e1'::uuid,
   'Patron', 2500, 'GBP', '["Bonus content","Early access"]'::jsonb)
ON CONFLICT DO NOTHING;
