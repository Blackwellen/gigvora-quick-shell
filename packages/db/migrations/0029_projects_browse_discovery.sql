-- Domain 29 — Projects Browse & Discovery.
-- Owner: apps/api-nest/src/modules/projects-browse-discovery/
-- Source of truth: packages/db/src/schema/projects-browse-discovery.ts

CREATE TABLE IF NOT EXISTS project_saved_searches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  name              text NOT NULL,
  query             jsonb NOT NULL DEFAULT '{}'::jsonb,
  alert_cadence     text NOT NULL DEFAULT 'daily' CHECK (alert_cadence IN ('off','instant','daily','weekly')),
  last_run_at       timestamptz,
  results_last_run  integer NOT NULL DEFAULT 0 CHECK (results_last_run >= 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pjss_user_idx ON project_saved_searches(user_id, last_run_at);

CREATE TABLE IF NOT EXISTS project_bookmarks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  project_id  uuid NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pjbm_user_project_idx ON project_bookmarks(user_id, project_id);

CREATE TABLE IF NOT EXISTS project_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid,
  project_id  uuid NOT NULL,
  source      text NOT NULL DEFAULT 'browse' CHECK (source IN ('browse','search','recommendation','invite','external')),
  dwell_ms    integer NOT NULL DEFAULT 0 CHECK (dwell_ms >= 0),
  proposed    boolean NOT NULL DEFAULT false,
  viewed_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pjv_project_idx ON project_views(project_id, viewed_at);
CREATE INDEX IF NOT EXISTS pjv_user_idx    ON project_views(user_id, viewed_at);

CREATE TABLE IF NOT EXISTS project_stats (
  project_id      uuid PRIMARY KEY,
  views           integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  unique_viewers  integer NOT NULL DEFAULT 0 CHECK (unique_viewers >= 0),
  bookmarks       integer NOT NULL DEFAULT 0 CHECK (bookmarks >= 0),
  proposals       integer NOT NULL DEFAULT 0 CHECK (proposals >= 0),
  invites_sent    integer NOT NULL DEFAULT 0 CHECK (invites_sent >= 0),
  ranking_score   integer NOT NULL DEFAULT 0,
  recomputed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_browse_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  project_id  uuid NOT NULL,
  signal      text NOT NULL CHECK (signal IN ('not_relevant','budget_too_low','scope_mismatch','timeline','other')),
  detail      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pjbf_project_idx ON project_browse_feedback(project_id, signal);
