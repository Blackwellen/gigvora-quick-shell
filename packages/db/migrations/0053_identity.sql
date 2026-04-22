-- Domain: Identity
CREATE TABLE IF NOT EXISTS identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  primary_email text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  primary_handle text NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted','pending')),
  locale text NOT NULL DEFAULT 'en-US',
  timezone text NOT NULL DEFAULT 'UTC',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS identities_email_idx ON identities(tenant_id, primary_email);
CREATE UNIQUE INDEX IF NOT EXISTS identities_handle_idx ON identities(tenant_id, primary_handle);
CREATE INDEX IF NOT EXISTS identities_status_idx ON identities(tenant_id, status);

CREATE TABLE IF NOT EXISTS identity_org_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','manager','member','guest')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','removed')),
  invited_by_id uuid,
  joined_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS iom_unique_idx ON identity_org_memberships(identity_id, org_id);
CREATE INDEX IF NOT EXISTS iom_org_idx ON identity_org_memberships(org_id, status);

CREATE TABLE IF NOT EXISTS identity_handles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  handle text NOT NULL,
  kind text NOT NULL DEFAULT 'alias' CHECK (kind IN ('primary','alias','reserved')),
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ih_handle_idx ON identity_handles(handle);
CREATE INDEX IF NOT EXISTS ih_identity_idx ON identity_handles(identity_id, kind);
