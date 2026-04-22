-- Domain — Payouts v2 (multi-rail)
CREATE TABLE IF NOT EXISTS payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  rail text NOT NULL CHECK (rail IN ('bank','card','wallet','stripe_connect','paypal','crypto')),
  currency text NOT NULL DEFAULT 'USD',
  country_code text NOT NULL,
  external_account_id text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification','active','disabled')),
  is_default boolean NOT NULL DEFAULT false,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_identity_id, rail, external_account_id)
);
CREATE INDEX IF NOT EXISTS payout_accounts_owner_idx ON payout_accounts(owner_identity_id, status);

CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES payout_accounts(id) ON DELETE RESTRICT,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed','cancelled')),
  reference text NOT NULL UNIQUE,
  initiated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  failure_reason text,
  fee_amount_cents integer NOT NULL DEFAULT 0 CHECK (fee_amount_cents >= 0),
  net_amount_cents integer NOT NULL CHECK (net_amount_cents >= 0),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS payouts_owner_idx ON payouts(owner_identity_id, initiated_at DESC);
CREATE INDEX IF NOT EXISTS payouts_status_idx ON payouts(status, initiated_at);

CREATE TABLE IF NOT EXISTS payout_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  payout_id uuid REFERENCES payouts(id) ON DELETE SET NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('credit','debit','reserve','release','fee')),
  amount_cents integer NOT NULL,
  currency text NOT NULL,
  description text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payout_ledger_owner_idx ON payout_ledger(owner_identity_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS payout_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL UNIQUE,
  cadence text NOT NULL DEFAULT 'manual' CHECK (cadence IN ('manual','daily','weekly','monthly')),
  min_amount_cents integer NOT NULL DEFAULT 5000 CHECK (min_amount_cents >= 0),
  default_account_id uuid REFERENCES payout_accounts(id) ON DELETE SET NULL,
  next_run_at timestamptz
);
