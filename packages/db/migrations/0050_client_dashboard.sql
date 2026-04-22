-- Domain 50 — Client and Buyer Dashboard, Spend, Proposals, and Project Oversight
-- State machines:
--   client_proposals.status: received → shortlisted → accepted|rejected|withdrawn|expired
--   client_oversight_projects.status: planning → active → at_risk|on_hold|completed|cancelled
--   client_spend_ledger.status: pending → cleared|refunded|disputed

CREATE TABLE IF NOT EXISTS client_spend_ledger (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_identity_id   UUID NOT NULL,
  org_id               UUID,
  category             TEXT NOT NULL CHECK (category IN ('gig','service','project','subscription','fee','tax','refund')),
  vendor_identity_id   UUID,
  vendor_name          TEXT,
  reference_type       TEXT,
  reference_id         UUID,
  amount_cents         INTEGER NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'USD',
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','cleared','refunded','disputed')),
  spend_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_spend_client   ON client_spend_ledger(client_identity_id, spend_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_spend_category ON client_spend_ledger(category);

CREATE TABLE IF NOT EXISTS client_proposals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_identity_id   UUID NOT NULL,
  project_id           UUID,
  vendor_identity_id   UUID NOT NULL,
  vendor_name          TEXT,
  title                TEXT NOT NULL,
  summary              TEXT,
  amount_cents         INTEGER NOT NULL DEFAULT 0,
  currency             TEXT NOT NULL DEFAULT 'USD',
  duration_days        INTEGER,
  status               TEXT NOT NULL DEFAULT 'received'
                       CHECK (status IN ('received','shortlisted','accepted','rejected','withdrawn','expired')),
  match_score          NUMERIC(6,3),
  decision_at          TIMESTAMPTZ,
  decision_reason      TEXT,
  expires_at           TIMESTAMPTZ,
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_proposals_client  ON client_proposals(client_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_client_proposals_project ON client_proposals(project_id);

CREATE TABLE IF NOT EXISTS client_oversight_projects (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_identity_id   UUID NOT NULL,
  org_id               UUID,
  title                TEXT NOT NULL,
  vendor_identity_id   UUID,
  vendor_name          TEXT,
  status               TEXT NOT NULL DEFAULT 'planning'
                       CHECK (status IN ('planning','active','at_risk','on_hold','completed','cancelled')),
  health_score         INTEGER NOT NULL DEFAULT 70 CHECK (health_score BETWEEN 0 AND 100),
  budget_cents         INTEGER NOT NULL DEFAULT 0,
  spent_cents          INTEGER NOT NULL DEFAULT 0,
  started_at           TIMESTAMPTZ,
  due_at               TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  last_activity_at     TIMESTAMPTZ,
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_oversight_client ON client_oversight_projects(client_identity_id, status);

CREATE TABLE IF NOT EXISTS client_saved_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_identity_id   UUID NOT NULL,
  item_type            TEXT NOT NULL CHECK (item_type IN ('gig','service','professional','company','project')),
  item_id              UUID NOT NULL,
  label                TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_client_saved ON client_saved_items(client_identity_id, item_type, item_id);

CREATE TABLE IF NOT EXISTS client_approvals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_identity_id   UUID NOT NULL,
  org_id               UUID,
  kind                 TEXT NOT NULL CHECK (kind IN ('proposal','milestone','invoice','change_order','hire')),
  reference_id         UUID NOT NULL,
  title                TEXT NOT NULL,
  amount_cents         INTEGER,
  currency             TEXT DEFAULT 'USD',
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','escalated')),
  requested_by         UUID,
  decided_at           TIMESTAMPTZ,
  decision_note        TEXT,
  due_at               TIMESTAMPTZ,
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_approvals_client ON client_approvals(client_identity_id, status);

CREATE TABLE IF NOT EXISTS client_dashboard_events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_identity_id   UUID NOT NULL,
  actor_identity_id    UUID,
  action               TEXT NOT NULL,
  target_type          TEXT,
  target_id            UUID,
  diff                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip                   TEXT,
  user_agent           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_events_client ON client_dashboard_events(client_identity_id, created_at DESC);

-- Seed: realistic demo fixtures (idempotent via fixed UUIDs)
INSERT INTO client_oversight_projects (id, client_identity_id, title, vendor_name, status, health_score, budget_cents, spent_cents, started_at, due_at)
VALUES
  ('00000000-0000-0000-0000-000000005001'::uuid, '00000000-0000-0000-0000-0000000000c1'::uuid, 'Brand refresh', 'Atlas Studio',     'active',  82, 1500000,  920000, now() - interval '14 days', now() + interval '21 days'),
  ('00000000-0000-0000-0000-000000005002'::uuid, '00000000-0000-0000-0000-0000000000c1'::uuid, 'API integration', 'Northwind Devs', 'at_risk', 48,  900000,  870000, now() - interval '30 days', now() + interval '5 days'),
  ('00000000-0000-0000-0000-000000005003'::uuid, '00000000-0000-0000-0000-0000000000c1'::uuid, 'Investor deck',  'Helios Partners','planning',70,  300000,       0, NULL,                       now() + interval '40 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO client_proposals (id, client_identity_id, vendor_identity_id, vendor_name, title, summary, amount_cents, status, match_score, expires_at)
VALUES
  ('00000000-0000-0000-0000-000000005101'::uuid, '00000000-0000-0000-0000-0000000000c1'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, 'Atlas Studio',    'Phase-2 motion system', 'Adds Lottie + interactive states.', 480000, 'shortlisted', 0.86, now() + interval '7 days'),
  ('00000000-0000-0000-0000-000000005102'::uuid, '00000000-0000-0000-0000-0000000000c1'::uuid, '00000000-0000-0000-0000-0000000000a2'::uuid, 'Northwind Devs',  'Webhook reliability sprint', 'Replays + DLQ + observability.', 320000, 'received',    0.71, now() + interval '10 days'),
  ('00000000-0000-0000-0000-000000005103'::uuid, '00000000-0000-0000-0000-0000000000c1'::uuid, '00000000-0000-0000-0000-0000000000a3'::uuid, 'Helios Partners', 'Investor narrative arc',     'Story + financial model polish.', 250000, 'received',  0.64, now() + interval '14 days')
ON CONFLICT (id) DO NOTHING;
