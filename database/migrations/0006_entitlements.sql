-- Domain 04 — Roles, Entitlements, Plans & Access Gating
-- State machines:
--   subscriptions:  trialing | active | past_due | paused | canceled | expired
--   role_grants:    pending | active | revoked | expired
--   plan_changes:   pending | applied | failed | refunded
--   entitlement_overrides: active | revoked | expired
--   access_attempts: allowed | denied | upgrade_required | role_required

CREATE TABLE IF NOT EXISTS plans (
  id            text PRIMARY KEY,                         -- 'free' | 'starter' | 'pro' | 'business' | 'enterprise'
  label         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  price_monthly numeric(12,2) NOT NULL DEFAULT 0,
  price_annual  numeric(12,2) NOT NULL DEFAULT 0,
  entitlements  text[] NOT NULL DEFAULT '{}',
  limits        jsonb  NOT NULL DEFAULT '{}'::jsonb,
  highlight     boolean NOT NULL DEFAULT false,
  badge         text,
  position      int NOT NULL DEFAULT 0,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_grants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid NOT NULL,
  org_id       uuid,                                       -- nullable for personal roles
  role         text NOT NULL CHECK (role IN ('user','professional','enterprise','admin','moderator','support')),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','revoked','expired')),
  granted_by   uuid,
  granted_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz,
  revoked_at   timestamptz,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (identity_id, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::uuid), role)
);
CREATE INDEX IF NOT EXISTS idx_role_grants_identity ON role_grants(identity_id, status);
CREATE INDEX IF NOT EXISTS idx_role_grants_org ON role_grants(org_id, status);

CREATE TABLE IF NOT EXISTS subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     uuid,                                    -- personal subs
  org_id          uuid,                                    -- enterprise subs
  plan_id         text NOT NULL REFERENCES plans(id),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing','active','past_due','paused','canceled','expired')),
  billing_cycle   text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
  seats           int  NOT NULL DEFAULT 1,
  trial_ends_at   timestamptz,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end   timestamptz NOT NULL DEFAULT now() + interval '30 days',
  cancel_at       timestamptz,
  canceled_at     timestamptz,
  external_ref    text,                                    -- stripe sub id etc
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK ((identity_id IS NOT NULL) OR (org_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_identity ON subscriptions(identity_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(org_id, status);

CREATE TABLE IF NOT EXISTS plan_changes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  from_plan       text REFERENCES plans(id),
  to_plan         text NOT NULL REFERENCES plans(id),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','applied','failed','refunded')),
  requested_by    uuid,
  reason          text,
  applied_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plan_changes_subscription ON plan_changes(subscription_id, created_at DESC);

CREATE TABLE IF NOT EXISTS entitlement_overrides (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid,
  org_id       uuid,
  feature      text NOT NULL,                              -- e.g. 'recruiter-pro'
  grant        boolean NOT NULL DEFAULT true,              -- true=grant, false=deny
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  reason       text,
  granted_by   uuid,
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK ((identity_id IS NOT NULL) OR (org_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_overrides_identity_feature ON entitlement_overrides(identity_id, feature, status);
CREATE INDEX IF NOT EXISTS idx_overrides_org_feature ON entitlement_overrides(org_id, feature, status);

CREATE TABLE IF NOT EXISTS access_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid,
  org_id       uuid,
  feature      text,
  required_role text,
  outcome      text NOT NULL CHECK (outcome IN ('allowed','denied','upgrade_required','role_required')),
  route        text,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_access_attempts_identity ON access_attempts(identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_attempts_feature ON access_attempts(feature, outcome, created_at DESC);

CREATE TABLE IF NOT EXISTS role_switch_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  uuid NOT NULL,
  from_role    text,
  to_role      text NOT NULL,
  org_id       uuid,
  ip           inet,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_role_switch_identity ON role_switch_events(identity_id, created_at DESC);
