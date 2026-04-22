-- Domain — Referrals & Affiliate
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  code text NOT NULL UNIQUE CHECK (length(code) BETWEEN 3 AND 32),
  program_type text NOT NULL DEFAULT 'user' CHECK (program_type IN ('user','affiliate','partner')),
  reward_type text NOT NULL DEFAULT 'flat' CHECK (reward_type IN ('flat','percentage','tiered')),
  reward_value integer NOT NULL DEFAULT 0 CHECK (reward_value >= 0),
  reward_currency text NOT NULL DEFAULT 'USD',
  active text NOT NULL DEFAULT 'yes' CHECK (active IN ('yes','no')),
  expires_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ref_codes_owner_idx ON referral_codes(owner_identity_id);

CREATE TABLE IF NOT EXISTS referral_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  visitor_fingerprint text NOT NULL,
  source text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ref_visits_code_idx ON referral_visits(code_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  converted_identity_id uuid NOT NULL,
  conversion_type text NOT NULL CHECK (conversion_type IN ('signup','first_purchase','subscription','gig_purchase','project_award','course_enrollment')),
  amount_cents integer NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  reward_cents integer NOT NULL DEFAULT 0 CHECK (reward_cents >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','reversed')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code_id, converted_identity_id, conversion_type)
);
CREATE INDEX IF NOT EXISTS ref_conv_code_idx ON referral_conversions(code_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid')),
  paid_at timestamptz,
  CHECK (period_end > period_start)
);
