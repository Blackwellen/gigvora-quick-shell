-- Domain 13 — Agency Pages, Service Presence & Public Proof Surfaces
-- Mirrors packages/db/src/schema/agency.ts one-for-one.
-- Run against the user's own Postgres via Drizzle (drizzle-kit migrate)
-- or psql directly. Do NOT run against the Supabase project — see
-- mem://tech/no-domain-code-in-supabase.

BEGIN;

CREATE TABLE IF NOT EXISTS agencies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid NOT NULL,
  slug                text NOT NULL UNIQUE,
  name                text NOT NULL,
  tagline             text,
  industry            text,
  size                text,
  founded             text,
  headquarters        text,
  website             text,
  about               text,
  logo_url            text,
  cover_url           text,
  specialties         jsonb NOT NULL DEFAULT '[]'::jsonb,
  languages           jsonb NOT NULL DEFAULT '[]'::jsonb,
  engagement_models   jsonb NOT NULL DEFAULT '[]'::jsonb,
  values              jsonb NOT NULL DEFAULT '[]'::jsonb,
  status              text NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','active','paused','archived')),
  visibility          text NOT NULL DEFAULT 'public'
                      CHECK (visibility IN ('public','network','private')),
  verified            boolean NOT NULL DEFAULT false,
  accepting_projects  boolean NOT NULL DEFAULT true,
  follower_count      integer NOT NULL DEFAULT 0,
  rating_avg          integer NOT NULL DEFAULT 0,  -- x100 to avoid float
  rating_count        integer NOT NULL DEFAULT 0,
  completed_projects  integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agencies_slug_idx   ON agencies(slug);
CREATE INDEX IF NOT EXISTS agencies_status_idx ON agencies(status);
CREATE INDEX IF NOT EXISTS agencies_owner_idx  ON agencies(owner_id);

CREATE TABLE IF NOT EXISTS agency_services (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id         uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name              text NOT NULL,
  description       text,
  price_from_cents  integer,
  price_to_cents    integer,
  currency          text NOT NULL DEFAULT 'USD',
  duration          text,
  popular           boolean NOT NULL DEFAULT false,
  status            text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','paused','archived')),
  position          integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agency_services_agency_idx ON agency_services(agency_id);

CREATE TABLE IF NOT EXISTS agency_team (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  identity_id uuid,
  name        text NOT NULL,
  role        text NOT NULL,
  skills      jsonb NOT NULL DEFAULT '[]'::jsonb,
  available   boolean NOT NULL DEFAULT true,
  badge       text,
  avatar_url  text,
  position    integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS agency_team_agency_idx ON agency_team(agency_id);

CREATE TABLE IF NOT EXISTS agency_case_studies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  title         text NOT NULL,
  client        text,
  outcome       text,
  body          text,
  cover_url     text,
  tags          jsonb NOT NULL DEFAULT '[]'::jsonb,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','pending','published','archived','rejected')),
  views         integer NOT NULL DEFAULT 0,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agency_case_studies_agency_idx ON agency_case_studies(agency_id);
CREATE INDEX IF NOT EXISTS agency_case_studies_status_idx ON agency_case_studies(status);

CREATE TABLE IF NOT EXISTS agency_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  author_id       uuid,
  author_name     text,
  author_company  text,
  rating          integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title           text,
  body            text,
  pros            text,
  cons            text,
  status          text NOT NULL DEFAULT 'visible'
                  CHECK (status IN ('visible','hidden','flagged')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agency_reviews_agency_idx ON agency_reviews(agency_id);

CREATE TABLE IF NOT EXISTS agency_proofs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  kind          text NOT NULL
                CHECK (kind IN ('certification','award','press','security','compliance','partnership')),
  label         text NOT NULL,
  issuer        text,
  evidence_url  text,
  issued_at     timestamptz,
  expires_at    timestamptz,
  verified      boolean NOT NULL DEFAULT false,
  verified_at   timestamptz
);
CREATE INDEX IF NOT EXISTS agency_proofs_agency_idx ON agency_proofs(agency_id);

CREATE TABLE IF NOT EXISTS agency_inquiries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  service_id    uuid REFERENCES agency_services(id) ON DELETE SET NULL,
  contact_name  text NOT NULL,
  contact_email text NOT NULL,
  company       text,
  budget        text,
  message       text NOT NULL,
  status        text NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','contacted','qualified','won','lost','spam')),
  consent       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agency_inquiries_agency_idx ON agency_inquiries(agency_id);

CREATE TABLE IF NOT EXISTS agency_followers (
  agency_id   uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  follower_id uuid NOT NULL,
  followed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agency_id, follower_id)
);

CREATE TABLE IF NOT EXISTS agency_views (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  viewer_id uuid,
  ip        text,
  ua        text,
  at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agency_views_agency_idx ON agency_views(agency_id);
CREATE INDEX IF NOT EXISTS agency_views_at_idx     ON agency_views(at);

-- updated_at touch trigger (shared utility, safe-create)
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agencies_touch          ON agencies;
DROP TRIGGER IF EXISTS agency_services_touch   ON agency_services;
DROP TRIGGER IF EXISTS agency_case_studies_touch ON agency_case_studies;
CREATE TRIGGER agencies_touch          BEFORE UPDATE ON agencies          FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER agency_services_touch   BEFORE UPDATE ON agency_services   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER agency_case_studies_touch BEFORE UPDATE ON agency_case_studies FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMIT;
