-- Domain — Tax & Compliance
CREATE TABLE IF NOT EXISTS tax_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  jurisdiction text NOT NULL CHECK (length(jurisdiction) BETWEEN 2 AND 16),
  tax_id text NOT NULL CHECK (length(tax_id) BETWEEN 3 AND 64),
  registration_name text,
  active boolean NOT NULL DEFAULT true,
  valid_from timestamptz,
  valid_to timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_identity_id, jurisdiction)
);
CREATE INDEX IF NOT EXISTS tax_reg_owner_idx ON tax_registrations(owner_identity_id, active);

CREATE TABLE IF NOT EXISTS tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL,
  category text NOT NULL DEFAULT 'standard' CHECK (category IN ('standard','reduced','zero','exempt')),
  rate_bps integer NOT NULL CHECK (rate_bps >= 0 AND rate_bps <= 10000),
  applies_from timestamptz NOT NULL,
  applies_to timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (applies_to IS NULL OR applies_to >= applies_from)
);
CREATE INDEX IF NOT EXISTS tax_rates_juris_idx ON tax_rates(jurisdiction, category, applies_from DESC);

CREATE TABLE IF NOT EXISTS tax_exemption_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_identity_id uuid NOT NULL,
  jurisdiction text NOT NULL,
  certificate_number text NOT NULL,
  expires_at timestamptz,
  document_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','expired','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_identity_id, jurisdiction, certificate_number)
);
CREATE INDEX IF NOT EXISTS tax_cert_customer_idx ON tax_exemption_certificates(customer_identity_id, status);

CREATE TABLE IF NOT EXISTS tax_forms_w9 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  legal_name text NOT NULL CHECK (length(legal_name) BETWEEN 2 AND 200),
  business_name text,
  classification text NOT NULL CHECK (classification IN ('individual','c-corp','s-corp','partnership','llc','other')),
  tin_type text NOT NULL CHECK (tin_type IN ('ssn','ein')),
  tin_encrypted text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'US' CHECK (length(country) = 2),
  signed_at timestamptz NOT NULL DEFAULT now(),
  signature_name text NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected')),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS w9_identity_idx ON tax_forms_w9(identity_id, status);

CREATE TABLE IF NOT EXISTS tax_1099_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_identity_id uuid NOT NULL,
  payee_identity_id uuid NOT NULL,
  tax_year integer NOT NULL CHECK (tax_year BETWEEN 2000 AND 2100),
  form_type text NOT NULL DEFAULT '1099-NEC' CHECK (form_type IN ('1099-NEC','1099-MISC','1099-K')),
  total_paid_cents integer NOT NULL CHECK (total_paid_cents >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','filed','delivered','corrected','voided')),
  filed_at timestamptz,
  pdf_url text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payer_identity_id, payee_identity_id, tax_year, form_type)
);
CREATE INDEX IF NOT EXISTS tax_1099_payer_idx ON tax_1099_forms(payer_identity_id, tax_year);
CREATE INDEX IF NOT EXISTS tax_1099_payee_idx ON tax_1099_forms(payee_identity_id, tax_year);

CREATE TABLE IF NOT EXISTS tax_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  jurisdiction text NOT NULL,
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  tax_cents integer NOT NULL CHECK (tax_cents >= 0),
  rate_bps integer NOT NULL CHECK (rate_bps >= 0 AND rate_bps <= 10000),
  reverse_charge boolean NOT NULL DEFAULT false,
  computed_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS tax_calc_invoice_idx ON tax_calculations(invoice_id) WHERE invoice_id IS NOT NULL;
