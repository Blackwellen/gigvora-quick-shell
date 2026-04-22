-- Networking + Speed Networking + Events + Groups — schema migration.
-- Append-only audit; status CHECKs; Stripe-ready paid-room fields.

-- ───── Networking Rooms ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS net_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'open',           -- open | private | speed | event
  status text NOT NULL DEFAULT 'draft',        -- draft | scheduled | live | ended | archived
  title text NOT NULL,
  topic text NOT NULL DEFAULT '',
  starts_at timestamptz,
  ends_at timestamptz,
  capacity int NOT NULL DEFAULT 25,
  video_provider text NOT NULL DEFAULT 'jitsi', -- jitsi | livekit | daily
  video_room_id text,
  recording_url text,
  -- Paid-room (Stripe-ready)
  is_paid boolean NOT NULL DEFAULT false,
  price_minor int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  stripe_product_id text,
  stripe_price_id text,
  -- Speed-networking specific
  speed_round_seconds int NOT NULL DEFAULT 180,
  speed_match_strategy text NOT NULL DEFAULT 'interest_overlap', -- interest_overlap | random | industry
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  invited_identity_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT net_rooms_status_chk CHECK (status IN ('draft','scheduled','live','ended','archived')),
  CONSTRAINT net_rooms_kind_chk   CHECK (kind IN ('open','private','speed','event')),
  CONSTRAINT net_rooms_provider_chk CHECK (video_provider IN ('jitsi','livekit','daily'))
);
CREATE INDEX IF NOT EXISTS idx_net_rooms_owner ON net_rooms(owner_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_net_rooms_time ON net_rooms(starts_at);
CREATE INDEX IF NOT EXISTS idx_net_rooms_kind ON net_rooms(kind, status);

CREATE TABLE IF NOT EXISTS net_room_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES net_rooms(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'attendee',  -- host | cohost | attendee | observer
  joined_at timestamptz,
  left_at timestamptz,
  paid_status text NOT NULL DEFAULT 'free', -- free | pending | paid | refunded
  stripe_session_id text,
  card_shared boolean NOT NULL DEFAULT false,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT net_attendees_role_chk CHECK (role IN ('host','cohost','attendee','observer')),
  CONSTRAINT uniq_net_room_member UNIQUE (room_id, identity_id)
);
CREATE INDEX IF NOT EXISTS idx_net_attendees_room ON net_room_attendees(room_id);
CREATE INDEX IF NOT EXISTS idx_net_attendees_id ON net_room_attendees(identity_id);

-- ───── Speed-networking matches (per round) ─────────────────────────
CREATE TABLE IF NOT EXISTS net_speed_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES net_rooms(id) ON DELETE CASCADE,
  round_index int NOT NULL,
  identity_a uuid NOT NULL,
  identity_b uuid NOT NULL,
  score int NOT NULL DEFAULT 0,
  reason jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome text,                              -- connected | passed | reported
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_speed_pair UNIQUE (room_id, round_index, identity_a, identity_b)
);
CREATE INDEX IF NOT EXISTS idx_speed_matches_room ON net_speed_matches(room_id, round_index);

-- ───── Digital business cards (already-implied feature, persisted now) ─────
CREATE TABLE IF NOT EXISTS net_business_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  headline text NOT NULL DEFAULT '',
  email text,
  phone text,
  website text,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{label, url}]
  avatar_url text,
  accent_color text NOT NULL DEFAULT 'oklch(0.5 0.18 240)',
  visibility text NOT NULL DEFAULT 'connections', -- public | connections | private
  share_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT net_card_visibility_chk CHECK (visibility IN ('public','connections','private'))
);

CREATE TABLE IF NOT EXISTS net_card_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES net_business_cards(id) ON DELETE CASCADE,
  from_identity_id uuid NOT NULL,
  to_identity_id uuid NOT NULL,
  context text NOT NULL DEFAULT 'manual',     -- manual | room | speed | event | group
  context_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_card_share UNIQUE (card_id, to_identity_id, context_id)
);
CREATE INDEX IF NOT EXISTS idx_card_shares_to ON net_card_shares(to_identity_id);

-- ───── Events ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evt_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_identity_id uuid NOT NULL,
  host_org_id uuid,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',       -- draft | published | live | completed | cancelled
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  format text NOT NULL DEFAULT 'virtual',     -- virtual | in_person | hybrid
  visibility text NOT NULL DEFAULT 'public',  -- public | network | invited
  location_name text,
  location_lat numeric,
  location_lng numeric,
  capacity int NOT NULL DEFAULT 100,
  rsvp_count int NOT NULL DEFAULT 0,
  -- Ticketing (Stripe-ready)
  is_paid boolean NOT NULL DEFAULT false,
  price_minor int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  stripe_product_id text,
  stripe_price_id text,
  cover_image_url text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evt_status_chk CHECK (status IN ('draft','published','live','completed','cancelled')),
  CONSTRAINT evt_format_chk CHECK (format IN ('virtual','in_person','hybrid')),
  CONSTRAINT evt_visibility_chk CHECK (visibility IN ('public','network','invited'))
);
CREATE INDEX IF NOT EXISTS idx_evt_host ON evt_events(host_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_evt_time ON evt_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_evt_visibility ON evt_events(visibility, status);

CREATE TABLE IF NOT EXISTS evt_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES evt_events(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'going',       -- going | maybe | declined | waitlist | checked_in
  paid_status text NOT NULL DEFAULT 'free',
  stripe_session_id text,
  rsvp_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evt_rsvp_status_chk CHECK (status IN ('going','maybe','declined','waitlist','checked_in')),
  CONSTRAINT uniq_evt_rsvp UNIQUE (event_id, identity_id)
);
CREATE INDEX IF NOT EXISTS idx_evt_rsvps_event ON evt_rsvps(event_id);

-- ───── Groups ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  handle text NOT NULL UNIQUE,
  display_name text NOT NULL,
  about text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'public',  -- public | private | secret
  join_policy text NOT NULL DEFAULT 'open',   -- open | request | invite_only
  cover_image_url text,
  category text,
  member_count int NOT NULL DEFAULT 0,
  post_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',      -- active | archived | suspended
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT grp_status_chk CHECK (status IN ('active','archived','suspended')),
  CONSTRAINT grp_visibility_chk CHECK (visibility IN ('public','private','secret')),
  CONSTRAINT grp_join_policy_chk CHECK (join_policy IN ('open','request','invite_only'))
);
CREATE INDEX IF NOT EXISTS idx_grp_visibility ON grp_groups(visibility, status);

CREATE TABLE IF NOT EXISTS grp_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES grp_groups(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',        -- owner | admin | mod | member | pending
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT grp_role_chk CHECK (role IN ('owner','admin','mod','member','pending')),
  CONSTRAINT uniq_grp_member UNIQUE (group_id, identity_id)
);
CREATE INDEX IF NOT EXISTS idx_grp_members_group ON grp_members(group_id);
CREATE INDEX IF NOT EXISTS idx_grp_members_id ON grp_members(identity_id);

CREATE TABLE IF NOT EXISTS grp_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES grp_groups(id) ON DELETE CASCADE,
  author_identity_id uuid NOT NULL,
  body text NOT NULL DEFAULT '',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  reaction_count int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  pinned boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'published',   -- draft | published | hidden | removed
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT grp_post_status_chk CHECK (status IN ('draft','published','hidden','removed'))
);
CREATE INDEX IF NOT EXISTS idx_grp_posts_group ON grp_posts(group_id, created_at DESC);

-- ───── Audit (append-only) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS neg_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_identity_id uuid NOT NULL,
  actor_role text NOT NULL DEFAULT 'user',
  domain text NOT NULL,                       -- networking | speed | event | group | card
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_neg_audit_entity ON neg_audit(domain, entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_neg_audit_actor ON neg_audit(actor_identity_id);

CREATE OR REPLACE FUNCTION neg_audit_block_mutation() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'neg_audit is append-only'; END;
$$;
DROP TRIGGER IF EXISTS neg_audit_no_update ON neg_audit;
CREATE TRIGGER neg_audit_no_update BEFORE UPDATE ON neg_audit
  FOR EACH ROW EXECUTE FUNCTION neg_audit_block_mutation();
DROP TRIGGER IF EXISTS neg_audit_no_delete ON neg_audit;
CREATE TRIGGER neg_audit_no_delete BEFORE DELETE ON neg_audit
  FOR EACH ROW EXECUTE FUNCTION neg_audit_block_mutation();
