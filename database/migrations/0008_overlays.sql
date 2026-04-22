-- Domain 06 — Pop-ups, Drawers, Follow-Through Windows, Detached Views
-- Persists overlay sessions (drawer/popup/inspector/wizard/detached-view) and
-- follow-through workflows (e.g. "after purchase show success then prompt
-- review") that survive page refresh and continue across cross-domain handoffs.

CREATE TYPE overlay_kind AS ENUM (
  'modal','drawer','sheet','popover','hovercard','toast','wizard',
  'inspector','detached_window','quick_preview','confirmation'
);

CREATE TYPE overlay_status AS ENUM (
  'pending','open','dismissed','completed','expired','failed','escalated'
);

CREATE TYPE overlay_origin AS ENUM (
  'user','system','workflow','notification','deeplink','admin'
);

-- A single overlay invocation. UI components write here when opened so a
-- refresh can rehydrate the same panel; closes/completions update status.
CREATE TABLE IF NOT EXISTS overlay_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     uuid REFERENCES identities(id) ON DELETE SET NULL,
  org_id          uuid,
  kind            overlay_kind NOT NULL,
  surface_key     text NOT NULL,                -- e.g. 'gigs.detail.editor'
  status          overlay_status NOT NULL DEFAULT 'open',
  origin          overlay_origin NOT NULL DEFAULT 'user',
  route           text,                         -- the route the overlay was opened from
  entity_type     text,                         -- 'gig'|'job'|'profile'|...
  entity_id       text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,  -- form state, filters, draft
  result          jsonb,                        -- outcome on completion
  opened_at       timestamptz NOT NULL DEFAULT now(),
  closed_at       timestamptz,
  expires_at      timestamptz,
  audit           jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX overlay_sessions_identity_idx ON overlay_sessions(identity_id, status);
CREATE INDEX overlay_sessions_surface_idx  ON overlay_sessions(surface_key, status);
CREATE INDEX overlay_sessions_entity_idx   ON overlay_sessions(entity_type, entity_id);

-- Multi-step follow-through (purchase → success → review prompt → next-action)
CREATE TYPE workflow_status AS ENUM (
  'draft','active','paused','completed','failed','cancelled','expired'
);

CREATE TABLE IF NOT EXISTS overlay_workflows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid REFERENCES identities(id) ON DELETE CASCADE,
  template_key  text NOT NULL,                  -- 'purchase_followup', 'mfa_recovery'
  status        workflow_status NOT NULL DEFAULT 'active',
  current_step  text NOT NULL,
  total_steps   int  NOT NULL,
  context       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);
CREATE INDEX overlay_workflows_identity_idx ON overlay_workflows(identity_id, status);

CREATE TABLE IF NOT EXISTS overlay_workflow_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   uuid NOT NULL REFERENCES overlay_workflows(id) ON DELETE CASCADE,
  step_key      text NOT NULL,
  position      int  NOT NULL,
  status        overlay_status NOT NULL DEFAULT 'pending',
  data          jsonb NOT NULL DEFAULT '{}'::jsonb,
  entered_at    timestamptz,
  exited_at     timestamptz,
  UNIQUE (workflow_id, step_key)
);
CREATE INDEX overlay_workflow_steps_status_idx ON overlay_workflow_steps(workflow_id, status);

-- Detached / pop-out windows (a panel torn off into its own browser window).
-- We persist the live link so the parent can communicate via BroadcastChannel
-- and the operator can re-attach later.
CREATE TABLE IF NOT EXISTS detached_windows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid REFERENCES identities(id) ON DELETE CASCADE,
  channel_key   text NOT NULL,                 -- BroadcastChannel name
  surface_key   text NOT NULL,
  route         text NOT NULL,
  state         jsonb NOT NULL DEFAULT '{}'::jsonb,
  opened_at     timestamptz NOT NULL DEFAULT now(),
  last_ping_at  timestamptz NOT NULL DEFAULT now(),
  closed_at     timestamptz,
  UNIQUE (identity_id, channel_key)
);

-- Audit trail for compliance (who opened what, what was the outcome).
CREATE TABLE IF NOT EXISTS overlay_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid REFERENCES overlay_sessions(id) ON DELETE SET NULL,
  workflow_id   uuid REFERENCES overlay_workflows(id) ON DELETE SET NULL,
  identity_id   uuid,
  action        text NOT NULL,                 -- 'opened','dismissed','completed','escalated'
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX overlay_audit_identity_idx ON overlay_audit(identity_id, at DESC);
