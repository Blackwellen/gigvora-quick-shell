-- Domain: Overlays (workflow defs, drafts, snapshots, undo tombstones)
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  display_name text NOT NULL,
  surface_kind text NOT NULL CHECK (surface_kind IN ('wizard','drawer','inspector','popout','hovercard')),
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS wd_slug_idx ON workflow_definitions(slug);

CREATE TABLE IF NOT EXISTS overlay_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  workflow_slug text NOT NULL,
  scope_kind text,
  scope_id uuid,
  step integer NOT NULL DEFAULT 0 CHECK (step >= 0),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS od_identity_idx ON overlay_drafts(identity_id, workflow_slug);
CREATE INDEX IF NOT EXISTS od_scope_idx ON overlay_drafts(scope_kind, scope_id);

CREATE TABLE IF NOT EXISTS overlay_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES overlay_drafts(id) ON DELETE CASCADE,
  step integer NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS os_draft_idx ON overlay_snapshots(draft_id, captured_at);

CREATE TABLE IF NOT EXISTS undo_tombstones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  domain text NOT NULL,
  action text NOT NULL,
  target_kind text NOT NULL,
  target_id text NOT NULL,
  reverse_action jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ut_identity_idx ON undo_tombstones(identity_id, expires_at);
CREATE INDEX IF NOT EXISTS ut_target_idx ON undo_tombstones(target_kind, target_id);

CREATE TABLE IF NOT EXISTS overlay_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid,
  workflow_slug text NOT NULL,
  draft_id uuid,
  kind text NOT NULL CHECK (kind IN ('opened','step_advanced','saved','cancelled','completed')),
  step integer,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oe_workflow_idx ON overlay_events(workflow_slug, occurred_at);
CREATE INDEX IF NOT EXISTS oe_draft_idx ON overlay_events(draft_id);
