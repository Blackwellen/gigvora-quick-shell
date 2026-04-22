-- Domain 32 — Project Posting Studio, Smart Match & Invite Flows.
-- Owner: apps/api-nest/src/modules/project-posting-smart-match/
-- Source of truth: packages/db/src/schema/project-posting-smart-match.ts

CREATE TABLE IF NOT EXISTS projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         text NOT NULL,
  owner_id          uuid NOT NULL,
  title             text NOT NULL,
  slug              text NOT NULL,
  summary           text NOT NULL DEFAULT '',
  description       text NOT NULL DEFAULT '',
  category          text,
  skills            jsonb NOT NULL DEFAULT '[]'::jsonb,
  budget_type       text NOT NULL DEFAULT 'fixed' CHECK (budget_type IN ('fixed','hourly','range')),
  budget_min_cents  integer NOT NULL DEFAULT 0 CHECK (budget_min_cents >= 0),
  budget_max_cents  integer NOT NULL DEFAULT 0 CHECK (budget_max_cents >= 0),
  currency          text NOT NULL DEFAULT 'USD',
  duration_days     integer NOT NULL DEFAULT 0 CHECK (duration_days >= 0),
  work_mode         text NOT NULL DEFAULT 'remote' CHECK (work_mode IN ('remote','hybrid','onsite')),
  location          text,
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','pending_approval','published','paused','closed','archived')),
  visibility        text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','invite_only','private')),
  approval_state    text NOT NULL DEFAULT 'none' CHECK (approval_state IN ('none','requested','approved','rejected')),
  published_at      timestamptz,
  closed_at         timestamptz,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (budget_max_cents = 0 OR budget_max_cents >= budget_min_cents)
);
CREATE UNIQUE INDEX IF NOT EXISTS pj_tenant_slug_idx   ON projects(tenant_id, slug);
CREATE INDEX        IF NOT EXISTS pj_tenant_status_idx ON projects(tenant_id, status);

CREATE TABLE IF NOT EXISTS project_approvals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step         integer NOT NULL CHECK (step > 0),
  approver_id  uuid NOT NULL,
  decision     text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending','approved','rejected')),
  rationale    text,
  decided_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pja_project_step_idx ON project_approvals(project_id, step);

CREATE TABLE IF NOT EXISTS project_match_runs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  model_version       text NOT NULL DEFAULT 'fallback-v1',
  diversify_enabled   boolean NOT NULL DEFAULT true,
  candidate_count     integer NOT NULL DEFAULT 0 CHECK (candidate_count >= 0),
  ran_at              timestamptz NOT NULL DEFAULT now(),
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS pmr_project_idx ON project_match_runs(project_id, ran_at);

CREATE TABLE IF NOT EXISTS project_match_candidates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        uuid NOT NULL REFERENCES project_match_runs(id) ON DELETE CASCADE,
  candidate_id  uuid NOT NULL,
  score         integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 1000),
  rank          integer NOT NULL DEFAULT 0 CHECK (rank >= 0),
  reasons       jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS pmc_run_rank_idx ON project_match_candidates(run_id, rank);

CREATE TABLE IF NOT EXISTS project_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inviter_id    uuid NOT NULL,
  candidate_id  uuid NOT NULL,
  status        text NOT NULL DEFAULT 'sent'
                CHECK (status IN ('sent','viewed','accepted','declined','expired','withdrawn')),
  message       text,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  responded_at  timestamptz,
  expires_at    timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS pin_project_candidate_idx ON project_invites(project_id, candidate_id);
CREATE INDEX        IF NOT EXISTS pin_candidate_idx         ON project_invites(candidate_id, status);

CREATE TABLE IF NOT EXISTS project_boost_wallets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid NOT NULL,
  tenant_id           text NOT NULL,
  balance             integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_purchased  integer NOT NULL DEFAULT 0 CHECK (lifetime_purchased >= 0),
  lifetime_consumed   integer NOT NULL DEFAULT 0 CHECK (lifetime_consumed >= 0),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pbw_owner_idx ON project_boost_wallets(owner_id, tenant_id);

CREATE TABLE IF NOT EXISTS project_boost_ledger (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id      uuid NOT NULL REFERENCES project_boost_wallets(id) ON DELETE CASCADE,
  type           text NOT NULL CHECK (type IN ('purchase','consume','refund','adjust')),
  amount         integer NOT NULL,
  balance_after  integer NOT NULL CHECK (balance_after >= 0),
  project_id     uuid,
  reference      text,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pbl_wallet_idx ON project_boost_ledger(wallet_id, created_at);

CREATE TABLE IF NOT EXISTS project_boost_purchases (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id         uuid NOT NULL REFERENCES project_boost_wallets(id) ON DELETE CASCADE,
  pack_id           text NOT NULL,
  credits           integer NOT NULL CHECK (credits > 0),
  amount_cents      integer NOT NULL CHECK (amount_cents >= 0),
  currency          text NOT NULL DEFAULT 'USD',
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed','refunded')),
  idempotency_key   text NOT NULL,
  confirmed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pbp_idemp_idx ON project_boost_purchases(idempotency_key);

CREATE TABLE IF NOT EXISTS project_outbound_webhooks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     text NOT NULL,
  event         text NOT NULL,
  target_url    text NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  status        text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','dead')),
  attempts      integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error    text,
  delivered_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pow_status_idx ON project_outbound_webhooks(status, created_at);
CREATE INDEX IF NOT EXISTS pow_event_idx  ON project_outbound_webhooks(tenant_id, event);
