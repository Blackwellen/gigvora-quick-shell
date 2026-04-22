-- Domain: Outbound Webhooks
CREATE TABLE IF NOT EXISTS webhook_event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  domain text NOT NULL,
  description text NOT NULL DEFAULT '',
  schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS whet_slug_idx ON webhook_event_types(slug);
CREATE INDEX IF NOT EXISTS whet_domain_idx ON webhook_event_types(domain);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  owner_identity_id uuid NOT NULL,
  url text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  signing_secret_ciphertext text NOT NULL,
  signing_key_version integer NOT NULL DEFAULT 1 CHECK (signing_key_version > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','disabled')),
  rate_limit_per_min integer NOT NULL DEFAULT 120 CHECK (rate_limit_per_min > 0),
  last_delivery_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  consecutive_failures integer NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whe_tenant_idx ON webhook_endpoints(tenant_id, status);
CREATE INDEX IF NOT EXISTS whe_owner_idx ON webhook_endpoints(owner_identity_id);
CREATE UNIQUE INDEX IF NOT EXISTS whe_tenant_url_idx ON webhook_endpoints(tenant_id, url);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature text NOT NULL,
  signature_key_version integer NOT NULL,
  attempt integer NOT NULL DEFAULT 1,
  max_attempts integer NOT NULL DEFAULT 8,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_flight','success','failed','dead_letter')),
  response_status integer,
  response_headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_body_excerpt text,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  attempted_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  error text,
  CHECK (attempt >= 1 AND attempt <= max_attempts)
);
CREATE INDEX IF NOT EXISTS whd_endpoint_time_idx ON webhook_deliveries(endpoint_id, scheduled_for);
CREATE INDEX IF NOT EXISTS whd_status_idx ON webhook_deliveries(status, scheduled_for);
CREATE INDEX IF NOT EXISTS whd_event_idx ON webhook_deliveries(event_id);

CREATE TABLE IF NOT EXISTS webhook_dead_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES webhook_deliveries(id) ON DELETE CASCADE,
  endpoint_id uuid NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  moved_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL,
  resolved_at timestamptz,
  replayed_delivery_id uuid REFERENCES webhook_deliveries(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS whdl_endpoint_idx ON webhook_dead_letters(endpoint_id, moved_at);
CREATE UNIQUE INDEX IF NOT EXISTS whdl_delivery_idx ON webhook_dead_letters(delivery_id);
