-- Domain 16 — Ratings, Reviews, Trust Badges & Social Proof.
-- Mirrors packages/db/src/schema/trust.ts. Owned by apps/api-nest/src/modules/trust/.
-- Never run against Lovable Cloud Supabase.

CREATE TABLE IF NOT EXISTS reviews (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id         uuid NOT NULL,
  author_name       text,
  author_avatar_key text,
  author_role       text,
  subject_kind      text NOT NULL CHECK (subject_kind IN ('user','agency','company','gig','service','project','job')),
  subject_id        text NOT NULL CHECK (length(subject_id) BETWEEN 1 AND 120),
  rating            integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title             text NOT NULL CHECK (length(title) BETWEEN 2 AND 160),
  body              text NOT NULL CHECK (length(body) BETWEEN 10 AND 4000),
  pros              jsonb NOT NULL DEFAULT '[]'::jsonb,
  cons              jsonb NOT NULL DEFAULT '[]'::jsonb,
  project_ref       text,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','pending','published','disputed','rejected','archived')),
  helpful_count     integer NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  report_count      integer NOT NULL DEFAULT 0 CHECK (report_count >= 0),
  response_id       uuid,
  contact_email     text,
  published_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_subject_idx ON reviews(subject_kind, subject_id);
CREATE INDEX IF NOT EXISTS reviews_author_idx  ON reviews(author_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx  ON reviews(status);
CREATE INDEX IF NOT EXISTS reviews_rating_idx  ON reviews(rating);

CREATE TABLE IF NOT EXISTS review_responses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL,
  body        text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS review_responses_review_idx ON review_responses(review_id);

CREATE TABLE IF NOT EXISTS review_reactions (
  review_id  uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  actor_id   uuid NOT NULL,
  kind       text NOT NULL DEFAULT 'helpful' CHECK (kind IN ('helpful','not_helpful','report')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (review_id, actor_id, kind)
);

CREATE TABLE IF NOT EXISTS review_moderation (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  action     text NOT NULL CHECK (action IN ('hold','approve','reject','flag','restore')),
  reason     text,
  actor_id   uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS review_moderation_review_idx ON review_moderation(review_id);

CREATE TABLE IF NOT EXISTS trust_badges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_kind text NOT NULL,
  subject_id   text NOT NULL,
  badge_key    text NOT NULL CHECK (badge_key IN ('top_rated','verified_pro','fast_responder','trusted_seller','community_leader','rising_star','enterprise_ready','long_tenured')),
  awarded_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS trust_badges_subject_badge_uq ON trust_badges(subject_kind, subject_id, badge_key);
CREATE INDEX        IF NOT EXISTS trust_badges_subject_idx      ON trust_badges(subject_kind, subject_id);

CREATE TABLE IF NOT EXISTS references_t (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    text NOT NULL,
  contact_name  text NOT NULL CHECK (length(contact_name) BETWEEN 1 AND 120),
  contact_email text NOT NULL CHECK (length(contact_email) BETWEEN 3 AND 255),
  relationship  text NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','expired','declined')),
  requested_at  timestamptz NOT NULL DEFAULT now(),
  responded_at  timestamptz,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS references_subject_idx ON references_t(subject_id);

CREATE TABLE IF NOT EXISTS trust_verifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id   text NOT NULL,
  kind         text NOT NULL CHECK (kind IN ('identity','email','phone','skills','background','portfolio','payment','address')),
  status       text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','pending','verified','failed')),
  started_at   timestamptz,
  completed_at timestamptz,
  expires_at   timestamptz,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS trust_verifications_subject_kind_uq ON trust_verifications(subject_id, kind);
CREATE INDEX        IF NOT EXISTS trust_verifications_status_idx       ON trust_verifications(status);

CREATE TABLE IF NOT EXISTS trust_scores (
  subject_kind text NOT NULL,
  subject_id   text NOT NULL,
  score        integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  band         text NOT NULL DEFAULT 'emerging' CHECK (band IN ('emerging','trusted','verified','elite')),
  components   jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_kind, subject_id)
);
