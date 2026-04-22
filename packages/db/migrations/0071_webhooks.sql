-- Domain — Outbound Webhooks
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  owner_identity_id uuid NOT NULL,
  url text NOT NULL CHECK (url ~* '^https?://'),
  description text,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  secret text NOT NULL CHECK (length(secret) >= 32),
  active boolean NOT NULL DEFAULT true,
  api_version text NOT NULL DEFAULT '2025-01-01',
  failure_count integer NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS webhook_endpoints_tenant_idx ON webhook_endpoints(tenant_id, active);

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  event_name text NOT NULL CHECK (length(event_name) BETWEEN 3 AND 128),
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS webhook_events_tenant_idx ON webhook_events(tenant_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','abandoned')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0 AND attempt_count <= 20),
  response_status integer CHECK (response_status IS NULL OR (response_status >= 100 AND response_status <= 599)),
  response_body text,
  request_body jsonb NOT NULL,
  signature_header text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  next_retry_at timestamptz
);
CREATE INDEX IF NOT EXISTS webhook_deliveries_endpoint_idx ON webhook_deliveries(endpoint_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS webhook_deliveries_retry_idx ON webhook_deliveries(next_retry_at) WHERE status = 'pending';
