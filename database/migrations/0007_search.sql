-- Domain 05 — Global Search, Command Palette, Shortcuts & Cross-Linking
-- State machines:
--   saved_searches: active | archived
--   search_index_jobs: pending | running | completed | failed
--   shortcuts: active | disabled
--   cross_links: active | broken | archived

-- Lightweight Postgres-side search index (mirrors what OpenSearch holds, but
-- always queryable as a deterministic fallback when the search-indexer service
-- is unreachable). Real production traffic hits OpenSearch via the indexer.
CREATE TABLE IF NOT EXISTS search_documents (
  id           text NOT NULL,
  index_name   text NOT NULL,             -- 'users' | 'jobs' | 'projects' | 'gigs' | 'services' | 'companies' | 'startups' | 'media' | 'groups' | 'events'
  title        text NOT NULL,
  body         text NOT NULL DEFAULT '',
  tags         text[] NOT NULL DEFAULT '{}',
  url          text,
  owner_id     uuid,
  org_id       uuid,
  visibility   text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','org','internal')),
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  tsv          tsvector,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (index_name, id)
);
CREATE INDEX IF NOT EXISTS idx_search_documents_tsv ON search_documents USING GIN (tsv);
CREATE INDEX IF NOT EXISTS idx_search_documents_tags ON search_documents USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_search_documents_visibility ON search_documents(visibility, index_name);

CREATE OR REPLACE FUNCTION search_documents_tsv_update() RETURNS trigger AS $$
BEGIN
  NEW.tsv := setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A')
          || setweight(to_tsvector('simple', array_to_string(coalesce(NEW.tags,'{}'::text[]), ' ')), 'B')
          || setweight(to_tsvector('simple', coalesce(NEW.body,'')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_search_documents_tsv ON search_documents;
CREATE TRIGGER trg_search_documents_tsv BEFORE INSERT OR UPDATE ON search_documents
  FOR EACH ROW EXECUTE FUNCTION search_documents_tsv_update();

CREATE TABLE IF NOT EXISTS saved_searches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid NOT NULL,
  name         text NOT NULL,
  query        text NOT NULL DEFAULT '',
  filters      jsonb NOT NULL DEFAULT '{}'::jsonb,
  scope        text NOT NULL DEFAULT 'all',           -- 'all' | <index_name>
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  pinned       boolean NOT NULL DEFAULT false,
  notify       boolean NOT NULL DEFAULT false,        -- send digest when new matches
  last_run_at  timestamptz,
  last_count   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_searches_identity ON saved_searches(identity_id, status, pinned DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS search_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid,                                  -- null = anonymous
  query        text NOT NULL,
  scope        text NOT NULL DEFAULT 'all',
  result_count int NOT NULL DEFAULT 0,
  clicked_id   text,                                  -- search_documents.id
  clicked_index text,                                 -- search_documents.index_name
  ms           int,                                   -- query latency
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_history_identity ON search_history(identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query, created_at DESC);

CREATE TABLE IF NOT EXISTS command_palette_actions (
  id           text PRIMARY KEY,                      -- 'create.gig' | 'goto.inbox' | ...
  label        text NOT NULL,
  category     text NOT NULL,                         -- 'navigate' | 'create' | 'admin' | 'recent' | 'help'
  hint         text,                                  -- subtitle in palette
  icon         text,                                  -- lucide name
  shortcut     text,                                  -- e.g. 'g i'
  href         text,                                  -- nav target
  required_role text,                                 -- 'admin' | 'professional' | ...
  required_entitlement text,
  active       boolean NOT NULL DEFAULT true,
  position     int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shortcuts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid NOT NULL,                         -- per-user override
  action_id    text NOT NULL REFERENCES command_palette_actions(id) ON DELETE CASCADE,
  keybind      text NOT NULL,                         -- 'g i' | 'mod+k' etc
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identity_id, action_id)
);

CREATE TABLE IF NOT EXISTS cross_links (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_index text NOT NULL,
  source_id    text NOT NULL,
  target_index text NOT NULL,
  target_id    text NOT NULL,
  relation     text NOT NULL,                         -- 'related' | 'mentions' | 'depends_on' | 'references' | 'attached_to'
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','broken','archived')),
  weight       numeric(5,3) NOT NULL DEFAULT 1.0,
  created_by   uuid,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_index, source_id, target_index, target_id, relation)
);
CREATE INDEX IF NOT EXISTS idx_cross_links_source ON cross_links(source_index, source_id, status);
CREATE INDEX IF NOT EXISTS idx_cross_links_target ON cross_links(target_index, target_id, status);

CREATE TABLE IF NOT EXISTS search_index_jobs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  index_name   text NOT NULL,
  doc_id       text NOT NULL,
  op           text NOT NULL CHECK (op IN ('upsert','delete')),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  attempts     int NOT NULL DEFAULT 0,
  last_error   text,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_search_index_jobs_status ON search_index_jobs(status, created_at);
