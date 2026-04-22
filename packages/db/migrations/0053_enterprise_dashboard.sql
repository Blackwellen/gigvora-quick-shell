-- Domain 53 — Enterprise & Company Dashboard, Hiring, Procurement, Team Operations
-- State machines:
--   ed_requisitions.status:    draft → open → on_hold|filled|cancelled
--   ed_purchase_orders.status: draft → submitted → approved|rejected → received|cancelled
--   ed_team_tasks.status:      todo ↔ in_progress → blocked|done

CREATE TABLE IF NOT EXISTS ed_requisitions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_identity_id   UUID NOT NULL,
  title                    TEXT NOT NULL,
  department               TEXT,
  location                 TEXT,
  seniority                TEXT NOT NULL DEFAULT 'mid',
  headcount                INTEGER NOT NULL DEFAULT 1 CHECK (headcount >= 1),
  status                   TEXT NOT NULL DEFAULT 'open'
                           CHECK (status IN ('draft','open','on_hold','filled','cancelled')),
  budget_cents             INTEGER NOT NULL DEFAULT 0,
  applicants               INTEGER NOT NULL DEFAULT 0,
  owner_identity_id        UUID,
  opened_on                DATE,
  target_fill_by           DATE,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ed_req_ent ON ed_requisitions(enterprise_identity_id, status);

CREATE TABLE IF NOT EXISTS ed_purchase_orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_identity_id   UUID NOT NULL,
  po_number                TEXT NOT NULL,
  vendor_name              TEXT NOT NULL,
  vendor_identity_id       UUID,
  category                 TEXT,
  status                   TEXT NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft','submitted','approved','rejected','received','cancelled')),
  amount_cents             INTEGER NOT NULL DEFAULT 0,
  currency                 TEXT NOT NULL DEFAULT 'USD',
  requester_identity_id    UUID,
  approver_identity_id     UUID,
  submitted_at             TIMESTAMPTZ,
  decided_at               TIMESTAMPTZ,
  received_on              DATE,
  notes                    TEXT,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ed_po_ent ON ed_purchase_orders(enterprise_identity_id, status);

CREATE TABLE IF NOT EXISTS ed_team_members (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_identity_id   UUID NOT NULL,
  member_identity_id       UUID NOT NULL,
  full_name                TEXT NOT NULL,
  role                     TEXT,
  department               TEXT,
  manager_identity_id      UUID,
  status                   TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','onboarding','offboarding','inactive')),
  started_on               DATE,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_ed_member_ent ON ed_team_members(enterprise_identity_id, status);

CREATE TABLE IF NOT EXISTS ed_team_tasks (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_identity_id   UUID NOT NULL,
  title                    TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'todo'
                           CHECK (status IN ('todo','in_progress','blocked','done')),
  priority                 TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  category                 TEXT,
  assignee_identity_id     UUID,
  due_at                   TIMESTAMPTZ,
  blocked_reason           TEXT,
  completed_at             TIMESTAMPTZ,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ed_task_ent ON ed_team_tasks(enterprise_identity_id, status);

CREATE TABLE IF NOT EXISTS ed_spend_ledger (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_identity_id   UUID NOT NULL,
  occurred_on              DATE NOT NULL,
  category                 TEXT NOT NULL,
  amount_cents             INTEGER NOT NULL DEFAULT 0,
  currency                 TEXT NOT NULL DEFAULT 'USD',
  vendor_name              TEXT,
  ref_type                 TEXT,
  ref_id                   UUID,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_ed_spend_ent ON ed_spend_ledger(enterprise_identity_id, occurred_on);

CREATE TABLE IF NOT EXISTS ed_events (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_identity_id   UUID NOT NULL,
  actor_identity_id        UUID,
  action                   TEXT NOT NULL,
  target_type              TEXT,
  target_id                UUID,
  diff                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ed_events_ent ON ed_events(enterprise_identity_id, created_at DESC);

-- Seed demo fixtures
INSERT INTO ed_requisitions (id, enterprise_identity_id, title, department, location, seniority, headcount, status, budget_cents, applicants, opened_on, target_fill_by)
VALUES
  ('00000000-0000-0000-0000-000000005301'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'Senior Backend Engineer', 'Engineering', 'Remote', 'senior', 2, 'open',     18000000, 47, current_date - 12, current_date + 45),
  ('00000000-0000-0000-0000-000000005302'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'Product Designer',        'Design',      'London', 'mid',    1, 'on_hold',  10000000, 22, current_date - 30, current_date + 15),
  ('00000000-0000-0000-0000-000000005303'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'Finance Analyst',         'Finance',     'NYC',    'mid',    1, 'open',      9500000, 18, current_date - 5,  current_date + 60)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ed_purchase_orders (id, enterprise_identity_id, po_number, vendor_name, category, status, amount_cents, requester_identity_id, submitted_at)
VALUES
  ('00000000-0000-0000-0000-000000005401'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'PO-2025-0001', 'Atlassian',     'software', 'submitted', 1200000, '00000000-0000-0000-0000-0000000000r1'::uuid, now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000005402'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'PO-2025-0002', 'Dell',          'hardware', 'approved',   850000, '00000000-0000-0000-0000-0000000000r1'::uuid, now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000005403'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'PO-2025-0003', 'Acme Consulting','services', 'draft',     2500000, '00000000-0000-0000-0000-0000000000r1'::uuid, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ed_team_members (enterprise_identity_id, member_identity_id, full_name, role, department, status, started_on)
VALUES
  ('00000000-0000-0000-0000-0000000000e1'::uuid, '00000000-0000-0000-0000-0000000000m1'::uuid, 'Priya Patel',   'Engineering Manager', 'Engineering', 'active',     current_date - 400),
  ('00000000-0000-0000-0000-0000000000e1'::uuid, '00000000-0000-0000-0000-0000000000m2'::uuid, 'Marco Rossi',   'Senior Engineer',     'Engineering', 'active',     current_date - 250),
  ('00000000-0000-0000-0000-0000000000e1'::uuid, '00000000-0000-0000-0000-0000000000m3'::uuid, 'Yuki Tanaka',   'Designer',            'Design',      'onboarding', current_date - 4)
ON CONFLICT DO NOTHING;

INSERT INTO ed_team_tasks (id, enterprise_identity_id, title, status, priority, category, due_at)
VALUES
  ('00000000-0000-0000-0000-000000005501'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'Approve Q2 procurement plan', 'in_progress', 'high',   'procurement', now() + interval '2 days'),
  ('00000000-0000-0000-0000-000000005502'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'Onboard new designer',        'todo',        'normal', 'ops',         now() + interval '5 days'),
  ('00000000-0000-0000-0000-000000005503'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'GDPR DPA renewal',            'blocked',     'urgent', 'compliance',  now() + interval '1 day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ed_spend_ledger (enterprise_identity_id, occurred_on, category, amount_cents, vendor_name)
VALUES
  ('00000000-0000-0000-0000-0000000000e1'::uuid, current_date - 14, 'software',   1200000, 'Atlassian'),
  ('00000000-0000-0000-0000-0000000000e1'::uuid, current_date - 10, 'hardware',    850000, 'Dell'),
  ('00000000-0000-0000-0000-0000000000e1'::uuid, current_date -  3, 'services',   2500000, 'Acme Consulting'),
  ('00000000-0000-0000-0000-0000000000e1'::uuid, current_date -  1, 'payroll',   18000000, NULL)
ON CONFLICT DO NOTHING;
