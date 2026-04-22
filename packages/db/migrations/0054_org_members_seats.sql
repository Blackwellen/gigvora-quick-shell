-- Domain 54 — Organization Members, Seats, Roles, Permission Controls
-- State machines:
--   oms_invitations.status: pending → accepted|revoked|expired
--   oms_members.status:     active ↔ suspended → removed
--   oms_seats.status:       available ↔ assigned; locked

CREATE TABLE IF NOT EXISTS oms_roles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_identity_id          UUID NOT NULL,
  key                      TEXT NOT NULL,
  name                     TEXT NOT NULL,
  description              TEXT,
  is_system                BOOLEAN NOT NULL DEFAULT FALSE,
  permissions              JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_oms_roles_org_key UNIQUE (org_identity_id, key)
);
CREATE INDEX IF NOT EXISTS idx_oms_roles_org ON oms_roles(org_identity_id);

CREATE TABLE IF NOT EXISTS oms_members (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_identity_id          UUID NOT NULL,
  member_identity_id       UUID NOT NULL,
  full_name                TEXT NOT NULL,
  email                    TEXT NOT NULL,
  role_key                 TEXT NOT NULL DEFAULT 'member',
  status                   TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','suspended','removed')),
  seat_id                  UUID,
  last_active_at           TIMESTAMPTZ,
  invited_by               UUID,
  joined_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at               TIMESTAMPTZ,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT uniq_oms_members_org_member UNIQUE (org_identity_id, member_identity_id)
);
CREATE INDEX IF NOT EXISTS idx_oms_members_org ON oms_members(org_identity_id, status);

CREATE TABLE IF NOT EXISTS oms_seats (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_identity_id          UUID NOT NULL,
  plan                     TEXT NOT NULL DEFAULT 'pro',
  seat_type                TEXT NOT NULL DEFAULT 'full' CHECK (seat_type IN ('full','viewer','guest')),
  status                   TEXT NOT NULL DEFAULT 'available'
                           CHECK (status IN ('available','assigned','locked')),
  assigned_member_id       UUID,
  assigned_at              TIMESTAMPTZ,
  cost_cents               INTEGER NOT NULL DEFAULT 0,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oms_seats_org ON oms_seats(org_identity_id, status);

CREATE TABLE IF NOT EXISTS oms_invitations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_identity_id          UUID NOT NULL,
  email                    TEXT NOT NULL,
  role_key                 TEXT NOT NULL DEFAULT 'member',
  seat_type                TEXT NOT NULL DEFAULT 'full',
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','accepted','revoked','expired')),
  invited_by               UUID NOT NULL,
  token                    TEXT NOT NULL,
  expires_at               TIMESTAMPTZ NOT NULL,
  accepted_at              TIMESTAMPTZ,
  accepted_member_id       UUID,
  revoked_at               TIMESTAMPTZ,
  meta                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_oms_inv_token UNIQUE (token)
);
CREATE INDEX IF NOT EXISTS idx_oms_inv_org ON oms_invitations(org_identity_id, status);

CREATE TABLE IF NOT EXISTS oms_audit_events (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_identity_id          UUID NOT NULL,
  actor_identity_id        UUID,
  action                   TEXT NOT NULL,
  target_type              TEXT,
  target_id                UUID,
  diff                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip                       TEXT,
  user_agent               TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oms_audit_org ON oms_audit_events(org_identity_id, created_at DESC);

-- Seed system roles + demo data
INSERT INTO oms_roles (org_identity_id, key, name, description, is_system, permissions) VALUES
  ('00000000-0000-0000-0000-0000000000e1'::uuid, 'owner',   'Owner',   'Full administrative control',                      TRUE,  '["org:*","members:*","billing:*","roles:*","audit:read"]'::jsonb),
  ('00000000-0000-0000-0000-0000000000e1'::uuid, 'admin',   'Admin',   'Manage members, seats, and most settings',         TRUE,  '["members:*","roles:read","roles:assign","audit:read","seats:*"]'::jsonb),
  ('00000000-0000-0000-0000-0000000000e1'::uuid, 'manager', 'Manager', 'Manage own team members',                          TRUE,  '["members:read","members:invite","seats:read"]'::jsonb),
  ('00000000-0000-0000-0000-0000000000e1'::uuid, 'member',  'Member',  'Standard collaborator',                            TRUE,  '["members:read","seats:read"]'::jsonb),
  ('00000000-0000-0000-0000-0000000000e1'::uuid, 'viewer',  'Viewer',  'Read-only access',                                 TRUE,  '["members:read"]'::jsonb)
ON CONFLICT (org_identity_id, key) DO NOTHING;

INSERT INTO oms_seats (id, org_identity_id, plan, seat_type, status, cost_cents) VALUES
  ('00000000-0000-0000-0000-000000005401'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'team', 'full',   'assigned',  4900),
  ('00000000-0000-0000-0000-000000005402'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'team', 'full',   'assigned',  4900),
  ('00000000-0000-0000-0000-000000005403'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'team', 'full',   'available', 4900),
  ('00000000-0000-0000-0000-000000005404'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, 'team', 'viewer', 'available', 1900)
ON CONFLICT (id) DO NOTHING;

INSERT INTO oms_members (id, org_identity_id, member_identity_id, full_name, email, role_key, status, seat_id, last_active_at) VALUES
  ('00000000-0000-0000-0000-000000005501'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, '00000000-0000-0000-0000-0000000000m1'::uuid, 'Priya Patel',  'priya@example.com',  'owner',  'active', '00000000-0000-0000-0000-000000005401'::uuid, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-000000005502'::uuid, '00000000-0000-0000-0000-0000000000e1'::uuid, '00000000-0000-0000-0000-0000000000m2'::uuid, 'Marco Rossi',  'marco@example.com',  'admin',  'active', '00000000-0000-0000-0000-000000005402'::uuid, now() - interval '3 hours')
ON CONFLICT (org_identity_id, member_identity_id) DO NOTHING;

INSERT INTO oms_invitations (org_identity_id, email, role_key, seat_type, status, invited_by, token, expires_at) VALUES
  ('00000000-0000-0000-0000-0000000000e1'::uuid, 'newhire@example.com', 'member', 'full', 'pending', '00000000-0000-0000-0000-0000000000m1'::uuid, 'demo-token-54-1', now() + interval '7 days')
ON CONFLICT (token) DO NOTHING;
