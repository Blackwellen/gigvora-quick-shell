-- Domain 09 — Feed Posts, Reactions, Comments.
-- Mirrors packages/db/src/schema/feed.ts. Owned by apps/api-nest/src/modules/feed/.
-- Never run against Lovable Cloud Supabase.

CREATE TABLE IF NOT EXISTS feed_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       uuid NOT NULL,
  author_kind     text NOT NULL DEFAULT 'identity' CHECK (author_kind IN ('identity','company','system')),
  body            text NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  media           jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility      text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','connections','private')),
  status          text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived','flagged')),
  reaction_count  integer NOT NULL DEFAULT 0 CHECK (reaction_count >= 0),
  comment_count   integer NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  opportunity     jsonb,
  published_at    timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  version         integer NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS feed_author_idx ON feed_posts(author_id, published_at DESC);
CREATE INDEX IF NOT EXISTS feed_status_idx ON feed_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS feed_published_idx ON feed_posts(published_at DESC) WHERE status = 'published';
-- Full-text search index for body
CREATE INDEX IF NOT EXISTS feed_posts_body_fts_idx ON feed_posts USING gin (to_tsvector('english', body));

CREATE TABLE IF NOT EXISTS feed_reactions (
  post_id    uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  actor_id   uuid NOT NULL,
  kind       text NOT NULL DEFAULT 'like' CHECK (kind IN ('like','celebrate','support','insightful','curious')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, actor_id, kind)
);
CREATE INDEX IF NOT EXISTS feed_reactions_actor_idx ON feed_reactions(actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS feed_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL,
  body       text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS feed_comments_post_idx ON feed_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS feed_comments_author_idx ON feed_comments(author_id, created_at DESC);
