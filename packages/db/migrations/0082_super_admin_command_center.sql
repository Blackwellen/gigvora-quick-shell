-- Domain 74 — Super Admin Command Center, Feature Flags, Audit, and Platform Overrides.

CREATE TABLE IF NOT EXISTS sa_feature_flags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_pct  NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  environments JSONB NOT NULL DEFAULT '["production"]'::jsonb,
  segments     JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{kind,value}]
  variants     JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{key,weight,payload}]
  owner_id     UUID,
  created_by   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sa_flags_status ON sa_feature_flags(status);
CREATE INDEX IF NOT EXISTS idx_sa_flags_owner  ON sa_feature_flags(owner_id);

CREATE TABLE IF NOT EXISTS sa_overrides (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope        TEXT NOT NULL CHECK (scope IN ('platform','tenant','user','feature','route','domain')),
  scope_id     TEXT,
  kind         TEXT NOT NULL CHECK (kind IN ('rate_limit','maintenance','config','entitlement','kill_switch','dark_launch','cost_cap','rollout')),
  value        JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','expired','archived')),
  created_by   UUID,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sa_overrides_scope  ON sa_overrides(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_sa_overrides_status ON sa_overrides(status);
CREATE INDEX IF NOT EXISTS idx_sa_overrides_kind   ON sa_overrides(kind);

CREATE TABLE IF NOT EXISTS sa_incidents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('sev1','sev2','sev3','sev4')),
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','mitigated','resolved','postmortem','archived')),
  scope       TEXT NOT NULL DEFAULT 'platform',
  commander   UUID,
  opened_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  mitigated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes       TEXT NOT NULL DEFAULT '',
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_sa_inc_status ON sa_incidents(status, opened_at DESC);

-- Append-only platform-wide audit ledger (admin actions, override flips, flag flips).
CREATE TABLE IF NOT EXISTS sa_audit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID,
  domain      TEXT NOT NULL,                  -- 'feature_flag' | 'override' | 'incident' | 'platform'
  target_id   TEXT,
  action      TEXT NOT NULL,                  -- 'create','update','toggle','rollout','expire','impersonate','kill_switch'…
  from_state  TEXT,
  to_state    TEXT,
  diff        JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip          INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sa_audit_domain ON sa_audit(domain, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sa_audit_actor  ON sa_audit(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sa_audit_target ON sa_audit(target_id, created_at DESC);

CREATE OR REPLACE FUNCTION sa_audit_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'sa_audit is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_sa_audit_no_update ON sa_audit;
CREATE TRIGGER trg_sa_audit_no_update BEFORE UPDATE OR DELETE ON sa_audit
  FOR EACH ROW EXECUTE FUNCTION sa_audit_immutable();

-- Seeds.
INSERT INTO sa_feature_flags (key, name, description, enabled, rollout_pct, status, environments, segments) VALUES
 ('experiments.recruiter_pro_v2', 'Recruiter Pro v2',           'New recruiter pipeline experience.',         TRUE,  35, 'active', '["production"]', '[{"kind":"role","value":"recruiter"}]'),
 ('platform.gigvora_ai',          'Gigvora AI workspace',       'Internal AI workspace rollout.',             TRUE, 100, 'active', '["production","staging"]', '[]'),
 ('platform.byok_ai',             'BYOK AI providers',          'Bring-your-own-key AI provider routing.',    TRUE,  60, 'active', '["production"]', '[{"kind":"plan","value":"enterprise"}]'),
 ('safety.incident_mode',         'Incident mode banner',       'Global incident banner toggle.',             FALSE,  0, 'paused', '["production"]', '[]'),
 ('payments.escrow_v2',           'Escrow v2 release rails',    'Migration of escrow holds to v2 ledger.',    FALSE, 10, 'draft',  '["staging"]',    '[]')
ON CONFLICT (key) DO NOTHING;

INSERT INTO sa_overrides (scope, scope_id, kind, value, reason, status, expires_at) VALUES
 ('platform', NULL,            'rate_limit',  '{"per_minute":600}'::jsonb,         'Default API rate limit',                  'active', NULL),
 ('domain',   'payouts',       'cost_cap',    '{"daily_gbp":250000}'::jsonb,        'Daily payout cap (£250k)',               'active', NULL),
 ('feature',  'platform.byok_ai','rollout',   '{"pct":60}'::jsonb,                  'Hold BYOK rollout at 60% pending audit', 'active', now()+interval '14 days'),
 ('platform', NULL,            'maintenance', '{"banner":"Scheduled maintenance Sat 02:00 UTC"}'::jsonb, 'Planned maintenance', 'paused', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sa_incidents (title, severity, status, scope, opened_at, mitigated_at, notes) VALUES
 ('Search latency degradation', 'sev3', 'mitigated', 'search',  now()-interval '2 hours', now()-interval '40 minutes', 'OpenSearch shard rebalance complete; monitoring p95.'),
 ('Stripe webhook delays',      'sev2', 'open',      'payments',now()-interval '25 minutes', NULL,                     'Awaiting Stripe response; queue depth 1.2k.')
ON CONFLICT DO NOTHING;
