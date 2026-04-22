-- Domain 23 — Job Posting Studio.
-- Owner: apps/api-nest/src/modules/job-posting-studio/
-- Source of truth: packages/db/src/schema/job-posting-studio.ts

CREATE TABLE IF NOT EXISTS job_postings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL,
  tenant_id             text NOT NULL,
  author_id             uuid NOT NULL,
  title                 text NOT NULL,
  slug                  text NOT NULL,
  status                text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','review','scheduled','published','paused','archived')),
  employment_type       text NOT NULL DEFAULT 'full_time'
                        CHECK (employment_type IN ('full_time','part_time','contract','temporary','internship','apprenticeship')),
  work_mode             text NOT NULL DEFAULT 'hybrid' CHECK (work_mode IN ('remote','hybrid','onsite')),
  location_city         text,
  location_country      text,
  salary_min            integer CHECK (salary_min IS NULL OR salary_min >= 0),
  salary_max            integer CHECK (salary_max IS NULL OR salary_max >= 0),
  salary_currency       text NOT NULL DEFAULT 'GBP',
  description           text NOT NULL DEFAULT '',
  responsibilities      jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements          jsonb NOT NULL DEFAULT '[]'::jsonb,
  perks                 jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at          timestamptz,
  scheduled_publish_at  timestamptz,
  expires_at            timestamptz,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min),
  CHECK (expires_at IS NULL OR published_at IS NULL OR expires_at > published_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS jps_tenant_slug_idx     ON job_postings(tenant_id, slug);
CREATE INDEX        IF NOT EXISTS jps_workspace_status_idx ON job_postings(workspace_id, status);

CREATE TABLE IF NOT EXISTS job_posting_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id   uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  version      integer NOT NULL CHECK (version > 0),
  author_id    uuid NOT NULL,
  diff         jsonb NOT NULL DEFAULT '{}'::jsonb,
  snapshot     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS jpv_posting_version_idx ON job_posting_versions(posting_id, version);

CREATE TABLE IF NOT EXISTS job_posting_distributions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id    uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  channel       text NOT NULL
                CHECK (channel IN ('gigvora','linkedin','indeed','wellfound','careers_site','x','partner_api')),
  external_id   text,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','live','failed','expired','removed')),
  published_at  timestamptz,
  removed_at    timestamptz,
  cost          integer NOT NULL DEFAULT 0 CHECK (cost >= 0),
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS jpd_posting_channel_idx ON job_posting_distributions(posting_id, channel);

CREATE TABLE IF NOT EXISTS job_posting_suggestions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id     uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  kind           text NOT NULL CHECK (kind IN ('rewrite','bias_check','seo','inclusivity','salary_benchmark')),
  model_version  text NOT NULL DEFAULT 'jps.suggest.v1',
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepted       boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jpsg_posting_kind_idx ON job_posting_suggestions(posting_id, kind);
