-- Domain 11: Profiles, Professional Identity, Reputation Surfaces
-- 11-tab profile system, badges, endorsements, verification, reputation scoring

CREATE TABLE IF NOT EXISTS profile_extended (
  identity_id uuid PRIMARY KEY,
  handle text UNIQUE NOT NULL,
  display_name text NOT NULL,
  headline text DEFAULT '',
  summary text DEFAULT '',
  location text DEFAULT '',
  website text,
  cover_url text,
  avatar_url text,
  pronouns text,
  open_to_work boolean DEFAULT false,
  open_to_freelance boolean DEFAULT false,
  open_to_mentoring boolean DEFAULT false,
  hourly_rate_cents integer,
  currency text DEFAULT 'GBP',
  timezone text DEFAULT 'Europe/London',
  visibility text NOT NULL DEFAULT 'public', -- public | network | private
  status text NOT NULL DEFAULT 'active',     -- active | paused | archived
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_ext_handle ON profile_extended(handle);
CREATE INDEX IF NOT EXISTS idx_profile_ext_visibility ON profile_extended(visibility);

CREATE TABLE IF NOT EXISTS profile_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  description text DEFAULT '',
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_exp_identity ON profile_experience(identity_id, position);

CREATE TABLE IF NOT EXISTS profile_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  institution text NOT NULL,
  degree text,
  field text,
  start_year integer,
  end_year integer,
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_edu_identity ON profile_education(identity_id, position);

CREATE TABLE IF NOT EXISTS profile_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  skill text NOT NULL,
  level text DEFAULT 'intermediate', -- beginner | intermediate | expert
  endorsement_count integer DEFAULT 0,
  position integer DEFAULT 0,
  UNIQUE(identity_id, skill)
);
CREATE INDEX IF NOT EXISTS idx_profile_skills_identity ON profile_skills(identity_id, position);

CREATE TABLE IF NOT EXISTS profile_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL,
  endorser_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(skill_id, endorser_id)
);
CREATE INDEX IF NOT EXISTS idx_endorsements_skill ON profile_endorsements(skill_id);

CREATE TABLE IF NOT EXISTS profile_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  cover_url text,
  external_url text,
  media jsonb NOT NULL DEFAULT '[]',
  tags text[] NOT NULL DEFAULT '{}',
  position integer DEFAULT 0,
  status text NOT NULL DEFAULT 'published', -- draft | published | archived
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_identity ON profile_portfolio(identity_id, position);

CREATE TABLE IF NOT EXISTS profile_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text DEFAULT '',
  context text, -- 'project', 'gig', 'service', 'job'
  context_id uuid,
  status text NOT NULL DEFAULT 'published', -- pending | published | flagged | removed
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_subject ON profile_reviews(subject_id, created_at DESC);

CREATE TABLE IF NOT EXISTS profile_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  code text NOT NULL,         -- e.g. 'verified', 'top_rated', 'rising'
  label text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  meta jsonb DEFAULT '{}',
  UNIQUE(identity_id, code)
);
CREATE INDEX IF NOT EXISTS idx_badges_identity ON profile_badges(identity_id);

CREATE TABLE IF NOT EXISTS profile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  kind text NOT NULL, -- 'email','phone','id_document','company','linkedin','github'
  status text NOT NULL DEFAULT 'pending', -- pending | active | failed | expired | revoked
  evidence_url text,
  verified_at timestamptz,
  expires_at timestamptz,
  reviewer_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(identity_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_verif_identity ON profile_verifications(identity_id);
CREATE INDEX IF NOT EXISTS idx_verif_status ON profile_verifications(status);

CREATE TABLE IF NOT EXISTS profile_reputation (
  identity_id uuid PRIMARY KEY,
  score double precision NOT NULL DEFAULT 0,
  band text NOT NULL DEFAULT 'new', -- new | rising | trusted | top
  components jsonb NOT NULL DEFAULT '{}', -- {reviews, completion, verifications, activity, endorsements}
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL,
  viewer_id uuid,
  source text, -- 'feed','search','direct','network'
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_views_subject ON profile_views(subject_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS profile_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  diff jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_audit_identity ON profile_audit(identity_id, occurred_at DESC);
