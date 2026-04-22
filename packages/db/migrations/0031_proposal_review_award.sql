-- Domain 31 — Proposal Review, Compare, Shortlist & Award.
-- Owner: apps/api-nest/src/modules/proposal-review-award/
-- Source of truth: packages/db/src/schema/proposal-review-award.ts

CREATE TABLE IF NOT EXISTS proposal_reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  uuid NOT NULL,
  project_id   uuid NOT NULL,
  reviewer_id  uuid NOT NULL,
  decision     text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending','shortlisted','rejected','hold')),
  rationale    text,
  decided_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS prr_prop_reviewer_idx ON proposal_reviews(proposal_id, reviewer_id);
CREATE INDEX        IF NOT EXISTS prr_project_idx       ON proposal_reviews(project_id, decision);

CREATE TABLE IF NOT EXISTS proposal_scorecards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     uuid NOT NULL,
  reviewer_id     uuid NOT NULL,
  rubric_id       text NOT NULL DEFAULT 'default',
  scores          jsonb NOT NULL DEFAULT '{}'::jsonb,
  weighted_total  integer NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS psc_prop_reviewer_idx ON proposal_scorecards(proposal_id, reviewer_id);

CREATE TABLE IF NOT EXISTS proposal_shortlists (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL,
  owner_id      uuid NOT NULL,
  name          text NOT NULL DEFAULT 'Shortlist',
  proposal_ids  jsonb NOT NULL DEFAULT '[]'::jsonb,
  pinned        boolean NOT NULL DEFAULT false,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS psl_project_idx ON proposal_shortlists(project_id);

CREATE TABLE IF NOT EXISTS proposal_comparisons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL,
  owner_id      uuid NOT NULL,
  proposal_ids  jsonb NOT NULL DEFAULT '[]'::jsonb,
  axes          jsonb NOT NULL DEFAULT '[]'::jsonb,
  snapshot      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pcm_project_idx ON proposal_comparisons(project_id, created_at);

CREATE TABLE IF NOT EXISTS proposal_awards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL,
  proposal_id     uuid NOT NULL,
  awarded_by      uuid NOT NULL,
  awarded_at      timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','declined','rescinded','escrow_held')),
  escrow_hold_id  uuid,
  contract_id     uuid,
  amount_cents    integer NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency        text NOT NULL DEFAULT 'USD',
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS paw_proposal_idx       ON proposal_awards(proposal_id);
CREATE INDEX        IF NOT EXISTS paw_project_status_idx ON proposal_awards(project_id, status);

CREATE TABLE IF NOT EXISTS proposal_review_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL,
  proposal_id  uuid,
  actor_id     uuid NOT NULL,
  event        text NOT NULL
               CHECK (event IN ('viewed','scored','shortlisted','rejected','compared','awarded','rescinded')),
  detail       jsonb NOT NULL DEFAULT '{}'::jsonb,
  at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pre_project_idx  ON proposal_review_events(project_id, at);
CREATE INDEX IF NOT EXISTS pre_proposal_idx ON proposal_review_events(proposal_id, at);
