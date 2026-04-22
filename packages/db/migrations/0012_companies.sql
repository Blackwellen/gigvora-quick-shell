-- Domain 12 — Companies, Members, Locations, Links, Followers, Posts, Brand.
-- Mirrors packages/db/src/schema/companies.ts. Owned by apps/api-nest/src/modules/companies/.
-- Never run against Lovable Cloud Supabase.

CREATE TABLE IF NOT EXISTS companies (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text NOT NULL CHECK (length(slug) BETWEEN 2 AND 80 AND slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  name               text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  tagline            text NOT NULL DEFAULT '',
  about              text NOT NULL DEFAULT '',
  industry           text,
  size_band          text CHECK (size_band IS NULL OR size_band IN ('1','2-10','11-50','51-200','201-500','501-1000','1001-5000','5001-10000','10000+')),
  founded_year       integer CHECK (founded_year IS NULL OR founded_year BETWEEN 1700 AND 2100),
  headquarters       text,
  website            text,
  logo_url           text,
  cover_url          text,
  brand_color        text,
  visibility         text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','unlisted','private')),
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  verified           boolean NOT NULL DEFAULT false,
  follower_count     integer NOT NULL DEFAULT 0 CHECK (follower_count >= 0),
  employee_count     integer NOT NULL DEFAULT 0 CHECK (employee_count >= 0),
  open_roles_count   integer NOT NULL DEFAULT 0 CHECK (open_roles_count >= 0),
  created_by         uuid NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  version            integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_uq      ON companies(slug);
CREATE INDEX        IF NOT EXISTS companies_status_idx   ON companies(status, visibility);
CREATE INDEX        IF NOT EXISTS companies_industry_idx ON companies(industry);
CREATE INDEX        IF NOT EXISTS companies_verified_idx ON companies(verified) WHERE verified;
CREATE INDEX        IF NOT EXISTS companies_name_fts_idx ON companies USING gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(tagline,'') || ' ' || coalesce(about,'')));

CREATE TABLE IF NOT EXISTS company_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  identity_id  uuid NOT NULL,
  role         text NOT NULL DEFAULT 'employee' CHECK (role IN ('owner','admin','manager','employee','contractor','alumni')),
  title        text,
  is_public    boolean NOT NULL DEFAULT true,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','left','removed')),
  joined_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS company_members_pair_uq      ON company_members(company_id, identity_id);
CREATE INDEX        IF NOT EXISTS company_members_company_idx  ON company_members(company_id, status);
CREATE INDEX        IF NOT EXISTS company_members_identity_idx ON company_members(identity_id);

CREATE TABLE IF NOT EXISTS company_locations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  label       text NOT NULL,
  city        text,
  country     text,
  is_hq       boolean NOT NULL DEFAULT false,
  position    integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS company_locations_company_idx ON company_locations(company_id, position);
CREATE UNIQUE INDEX IF NOT EXISTS company_locations_one_hq_uq ON company_locations(company_id) WHERE is_hq;

CREATE TABLE IF NOT EXISTS company_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('linkedin','twitter','x','github','crunchbase','glassdoor','youtube','instagram','tiktok','website','blog','other')),
  url         text NOT NULL CHECK (url ~ '^https?://'),
  position    integer NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS company_links_kind_uq ON company_links(company_id, kind);

CREATE TABLE IF NOT EXISTS company_followers (
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  follower_id  uuid NOT NULL,
  followed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, follower_id)
);
CREATE INDEX IF NOT EXISTS company_followers_follower_idx ON company_followers(follower_id, followed_at DESC);

CREATE TABLE IF NOT EXISTS company_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL,
  body            text NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  media           jsonb NOT NULL DEFAULT '[]'::jsonb,
  status          text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived','flagged')),
  published_at    timestamptz NOT NULL DEFAULT now(),
  reaction_count  integer NOT NULL DEFAULT 0 CHECK (reaction_count >= 0)
);
CREATE INDEX IF NOT EXISTS company_posts_company_idx ON company_posts(company_id, published_at DESC);

CREATE TABLE IF NOT EXISTS company_brand (
  company_id        uuid PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  primary_color     text,
  secondary_color   text,
  text_color        text,
  font_family       text,
  hero_url          text,
  values            jsonb NOT NULL DEFAULT '[]'::jsonb,
  perks             jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at        timestamptz NOT NULL DEFAULT now()
);
