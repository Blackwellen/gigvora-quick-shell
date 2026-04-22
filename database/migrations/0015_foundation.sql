-- Consolidated, Drizzle-aligned schema for the hardened domains 09–12.
-- Supersedes the older per-domain files (0010_feed.sql, 0012_network.sql,
-- 0013_profiles.sql, 0014_companies.sql) where they conflict. Safe to apply
-- on a fresh db; on an existing db drop the older domain tables first.

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  domain text NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  diff jsonb,
  request_id text,
  ip text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_target_idx ON audit_events(target_type, target_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_actor_idx  ON audit_events(actor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_domain_idx ON audit_events(domain, occurred_at DESC);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  actor_id text NOT NULL,
  scope text NOT NULL,
  key text NOT NULL,
  request_hash text NOT NULL,
  response_status integer NOT NULL,
  response_body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (actor_id, scope, key)
);
CREATE INDEX IF NOT EXISTS idempotency_expires_idx ON idempotency_keys(expires_at);

-- The full per-domain DDL is owned by Drizzle in packages/db/src/schema/*.ts.
-- For environments that prefer SQL migrations, generate them via
--   pnpm --filter @gigvora/db drizzle-kit generate
-- and commit the output here as 0016_*.sql files.
