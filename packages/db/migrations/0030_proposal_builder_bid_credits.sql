-- Domain 30 — Proposal Builder & Bid Credits.
-- Owner: apps/api-nest/src/modules/proposal-builder-bid-credits/
-- Source of truth: packages/db/src/schema/proposal-builder-bid-credits.ts

CREATE TABLE IF NOT EXISTS proposals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         text NOT NULL,
  project_id        uuid NOT NULL,
  author_id         uuid NOT NULL,
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','submitted','shortlisted','awarded','declined','withdrawn')),
  cover_letter      text NOT NULL DEFAULT '',
  bid_amount_cents  integer NOT NULL DEFAULT 0 CHECK (bid_amount_cents >= 0),
  currency          text NOT NULL DEFAULT 'USD',
  duration_days     integer NOT NULL DEFAULT 0 CHECK (duration_days >= 0),
  milestones        jsonb NOT NULL DEFAULT '[]'::jsonb,
  credits_held      integer NOT NULL DEFAULT 0 CHECK (credits_held >= 0),
  submitted_at      timestamptz,
  decided_at        timestamptz,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pp_project_status_idx ON proposals(project_id, status);
CREATE INDEX IF NOT EXISTS pp_author_idx         ON proposals(author_id, status);

CREATE TABLE IF NOT EXISTS proposal_attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  file_key     text NOT NULL,
  file_name    text NOT NULL,
  mime_type    text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes   integer NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pa_proposal_idx ON proposal_attachments(proposal_id);

CREATE TABLE IF NOT EXISTS proposal_revisions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version      integer NOT NULL CHECK (version > 0),
  snapshot     jsonb NOT NULL DEFAULT '{}'::jsonb,
  author_id    uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pr_prop_version_idx ON proposal_revisions(proposal_id, version);

CREATE TABLE IF NOT EXISTS bid_credit_wallets (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id             uuid NOT NULL,
  tenant_id            text NOT NULL,
  balance              integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  held                 integer NOT NULL DEFAULT 0 CHECK (held >= 0),
  lifetime_purchased   integer NOT NULL DEFAULT 0 CHECK (lifetime_purchased >= 0),
  lifetime_consumed    integer NOT NULL DEFAULT 0 CHECK (lifetime_consumed >= 0),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS bcw_owner_idx ON bid_credit_wallets(owner_id, tenant_id);

CREATE TABLE IF NOT EXISTS bid_credit_ledger (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       uuid NOT NULL REFERENCES bid_credit_wallets(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('purchase','hold','release','consume','refund','adjust')),
  amount          integer NOT NULL,
  balance_after   integer NOT NULL CHECK (balance_after >= 0),
  held_after      integer NOT NULL CHECK (held_after >= 0),
  proposal_id     uuid,
  reference       text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bcl_wallet_idx   ON bid_credit_ledger(wallet_id, created_at);
CREATE INDEX IF NOT EXISTS bcl_proposal_idx ON bid_credit_ledger(proposal_id);

CREATE TABLE IF NOT EXISTS bid_credit_purchases (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id         uuid NOT NULL REFERENCES bid_credit_wallets(id) ON DELETE CASCADE,
  pack_id           text NOT NULL,
  credits           integer NOT NULL CHECK (credits > 0),
  amount_cents      integer NOT NULL CHECK (amount_cents >= 0),
  currency          text NOT NULL DEFAULT 'USD',
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed','refunded')),
  idempotency_key   text NOT NULL,
  confirmed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS bcp_idemp_idx ON bid_credit_purchases(idempotency_key);
