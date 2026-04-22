-- Domain 12 — Company Pages, Employer Presence, Brand Surfaces
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text DEFAULT '',
  about text DEFAULT '',
  industry text,
  size_band text, -- '1-10','11-50','51-200','201-1000','1001-5000','5000+'
  founded_year integer,
  headquarters text,
  website text,
  logo_url text,
  cover_url text,
  brand_color text,
  visibility text NOT NULL DEFAULT 'public', -- public | unlisted | private
  status text NOT NULL DEFAULT 'active',     -- draft | active | paused | archived
  verified boolean NOT NULL DEFAULT false,
  follower_count integer NOT NULL DEFAULT 0,
  employee_count integer NOT NULL DEFAULT 0,
  open_roles_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_status_visibility ON companies(status, visibility);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);

CREATE TABLE IF NOT EXISTS company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  identity_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'employee', -- owner | admin | recruiter | editor | employee
  title text,
  is_public boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active', -- active | invited | removed
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, identity_id)
);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id, status);
CREATE INDEX IF NOT EXISTS idx_company_members_identity ON company_members(identity_id);

CREATE TABLE IF NOT EXISTS company_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  label text NOT NULL,
  city text,
  country text,
  is_hq boolean NOT NULL DEFAULT false,
  position integer DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_company_locations_company ON company_locations(company_id);

CREATE TABLE IF NOT EXISTS company_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  kind text NOT NULL, -- 'linkedin','twitter','github','careers','press'
  url text NOT NULL,
  position integer DEFAULT 0,
  UNIQUE(company_id, kind)
);

CREATE TABLE IF NOT EXISTS company_followers (
  company_id uuid NOT NULL,
  follower_id uuid NOT NULL,
  followed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, follower_id)
);
CREATE INDEX IF NOT EXISTS idx_company_followers_follower ON company_followers(follower_id);

CREATE TABLE IF NOT EXISTS company_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  media jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'published', -- draft | published | archived
  published_at timestamptz NOT NULL DEFAULT now(),
  reaction_count integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_company_posts_company ON company_posts(company_id, published_at DESC);

CREATE TABLE IF NOT EXISTS company_brand (
  company_id uuid PRIMARY KEY,
  primary_color text,
  secondary_color text,
  text_color text,
  font_family text,
  hero_url text,
  values jsonb NOT NULL DEFAULT '[]',
  perks jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  viewer_id uuid,
  source text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_views_company ON company_views(company_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS company_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  diff jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_audit_company ON company_audit(company_id, occurred_at DESC);
