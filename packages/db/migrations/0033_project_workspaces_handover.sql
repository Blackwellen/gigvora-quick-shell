-- Domain 33 — Project Workspaces & Handover.
-- Owner: apps/api-nest/src/modules/project-workspaces-handover/
-- Source of truth: packages/db/src/schema/project-workspaces-handover.ts

CREATE TABLE IF NOT EXISTS project_workspaces (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     text NOT NULL,
  project_id    uuid NOT NULL,
  contract_id   uuid NOT NULL,
  buyer_id      uuid NOT NULL,
  provider_id   uuid NOT NULL,
  title         text NOT NULL,
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','paused','handover','completed','cancelled')),
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pw_contract_idx ON project_workspaces(contract_id);
CREATE INDEX        IF NOT EXISTS pw_project_idx  ON project_workspaces(project_id);

CREATE TABLE IF NOT EXISTS project_milestones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES project_workspaces(id) ON DELETE CASCADE,
  ordering      integer NOT NULL CHECK (ordering > 0),
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  amount_cents  integer NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency      text NOT NULL DEFAULT 'USD',
  due_at        timestamptz,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','in_progress','submitted','approved','rejected','released')),
  submitted_at  timestamptz,
  approved_at   timestamptz,
  released_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pms_workspace_order_idx  ON project_milestones(workspace_id, ordering);
CREATE INDEX        IF NOT EXISTS pms_workspace_status_idx ON project_milestones(workspace_id, status);

CREATE TABLE IF NOT EXISTS project_deliverables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES project_workspaces(id) ON DELETE CASCADE,
  milestone_id  uuid REFERENCES project_milestones(id) ON DELETE SET NULL,
  uploader_id   uuid NOT NULL,
  file_key      text NOT NULL,
  file_name     text NOT NULL,
  mime_type     text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes    integer NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  status        text NOT NULL DEFAULT 'submitted'
                CHECK (status IN ('submitted','accepted','rejected','revised')),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pd_workspace_idx ON project_deliverables(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS pd_milestone_idx ON project_deliverables(milestone_id);

CREATE TABLE IF NOT EXISTS project_handover_checklists (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES project_workspaces(id) ON DELETE CASCADE,
  ordering      integer NOT NULL CHECK (ordering > 0),
  label         text NOT NULL,
  required      boolean NOT NULL DEFAULT true,
  done          boolean NOT NULL DEFAULT false,
  done_by       uuid,
  done_at       timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS phc_workspace_order_idx ON project_handover_checklists(workspace_id, ordering);

CREATE TABLE IF NOT EXISTS project_final_reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES project_workspaces(id) ON DELETE CASCADE,
  author_id        uuid NOT NULL,
  summary          text NOT NULL DEFAULT '',
  outcomes         jsonb NOT NULL DEFAULT '[]'::jsonb,
  ratings          jsonb NOT NULL DEFAULT '{}'::jsonb,
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','acknowledged')),
  submitted_at     timestamptz,
  acknowledged_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pfr_workspace_idx ON project_final_reports(workspace_id);

CREATE TABLE IF NOT EXISTS project_workspace_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES project_workspaces(id) ON DELETE CASCADE,
  actor_id      uuid,
  event         text NOT NULL,
  detail        jsonb NOT NULL DEFAULT '{}'::jsonb,
  at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pwe_workspace_idx ON project_workspace_events(workspace_id, at);
