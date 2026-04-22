-- Domain 19 — Candidate Availability & Matching.
-- Owner: apps/api-nest/src/modules/candidate-availability-matching/
-- Source of truth: packages/db/src/schema/candidate-availability-matching.ts
-- ML scoring: apps/ml-python/app/candidate_matching.py

CREATE TABLE IF NOT EXISTS candidate_availability_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    uuid NOT NULL,
  tenant_id       text NOT NULL,
  timezone        text NOT NULL DEFAULT 'UTC',
  hours_per_week  integer NOT NULL DEFAULT 40 CHECK (hours_per_week BETWEEN 0 AND 80),
  notice_days     integer NOT NULL DEFAULT 14 CHECK (notice_days >= 0),
  remote_pref     text NOT NULL DEFAULT 'hybrid' CHECK (remote_pref IN ('remote','hybrid','onsite')),
  travel_pct      integer NOT NULL DEFAULT 0 CHECK (travel_pct BETWEEN 0 AND 100),
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open','passive','closed')),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS cap_candidate_idx     ON candidate_availability_profiles(candidate_id);
CREATE INDEX        IF NOT EXISTS cap_tenant_status_idx ON candidate_availability_profiles(tenant_id, status);

CREATE TABLE IF NOT EXISTS candidate_availability_windows (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL REFERENCES candidate_availability_profiles(id) ON DELETE CASCADE,
  day_of_week     integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_minute    integer NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute      integer NOT NULL CHECK (end_minute BETWEEN 1 AND 1440),
  effective_from  date,
  effective_to    date,
  CHECK (end_minute > start_minute),
  CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);
CREATE INDEX IF NOT EXISTS cap_windows_profile_idx ON candidate_availability_windows(profile_id, day_of_week);

CREATE TABLE IF NOT EXISTS candidate_time_off (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES candidate_availability_profiles(id) ON DELETE CASCADE,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL,
  reason      text,
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS cap_timeoff_profile_idx ON candidate_time_off(profile_id, starts_at);

CREATE TABLE IF NOT EXISTS candidate_matches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    uuid NOT NULL,
  target_kind     text NOT NULL CHECK (target_kind IN ('requisition','project','gig')),
  target_id       uuid NOT NULL,
  tenant_id       text NOT NULL,
  score           integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_version   text NOT NULL DEFAULT 'cap.match.v1',
  status          text NOT NULL DEFAULT 'proposed'
                  CHECK (status IN ('proposed','viewed','shortlisted','dismissed','matched')),
  recomputed_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS cap_match_unique_idx ON candidate_matches(candidate_id, target_kind, target_id);
CREATE INDEX        IF NOT EXISTS cap_match_tenant_idx ON candidate_matches(tenant_id, status, score);

CREATE TABLE IF NOT EXISTS candidate_match_events (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id  uuid NOT NULL REFERENCES candidate_matches(id) ON DELETE CASCADE,
  kind      text NOT NULL,
  actor     text NOT NULL,
  detail    jsonb NOT NULL DEFAULT '{}'::jsonb,
  at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cap_match_events_match_idx ON candidate_match_events(match_id, at);
