-- Domain — Audit Log (immutable, hash-chained)
CREATE TABLE IF NOT EXISTS audit_log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  actor_identity_id uuid,
  actor_kind text NOT NULL DEFAULT 'user' CHECK (actor_kind IN ('user','system','api_key','webhook')),
  action text NOT NULL CHECK (length(action) BETWEEN 3 AND 128),
  resource_type text NOT NULL CHECK (length(resource_type) BETWEEN 1 AND 64),
  resource_id text NOT NULL CHECK (length(resource_id) BETWEEN 1 AND 128),
  before jsonb,
  after jsonb,
  reason text,
  ip_hash text,
  user_agent text,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','notice','warning','critical')),
  prev_hash text,
  hash text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_tenant_time_idx ON audit_log_entries(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_resource_idx ON audit_log_entries(resource_type, resource_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_actor_idx ON audit_log_entries(actor_identity_id, occurred_at DESC) WHERE actor_identity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS audit_severity_idx ON audit_log_entries(tenant_id, severity, occurred_at DESC) WHERE severity IN ('warning','critical');

-- Block UPDATE/DELETE so the chain stays tamper-evident
CREATE OR REPLACE FUNCTION audit_log_block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log_entries is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log_entries;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log_entries
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();

CREATE TABLE IF NOT EXISTS audit_log_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL,
  destination_kind text NOT NULL CHECK (destination_kind IN ('s3','gcs','http','datadog','splunk')),
  destination_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  active integer NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  last_delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
