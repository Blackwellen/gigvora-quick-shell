-- Domain 24 — Jobs Browse & Discovery.
-- Owner: apps/api-nest/src/modules/jobs-browse/
-- Source of truth: packages/db/src/schema/jobs-browse.ts
-- ML ranker: apps/ml-python/app/jobs_browse.py
-- NB: posting_id references public.job_postings(id) from Domain 23. We intentionally
-- omit the FK to keep this migration independently runnable in isolated test envs.

CREATE TABLE IF NOT EXISTS job_saved_searches (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL,
  name               text NOT NULL,
  query              jsonb NOT NULL DEFAULT '{}'::jsonb,
  alert_cadence      text NOT NULL DEFAULT 'daily'
                     CHECK (alert_cadence IN ('off','instant','daily','weekly')),
  last_run_at        timestamptz,
  results_last_run   integer NOT NULL DEFAULT 0 CHECK (results_last_run >= 0),
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jss_user_idx ON job_saved_searches(user_id, last_run_at);

CREATE TABLE IF NOT EXISTS job_bookmarks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  posting_id  uuid NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS jb_user_posting_idx ON job_bookmarks(user_id, posting_id);

CREATE TABLE IF NOT EXISTS job_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid,
  posting_id  uuid NOT NULL,
  source      text NOT NULL DEFAULT 'browse'
              CHECK (source IN ('browse','search','recommendation','external','direct')),
  dwell_ms    integer NOT NULL DEFAULT 0 CHECK (dwell_ms >= 0),
  applied     boolean NOT NULL DEFAULT false,
  viewed_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jv_posting_idx ON job_views(posting_id, viewed_at);
CREATE INDEX IF NOT EXISTS jv_user_idx    ON job_views(user_id, viewed_at);

CREATE TABLE IF NOT EXISTS job_posting_stats (
  posting_id      uuid PRIMARY KEY,
  views           integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  unique_viewers  integer NOT NULL DEFAULT 0 CHECK (unique_viewers >= 0),
  bookmarks       integer NOT NULL DEFAULT 0 CHECK (bookmarks >= 0),
  applies         integer NOT NULL DEFAULT 0 CHECK (applies >= 0),
  ctr_bp          integer NOT NULL DEFAULT 0 CHECK (ctr_bp BETWEEN 0 AND 10000),
  ranking_score   integer NOT NULL DEFAULT 0 CHECK (ranking_score BETWEEN 0 AND 100),
  recomputed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_browse_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  posting_id  uuid NOT NULL,
  signal      text NOT NULL
              CHECK (signal IN ('not_relevant','wrong_location','salary_too_low','seniority_mismatch','other')),
  detail      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jbf_posting_idx ON job_browse_feedback(posting_id, signal);
