-- Domain — Learning Paths
CREATE TABLE IF NOT EXISTS learning_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_identity_id uuid NOT NULL,
  slug text NOT NULL UNIQUE CHECK (length(slug) BETWEEN 3 AND 100),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  summary text NOT NULL,
  level text NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced')),
  language text NOT NULL DEFAULT 'en',
  duration_minutes integer NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  cover_url text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learning_courses_status_idx ON learning_courses(status, published_at DESC);

CREATE TABLE IF NOT EXISTS learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  UNIQUE (course_id, position)
);

CREATE TABLE IF NOT EXISTS learning_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  content_type text NOT NULL DEFAULT 'video' CHECK (content_type IN ('video','text','quiz','assignment')),
  content_url text,
  content_body text,
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  UNIQUE (module_id, position)
);

CREATE TABLE IF NOT EXISTS learning_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  student_identity_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled','refunded')),
  progress_pct integer NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (course_id, student_identity_id)
);
CREATE INDEX IF NOT EXISTS le_student_idx ON learning_enrollments(student_identity_id, enrolled_at DESC);

CREATE TABLE IF NOT EXISTS learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES learning_enrollments(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES learning_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  watched_seconds integer NOT NULL DEFAULT 0 CHECK (watched_seconds >= 0),
  completed_at timestamptz,
  UNIQUE (enrollment_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS learning_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL UNIQUE REFERENCES learning_enrollments(id) ON DELETE CASCADE,
  student_identity_id uuid NOT NULL,
  course_id uuid NOT NULL,
  certificate_number text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  pdf_url text
);
