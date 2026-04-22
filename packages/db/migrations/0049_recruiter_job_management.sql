-- Domain: Recruiter Job Management (Recruiter Pro)
CREATE TABLE IF NOT EXISTS recruiter_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  owner_id uuid NOT NULL,
  job_id uuid,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_template boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rp_tenant_owner_idx ON recruiter_pipelines(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS rp_job_idx ON recruiter_pipelines(job_id);

CREATE TABLE IF NOT EXISTS recruiter_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES recruiter_pipelines(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'review' CHECK (kind IN ('sourced','applied','review','interview','offer','hired','rejected','withdrawn')),
  sla_hours integer NOT NULL DEFAULT 72 CHECK (sla_hours > 0),
  scorecard_id uuid,
  auto_advance boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS rps_pipeline_pos_idx ON recruiter_pipeline_stages(pipeline_id, position);

CREATE TABLE IF NOT EXISTS recruiter_candidate_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES recruiter_pipelines(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES recruiter_pipeline_stages(id) ON DELETE CASCADE,
  candidate_identity_id uuid NOT NULL,
  application_id uuid,
  position integer NOT NULL DEFAULT 0,
  entered_stage_at timestamptz NOT NULL DEFAULT now(),
  assigned_recruiter_id uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_hold','withdrawn','hired','rejected')),
  rating integer NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS rca_unique_idx ON recruiter_candidate_assignments(pipeline_id, candidate_identity_id);
CREATE INDEX IF NOT EXISTS rca_stage_idx ON recruiter_candidate_assignments(stage_id, position);
CREATE INDEX IF NOT EXISTS rca_recruiter_idx ON recruiter_candidate_assignments(assigned_recruiter_id, status);

CREATE TABLE IF NOT EXISTS recruiter_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES recruiter_candidate_assignments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  visibility text NOT NULL DEFAULT 'team' CHECK (visibility IN ('private','team','hiring_manager')),
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rn_assign_idx ON recruiter_notes(assignment_id, created_at);

CREATE TABLE IF NOT EXISTS recruiter_hiring_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES recruiter_candidate_assignments(id) ON DELETE CASCADE,
  decision_maker_id uuid NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('offer','reject','hold','advance')),
  reason text,
  rationale jsonb NOT NULL DEFAULT '{}'::jsonb,
  decided_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rhd_assign_idx ON recruiter_hiring_decisions(assignment_id, decided_at);

CREATE TABLE IF NOT EXISTS recruiter_pipeline_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES recruiter_pipelines(id) ON DELETE CASCADE,
  captured_at timestamptz NOT NULL DEFAULT now(),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS rps_snap_idx ON recruiter_pipeline_snapshots(pipeline_id, captured_at);
