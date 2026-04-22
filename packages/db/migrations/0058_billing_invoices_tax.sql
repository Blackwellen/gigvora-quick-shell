-- Domain 58 — Billing, Invoices, Tax, Subscriptions & Commercial Setup.
-- Append-only invoice event log; CHECKs on totals/refunds; provider webhook dedupe.
-- State machines:
--   bit_invoices.status:    draft → open → partially_paid → paid;
--                           draft → void; open → uncollectible; paid → (partially_)refunded
--   bit_subscriptions:      trialing → active ↔ past_due → cancelled | paused → active
--   bit_dunning_attempts:   scheduled → succeeded | failed | skipped
--   bit_disputes:           opened → under_review → won | lost | accepted

CREATE TABLE IF NOT EXISTS bit_commercial_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id    UUID NOT NULL UNIQUE,
  legal_name           TEXT NOT NULL CHECK (length(legal_name) BETWEEN 1 AND 200),
  trading_name         TEXT,
  tax_id               TEXT,
  tax_scheme           TEXT NOT NULL DEFAULT 'GB-VAT',
  default_currency     TEXT NOT NULL DEFAULT 'GBP' CHECK (length(default_currency) = 3),
  billing_email        TEXT NOT NULL CHECK (billing_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  address_line1        TEXT NOT NULL,
  address_line2        TEXT,
  city                 TEXT NOT NULL,
  region               TEXT,
  postal_code          TEXT NOT NULL,
  country              TEXT NOT NULL DEFAULT 'GB' CHECK (length(country) = 2),
  invoice_prefix       TEXT NOT NULL DEFAULT 'INV' CHECK (length(invoice_prefix) BETWEEN 1 AND 12),
  next_invoice_seq     INTEGER NOT NULL DEFAULT 1 CHECK (next_invoice_seq > 0),
  payment_terms_days   INTEGER NOT NULL DEFAULT 14 CHECK (payment_terms_days BETWEEN 0 AND 365),
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bit_tax_rates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID NOT NULL,
  jurisdiction        TEXT NOT NULL CHECK (length(jurisdiction) BETWEEN 2 AND 16),
  category            TEXT NOT NULL DEFAULT 'standard'
                      CHECK (category IN ('standard','reduced','zero','exempt','reverse_charge')),
  rate_bp             INTEGER NOT NULL CHECK (rate_bp BETWEEN 0 AND 10000),
  applies_from        TIMESTAMPTZ NOT NULL DEFAULT now(),
  applies_to          TIMESTAMPTZ,
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (applies_to IS NULL OR applies_to >= applies_from)
);
CREATE INDEX IF NOT EXISTS idx_bit_tax_rates_owner ON bit_tax_rates(owner_identity_id, jurisdiction, category);

CREATE TABLE IF NOT EXISTS bit_invoices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id     UUID NOT NULL,
  customer_identity_id  UUID,
  customer_email        TEXT NOT NULL CHECK (customer_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  customer_name         TEXT NOT NULL CHECK (length(customer_name) BETWEEN 1 AND 200),
  number                TEXT NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  subtotal_minor        INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_minor >= 0),
  tax_minor             INTEGER NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  discount_minor        INTEGER NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  total_minor           INTEGER NOT NULL DEFAULT 0 CHECK (total_minor >= 0),
  paid_minor            INTEGER NOT NULL DEFAULT 0 CHECK (paid_minor >= 0),
  refunded_minor        INTEGER NOT NULL DEFAULT 0 CHECK (refunded_minor >= 0),
  status                TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','open','partially_paid','paid','void','uncollectible','refunded','partially_refunded')),
  issue_date            TIMESTAMPTZ,
  due_date              TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  voided_at             TIMESTAMPTZ,
  po_number             TEXT,
  notes                 TEXT,
  pdf_url               TEXT,
  reverse_charge        BOOLEAN NOT NULL DEFAULT false,
  tax_jurisdiction      TEXT,
  subscription_id       UUID,
  meta                  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_bit_invoices_paid_lte_total CHECK (paid_minor <= total_minor),
  CONSTRAINT chk_bit_invoices_refund_lte_paid CHECK (refunded_minor <= paid_minor),
  CONSTRAINT uniq_bit_invoices_owner_number UNIQUE (owner_identity_id, number)
);
CREATE INDEX IF NOT EXISTS idx_bit_invoices_owner ON bit_invoices(owner_identity_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_bit_invoices_customer ON bit_invoices(customer_identity_id, status);

CREATE TABLE IF NOT EXISTS bit_invoice_line_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        UUID NOT NULL REFERENCES bit_invoices(id) ON DELETE CASCADE,
  description       TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 500),
  quantity          NUMERIC(14,4) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_minor  INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_minor >= 0),
  tax_rate_bp       INTEGER NOT NULL DEFAULT 0 CHECK (tax_rate_bp BETWEEN 0 AND 10000),
  amount_minor      INTEGER NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  meta              JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_bit_invoice_lines_invoice ON bit_invoice_line_items(invoice_id);

CREATE TABLE IF NOT EXISTS bit_invoice_payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES bit_invoices(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL DEFAULT 'stripe',
  provider_ref  TEXT,
  amount_minor  INTEGER NOT NULL CHECK (amount_minor > 0),
  currency      TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  status        TEXT NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending','succeeded','failed','refunded')),
  paid_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_bit_invoice_payments_invoice ON bit_invoice_payments(invoice_id, status);

CREATE TABLE IF NOT EXISTS bit_credit_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES bit_invoices(id) ON DELETE CASCADE,
  number        TEXT NOT NULL UNIQUE,
  amount_minor  INTEGER NOT NULL CHECK (amount_minor > 0),
  currency      TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  reason        TEXT NOT NULL CHECK (length(reason) BETWEEN 1 AND 500),
  status        TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','voided')),
  pdf_url       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bit_subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id        UUID NOT NULL,
  customer_identity_id     UUID NOT NULL,
  product_key              TEXT NOT NULL CHECK (length(product_key) BETWEEN 2 AND 80),
  plan_name                TEXT NOT NULL,
  amount_minor             INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency                 TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  interval                 TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('day','week','month','year')),
  interval_count           INTEGER NOT NULL DEFAULT 1 CHECK (interval_count BETWEEN 1 AND 12),
  status                   TEXT NOT NULL DEFAULT 'trialing'
                           CHECK (status IN ('trialing','active','past_due','paused','cancelled','incomplete')),
  trial_ends_at            TIMESTAMPTZ,
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  cancel_at                TIMESTAMPTZ,
  cancelled_at             TIMESTAMPTZ,
  paused_at                TIMESTAMPTZ,
  external_provider        TEXT,
  external_subscription_id TEXT,
  auto_renew               BOOLEAN NOT NULL DEFAULT true,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bit_subs_owner ON bit_subscriptions(owner_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_bit_subs_customer ON bit_subscriptions(customer_identity_id, status);

CREATE TABLE IF NOT EXISTS bit_dunning_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES bit_invoices(id) ON DELETE CASCADE,
  attempt_number  INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number BETWEEN 1 AND 10),
  status          TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','succeeded','failed','skipped')),
  scheduled_for   TIMESTAMPTZ NOT NULL,
  attempted_at    TIMESTAMPTZ,
  failure_reason  TEXT,
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_bit_dunning_invoice ON bit_dunning_attempts(invoice_id, attempt_number);

CREATE TABLE IF NOT EXISTS bit_disputes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES bit_invoices(id) ON DELETE CASCADE,
  amount_minor  INTEGER NOT NULL CHECK (amount_minor > 0),
  reason        TEXT NOT NULL CHECK (length(reason) BETWEEN 1 AND 500),
  status        TEXT NOT NULL DEFAULT 'opened' CHECK (status IN ('opened','under_review','won','lost','accepted')),
  evidence_url  TEXT,
  external_ref  TEXT,
  opened_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ,
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_bit_disputes_invoice ON bit_disputes(invoice_id, status);

CREATE TABLE IF NOT EXISTS bit_invoice_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id          UUID NOT NULL REFERENCES bit_invoices(id) ON DELETE CASCADE,
  kind                TEXT NOT NULL,
  actor_identity_id   UUID,
  amount_minor        INTEGER NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'GBP',
  reference           TEXT,
  diff                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bit_invoice_events_invoice ON bit_invoice_events(invoice_id, created_at DESC);

-- Append-only event log.
CREATE OR REPLACE FUNCTION bit_invoice_events_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'bit_invoice_events is append-only';
END $$;
DROP TRIGGER IF EXISTS trg_bit_invoice_events_no_update ON bit_invoice_events;
CREATE TRIGGER trg_bit_invoice_events_no_update BEFORE UPDATE OR DELETE ON bit_invoice_events
  FOR EACH ROW EXECUTE FUNCTION bit_invoice_events_immutable();

CREATE TABLE IF NOT EXISTS bit_webhook_deliveries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider         TEXT NOT NULL,
  event_id         TEXT NOT NULL,
  event_type       TEXT NOT NULL,
  signature_valid  TEXT NOT NULL DEFAULT 'true',
  status           TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed','skipped','failed')),
  payload          JSONB NOT NULL,
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_bit_webhook_provider_event UNIQUE (provider, event_id)
);

CREATE TABLE IF NOT EXISTS bit_audit_events (
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
CREATE INDEX IF NOT EXISTS idx_bit_audit_owner ON bit_audit_events(owner_identity_id, created_at DESC);

-- ─── Seed: profile, rate, invoice, subscription ───────────
INSERT INTO bit_commercial_profiles (id, owner_identity_id, legal_name, tax_id, billing_email, address_line1, city, postal_code, country)
VALUES ('00000000-0000-0000-0000-000000005801'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'Acme Ltd', 'GB123456789', 'billing@acme.example', '1 Pall Mall', 'London', 'SW1Y 5AA', 'GB')
ON CONFLICT (owner_identity_id) DO NOTHING;

INSERT INTO bit_tax_rates (owner_identity_id, jurisdiction, category, rate_bp)
VALUES ('00000000-0000-0000-0000-0000000000e1'::uuid, 'GB', 'standard', 2000),
       ('00000000-0000-0000-0000-0000000000e1'::uuid, 'GB', 'zero', 0),
       ('00000000-0000-0000-0000-0000000000e1'::uuid, 'EU-DE', 'reverse_charge', 0)
ON CONFLICT DO NOTHING;

INSERT INTO bit_invoices (id, owner_identity_id, customer_identity_id, customer_email, customer_name, number, currency,
                          subtotal_minor, tax_minor, total_minor, status, issue_date, due_date, tax_jurisdiction)
VALUES ('00000000-0000-0000-0000-000000005811'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid,
        '00000000-0000-0000-0000-0000000000c1'::uuid, 'client@example.com', 'Globex Inc',
        'INV-2026-00001', 'GBP', 100_00, 20_00, 120_00, 'open', now() - INTERVAL '5 days', now() + INTERVAL '9 days', 'GB')
ON CONFLICT DO NOTHING;

INSERT INTO bit_invoice_line_items (invoice_id, description, quantity, unit_price_minor, tax_rate_bp, amount_minor)
VALUES ('00000000-0000-0000-0000-000000005811'::uuid, 'Consulting (October)', 10, 10_00, 2000, 100_00)
ON CONFLICT DO NOTHING;

INSERT INTO bit_subscriptions (owner_identity_id, customer_identity_id, product_key, plan_name, amount_minor,
                               interval, status, trial_ends_at, current_period_start, current_period_end)
VALUES ('00000000-0000-0000-0000-0000000000e1'::uuid, '00000000-0000-0000-0000-0000000000c1'::uuid,
        'pro-monthly', 'Pro Monthly', 19_00, 'month', 'active',
        NULL, now() - INTERVAL '5 days', now() + INTERVAL '25 days')
ON CONFLICT DO NOTHING;
