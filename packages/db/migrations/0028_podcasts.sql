-- Domain 28 — Podcasts.
-- Owner: apps/api-nest/src/modules/podcasts/
-- Source of truth: packages/db/src/schema/podcasts.ts

CREATE TABLE IF NOT EXISTS podcast_shows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     text NOT NULL,
  owner_id      uuid NOT NULL,
  title         text NOT NULL,
  slug          text NOT NULL,
  tagline       text,
  description   text NOT NULL DEFAULT '',
  language      text NOT NULL DEFAULT 'en',
  category      text,
  artwork_key   text,
  rss_url       text,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  monetization  text NOT NULL DEFAULT 'none'  CHECK (monetization IN ('none','sponsor','donations','both')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS psh_tenant_slug_idx ON podcast_shows(tenant_id, slug);

CREATE TABLE IF NOT EXISTS podcast_episodes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id           uuid NOT NULL REFERENCES podcast_shows(id) ON DELETE CASCADE,
  number            integer NOT NULL CHECK (number > 0),
  season            integer NOT NULL DEFAULT 1 CHECK (season > 0),
  title             text NOT NULL,
  slug              text NOT NULL,
  description       text NOT NULL DEFAULT '',
  audio_key         text NOT NULL,
  duration_seconds  integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','scheduled','published','unlisted','archived')),
  publish_at        timestamptz,
  published_at      timestamptz,
  explicit          boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pep_show_number_idx ON podcast_episodes(show_id, season, number);
CREATE INDEX        IF NOT EXISTS pep_show_status_idx ON podcast_episodes(show_id, status, published_at);

CREATE TABLE IF NOT EXISTS podcast_chapters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id  uuid NOT NULL REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  start_ms    integer NOT NULL CHECK (start_ms >= 0),
  title       text NOT NULL,
  url         text
);
CREATE INDEX IF NOT EXISTS pch_episode_idx ON podcast_chapters(episode_id, start_ms);

CREATE TABLE IF NOT EXISTS podcast_transcripts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id  uuid NOT NULL REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  language    text NOT NULL DEFAULT 'en',
  status      text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','ready','failed')),
  segments    jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ptr_episode_idx ON podcast_transcripts(episode_id);

CREATE TABLE IF NOT EXISTS podcast_subscriptions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id        uuid NOT NULL REFERENCES podcast_shows(id) ON DELETE CASCADE,
  subscriber_id  uuid NOT NULL,
  tier           text NOT NULL DEFAULT 'free' CHECK (tier IN ('free','supporter','premium')),
  started_at     timestamptz NOT NULL DEFAULT now(),
  cancelled_at   timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS psub_show_subscriber_idx ON podcast_subscriptions(show_id, subscriber_id);

CREATE TABLE IF NOT EXISTS podcast_listens (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id        uuid NOT NULL REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  listener_id       uuid,
  started_at        timestamptz NOT NULL DEFAULT now(),
  listened_seconds  integer NOT NULL DEFAULT 0 CHECK (listened_seconds >= 0),
  completed_pct     integer NOT NULL DEFAULT 0 CHECK (completed_pct BETWEEN 0 AND 100),
  surface           text NOT NULL DEFAULT 'web' CHECK (surface IN ('web','ios','android','rss','embed'))
);
CREATE INDEX IF NOT EXISTS plt_episode_idx ON podcast_listens(episode_id, started_at);

CREATE TABLE IF NOT EXISTS podcast_sponsorships (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id     uuid NOT NULL REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  sponsor_name   text NOT NULL,
  position_ms    integer NOT NULL DEFAULT 0 CHECK (position_ms >= 0),
  duration_ms    integer NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  cpm_cents      integer NOT NULL DEFAULT 0 CHECK (cpm_cents >= 0),
  impressions    integer NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  revenue_cents  integer NOT NULL DEFAULT 0 CHECK (revenue_cents >= 0),
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS psp_episode_idx ON podcast_sponsorships(episode_id);
