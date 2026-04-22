-- Domain 59 — Payouts, Escrow, Finance Operations & Hold Management.
-- Append-only ledger; CHECK invariants on amounts/refunds; provider webhook dedupe.
-- State machines:
--   pef_payouts:  pending → processing → paid | failed | cancelled; failed → processing
--   pef_escrows:  held → released | refunded | disputed → released | refunded; held → partially_released
--   pef_holds:    open → released | escalated | converted_to_dispute
--   pef_disputes: opened → under_review → resolved | rejected

CREATE TABLE IF NOT EXISTS pef_payout_accounts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id    UUID NOT NULL,
  rail                 TEXT NOT NULL CHECK (rail IN ('bank','stripe_connect','paypal','wise','crypto')),
  currency             TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  country_code         TEXT NOT NULL DEFAULT 'GB' CHECK (length(country_code) = 2),
  external_account_id  TEXT NOT NULL,
  display_name         TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 200),
  status               TEXT NOT NULL DEFAULT 'pending_verification'
                       CHECK (status IN ('pending_verification','active','disabled')),
  is_default           BOOLEAN NOT NULL DEFAULT false,
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_pef_payout_acct UNIQUE (owner_identity_id, rail, external_account_id)
);
CREATE INDEX IF NOT EXISTS idx_pef_payout_acct_owner ON pef_payout_accounts(owner_identity_id, status);

CREATE TABLE IF NOT EXISTS pef_payouts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id    UUID NOT NULL,
  account_id           UUID NOT NULL REFERENCES pef_payout_accounts(id) ON DELETE RESTRICT,
  amount_minor         INTEGER NOT NULL CHECK (amount_minor > 0),
  fee_minor            INTEGER NOT NULL DEFAULT 0 CHECK (fee_minor >= 0),
  net_amount_minor     INTEGER NOT NULL CHECK (net_amount_minor >= 0),
  currency             TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','processing','paid','failed','cancelled')),
  reference            TEXT NOT NULL UNIQUE,
  initiated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at         TIMESTAMPTZ,
  failure_reason       TEXT,
  external_provider    TEXT,
  external_ref         TEXT,
  retry_count          INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 10),
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chk_pef_payout_net CHECK (net_amount_minor + fee_minor = amount_minor)
);
CREATE INDEX IF NOT EXISTS idx_pef_payouts_owner ON pef_payouts(owner_identity_id, initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pef_payouts_status ON pef_payouts(status, initiated_at);

CREATE TABLE IF NOT EXISTS pef_payout_schedules (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id    UUID NOT NULL UNIQUE,
  cadence              TEXT NOT NULL DEFAULT 'manual'
                       CHECK (cadence IN ('manual','daily','weekly','monthly')),
  min_amount_minor     INTEGER NOT NULL DEFAULT 5000 CHECK (min_amount_minor >= 0),
  default_account_id   UUID REFERENCES pef_payout_accounts(id) ON DELETE SET NULL,
  next_run_at          TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pef_escrows (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_identity_id    UUID NOT NULL,
  payee_identity_id    UUID NOT NULL,
  context_type         TEXT NOT NULL CHECK (context_type IN ('project','gig','service','booking','award')),
  context_id           UUID NOT NULL,
  amount_minor         INTEGER NOT NULL CHECK (amount_minor > 0),
  released_minor       INTEGER NOT NULL DEFAULT 0 CHECK (released_minor >= 0),
  refunded_minor       INTEGER NOT NULL DEFAULT 0 CHECK (refunded_minor >= 0),
  currency             TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  status               TEXT NOT NULL DEFAULT 'held'
                       CHECK (status IN ('held','released','refunded','disputed','partially_released')),
  held_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at          TIMESTAMPTZ,
  refunded_at          TIMESTAMPTZ,
  reference            TEXT NOT NULL UNIQUE,
  external_provider    TEXT,
  external_ref         TEXT,
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chk_pef_escrow_balance CHECK (released_minor + refunded_minor <= amount_minor)
);
CREATE INDEX IF NOT EXISTS idx_pef_escrows_context ON pef_escrows(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_pef_escrows_payee ON pef_escrows(payee_identity_id, status);

CREATE TABLE IF NOT EXISTS pef_holds (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type             TEXT NOT NULL CHECK (subject_type IN ('payout','escrow','invoice','account')),
  subject_id               UUID NOT NULL,
  owner_identity_id        UUID NOT NULL,
  reason_code              TEXT NOT NULL
                           CHECK (reason_code IN ('risk_review','kyc_pending','provider_block','dispute','manual','chargeback_risk','sanctions')),
  reason_detail            TEXT,
  status                   TEXT NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open','released','escalated','converted_to_dispute')),
  amount_minor             INTEGER NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  currency                 TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  opened_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at              TIMESTAMPTZ,
  opened_by_identity_id    UUID,
  resolved_by_identity_id  UUID,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_pef_holds_subject ON pef_holds(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_pef_holds_status ON pef_holds(status, opened_at);

CREATE TABLE IF NOT EXISTS pef_disputes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id               UUID REFERENCES pef_escrows(id) ON DELETE SET NULL,
  payout_id               UUID REFERENCES pef_payouts(id) ON DELETE SET NULL,
  raised_by_identity_id   UUID NOT NULL,
  amount_minor            INTEGER NOT NULL CHECK (amount_minor > 0),
  currency                TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  reason                  TEXT NOT NULL CHECK (length(reason) BETWEEN 1 AND 500),
  status                  TEXT NOT NULL DEFAULT 'opened'
                          CHECK (status IN ('opened','under_review','resolved','rejected')),
  evidence_url            TEXT,
  resolution              TEXT,
  opened_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at             TIMESTAMPTZ,
  meta                    JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chk_pef_dispute_target CHECK (escrow_id IS NOT NULL OR payout_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_pef_disputes_status ON pef_disputes(status, opened_at);

CREATE TABLE IF NOT EXISTS pef_ledger_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id   UUID NOT NULL,
  entry_type          TEXT NOT NULL
                      CHECK (entry_type IN ('credit','debit','reserve','release','refund','fee','adjustment','hold','hold_release')),
  ref_type            TEXT,
  ref_id              UUID,
  amount_minor        INTEGER NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'GBP' CHECK (length(currency) = 3),
  description         TEXT NOT NULL,
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_pef_ledger_owner ON pef_ledger_entries(owner_identity_id, occurred_at DESC);

-- Append-only ledger trigger.
CREATE OR REPLACE FUNCTION pef_ledger_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'pef_ledger_entries is append-only';
END $$;
DROP TRIGGER IF EXISTS trg_pef_ledger_no_update ON pef_ledger_entries;
CREATE TRIGGER trg_pef_ledger_no_update BEFORE UPDATE OR DELETE ON pef_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION pef_ledger_immutable();

CREATE TABLE IF NOT EXISTS pef_reconciliation_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            TEXT NOT NULL,
  period_start        TIMESTAMPTZ NOT NULL,
  period_end          TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','reconciled','partial','failed')),
  matched_count       INTEGER NOT NULL DEFAULT 0 CHECK (matched_count >= 0),
  unmatched_count     INTEGER NOT NULL DEFAULT 0 CHECK (unmatched_count >= 0),
  diff_minor          INTEGER NOT NULL DEFAULT 0,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS pef_webhook_deliveries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            TEXT NOT NULL,
  event_id            TEXT NOT NULL,
  event_type          TEXT NOT NULL,
  signature_valid     BOOLEAN NOT NULL DEFAULT true,
  status              TEXT NOT NULL DEFAULT 'processed'
                      CHECK (status IN ('processed','skipped','failed')),
  payload             JSONB NOT NULL,
  processed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_pef_webhook UNIQUE (provider, event_id)
);

CREATE TABLE IF NOT EXISTS pef_audit_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id  UUID,
  actor_identity_id  UUID,
  actor_role         TEXT,
  action             TEXT NOT NULL,
  target_type        TEXT,
  target_id          UUID,
  diff               JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip                 TEXT,
  user_agent         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pef_audit_owner ON pef_audit_events(owner_identity_id, created_at DESC);

-- ─── Seed: payout account + escrow + payout ─────────────
INSERT INTO pef_payout_accounts (id, owner_identity_id, rail, external_account_id, display_name, status, is_default)
VALUES ('00000000-0000-0000-0000-000000005901'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid,
        'bank', 'GB29NWBK60161331926819', 'NatWest •••• 6819', 'active', true)
ON CONFLICT DO NOTHING;

INSERT INTO pef_escrows (id, payer_identity_id, payee_identity_id, context_type, context_id, amount_minor, currency, status, reference)
VALUES ('00000000-0000-0000-0000-000000005911'::uuid, '00000000-0000-0000-0000-0000000000c1'::uuid,
        '00000000-0000-0000-0000-0000000000e1'::uuid, 'project',
        '00000000-0000-0000-0000-0000000000aa'::uuid, 250_00, 'GBP', 'held', 'ESC-DEMO-0001')
ON CONFLICT DO NOTHING;

INSERT INTO pef_payouts (id, owner_identity_id, account_id, amount_minor, fee_minor, net_amount_minor, currency, status, reference, initiated_at)
VALUES ('00000000-0000-0000-0000-000000005921'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid,
        '00000000-0000-0000-0000-000000005901'::uuid, 100_00, 50, 99_50, 'GBP', 'pending', 'PO-DEMO-0001', now())
ON CONFLICT DO NOTHING;

INSERT INTO pef_payout_schedules (owner_identity_id, cadence, min_amount_minor, default_account_id)
VALUES ('00000000-0000-0000-0000-0000000000e1'::uuid, 'weekly', 50_00, '00000000-0000-0000-0000-000000005901'::uuid)
ON CONFLICT DO NOTHING;
