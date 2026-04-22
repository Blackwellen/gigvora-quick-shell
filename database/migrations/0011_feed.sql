-- Domain 09 — Feed Home, Social Publishing, Opportunity Cards
-- Posts (text/media/link/poll/opportunity), reactions, comments, follows,
-- saved items, opportunity cards (jobs/gigs/services surfaced inline), and
-- a denormalized feed_index for fan-out reads.

CREATE TYPE post_kind   AS ENUM ('text','media','link','poll','opportunity','milestone');
CREATE TYPE post_status AS ENUM ('draft','published','paused','archived','flagged','removed');
CREATE TYPE post_visibility AS ENUM ('public','followers','connections','private','org');
CREATE TYPE reaction_kind AS ENUM ('like','celebrate','insightful','curious','support');

CREATE TABLE IF NOT EXISTS posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     uuid NOT NULL,
  org_id        uuid,
  kind          post_kind NOT NULL DEFAULT 'text',
  status        post_status NOT NULL DEFAULT 'published',
  visibility    post_visibility NOT NULL DEFAULT 'public',
  body          text NOT NULL DEFAULT '',
  media         jsonb NOT NULL DEFAULT '[]'::jsonb,    -- [{url,kind,alt,width,height}]
  link          jsonb,                                  -- {url,title,description,image}
  poll          jsonb,                                  -- {question,options[],closesAt}
  opportunity   jsonb,                                  -- {kind,refId,title,location,comp,deadline}
  tags          text[] NOT NULL DEFAULT '{}',
  language      text NOT NULL DEFAULT 'en',
  reaction_count int NOT NULL DEFAULT 0,
  comment_count  int NOT NULL DEFAULT 0,
  share_count    int NOT NULL DEFAULT 0,
  view_count     int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  edited_at     timestamptz,
  archived_at   timestamptz
);
CREATE INDEX posts_author_idx   ON posts(author_id, created_at DESC);
CREATE INDEX posts_status_idx   ON posts(status)   WHERE status = 'published';
CREATE INDEX posts_kind_idx     ON posts(kind, created_at DESC);
CREATE INDEX posts_tags_gin     ON posts USING GIN(tags);

CREATE TABLE IF NOT EXISTS post_reactions (
  post_id     uuid NOT NULL,
  actor_id    uuid NOT NULL,
  kind        reaction_kind NOT NULL DEFAULT 'like',
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, actor_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL,
  author_id   uuid NOT NULL,
  parent_id   uuid,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  edited_at   timestamptz,
  removed_at  timestamptz
);
CREATE INDEX post_comments_post_idx ON post_comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS post_saves (
  actor_id   uuid NOT NULL,
  post_id    uuid NOT NULL,
  saved_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_id, post_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id  uuid NOT NULL,
  followee_id  uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX follows_followee_idx ON follows(followee_id);

-- Denormalized fan-out index. One row per (viewer, post) so the home feed
-- is a bounded indexed read. Populated by service-level fan-out on publish.
CREATE TABLE IF NOT EXISTS feed_index (
  viewer_id    uuid NOT NULL,
  post_id      uuid NOT NULL,
  score        double precision NOT NULL DEFAULT 0,
  reason       text,                       -- 'follow','recommended','trending','opportunity'
  inserted_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (viewer_id, post_id)
);
CREATE INDEX feed_index_viewer_idx ON feed_index(viewer_id, score DESC, inserted_at DESC);

-- Opportunity cards: pre-built summary records that the feed surfaces inline.
CREATE TYPE opportunity_kind AS ENUM ('job','gig','service','project','event');
CREATE TABLE IF NOT EXISTS opportunity_cards (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind         opportunity_kind NOT NULL,
  ref_id       uuid NOT NULL,
  title        text NOT NULL,
  org_name     text,
  location     text,
  comp_min     int,
  comp_max     int,
  comp_currency text DEFAULT 'GBP',
  tags         text[] NOT NULL DEFAULT '{}',
  deadline_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX opportunity_cards_kind_idx ON opportunity_cards(kind, created_at DESC);
CREATE INDEX opportunity_cards_tags_gin ON opportunity_cards USING GIN(tags);
