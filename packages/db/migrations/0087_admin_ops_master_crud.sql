-- ============================================================
-- 0087_admin_ops_master_crud.sql
-- FD-16 closure — Admin Ops master CRUD (companies/users/mentors)
-- + cs_tasks table for the Customer Service delegated-task queue.
-- All tables live in the user's own Postgres; never in Lovable Cloud.
-- ============================================================

-- ── Admin Ops master records ──────────────────────────────
CREATE TABLE IF NOT EXISTS admin_ops_companies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       text UNIQUE NOT NULL,
  name            text NOT NULL,
  slug            text UNIQUE,
  verification    text NOT NULL DEFAULT 'pending'
    CHECK (verification IN ('pending','verified','rejected','suspended')),
  plan            text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','pro','team','enterprise')),
  headcount       int NOT NULL DEFAULT 0,
  region          text,
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','watch','suspended','archived')),
  risk_score      int NOT NULL DEFAULT 0,
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aoc_status ON admin_ops_companies (status);
CREATE INDEX IF NOT EXISTS idx_aoc_plan   ON admin_ops_companies (plan);

CREATE TABLE IF NOT EXISTS admin_ops_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       text UNIQUE NOT NULL,
  handle          text UNIQUE NOT NULL,
  email           text,
  plan            text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','pro','team','enterprise')),
  region          text,
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','watch','suspended','locked','archived')),
  risk_score      int NOT NULL DEFAULT 0,
  joined_at       date NOT NULL DEFAULT current_date,
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aou_status ON admin_ops_users (status);
CREATE INDEX IF NOT EXISTS idx_aou_plan   ON admin_ops_users (plan);

CREATE TABLE IF NOT EXISTS admin_ops_mentors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       text UNIQUE NOT NULL,
  display_name    text NOT NULL,
  speciality      text NOT NULL,
  rating          numeric(3,2) NOT NULL DEFAULT 0,
  sessions        int NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','suspended','archived')),
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aom_status ON admin_ops_mentors (status);

-- Append-only per-row audit log for every CRUD action ── replays w/ actor.
CREATE TABLE IF NOT EXISTS admin_ops_audit (
  id           bigserial PRIMARY KEY,
  entity       text NOT NULL CHECK (entity IN ('company','user','mentor')),
  entity_id    uuid NOT NULL,
  actor_id     uuid,
  action       text NOT NULL,
  before       jsonb,
  after        jsonb,
  ip           text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ao_audit_entity ON admin_ops_audit (entity, entity_id, created_at DESC);

-- Block updates / deletes on audit (append-only).
CREATE OR REPLACE FUNCTION admin_ops_audit_lock() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'admin_ops_audit is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_ao_audit_lock ON admin_ops_audit;
CREATE TRIGGER trg_ao_audit_lock BEFORE UPDATE OR DELETE ON admin_ops_audit
  FOR EACH ROW EXECUTE FUNCTION admin_ops_audit_lock();

-- ── Customer Service: delegated tasks queue ──────────────
CREATE TABLE IF NOT EXISTS cs_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference    text UNIQUE NOT NULL,
  title        text NOT NULL,
  detail       text,
  assignee_id  uuid,
  created_by   uuid,
  ticket_id    uuid,
  priority     text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  status       text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','blocked','done','cancelled')),
  due_at       timestamptz,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_tasks_status   ON cs_tasks (status, priority, due_at);
CREATE INDEX IF NOT EXISTS idx_cs_tasks_assignee ON cs_tasks (assignee_id, status);

-- Idempotent demo seed so the Admin Ops portal never lands empty in dev.
INSERT INTO admin_ops_companies (reference, name, slug, verification, plan, headcount, region, status, risk_score)
VALUES
  ('co_220','Acme Co.','acme-co','verified','pro',128,'UK','active',8),
  ('co_219','Lyra Labs','lyra-labs','verified','team',42,'US','watch',34),
  ('co_217','Northwind Holdings','northwind','pending','free',18,'IE','active',12)
ON CONFLICT (reference) DO NOTHING;

INSERT INTO admin_ops_users (reference, handle, email, plan, region, status, risk_score, joined_at)
VALUES
  ('u_1182','sarah_io','sarah@example.com','pro','UK','active',5,'2024-03-12'),
  ('u_5510','mark.k','mark@example.com','free','US','watch',42,'2024-08-04'),
  ('u_8810','anon_99',NULL,'free','Unknown','suspended',88,'2025-01-22'),
  ('u_2210','designcraft','dc@example.com','pro','IE','active',9,'2023-11-08')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO admin_ops_mentors (reference, display_name, speciality, rating, sessions, status)
VALUES
  ('mn_120','Sarah Iozzia','Product strategy',4.90,128,'active'),
  ('mn_118','Mark Kahan','Engineering leadership',4.80,92,'active'),
  ('mn_115','Aisha Fenton','Design systems',4.95,210,'active')
ON CONFLICT (reference) DO NOTHING;
