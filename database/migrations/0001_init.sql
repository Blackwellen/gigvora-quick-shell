-- Gigvora primary schema (Postgres). Replaces Supabase-managed tables.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  mfa_secret    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  cover_url    TEXT,
  headline     TEXT,
  location     TEXT,
  visibility   TEXT NOT NULL DEFAULT 'public',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE app_role AS ENUM ('user','professional','enterprise','admin');

CREATE TABLE user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role    app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  owner_id   UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE org_members (
  org_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE habits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  color         TEXT NOT NULL DEFAULT 'oklch(0.38 0.08 160)',
  frequency     JSONB NOT NULL DEFAULT '{"type":"daily"}',
  reminder_time TEXT,
  position      INT  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE habit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id   UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, date)
);

CREATE TABLE audit_log (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id  UUID REFERENCES users(id),
  action    TEXT NOT NULL,
  target    JSONB,
  meta      JSONB,
  at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_habits_user      ON habits(user_id);
CREATE INDEX idx_habit_logs_user  ON habit_logs(user_id, date);
CREATE INDEX idx_audit_actor_time ON audit_log(actor_id, at DESC);
