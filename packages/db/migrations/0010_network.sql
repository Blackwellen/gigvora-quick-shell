-- Domain 10 — Network: Connection Requests, Connections, Blocks, Edges.
-- Mirrors packages/db/src/schema/network.ts. Owned by apps/api-nest/src/modules/network/.
-- Never run against Lovable Cloud Supabase.

CREATE TABLE IF NOT EXISTS connection_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id       uuid NOT NULL,
  to_id         uuid NOT NULL,
  note          text CHECK (note IS NULL OR length(note) <= 500),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','withdrawn','expired')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  responded_at  timestamptz,
  CONSTRAINT cr_not_self CHECK (from_id <> to_id)
);
CREATE INDEX IF NOT EXISTS cr_to_idx   ON connection_requests(to_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS cr_from_idx ON connection_requests(from_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS cr_pending_uq ON connection_requests(from_id, to_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS connections (
  lo_id      uuid NOT NULL,
  hi_id      uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lo_id, hi_id),
  CONSTRAINT conn_canonical CHECK (lo_id < hi_id)
);
CREATE INDEX IF NOT EXISTS connections_hi_idx ON connections(hi_id);

CREATE TABLE IF NOT EXISTS user_blocks (
  actor_id   uuid NOT NULL,
  target_id  uuid NOT NULL,
  reason     text CHECK (reason IS NULL OR length(reason) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_id, target_id),
  CONSTRAINT block_not_self CHECK (actor_id <> target_id)
);
CREATE INDEX IF NOT EXISTS user_blocks_target_idx ON user_blocks(target_id);

CREATE TABLE IF NOT EXISTS network_edges (
  identity_id   uuid NOT NULL,
  peer_id       uuid NOT NULL,
  degree        integer NOT NULL CHECK (degree BETWEEN 1 AND 4),
  mutual_count  integer NOT NULL DEFAULT 0 CHECK (mutual_count >= 0),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (identity_id, peer_id)
);
CREATE INDEX IF NOT EXISTS edges_identity_idx ON network_edges(identity_id, degree);
CREATE INDEX IF NOT EXISTS edges_peer_idx     ON network_edges(peer_id, degree);
