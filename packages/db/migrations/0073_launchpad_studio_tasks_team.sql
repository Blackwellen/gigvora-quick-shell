-- Pass 4: Experience Launchpad + Creation Studio + Task List + Team Management
-- Idempotent. Reuses identities; no FK to auth.* schemas. RLS-friendly: every
-- row carries owner_identity_id or workspace_id and is filtered server-side.

BEGIN;

-- ── Experience Launchpad ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS launchpad_pathways (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  summary         TEXT NOT NULL DEFAULT '',
  domain          TEXT NOT NULL DEFAULT 'general',
  level           TEXT NOT NULL DEFAULT 'starter',           -- starter|intermediate|advanced
  duration_weeks  INTEGER NOT NULL DEFAULT 6,
  hero_image_url  TEXT,
  outcomes        JSONB NOT NULL DEFAULT '[]'::jsonb,
  modules         JSONB NOT NULL DEFAULT '[]'::jsonb,        -- [{title, lessons:[]}]
  tags            TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'published',          -- draft|published|archived
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lp_pathways_status_domain ON launchpad_pathways(status, domain);
CREATE INDEX IF NOT EXISTS idx_lp_pathways_tags ON launchpad_pathways USING GIN(tags);

CREATE TABLE IF NOT EXISTS launchpad_pathway_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     UUID NOT NULL,
  pathway_id      UUID NOT NULL REFERENCES launchpad_pathways(id) ON DELETE CASCADE,
  progress_pct    INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  status          TEXT NOT NULL DEFAULT 'active',              -- active|completed|paused|dropped
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  UNIQUE (identity_id, pathway_id)
);
CREATE INDEX IF NOT EXISTS idx_lp_enroll_identity ON launchpad_pathway_enrollments(identity_id);

CREATE TABLE IF NOT EXISTS launchpad_mentors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     UUID NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  headline        TEXT NOT NULL DEFAULT '',
  bio             TEXT NOT NULL DEFAULT '',
  expertise       TEXT[] NOT NULL DEFAULT '{}',
  industries      TEXT[] NOT NULL DEFAULT '{}',
  rate_amount     INTEGER NOT NULL DEFAULT 0,                  -- cents
  rate_currency   TEXT NOT NULL DEFAULT 'USD',
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  sessions        INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'available',           -- available|booked|waitlist|paused
  availability    JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lp_mentors_status ON launchpad_mentors(status);
CREATE INDEX IF NOT EXISTS idx_lp_mentors_expertise ON launchpad_mentors USING GIN(expertise);

CREATE TABLE IF NOT EXISTS launchpad_mentor_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id       UUID NOT NULL REFERENCES launchpad_mentors(id) ON DELETE CASCADE,
  mentee_identity_id UUID NOT NULL,
  scheduled_for   TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER NOT NULL DEFAULT 30,
  status          TEXT NOT NULL DEFAULT 'pending',             -- pending|confirmed|completed|cancelled|no_show
  topic           TEXT NOT NULL DEFAULT '',
  meeting_url     TEXT,
  amount_paid     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lp_bookings_mentor ON launchpad_mentor_bookings(mentor_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_lp_bookings_mentee ON launchpad_mentor_bookings(mentee_identity_id, scheduled_for);

CREATE TABLE IF NOT EXISTS launchpad_challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  brief           TEXT NOT NULL DEFAULT '',
  sponsor         TEXT,
  sponsor_logo    TEXT,
  prize_amount    INTEGER NOT NULL DEFAULT 0,
  prize_currency  TEXT NOT NULL DEFAULT 'USD',
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at         TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open',                -- draft|open|judging|closed
  tags            TEXT[] NOT NULL DEFAULT '{}',
  rubric          JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lp_challenges_status ON launchpad_challenges(status, ends_at);

CREATE TABLE IF NOT EXISTS launchpad_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    UUID NOT NULL REFERENCES launchpad_challenges(id) ON DELETE CASCADE,
  identity_id     UUID NOT NULL,
  title           TEXT NOT NULL,
  summary         TEXT NOT NULL DEFAULT '',
  asset_urls      JSONB NOT NULL DEFAULT '[]'::jsonb,
  score           INTEGER NOT NULL DEFAULT 0,
  rank            INTEGER,
  status          TEXT NOT NULL DEFAULT 'submitted',           -- draft|submitted|judging|winner|honorable
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lp_submissions_challenge ON launchpad_submissions(challenge_id, score DESC);

CREATE TABLE IF NOT EXISTS launchpad_opportunities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            TEXT NOT NULL,                                -- internship|graduate|fellowship|apprenticeship|project|event|job
  title           TEXT NOT NULL,
  org_name        TEXT NOT NULL,
  location        TEXT NOT NULL DEFAULT 'Remote',
  salary_band     TEXT,
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  level           TEXT NOT NULL DEFAULT 'entry',
  tags            TEXT[] NOT NULL DEFAULT '{}',
  link_href       TEXT,
  description     TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'open',                -- open|closed|filled
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lp_opps_kind_status ON launchpad_opportunities(kind, status);
CREATE INDEX IF NOT EXISTS idx_lp_opps_tags ON launchpad_opportunities USING GIN(tags);

-- ── Creation Studio ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS studio_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  workspace_id    UUID,
  kind            TEXT NOT NULL,                                -- post|article|reel|clip|podcast|short|campaign|template|showcase|story
  title           TEXT NOT NULL,
  body            TEXT NOT NULL DEFAULT '',
  blocks          JSONB NOT NULL DEFAULT '[]'::jsonb,           -- block editor JSON
  hero_url        TEXT,
  destination     TEXT NOT NULL DEFAULT 'feed',
  tags            TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'draft',                -- draft|in-review|scheduled|published|archived
  scheduled_for   TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  moderation_status TEXT NOT NULL DEFAULT 'pending',            -- pending|approved|rejected
  version         INTEGER NOT NULL DEFAULT 1,
  metrics         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_studio_drafts_owner_status ON studio_drafts(owner_identity_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS studio_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  kind            TEXT NOT NULL,                                -- image|video|audio|doc
  url             TEXT NOT NULL,
  poster_url      TEXT,
  bytes           BIGINT NOT NULL DEFAULT 0,
  duration_ms     INTEGER,
  width           INTEGER,
  height          INTEGER,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_studio_assets_owner ON studio_assets(owner_identity_id, created_at DESC);

-- ── Task List ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_lists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  workspace_id    UUID,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  color           TEXT NOT NULL DEFAULT '#6366f1',
  position        INTEGER NOT NULL DEFAULT 0,
  archived        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_lists_owner ON task_lists(owner_identity_id, archived, position);

CREATE TABLE IF NOT EXISTS task_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id         UUID NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
  owner_identity_id UUID NOT NULL,
  assignee_identity_id UUID,
  title           TEXT NOT NULL,
  notes           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'todo',                 -- todo|in_progress|blocked|done|cancelled
  priority        TEXT NOT NULL DEFAULT 'medium',               -- low|medium|high|urgent
  due_at          TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  position        INTEGER NOT NULL DEFAULT 0,
  labels          TEXT[] NOT NULL DEFAULT '{}',
  linked_entity   JSONB,                                         -- {kind, id, label}
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_items_list_status ON task_items(list_id, status, position);
CREATE INDEX IF NOT EXISTS idx_task_items_assignee ON task_items(assignee_identity_id, status, due_at);

-- ── Team Management ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  identity_id     UUID NOT NULL,
  display_name    TEXT NOT NULL,
  email           TEXT,
  role            TEXT NOT NULL DEFAULT 'member',                -- owner|admin|manager|member|viewer
  department      TEXT,
  title           TEXT,
  status          TEXT NOT NULL DEFAULT 'active',                -- active|invited|suspended|removed
  permissions     JSONB NOT NULL DEFAULT '{}'::jsonb,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, identity_id)
);
CREATE INDEX IF NOT EXISTS idx_team_members_ws_role ON team_members(workspace_id, role, status);

CREATE TABLE IF NOT EXISTS team_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'member',
  invited_by_identity_id UUID NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',               -- pending|accepted|expired|revoked
  token           TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_invites_ws_status ON team_invites(workspace_id, status);

-- ── Audit (append-only) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lst_audit (
  id              BIGSERIAL PRIMARY KEY,
  identity_id     UUID,
  domain          TEXT NOT NULL,                                  -- launchpad|studio|tasks|team
  action          TEXT NOT NULL,
  entity_kind     TEXT NOT NULL,
  entity_id       TEXT,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lst_audit_domain_created ON lst_audit(domain, created_at DESC);

COMMIT;
