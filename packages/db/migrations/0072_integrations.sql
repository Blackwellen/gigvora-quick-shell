-- Domain — Integrations Sync v2 (OAuth tokens + API keys + sync runs)
-- The `integration_connectors` and `integration_connections` tables already
-- exist via the original `integrations.ts` schema; this migration only adds
-- the OAuth/api-key vault + sync-run history.

CREATE TABLE IF NOT EXISTS integration_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text,
  expires_at timestamptz,
  token_type text NOT NULL DEFAULT 'Bearer',
  scope text,
  rotated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS int_oauth_conn_idx ON integration_oauth_tokens(connection_id);
CREATE INDEX IF NOT EXISTS int_oauth_expiring_idx ON integration_oauth_tokens(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS integration_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  key_encrypted text NOT NULL,
  hint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed')),
  started_at timestamptz,
  completed_at timestamptz,
  records_read integer NOT NULL DEFAULT 0 CHECK (records_read >= 0),
  records_written integer NOT NULL DEFAULT 0 CHECK (records_written >= 0),
  error_message text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS int_sync_conn_idx ON integration_sync_runs(connection_id, started_at DESC);
