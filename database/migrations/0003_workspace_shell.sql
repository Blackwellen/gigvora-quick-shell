-- Domain 01: Global Shell, Navigation, Workspace Orchestration
-- PostgreSQL schema for orgs, memberships, saved views, recent items,
-- user shell preferences, nav config, and audit events.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- ORGANIZATIONS ----------
CREATE TYPE org_plan AS ENUM ('free', 'pro', 'team', 'enterprise');
CREATE TYPE org_status AS ENUM ('active', 'paused', 'archived', 'suspended');

CREATE TABLE IF NOT EXISTS orgs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  logo_url     TEXT,
  plan         org_plan NOT NULL DEFAULT 'free',
  status       org_status NOT NULL DEFAULT 'active',
  owner_id     UUID NOT NULL,
  settings     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orgs_owner ON orgs(owner_id);
CREATE INDEX IF NOT EXISTS idx_orgs_status ON orgs(status);

-- ---------- MEMBERSHIPS ----------
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'viewer', 'guest');
CREATE TYPE membership_state AS ENUM ('pending', 'active', 'suspended', 'removed');

CREATE TABLE IF NOT EXISTS memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  role        org_role NOT NULL DEFAULT 'member',
  state       membership_state NOT NULL DEFAULT 'active',
  invited_by  UUID,
  invited_at  TIMESTAMPTZ,
  joined_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON memberships(org_id);

-- ---------- SAVED VIEWS ----------
CREATE TABLE IF NOT EXISTS saved_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  org_id     UUID REFERENCES orgs(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  route      TEXT NOT NULL,
  icon       TEXT,
  pinned     BOOLEAN NOT NULL DEFAULT false,
  position   INT NOT NULL DEFAULT 0,
  filters    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views(user_id, pinned DESC, position);

-- ---------- RECENT ITEMS (rolling) ----------
CREATE TYPE recent_kind AS ENUM ('page','profile','project','job','gig','service','message','order','event','group');

CREATE TABLE IF NOT EXISTS recent_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  org_id     UUID REFERENCES orgs(id) ON DELETE CASCADE,
  kind       recent_kind NOT NULL,
  label      TEXT NOT NULL,
  route      TEXT NOT NULL,
  meta       JSONB NOT NULL DEFAULT '{}'::jsonb,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recent_user_time ON recent_items(user_id, visited_at DESC);

-- ---------- SHELL PREFERENCES ----------
CREATE TABLE IF NOT EXISTS shell_prefs (
  user_id            UUID PRIMARY KEY,
  active_role        TEXT NOT NULL DEFAULT 'user',
  active_org_id      UUID REFERENCES orgs(id) ON DELETE SET NULL,
  sidebar_collapsed  BOOLEAN NOT NULL DEFAULT false,
  right_rail_open    BOOLEAN NOT NULL DEFAULT true,
  density            TEXT NOT NULL DEFAULT 'comfortable',
  theme              TEXT NOT NULL DEFAULT 'system',
  shortcuts          JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- NAV CONFIG (per role / per org overrides) ----------
CREATE TABLE IF NOT EXISTS nav_config (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope      TEXT NOT NULL CHECK (scope IN ('global','role','org','user')),
  scope_key  TEXT NOT NULL,
  tree       JSONB NOT NULL,
  version    INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scope, scope_key)
);

-- ---------- AUDIT EVENTS ----------
CREATE TABLE IF NOT EXISTS audit_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID NOT NULL,
  org_id     UUID,
  domain     TEXT NOT NULL DEFAULT 'shell',
  action     TEXT NOT NULL,
  target_type TEXT,
  target_id  UUID,
  meta       JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip         INET,
  ua         TEXT,
  at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor_time ON audit_events(actor_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_org_time ON audit_events(org_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_domain_action ON audit_events(domain, action);
