-- Domain 51 — Recruiter Dashboard, Pipelines, Response Rates, and Hiring Velocity
-- State machines:
--   recruiter_dashboard_pipelines.status: draft → active → paused → archived
--   recruiter_dashboard_outreach.status: queued → sent → opened → replied → bounced|unsubscribed
--   recruiter_dashboard_tasks.status: open → in_progress → done|snoozed|dismissed

CREATE TABLE IF NOT EXISTS recruiter_dashboard_pipelines (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_identity_id    UUID NOT NULL,
  org_id                   UUID,
  job_id                   UUID,
  name                     TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('draft','active','paused','archived')),
  total_candidates         INTEGER NOT NULL DEFAULT 0,
  active_candidates        INTEGER NOT NULL DEFAULT 0,
  hired_count              INTEGER NOT NULL DEFAULT 0,
  rejected_count           INTEGER NOT NULL DEFAULT 0,
  withdrawn_count          INTEGER NOT NULL DEFAULT 0,
  stage_counts             JSONB NOT NULL DEFAULT '{}'::jsonb,
  average_days_to_fill     NUMERIC(6,2),
  last_activity_at         TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rd_pipelines_recruiter ON recruiter_dashboard_pipelines(recruiter_identity_id, status);

CREATE TABLE IF NOT EXISTS recruiter_dashboard_outreach (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_identity_id    UUID NOT NULL,
  pipeline_id              UUID,
  candidate_identity_id    UUID NOT NULL,
  channel                  TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email','inmail','sms','call')),
  subject                  TEXT,
  status                   TEXT NOT NULL DEFAULT 'queued'
                           CHECK (status IN ('queued','sent','opened','replied','bounced','unsubscribed')),
  sent_at                  TIMESTAMPTZ,
  opened_at                TIMESTAMPTZ,
  replied_at               TIMESTAMPTZ,
  response_time_hours      NUMERIC(8,2),
  template_id              UUID,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rd_outreach_recruiter ON recruiter_dashboard_outreach(recruiter_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_rd_outreach_pipeline  ON recruiter_dashboard_outreach(pipeline_id);

CREATE TABLE IF NOT EXISTS recruiter_dashboard_velocity (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_identity_id    UUID NOT NULL,
  pipeline_id              UUID,
  captured_on              DATE NOT NULL,
  days_to_first_response   NUMERIC(6,2),
  days_to_shortlist        NUMERIC(6,2),
  days_to_offer            NUMERIC(6,2),
  days_to_hire             NUMERIC(6,2),
  response_rate            NUMERIC(5,4),
  conversion_rate          NUMERIC(5,4),
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rd_velocity ON recruiter_dashboard_velocity(recruiter_identity_id, pipeline_id, captured_on);

CREATE TABLE IF NOT EXISTS recruiter_dashboard_tasks (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_identity_id    UUID NOT NULL,
  pipeline_id              UUID,
  candidate_identity_id    UUID,
  kind                     TEXT NOT NULL CHECK (kind IN ('followup','review','interview','offer','reference','admin')),
  title                    TEXT NOT NULL,
  priority                 TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status                   TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','snoozed','dismissed')),
  due_at                   TIMESTAMPTZ,
  snoozed_until            TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rd_tasks_recruiter ON recruiter_dashboard_tasks(recruiter_identity_id, status);

CREATE TABLE IF NOT EXISTS recruiter_dashboard_events (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_identity_id    UUID NOT NULL,
  actor_identity_id        UUID,
  action                   TEXT NOT NULL,
  target_type              TEXT,
  target_id                UUID,
  diff                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rd_events_recruiter ON recruiter_dashboard_events(recruiter_identity_id, created_at DESC);

-- Seed: realistic demo fixtures (idempotent via fixed UUIDs)
INSERT INTO recruiter_dashboard_pipelines (id, recruiter_identity_id, name, status, total_candidates, active_candidates, hired_count, rejected_count, stage_counts, average_days_to_fill, last_activity_at)
VALUES
  ('00000000-0000-0000-0000-000000005101'::uuid, '00000000-0000-0000-0000-0000000000d1'::uuid, 'Senior Frontend Engineer',  'active', 48, 22, 3, 18, '{"sourced":12,"screen":6,"interview":3,"offer":1}'::jsonb, 28.4, now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000005102'::uuid, '00000000-0000-0000-0000-0000000000d1'::uuid, 'Staff Backend Engineer',    'active', 31, 14, 1, 12, '{"sourced":8,"screen":4,"interview":2}'::jsonb, 35.0, now() - interval '6 hours'),
  ('00000000-0000-0000-0000-000000005103'::uuid, '00000000-0000-0000-0000-0000000000d1'::uuid, 'Head of Design',            'paused', 14,  3, 0,  9, '{"sourced":2,"screen":1}'::jsonb, NULL,  now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO recruiter_dashboard_tasks (id, recruiter_identity_id, pipeline_id, kind, title, priority, status, due_at)
VALUES
  ('00000000-0000-0000-0000-000000005201'::uuid, '00000000-0000-0000-0000-0000000000d1'::uuid, '00000000-0000-0000-0000-000000005101'::uuid, 'followup',  'Chase 3 stalled candidates',     'high',   'open', now() + interval '1 day'),
  ('00000000-0000-0000-0000-000000005202'::uuid, '00000000-0000-0000-0000-0000000000d1'::uuid, '00000000-0000-0000-0000-000000005101'::uuid, 'interview', 'Confirm panel for tech round',    'urgent', 'open', now() + interval '8 hours'),
  ('00000000-0000-0000-0000-000000005203'::uuid, '00000000-0000-0000-0000-0000000000d1'::uuid, '00000000-0000-0000-0000-000000005102'::uuid, 'review',    'Review 5 inbound applications',  'normal', 'open', now() + interval '2 days')
ON CONFLICT (id) DO NOTHING;
