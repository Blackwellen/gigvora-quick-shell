-- Domain: Entitlements (plans, subscriptions, role grants, denials)
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  display_name text NOT NULL,
  tier integer NOT NULL DEFAULT 0 CHECK (tier >= 0),
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  interval text NOT NULL DEFAULT 'month' CHECK (interval IN ('month','year','once')),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS plans_slug_idx ON plans(slug);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  identity_id uuid,
  org_id uuid,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing','active','past_due','cancelled','expired')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  external_provider text,
  external_subscription_id text,
  cancelled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (identity_id IS NOT NULL OR org_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS subs_holder_idx ON subscriptions(tenant_id, identity_id, org_id, status);
CREATE INDEX IF NOT EXISTS subs_plan_idx ON subscriptions(plan_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS subs_external_idx ON subscriptions(external_provider, external_subscription_id);

CREATE TABLE IF NOT EXISTS role_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  identity_id uuid NOT NULL,
  org_id uuid,
  role text NOT NULL CHECK (role IN ('user','professional','enterprise','recruiter','admin','moderator','trust_safety')),
  granted_by_id uuid,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS rg_unique_idx ON role_grants(tenant_id, identity_id, org_id, role);
CREATE INDEX IF NOT EXISTS rg_identity_idx ON role_grants(identity_id, role);

CREATE TABLE IF NOT EXISTS entitlement_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  identity_id uuid,
  org_id uuid,
  feature_key text NOT NULL,
  source text NOT NULL DEFAULT 'plan' CHECK (source IN ('plan','trial','grant','admin_override')),
  source_ref_id uuid,
  numeric_limit integer,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (identity_id IS NOT NULL OR org_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS eg_holder_idx ON entitlement_grants(tenant_id, identity_id, org_id, feature_key);
CREATE INDEX IF NOT EXISTS eg_feature_idx ON entitlement_grants(feature_key);

CREATE TABLE IF NOT EXISTS entitlement_denials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  identity_id uuid NOT NULL,
  feature_key text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  surfaced_drawer boolean NOT NULL DEFAULT true,
  context jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS ed_identity_idx ON entitlement_denials(identity_id, attempted_at);
CREATE INDEX IF NOT EXISTS ed_feature_idx ON entitlement_denials(feature_key, attempted_at);
