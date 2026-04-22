-- Domain 11 — Profiles: extended profile, experience, education, skills,
-- endorsements, portfolio, reviews, badges, verifications, reputation.
-- Mirrors packages/db/src/schema/profiles.ts. Owned by apps/api-nest/src/modules/profiles/.
-- Never run against Lovable Cloud Supabase.

CREATE TABLE IF NOT EXISTS profile_extended (
  identity_id        uuid PRIMARY KEY,
  headline           text NOT NULL DEFAULT '',
  about              text NOT NULL DEFAULT '',
  location           text,
  website            text,
  pronouns           text,
  availability       text CHECK (availability IS NULL OR availability IN ('open','contract','part_time','full_time','not_looking')),
  hourly_rate_cents  integer CHECK (hourly_rate_cents IS NULL OR hourly_rate_cents >= 0),
  currency           text DEFAULT 'GBP' CHECK (currency IS NULL OR currency IN ('GBP','USD','EUR')),
  languages          jsonb NOT NULL DEFAULT '[]'::jsonb,
  links              jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility         text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','connections','private')),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_extended_visibility_idx ON profile_extended(visibility);
CREATE INDEX IF NOT EXISTS profile_extended_headline_fts_idx ON profile_extended USING gin (to_tsvector('english', coalesce(headline,'') || ' ' || coalesce(about,'')));

CREATE TABLE IF NOT EXISTS profile_experience (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid NOT NULL,
  title        text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  company      text NOT NULL CHECK (length(company) BETWEEN 1 AND 200),
  start_date   text NOT NULL,
  end_date     text,
  is_current   boolean NOT NULL DEFAULT false,
  description  text,
  position     integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS profile_experience_identity_idx ON profile_experience(identity_id, position);

CREATE TABLE IF NOT EXISTS profile_education (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     uuid NOT NULL,
  school          text NOT NULL CHECK (length(school) BETWEEN 1 AND 200),
  degree          text,
  field_of_study  text,
  start_year      integer CHECK (start_year IS NULL OR start_year BETWEEN 1900 AND 2100),
  end_year        integer CHECK (end_year IS NULL OR end_year BETWEEN 1900 AND 2100),
  position        integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS profile_education_identity_idx ON profile_education(identity_id, position);

CREATE TABLE IF NOT EXISTS profile_skills (
  identity_id        uuid NOT NULL,
  skill              text NOT NULL CHECK (length(skill) BETWEEN 1 AND 80),
  endorsement_count  integer NOT NULL DEFAULT 0 CHECK (endorsement_count >= 0),
  is_featured        boolean NOT NULL DEFAULT false,
  PRIMARY KEY (identity_id, skill)
);
CREATE INDEX IF NOT EXISTS profile_skills_skill_idx ON profile_skills(skill);
CREATE INDEX IF NOT EXISTS profile_skills_featured_idx ON profile_skills(identity_id) WHERE is_featured;

CREATE TABLE IF NOT EXISTS profile_endorsements (
  endorser_id  uuid NOT NULL,
  identity_id  uuid NOT NULL,
  skill        text NOT NULL,
  note         text CHECK (note IS NULL OR length(note) <= 500),
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (endorser_id, identity_id, skill),
  CONSTRAINT endorse_not_self CHECK (endorser_id <> identity_id)
);
CREATE INDEX IF NOT EXISTS profile_endorsements_subject_idx ON profile_endorsements(identity_id, skill);

CREATE TABLE IF NOT EXISTS profile_portfolio (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid NOT NULL,
  title        text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  summary      text,
  url          text,
  cover_url    text,
  tags         jsonb NOT NULL DEFAULT '[]'::jsonb,
  position     integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS profile_portfolio_identity_idx ON profile_portfolio(identity_id, position);

CREATE TABLE IF NOT EXISTS profile_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid NOT NULL,
  reviewer_id   uuid NOT NULL,
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body          text,
  context_type  text,
  context_id    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT review_not_self CHECK (reviewer_id <> identity_id)
);
CREATE INDEX IF NOT EXISTS profile_reviews_identity_idx ON profile_reviews(identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_reviews_reviewer_idx ON profile_reviews(reviewer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS profile_badges (
  identity_id  uuid NOT NULL,
  badge        text NOT NULL,
  awarded_at   timestamptz NOT NULL DEFAULT now(),
  issuer       text,
  PRIMARY KEY (identity_id, badge)
);

CREATE TABLE IF NOT EXISTS profile_verifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id   uuid NOT NULL,
  kind          text NOT NULL CHECK (kind IN ('email','gov_id','employer','education','phone','address')),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  evidence_url  text,
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_verifications_identity_idx ON profile_verifications(identity_id, kind);
CREATE INDEX IF NOT EXISTS profile_verifications_status_idx   ON profile_verifications(status);

CREATE TABLE IF NOT EXISTS profile_reputation (
  identity_id    uuid PRIMARY KEY,
  score          real NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  band           text NOT NULL DEFAULT 'new' CHECK (band IN ('new','emerging','trusted','verified','elite')),
  components     jsonb NOT NULL DEFAULT '{}'::jsonb,
  recomputed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_reputation_band_idx ON profile_reputation(band, score DESC);
