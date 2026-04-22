-- Domain 68 — Finance Admin Dashboard, Refunds, Payouts, Billing Controls.
-- Append-only ledger + state-machine driven refund/payout/hold tables.

CREATE TABLE IF NOT EXISTS fin_refunds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       TEXT NOT NULL UNIQUE CHECK (reference ~ '^RF-[A-Z0-9]{6,12}$'),
  invoice_id      UUID,
  payment_ref     TEXT,
  customer_id     UUID NOT NULL,
  amount_minor    BIGINT NOT NULL CHECK (amount_minor > 0),
  currency        TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  reason          TEXT NOT NULL CHECK (length(reason) BETWEEN 3 AND 500),
  category        TEXT NOT NULL DEFAULT 'goodwill' CHECK (category IN
                  ('duplicate','fraud','dispute','goodwill','service_failure','cancelled','partial')),
  provider        TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe','paddle','wallet','manual')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
                  ('draft','pending','approved','processing','succeeded','failed','rejected','reversed')),
  requested_by    UUID,
  approved_by     UUID,
  approved_at     TIMESTAMPTZ,
  processed_at    TIMESTAMPTZ,
  failure_reason  TEXT,
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_refunds_status   ON fin_refunds(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fin_refunds_customer ON fin_refunds(customer_id, status);

CREATE TABLE IF NOT EXISTS fin_holds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL,
  amount_minor  BIGINT NOT NULL CHECK (amount_minor > 0),
  currency      TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  reason        TEXT NOT NULL CHECK (reason IN ('kyc','risk_review','dispute','fraud','manual','compliance')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','released','expired')),
  expires_at    TIMESTAMPTZ,
  released_at   TIMESTAMPTZ,
  released_by   UUID,
  notes         TEXT,
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_holds_owner ON fin_holds(owner_id, status);

CREATE TABLE IF NOT EXISTS fin_billing_controls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope           TEXT NOT NULL CHECK (scope IN ('global','customer','plan','region')),
  scope_key       TEXT NOT NULL DEFAULT '*',
  control_key     TEXT NOT NULL,
  value           JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by      UUID,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope, scope_key, control_key)
);

-- Append-only finance ledger (signed, double-entry style)
CREATE TABLE IF NOT EXISTS fin_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  account       TEXT NOT NULL,                -- e.g. revenue, refunds, payouts, fees, escrow
  owner_id      UUID,
  ref_kind      TEXT NOT NULL,                -- invoice|refund|payout|hold|adjustment
  ref_id        UUID,
  direction     TEXT NOT NULL CHECK (direction IN ('credit','debit')),
  amount_minor  BIGINT NOT NULL CHECK (amount_minor > 0),
  currency      TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  description   TEXT,
  actor_id      UUID,
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_fin_ledger_account ON fin_ledger(account, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_fin_ledger_ref     ON fin_ledger(ref_kind, ref_id);

CREATE OR REPLACE FUNCTION fin_ledger_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'fin_ledger is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_fin_ledger_no_update ON fin_ledger;
CREATE TRIGGER trg_fin_ledger_no_update BEFORE UPDATE OR DELETE ON fin_ledger
  FOR EACH ROW EXECUTE FUNCTION fin_ledger_immutable();

-- Audit table for finance admin actions
CREATE TABLE IF NOT EXISTS fin_audit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID,
  action      TEXT NOT NULL,
  target_kind TEXT,
  target_id   UUID,
  diff        JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_audit_actor ON fin_audit_events(actor_id, created_at DESC);

CREATE OR REPLACE FUNCTION fin_audit_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'fin_audit_events is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_fin_audit_no_update ON fin_audit_events;
CREATE TRIGGER trg_fin_audit_no_update BEFORE UPDATE OR DELETE ON fin_audit_events
  FOR EACH ROW EXECUTE FUNCTION fin_audit_immutable();

-- Seed demo data so the dashboard renders.
INSERT INTO fin_refunds (reference, customer_id, amount_minor, currency, reason, category, provider, status)
VALUES
  ('RF-DEMO01', gen_random_uuid(), 4999,  'GBP', 'Duplicate charge after retry',     'duplicate',      'stripe', 'pending'),
  ('RF-DEMO02', gen_random_uuid(), 12500, 'GBP', 'Service not delivered on time',    'service_failure','stripe', 'approved'),
  ('RF-DEMO03', gen_random_uuid(), 7500,  'GBP', 'Customer dispute, chargeback risk','dispute',        'stripe', 'processing'),
  ('RF-DEMO04', gen_random_uuid(), 2500,  'GBP', 'Goodwill credit',                  'goodwill',       'wallet', 'succeeded'),
  ('RF-DEMO05', gen_random_uuid(), 1999,  'GBP', 'Mismatch on invoice line',         'partial',        'stripe', 'rejected')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO fin_holds (owner_id, amount_minor, reason, status, expires_at, notes)
VALUES
  (gen_random_uuid(), 50000, 'kyc',         'active',   now() + interval '7 days',  'Awaiting KYC docs'),
  (gen_random_uuid(), 25000, 'risk_review', 'active',   now() + interval '3 days',  'High-risk refund pattern'),
  (gen_random_uuid(), 10000, 'dispute',     'released', NULL,                       'Released after dispute won')
ON CONFLICT DO NOTHING;

INSERT INTO fin_billing_controls (scope, scope_key, control_key, value, enabled) VALUES
  ('global','*','refund_auto_approve_under_minor',  '{"value":1000}'::jsonb,  TRUE),
  ('global','*','refund_dual_approval_over_minor',  '{"value":50000}'::jsonb, TRUE),
  ('global','*','payout_pause',                     '{"value":false}'::jsonb, TRUE),
  ('global','*','billing_freeze',                   '{"value":false}'::jsonb, TRUE)
ON CONFLICT (scope, scope_key, control_key) DO NOTHING;
