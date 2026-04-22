-- ───────────────────────────────────────────────────────────────────────────
-- FD-16 Finance closure — encrypted bank-details vault, double-entry ledger,
-- held-credits / commission / ad-spend separation, and FCA-safe reveal audit.
--
-- Lives in user's own Postgres (DATABASE_URL), NEVER in Lovable Cloud.
-- ───────────────────────────────────────────────────────────────────────────

-- ── 1. Encrypted bank-details vault ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_details_vault (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                 UUID NOT NULL,
  owner_kind               TEXT NOT NULL CHECK (owner_kind IN ('user','company','admin','platform')),
  display_label            TEXT NOT NULL,
  country                  TEXT NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'GBP',
  account_holder_name      TEXT NOT NULL,
  -- Envelope-encrypted: ciphertext/iv/tag stored, plaintext NEVER persisted
  account_number_cipher    TEXT NOT NULL,
  account_number_iv        TEXT NOT NULL,
  account_number_tag       TEXT NOT NULL,
  sort_or_routing_cipher   TEXT NOT NULL,
  sort_or_routing_iv       TEXT NOT NULL,
  sort_or_routing_tag      TEXT NOT NULL,
  iban_cipher              TEXT,
  iban_iv                  TEXT,
  iban_tag                 TEXT,
  swift_bic                TEXT,
  -- Safe display fragments (last4 + fingerprint) for non-reveal contexts
  account_last4            TEXT NOT NULL,
  fingerprint              TEXT NOT NULL,
  key_version              INTEGER NOT NULL DEFAULT 1,
  verified                 BOOLEAN NOT NULL DEFAULT false,
  verified_at              TIMESTAMPTZ,
  verified_by              UUID,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at              TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_bank_vault_owner ON bank_details_vault(owner_kind, owner_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bank_vault_fp    ON bank_details_vault(fingerprint);

-- FCA-safe reveal audit (append-only)
CREATE TABLE IF NOT EXISTS bank_details_reveal_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id         UUID NOT NULL REFERENCES bank_details_vault(id) ON DELETE CASCADE,
  actor_id        UUID NOT NULL,
  actor_role      TEXT NOT NULL,
  reason          TEXT NOT NULL CHECK (length(reason) BETWEEN 4 AND 500),
  fields_revealed TEXT[] NOT NULL,
  ip              TEXT,
  user_agent      TEXT,
  session_id      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bank_reveal_bank  ON bank_details_reveal_events(bank_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bank_reveal_actor ON bank_details_reveal_events(actor_id, created_at DESC);

CREATE OR REPLACE FUNCTION bank_reveal_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'bank_details_reveal_events is append-only'; END $$;
DROP TRIGGER IF EXISTS bank_reveal_append_only ON bank_details_reveal_events;
CREATE TRIGGER bank_reveal_append_only BEFORE UPDATE OR DELETE ON bank_details_reveal_events
FOR EACH ROW EXECUTE FUNCTION bank_reveal_append_only();

-- ── 2. Double-entry ledger ───────────────────────────────────────────────
-- Accounts table: every owner × bucket has a ledger account.
-- Buckets enforce the held-credits / commission / ad-spend separation that
-- FCA + safeguarding rules require — funds in different buckets can NEVER be
-- silently rebalanced; only journal entries with offsetting debits/credits.
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID,                       -- NULL for platform-internal accounts
  owner_kind   TEXT NOT NULL CHECK (owner_kind IN ('user','company','platform')),
  bucket       TEXT NOT NULL CHECK (bucket IN
                ('available','held_credits','escrow','commission_payable',
                 'commission_revenue','ad_spend_prepaid','ad_spend_consumed',
                 'subscription_revenue','tax_payable','refund_payable',
                 'safeguarded_client_funds','platform_revenue','suspense')),
  currency     TEXT NOT NULL DEFAULT 'GBP',
  balance_minor BIGINT NOT NULL DEFAULT 0,  -- materialized from journal_lines
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_kind, owner_id, bucket, currency)
);
CREATE INDEX IF NOT EXISTS idx_ledger_owner ON ledger_accounts(owner_kind, owner_id);

-- Journal entry header
CREATE TABLE IF NOT EXISTS ledger_journal_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_by     UUID,
  kind          TEXT NOT NULL CHECK (kind IN
                ('charge','refund','payout','escrow_hold','escrow_release',
                 'commission_accrue','commission_payout','ad_spend_topup',
                 'ad_spend_consume','subscription','adjustment','reversal',
                 'transfer','tax_collect','credit_grant','credit_consume')),
  reference     TEXT NOT NULL,
  external_ref  TEXT,
  memo          TEXT,
  reversed_by   UUID REFERENCES ledger_journal_entries(id),
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (reference)
);
CREATE INDEX IF NOT EXISTS idx_journal_kind ON ledger_journal_entries(kind, posted_at DESC);

-- Lines: every journal must balance (sum of signed amounts = 0)
CREATE TABLE IF NOT EXISTS ledger_journal_lines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id      UUID NOT NULL REFERENCES ledger_journal_entries(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL REFERENCES ledger_accounts(id),
  -- positive = debit (asset/expense up), negative = credit (liability/revenue up)
  amount_minor  BIGINT NOT NULL CHECK (amount_minor <> 0),
  currency      TEXT NOT NULL,
  side          TEXT NOT NULL CHECK (side IN ('debit','credit')),
  memo          TEXT
);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry   ON ledger_journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON ledger_journal_lines(account_id);

-- Append-only on ledger journal lines + entries
CREATE OR REPLACE FUNCTION ledger_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'ledger is append-only — post a reversal entry instead'; END $$;
DROP TRIGGER IF EXISTS ledger_entries_append_only ON ledger_journal_entries;
CREATE TRIGGER ledger_entries_append_only BEFORE UPDATE OR DELETE ON ledger_journal_entries
FOR EACH ROW EXECUTE FUNCTION ledger_append_only();
DROP TRIGGER IF EXISTS ledger_lines_append_only ON ledger_journal_lines;
CREATE TRIGGER ledger_lines_append_only BEFORE UPDATE OR DELETE ON ledger_journal_lines
FOR EACH ROW EXECUTE FUNCTION ledger_append_only();

-- Balance enforcement: sum of lines per entry must be zero
CREATE OR REPLACE FUNCTION ledger_assert_balanced() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE total BIGINT;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN side='debit' THEN amount_minor ELSE -amount_minor END), 0)
  INTO total FROM ledger_journal_lines WHERE entry_id = NEW.entry_id;
  IF total <> 0 THEN
    RAISE EXCEPTION 'journal entry % does not balance (delta=%)', NEW.entry_id, total;
  END IF;
  -- Materialize account balance
  UPDATE ledger_accounts SET balance_minor = balance_minor +
    CASE WHEN NEW.side='debit' THEN NEW.amount_minor ELSE -NEW.amount_minor END
  WHERE id = NEW.account_id;
  RETURN NEW;
END $$;
-- Use DEFERRED constraint trigger so all lines for the entry are inserted first
DROP TRIGGER IF EXISTS ledger_assert_balanced ON ledger_journal_lines;
CREATE CONSTRAINT TRIGGER ledger_assert_balanced
  AFTER INSERT ON ledger_journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION ledger_assert_balanced();

-- Seed the platform-level accounts so the surface never blanks
INSERT INTO ledger_accounts (owner_id, owner_kind, bucket, currency)
VALUES
  (NULL, 'platform', 'commission_revenue',       'GBP'),
  (NULL, 'platform', 'safeguarded_client_funds', 'GBP'),
  (NULL, 'platform', 'platform_revenue',         'GBP'),
  (NULL, 'platform', 'tax_payable',              'GBP'),
  (NULL, 'platform', 'refund_payable',           'GBP'),
  (NULL, 'platform', 'suspense',                 'GBP'),
  (NULL, 'platform', 'ad_spend_consumed',        'GBP')
ON CONFLICT (owner_kind, owner_id, bucket, currency) DO NOTHING;
