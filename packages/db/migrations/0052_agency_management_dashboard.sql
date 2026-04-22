-- Domain 52 — Agency Management Dashboard, Delivery Ops, Utilization, Client Portfolio
-- State machines:
--   amd_engagements.status:  draft → active → at_risk|on_hold|completed|cancelled
--   amd_deliverables.status: todo → in_progress → review → done|blocked
--   amd_invoices.status:     draft → sent → paid|overdue|written_off

CREATE TABLE IF NOT EXISTS amd_engagements (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_identity_id       UUID NOT NULL,
  client_identity_id       UUID NOT NULL,
  client_name              TEXT NOT NULL,
  name                     TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('draft','active','at_risk','on_hold','completed','cancelled')),
  health_score             INTEGER NOT NULL DEFAULT 75 CHECK (health_score BETWEEN 0 AND 100),
  budget_cents             INTEGER NOT NULL DEFAULT 0,
  spent_cents              INTEGER NOT NULL DEFAULT 0,
  starts_on                DATE,
  ends_on                  DATE,
  owner_identity_id        UUID,
  tags                     JSONB NOT NULL DEFAULT '[]'::jsonb,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amd_eng_agency ON amd_engagements(agency_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_amd_eng_client ON amd_engagements(client_identity_id);

CREATE TABLE IF NOT EXISTS amd_deliverables (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_identity_id       UUID NOT NULL,
  engagement_id            UUID NOT NULL,
  title                    TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'todo'
                           CHECK (status IN ('todo','in_progress','review','done','blocked')),
  priority                 TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assignee_identity_id     UUID,
  due_at                   TIMESTAMPTZ,
  blocked_reason           TEXT,
  completed_at             TIMESTAMPTZ,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amd_deliv_agency ON amd_deliverables(agency_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_amd_deliv_eng    ON amd_deliverables(engagement_id);

CREATE TABLE IF NOT EXISTS amd_utilization (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_identity_id       UUID NOT NULL,
  member_identity_id       UUID NOT NULL,
  member_name              TEXT NOT NULL,
  role                     TEXT,
  captured_on              DATE NOT NULL,
  capacity_hours           NUMERIC(6,2) NOT NULL DEFAULT 40,
  billable_hours           NUMERIC(6,2) NOT NULL DEFAULT 0,
  non_billable_hours       NUMERIC(6,2) NOT NULL DEFAULT 0,
  utilization_rate         NUMERIC(5,4) NOT NULL DEFAULT 0,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_amd_util_agency ON amd_utilization(agency_identity_id, captured_on);
CREATE INDEX IF NOT EXISTS idx_amd_util_member ON amd_utilization(member_identity_id, captured_on);

CREATE TABLE IF NOT EXISTS amd_invoices (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_identity_id       UUID NOT NULL,
  engagement_id            UUID,
  client_identity_id       UUID NOT NULL,
  number                   TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft','sent','paid','overdue','written_off')),
  amount_cents             INTEGER NOT NULL DEFAULT 0,
  currency                 TEXT NOT NULL DEFAULT 'USD',
  issued_on                DATE,
  due_on                   DATE,
  paid_on                  DATE,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amd_inv_agency ON amd_invoices(agency_identity_id, status);

CREATE TABLE IF NOT EXISTS amd_events (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_identity_id       UUID NOT NULL,
  actor_identity_id        UUID,
  action                   TEXT NOT NULL,
  target_type              TEXT,
  target_id                UUID,
  diff                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amd_events_agency ON amd_events(agency_identity_id, created_at DESC);

-- Seed: realistic demo fixtures
INSERT INTO amd_engagements (id, agency_identity_id, client_identity_id, client_name, name, status, health_score, budget_cents, spent_cents, starts_on, ends_on)
VALUES
  ('00000000-0000-0000-0000-000000005201'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-0000000000c1'::uuid, 'Acme Corp',     'Brand Refresh Q1', 'active',  82, 5000000, 2400000, current_date - 40, current_date + 50),
  ('00000000-0000-0000-0000-000000005202'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-0000000000c2'::uuid, 'Globex Inc',    'Website Build',     'at_risk', 54, 3500000, 3100000, current_date - 60, current_date + 10),
  ('00000000-0000-0000-0000-000000005203'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-0000000000c3'::uuid, 'Initech',       'SEO Retainer',      'active',  88,  900000,  450000, current_date - 30, current_date + 60)
ON CONFLICT (id) DO NOTHING;

INSERT INTO amd_deliverables (id, agency_identity_id, engagement_id, title, status, priority, due_at)
VALUES
  ('00000000-0000-0000-0000-000000005301'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-000000005201'::uuid, 'Logo concepts v2',     'in_progress', 'high',   now() + interval '3 days'),
  ('00000000-0000-0000-0000-000000005302'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-000000005202'::uuid, 'Homepage handoff',     'review',      'urgent', now() + interval '1 day'),
  ('00000000-0000-0000-0000-000000005303'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-000000005203'::uuid, 'Monthly SEO report',   'todo',        'normal', now() + interval '7 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO amd_utilization (agency_identity_id, member_identity_id, member_name, role, captured_on, capacity_hours, billable_hours, non_billable_hours, utilization_rate)
VALUES
  ('00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-0000000000m1'::uuid, 'Alex Designer',  'Design',  current_date - 7, 40, 32, 4, 0.8000),
  ('00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-0000000000m2'::uuid, 'Sam Engineer',   'Eng',     current_date - 7, 40, 36, 2, 0.9000),
  ('00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-0000000000m3'::uuid, 'Jess PM',        'PM',      current_date - 7, 40, 22, 12, 0.5500)
ON CONFLICT DO NOTHING;

INSERT INTO amd_invoices (id, agency_identity_id, engagement_id, client_identity_id, number, status, amount_cents, issued_on, due_on)
VALUES
  ('00000000-0000-0000-0000-000000005401'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-000000005201'::uuid, '00000000-0000-0000-0000-0000000000c1'::uuid, 'INV-2025-0001', 'paid',    1200000, current_date - 30, current_date - 15),
  ('00000000-0000-0000-0000-000000005402'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-000000005202'::uuid, '00000000-0000-0000-0000-0000000000c2'::uuid, 'INV-2025-0002', 'overdue',  900000, current_date - 45, current_date - 15),
  ('00000000-0000-0000-0000-000000005403'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-000000005203'::uuid, '00000000-0000-0000-0000-0000000000c3'::uuid, 'INV-2025-0003', 'sent',     450000, current_date - 5,  current_date + 10)
ON CONFLICT (id) DO NOTHING;
