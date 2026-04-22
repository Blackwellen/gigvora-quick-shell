-- Domain 22 — Job Application Flow.
-- Owner: apps/api-nest/src/modules/job-application-flow/
-- Source of truth: packages/db/src/schema/job-application-flow.ts

CREATE TABLE IF NOT EXISTS job_applications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id   uuid NOT NULL,
  candidate_id     uuid NOT NULL,
  tenant_id        text NOT NULL,
  source           text NOT NULL DEFAULT 'direct'
                   CHECK (source IN ('direct','referral','search','agency','imported')),
  status           text NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','submitted','screening','advanced','offered','hired','rejected','withdrawn')),
  current_stage    text,
  submitted_at     timestamptz,
  withdrawn_at     timestamptz,
  rejected_reason  text,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS jap_job_candidate_idx   ON job_applications(job_posting_id, candidate_id);
CREATE INDEX        IF NOT EXISTS jap_candidate_idx       ON job_applications(candidate_id, status);
CREATE INDEX        IF NOT EXISTS jap_tenant_status_idx   ON job_applications(tenant_id, status);

CREATE TABLE IF NOT EXISTS job_application_answers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  question_key    text NOT NULL,
  question_label  text NOT NULL,
  answer          jsonb NOT NULL DEFAULT '{}'::jsonb,
  answered_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS jaa_app_question_idx ON job_application_answers(application_id, question_key);

CREATE TABLE IF NOT EXISTS job_application_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('resume','cover_letter','portfolio','transcript','other')),
  storage_key     text NOT NULL,
  filename        text NOT NULL,
  mime_type       text NOT NULL,
  size_bytes      integer NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  uploaded_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jad_app_idx ON job_application_documents(application_id, kind);

CREATE TABLE IF NOT EXISTS job_application_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  kind            text NOT NULL,
  from_stage      text,
  to_stage        text,
  actor           text NOT NULL,
  detail          jsonb NOT NULL DEFAULT '{}'::jsonb,
  at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jae_app_idx ON job_application_events(application_id, at);
