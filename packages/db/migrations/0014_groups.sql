-- Domain 14 — Groups, Community Hubs & Member Conversations
-- Mirrors packages/db/src/schema/groups.ts one-for-one. Lives in the
-- user's codebase only — never run against the Lovable Cloud Supabase
-- project. See mem://tech/no-domain-code-in-supabase.

BEGIN;

CREATE TABLE IF NOT EXISTS groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL,
  slug            text NOT NULL UNIQUE,
  name            text NOT NULL,
  category        text,
  description     text,
  rules           text,
  type            text NOT NULL DEFAULT 'public'  CHECK (type IN ('public','private','secret')),
  status          text NOT NULL DEFAULT 'active'  CHECK (status IN ('draft','active','paused','archived')),
  cover_url       text,
  icon_url        text,
  tags            jsonb NOT NULL DEFAULT '[]'::jsonb,
  join_policy     text NOT NULL DEFAULT 'open'    CHECK (join_policy IN ('open','request','invite_only')),
  posting_policy  text NOT NULL DEFAULT 'members' CHECK (posting_policy IN ('anyone','members','mods_only')),
  member_count    integer NOT NULL DEFAULT 0,
  posts_last_7d   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS groups_slug_idx     ON groups(slug);
CREATE INDEX IF NOT EXISTS groups_status_idx   ON groups(status);
CREATE INDEX IF NOT EXISTS groups_category_idx ON groups(category);

CREATE TABLE IF NOT EXISTS group_members (
  group_id     uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  identity_id  uuid NOT NULL,
  role         text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','moderator','member')),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','invited','banned','left')),
  display_name text,
  avatar_url   text,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, identity_id)
);
CREATE INDEX IF NOT EXISTS group_members_identity_idx ON group_members(identity_id);
CREATE INDEX IF NOT EXISTS group_members_status_idx   ON group_members(status);

CREATE TABLE IF NOT EXISTS group_join_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  message     text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  decided_at  timestamptz
);
CREATE INDEX IF NOT EXISTS group_join_requests_group_idx ON group_join_requests(group_id);

CREATE TABLE IF NOT EXISTS group_channels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  type        text NOT NULL DEFAULT 'discussion' CHECK (type IN ('discussion','announcement','voice','event')),
  position    integer NOT NULL DEFAULT 0,
  private     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS group_channels_group_idx ON group_channels(group_id);

CREATE TABLE IF NOT EXISTS group_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  channel_id      uuid REFERENCES group_channels(id) ON DELETE SET NULL,
  author_id       uuid NOT NULL,
  body            text NOT NULL,
  attachments     jsonb NOT NULL DEFAULT '[]'::jsonb,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','hidden','deleted')),
  pinned          boolean NOT NULL DEFAULT false,
  locked          boolean NOT NULL DEFAULT false,
  reaction_count  integer NOT NULL DEFAULT 0,
  comment_count   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS group_posts_group_idx  ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS group_posts_author_idx ON group_posts(author_id);
CREATE INDEX IF NOT EXISTS group_posts_status_idx ON group_posts(status);

CREATE TABLE IF NOT EXISTS group_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL,
  parent_id  uuid REFERENCES group_comments(id) ON DELETE CASCADE,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS group_comments_post_idx ON group_comments(post_id);

CREATE TABLE IF NOT EXISTS group_reactions (
  post_id    uuid NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  emoji      text NOT NULL,
  reacted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS group_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz,
  location    text,
  link        text,
  capacity    integer,
  status      text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','completed','cancelled')),
  rsvp_count  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS group_events_group_idx ON group_events(group_id);

CREATE TABLE IF NOT EXISTS group_rsvps (
  event_id    uuid NOT NULL REFERENCES group_events(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  status      text NOT NULL DEFAULT 'going' CHECK (status IN ('going','interested','declined')),
  rsvped_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, identity_id)
);

CREATE TABLE IF NOT EXISTS group_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  identity_id uuid,
  email       text,
  message     text,
  invited_by  uuid NOT NULL,
  status      text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','accepted','declined','expired')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS group_invites_group_idx ON group_invites(group_id);

CREATE TABLE IF NOT EXISTS group_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('post','comment','member')),
  target_id   uuid NOT NULL,
  reason      text NOT NULL,
  notes       text,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS group_reports_group_idx ON group_reports(group_id);

DROP TRIGGER IF EXISTS groups_touch ON groups;
DROP TRIGGER IF EXISTS group_members_touch ON group_members;
DROP TRIGGER IF EXISTS group_posts_touch   ON group_posts;
CREATE TRIGGER groups_touch        BEFORE UPDATE ON groups        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER group_members_touch BEFORE UPDATE ON group_members FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER group_posts_touch   BEFORE UPDATE ON group_posts   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMIT;
