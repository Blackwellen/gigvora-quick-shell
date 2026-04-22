-- Domain 20 — Enterprise Hiring Workspace.
-- Owner: apps/api-nest/src/modules/enterprise-hiring-workspace/
-- Source of truth: packages/db/src/schema/enterprise-hiring-workspace.ts

CREATE TABLE IF NOT EXISTS hiring_workspaces (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            text NOT NULL,
  name                 text NOT NULL,
  slug                 text NOT NULL,
  owner_id             uuid NOT NULL,
  status               text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  default_pipeline_id  uuid,
  settings             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS hw_tenant_slug_idx ON hiring_workspaces(tenant_id, slug);

CREATE TABLE IF NOT EXISTS hiring_workspace_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES hiring_workspaces(id) ON DELETE CASCADE,
  member_id     uuid NOT NULL,
  role          text NOT NULL DEFAULT 'recruiter'
                CHECK (role IN ('owner','admin','recruiter','hiring_manager','interviewer','viewer')),
  joined_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS hw_member_unique_idx ON hiring_workspace_members(workspace_id, member_id);
CREATE INDEX        IF NOT EXISTS hw_member_idx        ON hiring_workspace_members(member_id);

CREATE TABLE IF NOT EXISTS hiring_pipelines (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES hiring_workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  is_default    boolean NOT NULL DEFAULT false,
  stages        jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hp_workspace_idx ON hiring_pipelines(workspace_id);

CREATE TABLE IF NOT EXISTS hiring_approval_policies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES hiring_workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  scope         text NOT NULL CHECK (scope IN ('requisition','offer','budget')),
  rules         jsonb NOT NULL DEFAULT '[]'::jsonb,
  active        boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS hap_workspace_idx ON hiring_approval_policies(workspace_id, scope);

CREATE TABLE IF NOT EXISTS hiring_metrics (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           uuid NOT NULL REFERENCES hiring_workspaces(id) ON DELETE CASCADE,
  week_start             timestamptz NOT NULL,
  open_reqs              integer NOT NULL DEFAULT 0 CHECK (open_reqs >= 0),
  new_apps               integer NOT NULL DEFAULT 0 CHECK (new_apps >= 0),
  hires                  integer NOT NULL DEFAULT 0 CHECK (hires >= 0),
  avg_time_to_hire_days  integer NOT NULL DEFAULT 0 CHECK (avg_time_to_hire_days >= 0),
  funnel_snapshot        jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS hm_workspace_week_idx ON hiring_metrics(workspace_id, week_start);
