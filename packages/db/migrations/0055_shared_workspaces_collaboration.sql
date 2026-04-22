-- Domain 55 — Shared Workspaces, Internal Notes, Cross-Team Collaboration & Handoffs
-- State machines:
--   swc_workspaces.status: active ↔ archived
--   swc_notes.status:      draft → published ↔ archived
--   swc_handoffs.status:   pending → accepted|rejected|cancelled; accepted → completed
--   swc_members.status:    active ↔ removed

CREATE TABLE IF NOT EXISTS swc_workspaces (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_identity_id    UUID NOT NULL,
  name               TEXT NOT NULL,
  slug               TEXT NOT NULL,
  description        TEXT,
  visibility         TEXT NOT NULL DEFAULT 'team' CHECK (visibility IN ('team','private','org')),
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_by         UUID NOT NULL,
  archived_at        TIMESTAMPTZ,
  meta               JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_swc_ws_org_slug UNIQUE (org_identity_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_swc_ws_org ON swc_workspaces(org_identity_id, status);

CREATE TABLE IF NOT EXISTS swc_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL,
  member_identity_id  UUID NOT NULL,
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('owner','editor','contributor','viewer')),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','removed')),
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at          TIMESTAMPTZ,
  CONSTRAINT uniq_swc_members_ws_member UNIQUE (workspace_id, member_identity_id)
);
CREATE INDEX IF NOT EXISTS idx_swc_members_ws ON swc_members(workspace_id, status);

CREATE TABLE IF NOT EXISTS swc_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  author_id     UUID NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  tags          JSONB NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  pinned        BOOLEAN NOT NULL DEFAULT FALSE,
  published_at  TIMESTAMPTZ,
  archived_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_swc_notes_ws ON swc_notes(workspace_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS swc_handoffs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL,
  from_identity_id   UUID NOT NULL,
  to_identity_id     UUID NOT NULL,
  from_team          TEXT,
  to_team            TEXT,
  subject            TEXT NOT NULL,
  context            TEXT NOT NULL DEFAULT '',
  checklist          JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments        JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority           TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','accepted','rejected','cancelled','completed')),
  due_at             TIMESTAMPTZ,
  accepted_at        TIMESTAMPTZ,
  rejected_at        TIMESTAMPTZ,
  rejected_reason    TEXT,
  cancelled_at       TIMESTAMPTZ,
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_swc_handoffs_ws ON swc_handoffs(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_swc_handoffs_to ON swc_handoffs(to_identity_id, status);

CREATE TABLE IF NOT EXISTS swc_audit_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL,
  actor_identity_id   UUID,
  action              TEXT NOT NULL,
  target_type         TEXT,
  target_id           UUID,
  diff                JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip                  TEXT,
  user_agent          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_swc_audit_ws ON swc_audit_events(workspace_id, created_at DESC);

-- Seed demo workspace + members + notes + handoffs
INSERT INTO swc_workspaces (id, org_identity_id, name, slug, description, visibility, status, created_by) VALUES
  ('00000000-0000-0000-0000-000000005501'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid,
   'Acme · Delivery Ops', 'delivery-ops', 'Cross-team workspace for delivery handoffs', 'team', 'active',
   '00000000-0000-0000-0000-0000000000m1'::uuid)
ON CONFLICT (org_identity_id, slug) DO NOTHING;

INSERT INTO swc_members (workspace_id, member_identity_id, full_name, email, role) VALUES
  ('00000000-0000-0000-0000-000000005501'::uuid, '00000000-0000-0000-0000-0000000000m1'::uuid, 'Priya Patel', 'priya@example.com', 'owner'),
  ('00000000-0000-0000-0000-000000005501'::uuid, '00000000-0000-0000-0000-0000000000m2'::uuid, 'Marco Rossi', 'marco@example.com', 'editor')
ON CONFLICT (workspace_id, member_identity_id) DO NOTHING;

INSERT INTO swc_notes (workspace_id, author_id, title, body, tags, status, pinned, published_at) VALUES
  ('00000000-0000-0000-0000-000000005501'::uuid, '00000000-0000-0000-0000-0000000000m1'::uuid,
   'Onboarding playbook', 'Step-by-step onboarding for new delivery agents.',
   '["onboarding","delivery"]'::jsonb, 'published', TRUE, now()),
  ('00000000-0000-0000-0000-000000005501'::uuid, '00000000-0000-0000-0000-0000000000m2'::uuid,
   'Q4 retro draft', 'Draft notes for the Q4 retro — please review before Friday.',
   '["retro"]'::jsonb, 'draft', FALSE, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO swc_handoffs (workspace_id, from_identity_id, to_identity_id, from_team, to_team, subject, context, priority, status, due_at) VALUES
  ('00000000-0000-0000-0000-000000005501'::uuid, '00000000-0000-0000-0000-0000000000m1'::uuid,
   '00000000-0000-0000-0000-0000000000m2'::uuid, 'Sales', 'Delivery',
   'New client kickoff — Northwind', 'Contract signed; please run kickoff this week.',
   'high', 'pending', now() + interval '3 days')
ON CONFLICT DO NOTHING;
