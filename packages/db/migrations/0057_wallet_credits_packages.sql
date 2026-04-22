-- Domain 57 — Wallet, Credits, Packages & Purchase Flows
-- Append-only ledger; cached wallet balances; provider-webhook idempotency.
-- State machines:
--   wcp_packages.status:  draft → active ↔ paused → archived
--   wcp_purchases.status: pending → succeeded → (refunded|partially_refunded)
--                         pending → failed|cancelled
--   wcp_payouts.status:   pending → processing → paid|failed

CREATE TABLE IF NOT EXISTS wcp_wallets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  cash_balance_minor  INTEGER NOT NULL DEFAULT 0,
  credit_balance      INTEGER NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
  held_balance_minor  INTEGER NOT NULL DEFAULT 0 CHECK (held_balance_minor >= 0),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','frozen')),
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_wcp_wallets_owner_ccy UNIQUE (owner_identity_id, currency)
);

CREATE TABLE IF NOT EXISTS wcp_packages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  slug              TEXT NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  kind              TEXT NOT NULL DEFAULT 'credits' CHECK (kind IN ('credits','subscription','one_time','service_pack')),
  price_minor       INTEGER NOT NULL CHECK (price_minor >= 0),
  currency          TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  credits_granted   INTEGER NOT NULL DEFAULT 0 CHECK (credits_granted >= 0),
  billing_interval  TEXT CHECK (billing_interval IS NULL OR billing_interval IN ('month','year')),
  trial_days        INTEGER NOT NULL DEFAULT 0 CHECK (trial_days BETWEEN 0 AND 365),
  vat_rate_bp       INTEGER NOT NULL DEFAULT 2000 CHECK (vat_rate_bp BETWEEN 0 AND 10000),
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  features          JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_wcp_packages_owner_slug UNIQUE (owner_identity_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_wcp_packages_status ON wcp_packages(owner_identity_id, status);

CREATE TABLE IF NOT EXISTS wcp_purchases (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_identity_id        UUID NOT NULL,
  package_id               UUID REFERENCES wcp_packages(id) ON DELETE SET NULL,
  package_snapshot         JSONB NOT NULL DEFAULT '{}'::jsonb,
  amount_minor             INTEGER NOT NULL CHECK (amount_minor >= 0),
  vat_minor                INTEGER NOT NULL DEFAULT 0 CHECK (vat_minor >= 0),
  currency                 TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  credits_granted          INTEGER NOT NULL DEFAULT 0 CHECK (credits_granted >= 0),
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','succeeded','failed','cancelled','refunded','partially_refunded')),
  refunded_minor           INTEGER NOT NULL DEFAULT 0 CHECK (refunded_minor >= 0),
  provider                 TEXT NOT NULL DEFAULT 'stripe',
  provider_ref             TEXT,
  provider_client_secret   TEXT,
  failure_reason           TEXT,
  receipt_url              TEXT,
  invoice_number           TEXT,
  succeeded_at             TIMESTAMPTZ,
  failed_at                TIMESTAMPTZ,
  cancelled_at             TIMESTAMPTZ,
  refunded_at              TIMESTAMPTZ,
  idempotency_key          TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_wcp_purchases_refund_lte_amount CHECK (refunded_minor <= amount_minor),
  CONSTRAINT uniq_wcp_purchases_buyer_idem UNIQUE (buyer_identity_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_wcp_purchases_buyer ON wcp_purchases(buyer_identity_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS wcp_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       UUID NOT NULL REFERENCES wcp_wallets(id) ON DELETE CASCADE,
  amount_minor    INTEGER NOT NULL CHECK (amount_minor > 0),
  currency        TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed')),
  provider        TEXT NOT NULL DEFAULT 'stripe',
  provider_ref    TEXT,
  failure_reason  TEXT,
  scheduled_for   TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wcp_payouts_wallet ON wcp_payouts(wallet_id, status);

CREATE TABLE IF NOT EXISTS wcp_ledger_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id           UUID NOT NULL REFERENCES wcp_wallets(id) ON DELETE CASCADE,
  kind                TEXT NOT NULL
                      CHECK (kind IN ('purchase','refund','credit_grant','credit_spend','payout','payout_reversal','hold','release','adjustment')),
  amount_minor        INTEGER NOT NULL DEFAULT 0,
  credits             INTEGER NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  reference           TEXT,
  reverses_entry_id   UUID REFERENCES wcp_ledger_entries(id),
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wcp_ledger_wallet ON wcp_ledger_entries(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wcp_ledger_ref    ON wcp_ledger_entries(reference);

-- Block UPDATE/DELETE on the ledger so it remains append-only.
CREATE OR REPLACE FUNCTION wcp_ledger_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'wcp_ledger_entries is append-only';
END $$;
DROP TRIGGER IF EXISTS trg_wcp_ledger_no_update ON wcp_ledger_entries;
CREATE TRIGGER trg_wcp_ledger_no_update BEFORE UPDATE OR DELETE ON wcp_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION wcp_ledger_immutable();

CREATE TABLE IF NOT EXISTS wcp_audit_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id  UUID,
  actor_identity_id  UUID,
  action             TEXT NOT NULL,
  target_type        TEXT,
  target_id          UUID,
  diff               JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip                 TEXT,
  user_agent         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wcp_audit_owner ON wcp_audit_events(owner_identity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wcp_webhook_deliveries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider         TEXT NOT NULL,
  event_id         TEXT NOT NULL,
  event_type       TEXT NOT NULL,
  signature_valid  TEXT NOT NULL DEFAULT 'true',
  status           TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed','skipped','failed')),
  payload          JSONB NOT NULL,
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_wcp_webhook_provider_event UNIQUE (provider, event_id)
);

-- ─── Seed: wallet, packages, sample purchases & ledger ────────────
INSERT INTO wcp_wallets (id, owner_identity_id, currency, cash_balance_minor, credit_balance) VALUES
  ('00000000-0000-0000-0000-000000005701'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'GBP', 125_00, 250)
ON CONFLICT (owner_identity_id, currency) DO NOTHING;

INSERT INTO wcp_packages (id, owner_identity_id, slug, name, description, kind, price_minor, currency, credits_granted, vat_rate_bp, status, features) VALUES
  ('00000000-0000-0000-0000-000000005711'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'credits-100',  'Starter Credits',     'A small bundle of credits for casual use.',  'credits',      9_99,   'GBP', 100,  2000, 'active', '["100 credits","Never expires"]'::jsonb),
  ('00000000-0000-0000-0000-000000005712'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'credits-500',  'Pro Credits',         'A solid bundle for active professionals.',   'credits',     39_99,   'GBP', 500,  2000, 'active', '["500 credits","Priority support"]'::jsonb),
  ('00000000-0000-0000-0000-000000005713'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'pro-monthly',  'Pro Monthly',         'Unlimited Pro features, billed monthly.',    'subscription',19_00,   'GBP',   0,  2000, 'active', '["Unlimited search","Priority support"]'::jsonb)
ON CONFLICT (owner_identity_id, slug) DO NOTHING;

INSERT INTO wcp_purchases (id, buyer_identity_id, package_id, package_snapshot, amount_minor, vat_minor, currency, credits_granted, status, provider, provider_ref, succeeded_at, invoice_number) VALUES
  ('00000000-0000-0000-0000-000000005721'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, '00000000-0000-0000-0000-000000005711'::uuid,
   '{"slug":"credits-100","name":"Starter Credits"}'::jsonb,
   9_99, 1_66, 'GBP', 100, 'succeeded', 'stripe', 'pi_demo_5721', now() - INTERVAL '3 days', 'INV-2026-0001')
ON CONFLICT DO NOTHING;

INSERT INTO wcp_ledger_entries (wallet_id, kind, amount_minor, credits, reference, meta) VALUES
  ('00000000-0000-0000-0000-000000005701'::uuid, 'purchase',     9_99, 0,   'purchase:00000000-0000-0000-0000-000000005721', '{"invoice":"INV-2026-0001"}'::jsonb),
  ('00000000-0000-0000-0000-000000005701'::uuid, 'credit_grant', 0,    100, 'purchase:00000000-0000-0000-0000-000000005721', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000005701'::uuid, 'credit_grant', 0,    150, 'manual:welcome-bonus',                          '{"reason":"welcome"}'::jsonb)
ON CONFLICT DO NOTHING;
