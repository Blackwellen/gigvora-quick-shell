-- Domain 56 — Resource Planning, Utilization, Capacity & Assignment Dashboards
-- State machines:
--   rpu_resources.status:    active ↔ inactive
--   rpu_projects.status:     active ↔ paused → completed | archived
--   rpu_assignments.status:  draft → proposed → confirmed → active → completed
--                            (any non-terminal → cancelled, confirmed/active → on_hold ↔ active)

CREATE TABLE IF NOT EXISTS rpu_resources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_identity_id       UUID NOT NULL,
  identity_id           UUID,
  full_name             TEXT NOT NULL,
  email                 TEXT NOT NULL,
  role                  TEXT NOT NULL,
  team                  TEXT,
  location              TEXT,
  timezone              TEXT NOT NULL DEFAULT 'UTC',
  cost_rate             NUMERIC(10,2),
  bill_rate             NUMERIC(10,2),
  weekly_capacity_hours INTEGER NOT NULL DEFAULT 40 CHECK (weekly_capacity_hours BETWEEN 0 AND 168),
  skills                JSONB NOT NULL DEFAULT '[]'::jsonb,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  meta                  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_rpu_resources_org_email UNIQUE (org_identity_id, email)
);
CREATE INDEX IF NOT EXISTS idx_rpu_resources_org ON rpu_resources(org_identity_id, status);

CREATE TABLE IF NOT EXISTS rpu_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_identity_id UUID NOT NULL,
  name            TEXT NOT NULL,
  code            TEXT NOT NULL,
  client_name     TEXT,
  start_date      DATE,
  end_date        DATE,
  budget_hours    INTEGER CHECK (budget_hours IS NULL OR budget_hours >= 0),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_rpu_projects_org_code UNIQUE (org_identity_id, code)
);
CREATE INDEX IF NOT EXISTS idx_rpu_projects_org ON rpu_projects(org_identity_id, status);

CREATE TABLE IF NOT EXISTS rpu_assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_identity_id   UUID NOT NULL,
  resource_id       UUID NOT NULL,
  project_id        UUID NOT NULL,
  role              TEXT,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  hours_per_week    NUMERIC(5,2) NOT NULL CHECK (hours_per_week >= 0 AND hours_per_week <= 168),
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','proposed','confirmed','active','on_hold','completed','cancelled')),
  notes             TEXT,
  cancelled_reason  TEXT,
  proposed_at       TIMESTAMPTZ,
  confirmed_at      TIMESTAMPTZ,
  activated_at      TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  created_by        UUID NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_rpu_assignment_dates CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_rpu_assignments_org ON rpu_assignments(org_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_rpu_assignments_resource ON rpu_assignments(resource_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rpu_assignments_project ON rpu_assignments(project_id, status);

CREATE TABLE IF NOT EXISTS rpu_time_off (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_identity_id UUID NOT NULL,
  resource_id     UUID NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'pto' CHECK (kind IN ('pto','sick','holiday','other')),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  hours_per_day   NUMERIC(4,2) NOT NULL DEFAULT 8.00 CHECK (hours_per_day >= 0 AND hours_per_day <= 24),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_rpu_time_off_dates CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_rpu_time_off_resource ON rpu_time_off(resource_id, start_date);

CREATE TABLE IF NOT EXISTS rpu_audit_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_identity_id   UUID NOT NULL,
  actor_identity_id UUID,
  action            TEXT NOT NULL,
  target_type       TEXT,
  target_id         UUID,
  diff              JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip                TEXT,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rpu_audit_org ON rpu_audit_events(org_identity_id, created_at DESC);

-- Seed: org, projects, resources, assignments, time-off
INSERT INTO rpu_resources (id, org_identity_id, full_name, email, role, team, timezone, cost_rate, bill_rate, weekly_capacity_hours, skills) VALUES
  ('00000000-0000-0000-0000-000000005601'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'Priya Patel', 'priya@example.com', 'engineer', 'Platform', 'Europe/London', 65.00, 140.00, 40, '["typescript","postgres","nest"]'::jsonb),
  ('00000000-0000-0000-0000-000000005602'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'Marco Rossi', 'marco@example.com', 'designer', 'Design', 'Europe/Rome', 55.00, 120.00, 40, '["figma","prototyping"]'::jsonb),
  ('00000000-0000-0000-0000-000000005603'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'Aisha Khan', 'aisha@example.com', 'pm', 'Delivery', 'Asia/Karachi', 70.00, 150.00, 40, '["agile","stakeholder-mgmt"]'::jsonb)
ON CONFLICT (org_identity_id, email) DO NOTHING;

INSERT INTO rpu_projects (id, org_identity_id, name, code, client_name, start_date, end_date, budget_hours, status) VALUES
  ('00000000-0000-0000-0000-000000005611'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'Northwind Re-platform', 'NW-RE', 'Northwind Inc.', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '90 days', 800, 'active'),
  ('00000000-0000-0000-0000-000000005612'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'Acme Mobile App',         'AC-MOB', 'Acme Co.',       CURRENT_DATE,                       CURRENT_DATE + INTERVAL '60 days', 400, 'active')
ON CONFLICT (org_identity_id, code) DO NOTHING;

INSERT INTO rpu_assignments (org_identity_id, resource_id, project_id, role, start_date, end_date, hours_per_week, status, created_by, confirmed_at, activated_at) VALUES
  ('00000000-0000-0000-0000-0000000000e1'::uuid, '00000000-0000-0000-0000-000000005601'::uuid, '00000000-0000-0000-0000-000000005611'::uuid, 'tech-lead', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '60 days', 30.00, 'active', '00000000-0000-0000-0000-0000000000m1'::uuid, now(), now()),
  ('00000000-0000-0000-0000-0000000000e1'::uuid, '00000000-0000-0000-0000-000000005602'::uuid, '00000000-0000-0000-0000-000000005611'::uuid, 'lead-design', CURRENT_DATE, CURRENT_DATE + INTERVAL '45 days', 20.00, 'confirmed', '00000000-0000-0000-0000-0000000000m1'::uuid, now(), NULL),
  ('00000000-0000-0000-0000-0000000000e1'::uuid, '00000000-0000-0000-0000-000000005603'::uuid, '00000000-0000-0000-0000-000000005612'::uuid, 'pm', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '60 days', 25.00, 'proposed', '00000000-0000-0000-0000-0000000000m1'::uuid, NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO rpu_time_off (org_identity_id, resource_id, kind, start_date, end_date, hours_per_day, notes) VALUES
  ('00000000-0000-0000-0000-0000000000e1'::uuid, '00000000-0000-0000-0000-000000005602'::uuid, 'pto', CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '24 days', 8.00, 'Family holiday')
ON CONFLICT DO NOTHING;
