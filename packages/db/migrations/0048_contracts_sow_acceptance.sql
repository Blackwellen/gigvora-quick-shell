-- Domain: Contracts & SOW Acceptance
CREATE TABLE IF NOT EXISTS master_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  client_org_id uuid NOT NULL,
  vendor_org_id uuid NOT NULL,
  title text NOT NULL,
  jurisdiction text NOT NULL DEFAULT 'US-DE',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','countersigned','executed','terminated')),
  effective_at timestamptz,
  terminated_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS msa_pair_idx ON master_agreements(tenant_id, client_org_id, vendor_org_id, title);
CREATE INDEX IF NOT EXISTS msa_status_idx ON master_agreements(tenant_id, status);

CREATE TABLE IF NOT EXISTS sow_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  msa_id uuid REFERENCES master_agreements(id) ON DELETE SET NULL,
  scope_kind text NOT NULL CHECK (scope_kind IN ('project','job','gig','service','retainer')),
  scope_id uuid NOT NULL,
  title text NOT NULL,
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  payment_terms text NOT NULL DEFAULT 'net30',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','countersigned','executed','cancelled','expired')),
  expires_at timestamptz,
  executed_at timestamptz,
  pdf_storage_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sow_scope_idx ON sow_documents(tenant_id, scope_kind, scope_id);
CREATE INDEX IF NOT EXISTS sow_msa_idx ON sow_documents(msa_id);
CREATE INDEX IF NOT EXISTS sow_status_idx ON sow_documents(tenant_id, status);

CREATE TABLE IF NOT EXISTS sow_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_id uuid NOT NULL REFERENCES sow_documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  author_id uuid NOT NULL,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sow_version_unique_idx ON sow_versions(sow_id, version_number);
CREATE INDEX IF NOT EXISTS sow_version_current_idx ON sow_versions(sow_id, is_current);

CREATE TABLE IF NOT EXISTS sow_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_id uuid NOT NULL REFERENCES sow_documents(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES sow_versions(id) ON DELETE CASCADE,
  signer_id uuid NOT NULL,
  signer_role text NOT NULL CHECK (signer_role IN ('client','vendor','witness')),
  method text NOT NULL DEFAULT 'typed' CHECK (method IN ('typed','drawn','esign')),
  external_provider text,
  external_envelope_id text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  signature_data text
);
CREATE INDEX IF NOT EXISTS sow_sig_sow_idx ON sow_signatures(sow_id, signer_role);
CREATE UNIQUE INDEX IF NOT EXISTS sow_sig_unique_idx ON sow_signatures(version_id, signer_id);

CREATE TABLE IF NOT EXISTS sow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_id uuid NOT NULL REFERENCES sow_documents(id) ON DELETE CASCADE,
  actor_id uuid,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sow_event_idx ON sow_events(sow_id, occurred_at);
