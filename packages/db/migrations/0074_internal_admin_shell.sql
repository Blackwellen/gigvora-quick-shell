-- Domain 66 — Internal Admin Shell, Workspace Routing, Global Shortcuts, Queue Jump Logic.

CREATE TABLE IF NOT EXISTS ias_workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_-]{1,40}$'),
  label         TEXT NOT NULL CHECK (length(label) BETWEEN 1 AND 80),
  description   TEXT NOT NULL DEFAULT '',
  icon          TEXT NOT NULL DEFAULT 'shield',
  route         TEXT NOT NULL CHECK (route ~ '^/internal/[a-z0-9_/-]+$'),
  required_role TEXT NOT NULL DEFAULT 'operator'
                CHECK (required_role IN ('operator','moderator','finance','trust_safety','super_admin')),
  risk_band     TEXT NOT NULL DEFAULT 'low' CHECK (risk_band IN ('low','medium','high','critical')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  position      INTEGER NOT NULL DEFAULT 0,
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_ias_workspace_slug UNIQUE (slug)
);
CREATE INDEX IF NOT EXISTS idx_ias_workspaces_role ON ias_workspaces(required_role, status);

CREATE TABLE IF NOT EXISTS ias_queues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES ias_workspaces(id) ON DELETE SET NULL,
  slug          TEXT NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_-]{1,40}$'),
  label         TEXT NOT NULL CHECK (length(label) BETWEEN 1 AND 80),
  domain        TEXT NOT NULL CHECK (domain IN
                ('disputes','moderation','verification','tickets','withdrawals','ads','trust_safety','finance','reports','overrides','other')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  sla_minutes   INTEGER NOT NULL DEFAULT 60 CHECK (sla_minutes BETWEEN 1 AND 10080),
  health        TEXT NOT NULL DEFAULT 'healthy' CHECK (health IN ('healthy','caution','degraded','blocked')),
  depth         INTEGER NOT NULL DEFAULT 0 CHECK (depth >= 0),
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_ias_queue_slug UNIQUE (slug)
);
CREATE INDEX IF NOT EXISTS idx_ias_queues_workspace ON ias_queues(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_ias_queues_domain    ON ias_queues(domain, status);

CREATE TABLE IF NOT EXISTS ias_queue_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id      UUID NOT NULL REFERENCES ias_queues(id) ON DELETE CASCADE,
  reference     TEXT NOT NULL CHECK (length(reference) BETWEEN 1 AND 120),
  subject       TEXT NOT NULL DEFAULT '',
  priority      TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  state         TEXT NOT NULL DEFAULT 'pending'
                CHECK (state IN ('pending','active','escalated','blocked','completed','failed','refunded','archived')),
  assignee_id   UUID,
  due_at        TIMESTAMPTZ,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_ias_queue_item UNIQUE (queue_id, reference)
);
CREATE INDEX IF NOT EXISTS idx_ias_qi_queue_state ON ias_queue_items(queue_id, state, priority);
CREATE INDEX IF NOT EXISTS idx_ias_qi_assignee    ON ias_queue_items(assignee_id, state);

CREATE TABLE IF NOT EXISTS ias_shortcuts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo         TEXT NOT NULL CHECK (length(combo) BETWEEN 1 AND 20),
  label         TEXT NOT NULL CHECK (length(label) BETWEEN 1 AND 80),
  action        TEXT NOT NULL CHECK (action IN ('navigate','open_drawer','toggle_command','queue_jump','custom')),
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  scope         TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global','workspace','queue')),
  required_role TEXT NOT NULL DEFAULT 'operator'
                CHECK (required_role IN ('operator','moderator','finance','trust_safety','super_admin')),
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_ias_shortcut_combo UNIQUE (combo, scope)
);

CREATE TABLE IF NOT EXISTS ias_shell_audit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     UUID,
  identity_id     UUID,
  action          TEXT NOT NULL,
  workspace_slug  TEXT,
  queue_slug      TEXT,
  target_type     TEXT,
  target_id       UUID,
  diff            JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip              TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ias_audit_op   ON ias_shell_audit(operator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ias_audit_ws   ON ias_shell_audit(workspace_slug, created_at DESC);

-- Append-only shell audit
CREATE OR REPLACE FUNCTION ias_audit_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'ias_shell_audit is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_ias_audit_no_update ON ias_shell_audit;
CREATE TRIGGER trg_ias_audit_no_update BEFORE UPDATE OR DELETE ON ias_shell_audit
  FOR EACH ROW EXECUTE FUNCTION ias_audit_immutable();

-- Seed reference data so the shell renders believable state out of the box.
INSERT INTO ias_workspaces (slug, label, description, icon, route, required_role, risk_band, position) VALUES
  ('command',       'Command Center',     'Operator landing — KPIs, queues, audit',           'shield',     '/internal/admin-shell',                'operator',    'low',      0),
  ('disputes',      'Dispute Operations', 'Manage disputes, refunds, escalations',            'gavel',      '/internal/dispute-operations-dashboard','operator',    'medium',   1),
  ('moderation',    'Moderator',          'Content + behaviour moderation',                   'flag',       '/internal/moderator-dashboard',         'moderator',   'medium',   2),
  ('trust_safety',  'Trust & Safety',     'ML-assisted incident triage',                      'shield-alert','/internal/trust-safety-ml-dashboard',  'trust_safety','high',     3),
  ('verification',  'Verification',       'KYC + compliance review queue',                    'badge-check','/internal/verification-compliance-dashboard','operator','high',  4),
  ('finance',       'Finance',            'Withdrawals, payouts, refunds',                    'wallet',     '/internal/finance-admin-dashboard',     'finance',     'critical', 5),
  ('ads_ops',       'Ads Ops',            'Ad policy + campaign incidents',                   'megaphone',  '/internal/ads-ops-dashboard',           'operator',    'medium',   6),
  ('super_admin',   'Super Admin',        'Cross-domain command + override',                  'crown',      '/internal/super-admin-command-center',  'super_admin', 'critical', 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO ias_queues (workspace_id, slug, label, domain, sla_minutes, health, depth) VALUES
  ((SELECT id FROM ias_workspaces WHERE slug='disputes'),     'disputes-open',     'Open disputes',         'disputes',     120, 'caution',   23),
  ((SELECT id FROM ias_workspaces WHERE slug='moderation'),   'moderation-queue',  'Moderation queue',      'moderation',    60, 'healthy',   42),
  ((SELECT id FROM ias_workspaces WHERE slug='verification'), 'verification-kyc',  'KYC backlog',           'verification', 240, 'degraded',  87),
  ((SELECT id FROM ias_workspaces WHERE slug='finance'),      'finance-withdraw',  'Withdrawal review',     'withdrawals',  180, 'caution',   12),
  ((SELECT id FROM ias_workspaces WHERE slug='trust_safety'), 'trust-incidents',   'Active incidents',      'trust_safety',  30, 'healthy',    4),
  ((SELECT id FROM ias_workspaces WHERE slug='ads_ops'),      'ads-policy',        'Ads policy review',     'ads',           90, 'healthy',    9)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO ias_shortcuts (combo, label, action, scope, required_role, payload) VALUES
  ('G H', 'Go to Command',         'navigate',       'global', 'operator',    '{"route":"/internal/admin-shell"}'::jsonb),
  ('G Q', 'Queue Jump',            'queue_jump',     'global', 'operator',    '{}'::jsonb),
  ('G D', 'Disputes',              'navigate',       'global', 'operator',    '{"route":"/internal/dispute-operations-dashboard"}'::jsonb),
  ('G M', 'Moderation',            'navigate',       'global', 'moderator',   '{"route":"/internal/moderator-dashboard"}'::jsonb),
  ('G F', 'Finance',               'navigate',       'global', 'finance',     '{"route":"/internal/finance-admin-dashboard"}'::jsonb),
  ('G T', 'Trust & Safety',        'navigate',       'global', 'trust_safety','{"route":"/internal/trust-safety-ml-dashboard"}'::jsonb),
  ('G S', 'Super Admin',           'navigate',       'global', 'super_admin', '{"route":"/internal/super-admin-command-center"}'::jsonb),
  ('?',   'Show Shortcuts',        'open_drawer',    'global', 'operator',    '{"drawer":"shortcuts"}'::jsonb),
  ('Cmd K', 'Command Palette',     'toggle_command', 'global', 'operator',    '{}'::jsonb)
ON CONFLICT (combo, scope) DO NOTHING;
