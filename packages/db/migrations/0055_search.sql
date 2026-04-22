-- Domain: Search (FTS index, history, clicks, saved searches, command palette)
CREATE TABLE IF NOT EXISTS search_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  index_name text NOT NULL,
  external_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  url text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','tenant','private')),
  owner_identity_id uuid,
  recency_at timestamptz NOT NULL DEFAULT now(),
  engagement_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS si_unique_idx ON search_index(tenant_id, index_name, external_id);
CREATE INDEX IF NOT EXISTS si_index_recency_idx ON search_index(tenant_id, index_name, recency_at);
-- Full-text search: tsvector + trigram for fuzzy match
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS si_fts_idx ON search_index USING gin (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))
);
CREATE INDEX IF NOT EXISTS si_title_trgm_idx ON search_index USING gin (title gin_trgm_ops);

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid,
  tenant_id text NOT NULL,
  query text NOT NULL,
  scope text NOT NULL DEFAULT 'all',
  result_count integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sh_identity_idx ON search_history(identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sh_trending_idx ON search_history(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS search_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid,
  query text NOT NULL,
  scope text NOT NULL DEFAULT 'all',
  clicked_id text NOT NULL,
  clicked_index text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  clicked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sc_click_idx ON search_clicks(clicked_index, clicked_id, clicked_at);

CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  label text NOT NULL,
  query text NOT NULL,
  scope text NOT NULL DEFAULT 'all',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  notify boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ss_identity_idx ON saved_searches(identity_id, archived_at);

CREATE TABLE IF NOT EXISTS command_palette_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text NOT NULL,
  label text NOT NULL,
  "group" text NOT NULL,
  requires_roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  requires_entitlements jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_keybind text,
  enabled boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS cpi_action_idx ON command_palette_items(action_key);
CREATE INDEX IF NOT EXISTS cpi_group_idx ON command_palette_items("group");

CREATE TABLE IF NOT EXISTS command_shortcuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  action_key text NOT NULL,
  keybind text NOT NULL,
  disabled boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX IF NOT EXISTS csh_unique_idx ON command_shortcuts(identity_id, action_key);
