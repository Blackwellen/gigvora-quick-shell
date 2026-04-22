-- Domain 64 — Pricing, Promotions, Offer Packaging & Monetization Surfaces.

CREATE TABLE IF NOT EXISTS ppm_price_books (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  name              TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  currency          TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  meta              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ppm_books_owner ON ppm_price_books(owner_identity_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ppm_books_default
  ON ppm_price_books(owner_identity_id) WHERE is_default = TRUE;

CREATE TABLE IF NOT EXISTS ppm_price_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_book_id     UUID NOT NULL REFERENCES ppm_price_books(id) ON DELETE CASCADE,
  owner_identity_id UUID NOT NULL,
  sku               TEXT NOT NULL CHECK (length(sku) BETWEEN 1 AND 80),
  tier              TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard','starter','pro','enterprise','custom')),
  unit_minor        INTEGER NOT NULL CHECK (unit_minor >= 0),
  currency          TEXT NOT NULL CHECK (length(currency) = 3),
  min_quantity      INTEGER NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
  valid_from        TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until       TIMESTAMPTZ,
  meta              JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (valid_until IS NULL OR valid_until > valid_from),
  CONSTRAINT uniq_ppm_entry_live UNIQUE (price_book_id, sku, tier, valid_from)
);
CREATE INDEX IF NOT EXISTS idx_ppm_entries_book ON ppm_price_entries(price_book_id, sku, tier);

CREATE TABLE IF NOT EXISTS ppm_offer_packages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  slug              TEXT NOT NULL CHECK (length(slug) BETWEEN 2 AND 60 AND slug ~ '^[a-z0-9][a-z0-9_-]*$'),
  name              TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  tier              TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard','starter','pro','enterprise','custom')),
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  price_minor       INTEGER NOT NULL CHECK (price_minor >= 0),
  currency          TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  billing_interval  TEXT NOT NULL DEFAULT 'one_time' CHECK (billing_interval IN ('one_time','month','year')),
  features          JSONB NOT NULL DEFAULT '[]'::jsonb,
  highlight         BOOLEAN NOT NULL DEFAULT FALSE,
  position          INTEGER NOT NULL DEFAULT 0,
  meta              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_ppm_package_slug UNIQUE (owner_identity_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_ppm_packages_owner ON ppm_offer_packages(owner_identity_id, status, position);

CREATE TABLE IF NOT EXISTS ppm_promotions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID NOT NULL,
  code                TEXT NOT NULL CHECK (length(code) BETWEEN 3 AND 40 AND code ~ '^[A-Z0-9][A-Z0-9_-]*$'),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','expired','archived')),
  kind                TEXT NOT NULL DEFAULT 'percent' CHECK (kind IN ('percent','fixed','free_trial')),
  value_bps           INTEGER NOT NULL DEFAULT 0 CHECK (value_bps >= 0 AND value_bps <= 10000),
  value_minor         INTEGER NOT NULL DEFAULT 0 CHECK (value_minor >= 0),
  currency            TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  applies_to          TEXT NOT NULL DEFAULT 'any' CHECK (applies_to IN ('any','package','sku','first_purchase')),
  applies_to_refs     JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_redemptions     INTEGER CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  per_user_limit      INTEGER NOT NULL DEFAULT 1 CHECK (per_user_limit >= 1),
  redeemed_count      INTEGER NOT NULL DEFAULT 0 CHECK (redeemed_count >= 0),
  starts_at           TIMESTAMPTZ,
  ends_at             TIMESTAMPTZ,
  min_subtotal_minor  INTEGER NOT NULL DEFAULT 0 CHECK (min_subtotal_minor >= 0),
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CHECK (
    (kind = 'percent'  AND value_bps   > 0 AND value_minor = 0) OR
    (kind = 'fixed'    AND value_minor > 0 AND value_bps   = 0) OR
    (kind = 'free_trial')
  ),
  CONSTRAINT uniq_ppm_promo_code UNIQUE (owner_identity_id, code)
);
CREATE INDEX IF NOT EXISTS idx_ppm_promos_owner ON ppm_promotions(owner_identity_id, status);

CREATE TABLE IF NOT EXISTS ppm_promo_redemptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id             UUID NOT NULL REFERENCES ppm_promotions(id) ON DELETE CASCADE,
  owner_identity_id        UUID NOT NULL,
  redeemed_by_identity_id  UUID NOT NULL,
  order_ref                TEXT,
  discount_minor           INTEGER NOT NULL CHECK (discount_minor >= 0),
  currency                 TEXT NOT NULL CHECK (length(currency) = 3),
  redeemed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT uniq_ppm_redempt_order UNIQUE (promotion_id, order_ref)
);
CREATE INDEX IF NOT EXISTS idx_ppm_redempt_promo ON ppm_promo_redemptions(promotion_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ppm_redempt_user  ON ppm_promo_redemptions(redeemed_by_identity_id, promotion_id);

-- Append-only redemption log
CREATE OR REPLACE FUNCTION ppm_redemptions_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'ppm_promo_redemptions is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_ppm_redempt_no_update ON ppm_promo_redemptions;
CREATE TRIGGER trg_ppm_redempt_no_update BEFORE UPDATE OR DELETE ON ppm_promo_redemptions
  FOR EACH ROW EXECUTE FUNCTION ppm_redemptions_immutable();

CREATE TABLE IF NOT EXISTS ppm_quotes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id     UUID NOT NULL,
  customer_identity_id  UUID,
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','expired','cancelled')),
  subtotal_minor        INTEGER NOT NULL CHECK (subtotal_minor >= 0),
  discount_minor        INTEGER NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  tax_minor             INTEGER NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  total_minor           INTEGER NOT NULL CHECK (total_minor >= 0),
  currency              TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  promo_code            TEXT,
  line_items            JSONB NOT NULL DEFAULT '[]'::jsonb,
  valid_until           TIMESTAMPTZ,
  accepted_at           TIMESTAMPTZ,
  meta                  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (total_minor = GREATEST(0, subtotal_minor - discount_minor) + tax_minor),
  CHECK (discount_minor <= subtotal_minor)
);
CREATE INDEX IF NOT EXISTS idx_ppm_quotes_owner    ON ppm_quotes(owner_identity_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ppm_quotes_customer ON ppm_quotes(customer_identity_id, status);

CREATE TABLE IF NOT EXISTS ppm_audit_events (
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
CREATE INDEX IF NOT EXISTS idx_ppm_audit_owner ON ppm_audit_events(owner_identity_id, created_at DESC);

-- Seed
INSERT INTO ppm_price_books (id, owner_identity_id, name, currency, status, is_default)
VALUES ('00000000-0000-0000-0000-000000006701'::uuid,
        '00000000-0000-0000-0000-0000000000e1'::uuid,
        'Default Price Book', 'GBP', 'active', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO ppm_offer_packages (id, owner_identity_id, slug, name, tier, status, price_minor, currency, billing_interval, features, highlight, position)
VALUES
  ('00000000-0000-0000-0000-000000006801'::uuid,
   '00000000-0000-0000-0000-0000000000e1'::uuid,
   'starter', 'Starter', 'starter', 'active', 9900, 'GBP', 'month',
   '["1 project","Email support","Basic analytics"]'::jsonb, FALSE, 0),
  ('00000000-0000-0000-0000-000000006802'::uuid,
   '00000000-0000-0000-0000-0000000000e1'::uuid,
   'pro', 'Pro', 'pro', 'active', 29900, 'GBP', 'month',
   '["Unlimited projects","Priority support","Advanced analytics","API access"]'::jsonb, TRUE, 1),
  ('00000000-0000-0000-0000-000000006803'::uuid,
   '00000000-0000-0000-0000-0000000000e1'::uuid,
   'enterprise', 'Enterprise', 'enterprise', 'active', 99900, 'GBP', 'month',
   '["SSO + audit logs","Dedicated CSM","SLA","Custom integrations"]'::jsonb, FALSE, 2)
ON CONFLICT DO NOTHING;

INSERT INTO ppm_promotions (id, owner_identity_id, code, status, kind, value_bps, currency, applies_to, max_redemptions, per_user_limit, starts_at)
VALUES ('00000000-0000-0000-0000-000000006901'::uuid,
        '00000000-0000-0000-0000-0000000000e1'::uuid,
        'LAUNCH20', 'active', 'percent', 2000, 'GBP', 'any', 500, 1, now())
ON CONFLICT DO NOTHING;
