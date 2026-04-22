-- D23 — Search relevance fabric, canonical FTS hardening, saved-search runs, and search admin tables

ALTER TABLE IF EXISTS search_documents
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS region text;

UPDATE search_documents
SET tsv = setweight(to_tsvector('simple', coalesce(title,'')), 'A')
       || setweight(to_tsvector('simple', array_to_string(coalesce(tags,'{}'::text[]), ' ')), 'B')
       || setweight(to_tsvector('simple', coalesce(body,'')), 'C')
WHERE tsv IS NULL;

CREATE INDEX IF NOT EXISTS idx_search_documents_updated_at ON search_documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_documents_region ON search_documents(region, index_name);
CREATE INDEX IF NOT EXISTS idx_search_documents_status ON search_documents(status, index_name);

CREATE TABLE IF NOT EXISTS saved_search_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id uuid NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  hit_count int NOT NULL DEFAULT 0,
  sample jsonb NOT NULL DEFAULT '[]'::jsonb,
  ran_for_hours int NOT NULL DEFAULT 24,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_search_runs_saved_search ON saved_search_runs(saved_search_id, created_at DESC);

CREATE TABLE IF NOT EXISTS search_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'global',
  scope text NOT NULL DEFAULT 'all',
  term text NOT NULL,
  synonyms text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, scope, term)
);
CREATE INDEX IF NOT EXISTS idx_search_synonyms_lookup ON search_synonyms(tenant_id, scope, active);

CREATE TABLE IF NOT EXISTS search_relevance_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'global',
  scope text NOT NULL DEFAULT 'all',
  query text NOT NULL,
  doc_index text NOT NULL,
  doc_id text NOT NULL,
  action text NOT NULL DEFAULT 'boost' CHECK (action IN ('boost','bury','hide')),
  weight numeric(8,3) NOT NULL DEFAULT 1.0,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, scope, query, doc_index, doc_id)
);
CREATE INDEX IF NOT EXISTS idx_search_relevance_overrides_lookup ON search_relevance_overrides(tenant_id, scope, query);

CREATE TABLE IF NOT EXISTS search_saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  name text NOT NULL,
  scope text NOT NULL DEFAULT 'all',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_saved_filters_identity ON search_saved_filters(identity_id, scope, pinned DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS search_blocklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'global',
  doc_index text NOT NULL,
  doc_id text NOT NULL,
  reason text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, doc_index, doc_id)
);
CREATE INDEX IF NOT EXISTS idx_search_blocklist_lookup ON search_blocklist(tenant_id, active, doc_index);

CREATE TABLE IF NOT EXISTS search_geo_polygons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'global',
  name text NOT NULL,
  scope text NOT NULL DEFAULT 'all',
  polygon jsonb NOT NULL,
  center jsonb,
  radius_km int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_geo_polygons_scope ON search_geo_polygons(tenant_id, scope, name);

CREATE TABLE IF NOT EXISTS search_query_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'global',
  scope text NOT NULL DEFAULT 'all',
  cluster_key text NOT NULL,
  label text NOT NULL,
  sample_queries text[] NOT NULL DEFAULT '{}',
  summary text,
  query_count int NOT NULL DEFAULT 0,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, scope, cluster_key)
);
CREATE INDEX IF NOT EXISTS idx_search_query_clusters_scope ON search_query_clusters(tenant_id, scope, query_count DESC);

CREATE TABLE IF NOT EXISTS search_facet_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'global',
  scope text NOT NULL,
  facet_key text NOT NULL,
  label text NOT NULL,
  type text NOT NULL DEFAULT 'multi-select',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, scope, facet_key)
);
CREATE INDEX IF NOT EXISTS idx_search_facet_definitions_scope ON search_facet_definitions(tenant_id, scope, active, position);
