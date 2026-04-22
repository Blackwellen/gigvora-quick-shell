-- Domain — Billing & Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE CHECK (length(number) BETWEEN 3 AND 64),
  issuer_identity_id uuid NOT NULL,
  customer_identity_id uuid,
  customer_email text,
  customer_name text,
  currency text NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  subtotal_cents integer NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  tax_cents integer NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  discount_cents integer NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  amount_paid_cents integer NOT NULL DEFAULT 0 CHECK (amount_paid_cents >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','paid','partial','void','uncollectible','refunded')),
  issue_date timestamptz,
  due_date timestamptz,
  paid_at timestamptz,
  notes text,
  po_number text,
  pdf_url text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (amount_paid_cents <= total_cents)
);
CREATE INDEX IF NOT EXISTS invoices_issuer_idx ON invoices(issuer_identity_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS invoices_customer_idx ON invoices(customer_identity_id, status) WHERE customer_identity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS invoices_due_idx ON invoices(due_date) WHERE status IN ('open','partial');

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL CHECK (length(description) BETWEEN 1 AND 500),
  quantity numeric(14,4) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents integer NOT NULL DEFAULT 0,
  tax_rate_bps integer NOT NULL DEFAULT 0 CHECK (tax_rate_bps >= 0 AND tax_rate_bps <= 10000),
  amount_cents integer NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS invoice_line_items_invoice_idx ON invoice_line_items(invoice_id);

CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('stripe','paddle','wire','cash','wallet','other')),
  external_ref text,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending','succeeded','failed','refunded')),
  paid_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (provider, external_ref)
);
CREATE INDEX IF NOT EXISTS invoice_payments_invoice_idx ON invoice_payments(invoice_id);

CREATE TABLE IF NOT EXISTS recurring_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_identity_id uuid NOT NULL,
  product_key text NOT NULL,
  interval text NOT NULL DEFAULT 'month' CHECK (interval IN ('day','week','month','year')),
  interval_count integer NOT NULL DEFAULT 1 CHECK (interval_count BETWEEN 1 AND 12),
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing','active','past_due','cancelled','paused')),
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  cancelled_at timestamptz,
  external_subscription_id text,
  external_provider text CHECK (external_provider IN ('stripe','paddle') OR external_provider IS NULL),
  auto_renew boolean NOT NULL DEFAULT true,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (external_provider, external_subscription_id)
);
CREATE INDEX IF NOT EXISTS recurring_subs_customer_idx ON recurring_subscriptions(customer_identity_id, status);
CREATE INDEX IF NOT EXISTS recurring_subs_renewal_idx ON recurring_subscriptions(current_period_end) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  number text NOT NULL UNIQUE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  reason text NOT NULL CHECK (length(reason) BETWEEN 3 AND 500),
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','voided')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_notes_invoice_idx ON credit_notes(invoice_id);
