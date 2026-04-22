-- Domain 21 — Interview Planning.
-- Owner: apps/api-nest/src/modules/interview-planning/
-- Source of truth: packages/db/src/schema/interview-planning.ts

CREATE TABLE IF NOT EXISTS interview_loops (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL,
  requisition_id        uuid NOT NULL,
  candidate_id          uuid NOT NULL,
  stage_key             text NOT NULL,
  status                text NOT NULL DEFAULT 'planning'
                        CHECK (status IN ('planning','scheduled','in_progress','completed','withdrawn','cancelled')),
  target_completion_at  timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS il_candidate_idx ON interview_loops(candidate_id);
CREATE INDEX IF NOT EXISTS il_req_idx       ON interview_loops(requisition_id, status);

CREATE TABLE IF NOT EXISTS interview_slots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id       uuid NOT NULL REFERENCES interview_loops(id) ON DELETE CASCADE,
  kind          text NOT NULL DEFAULT 'panel'
                CHECK (kind IN ('phone','tech','panel','onsite','culture','system_design')),
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  location      text,
  meeting_link  text,
  status        text NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled','confirmed','completed','no_show','cancelled')),
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS is_loop_idx ON interview_slots(loop_id, starts_at);

CREATE TABLE IF NOT EXISTS interview_panelists (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id         uuid NOT NULL REFERENCES interview_slots(id) ON DELETE CASCADE,
  interviewer_id  uuid NOT NULL,
  role            text NOT NULL DEFAULT 'interviewer' CHECK (role IN ('lead','interviewer','shadow')),
  response_status text NOT NULL DEFAULT 'pending'
                  CHECK (response_status IN ('pending','accepted','declined','tentative'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ip_slot_interviewer_idx ON interview_panelists(slot_id, interviewer_id);

CREATE TABLE IF NOT EXISTS interview_scorecards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id         uuid NOT NULL REFERENCES interview_slots(id) ON DELETE CASCADE,
  interviewer_id  uuid NOT NULL,
  loop_id         uuid NOT NULL REFERENCES interview_loops(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','withdrawn')),
  recommendation  text CHECK (recommendation IS NULL OR recommendation IN ('strong_yes','yes','mixed','no','strong_no')),
  scores          jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes           text,
  submitted_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS isc_slot_interviewer_idx ON interview_scorecards(slot_id, interviewer_id);
CREATE INDEX        IF NOT EXISTS isc_loop_idx              ON interview_scorecards(loop_id, status);

CREATE TABLE IF NOT EXISTS interview_calibrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id       uuid NOT NULL REFERENCES interview_loops(id) ON DELETE CASCADE,
  decided_at    timestamptz,
  decision      text CHECK (decision IS NULL OR decision IN ('advance','reject','hold','rehouse')),
  rationale     text,
  participants  jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS icl_loop_idx ON interview_calibrations(loop_id, decided_at);
