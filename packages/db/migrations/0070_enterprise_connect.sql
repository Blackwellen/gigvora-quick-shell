-- Enterprise Connect & Startup Showcase — schema migration.
-- Idempotent. Append-only ec_audit enforced by trigger.

CREATE TABLE IF NOT EXISTS ec_org_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'enterprise',
  status text NOT NULL DEFAULT 'draft',
  handle text NOT NULL UNIQUE,
  legal_name text NOT NULL,
  display_name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  about text NOT NULL DEFAULT '',
  industry text,
  hq_country text,
  hq_city text,
  size_band text,
  funding_stage text,
  website_url text,
  logo_url text,
  banner_url text,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility text NOT NULL DEFAULT 'public',
  verified_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ec_orgs_kind_chk CHECK (kind IN ('enterprise','startup','scaleup','sme')),
  CONSTRAINT ec_orgs_status_chk CHECK (status IN ('draft','active','paused','archived')),
  CONSTRAINT ec_orgs_visibility_chk CHECK (visibility IN ('public','network','private'))
);
CREATE INDEX IF NOT EXISTS idx_ec_orgs_owner ON ec_org_profiles(owner_identity_id);
CREATE INDEX IF NOT EXISTS idx_ec_orgs_kind_status ON ec_org_profiles(kind, status);
CREATE INDEX IF NOT EXISTS idx_ec_orgs_industry ON ec_org_profiles(industry);

CREATE TABLE IF NOT EXISTS ec_directory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES ec_org_profiles(id) ON DELETE CASCADE,
  search_vector text NOT NULL DEFAULT '',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  region text,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_indexed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ec_dir_region ON ec_directory_entries(region);

CREATE TABLE IF NOT EXISTS ec_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id_a uuid NOT NULL REFERENCES ec_org_profiles(id) ON DELETE CASCADE,
  org_id_b uuid NOT NULL REFERENCES ec_org_profiles(id) ON DELETE CASCADE,
  relation_kind text NOT NULL DEFAULT 'partner',
  status text NOT NULL DEFAULT 'active',
  match_score int NOT NULL DEFAULT 0,
  match_reason jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ec_partners_status_chk CHECK (status IN ('proposed','active','paused','ended')),
  CONSTRAINT ec_partners_relation_chk CHECK (relation_kind IN ('partner','supplier','reseller','technology')),
  CONSTRAINT uniq_ec_partners_pair UNIQUE (org_id_a, org_id_b, relation_kind)
);
CREATE INDEX IF NOT EXISTS idx_ec_partners_a ON ec_partners(org_id_a, status);
CREATE INDEX IF NOT EXISTS idx_ec_partners_b ON ec_partners(org_id_b, status);

CREATE TABLE IF NOT EXISTS ec_procurement_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_org_id uuid NOT NULL REFERENCES ec_org_profiles(id) ON DELETE CASCADE,
  owner_identity_id uuid NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  category text,
  budget_minor int,
  currency text NOT NULL DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'draft',
  due_at timestamptz,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility text NOT NULL DEFAULT 'network',
  invited_org_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ec_proc_status_chk CHECK (status IN ('draft','open','shortlisting','awarded','closed','archived')),
  CONSTRAINT ec_proc_visibility_chk CHECK (visibility IN ('public','network','invited'))
);
CREATE INDEX IF NOT EXISTS idx_ec_proc_buyer ON ec_procurement_briefs(buyer_org_id, status);
CREATE INDEX IF NOT EXISTS idx_ec_proc_cat ON ec_procurement_briefs(category, status);

CREATE TABLE IF NOT EXISTS ec_intros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_identity_id uuid NOT NULL,
  broker_identity_id uuid NOT NULL,
  target_identity_id uuid NOT NULL,
  context_org_id uuid REFERENCES ec_org_profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  decline_reason text,
  expires_at timestamptz,
  decided_at timestamptz,
  completed_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ec_intros_status_chk CHECK (status IN ('pending','accepted','declined','expired','completed','cancelled'))
);
CREATE INDEX IF NOT EXISTS idx_ec_intros_broker ON ec_intros(broker_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_ec_intros_target ON ec_intros(target_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_ec_intros_req ON ec_intros(requester_identity_id, status);

CREATE TABLE IF NOT EXISTS ec_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_org_id uuid NOT NULL REFERENCES ec_org_profiles(id) ON DELETE CASCADE,
  owner_identity_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'boardroom',
  status text NOT NULL DEFAULT 'draft',
  title text NOT NULL,
  agenda text NOT NULL DEFAULT '',
  starts_at timestamptz,
  ends_at timestamptz,
  video_provider text NOT NULL DEFAULT 'jitsi',
  video_room_id text,
  capacity int NOT NULL DEFAULT 50,
  invited_identity_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  recording_url text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ec_rooms_status_chk CHECK (status IN ('draft','scheduled','live','ended','archived')),
  CONSTRAINT ec_rooms_kind_chk CHECK (kind IN ('boardroom','dealroom','private','event'))
);
CREATE INDEX IF NOT EXISTS idx_ec_rooms_owner ON ec_rooms(owner_org_id, status);
CREATE INDEX IF NOT EXISTS idx_ec_rooms_time ON ec_rooms(starts_at);

CREATE TABLE IF NOT EXISTS ec_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_org_id uuid NOT NULL REFERENCES ec_org_profiles(id) ON DELETE CASCADE,
  owner_identity_id uuid NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  format text NOT NULL DEFAULT 'virtual',
  visibility text NOT NULL DEFAULT 'invited',
  capacity int NOT NULL DEFAULT 100,
  rsvp_count int NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ec_events_status_chk CHECK (status IN ('draft','published','cancelled','completed')),
  CONSTRAINT ec_events_format_chk CHECK (format IN ('virtual','in_person','hybrid'))
);
CREATE INDEX IF NOT EXISTS idx_ec_events_host ON ec_events(host_org_id, status);
CREATE INDEX IF NOT EXISTS idx_ec_events_time ON ec_events(starts_at);

CREATE TABLE IF NOT EXISTS ec_startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES ec_org_profiles(id) ON DELETE CASCADE,
  pitch_one_liner text NOT NULL DEFAULT '',
  pitch_deck_url text,
  product_demo_url text,
  fundraising jsonb NOT NULL DEFAULT '{}'::jsonb,
  traction jsonb NOT NULL DEFAULT '{}'::jsonb,
  team jsonb NOT NULL DEFAULT '[]'::jsonb,
  showcase_rank int NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ec_startups_rank ON ec_startups(showcase_rank);
CREATE INDEX IF NOT EXISTS idx_ec_startups_featured ON ec_startups(featured);

CREATE TABLE IF NOT EXISTS ec_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_identity_id uuid NOT NULL,
  actor_role text NOT NULL DEFAULT 'user',
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ec_audit_entity ON ec_audit(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_ec_audit_actor ON ec_audit(actor_identity_id);

-- Append-only enforcement on audit (no updates / deletes).
CREATE OR REPLACE FUNCTION ec_audit_block_mutation() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ec_audit is append-only';
END;
$$;

DROP TRIGGER IF EXISTS ec_audit_no_update ON ec_audit;
CREATE TRIGGER ec_audit_no_update BEFORE UPDATE ON ec_audit
  FOR EACH ROW EXECUTE FUNCTION ec_audit_block_mutation();

DROP TRIGGER IF EXISTS ec_audit_no_delete ON ec_audit;
CREATE TRIGGER ec_audit_no_delete BEFORE DELETE ON ec_audit
  FOR EACH ROW EXECUTE FUNCTION ec_audit_block_mutation();
