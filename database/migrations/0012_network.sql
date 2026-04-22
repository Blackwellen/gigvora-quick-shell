-- Domain 10 — Network Graph, Connections, Followers, Degree Logic.
-- connection_requests (pending/accepted/declined/withdrawn/blocked) + connections
-- (symmetric, materialised on accept), follows (asymmetric — also used by Feed),
-- blocks, network_edges denormalised cache for degree lookups + suggestions.

CREATE TYPE connection_status AS ENUM ('pending','accepted','declined','withdrawn','blocked','expired');

CREATE TABLE IF NOT EXISTS connection_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  uuid NOT NULL,
  recipient_id  uuid NOT NULL,
  status        connection_status NOT NULL DEFAULT 'pending',
  message       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  responded_at  timestamptz,
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  CONSTRAINT cr_no_self CHECK (requester_id <> recipient_id)
);
CREATE UNIQUE INDEX cr_open_unique
  ON connection_requests(LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id))
  WHERE status = 'pending';
CREATE INDEX cr_recipient_idx ON connection_requests(recipient_id, status, created_at DESC);
CREATE INDEX cr_requester_idx ON connection_requests(requester_id, status, created_at DESC);

-- Symmetric undirected connection. We store the canonical (lo, hi) ordering.
CREATE TABLE IF NOT EXISTS connections (
  user_a_id   uuid NOT NULL,
  user_b_id   uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_a_id, user_b_id),
  CONSTRAINT conn_canonical CHECK (user_a_id < user_b_id)
);
CREATE INDEX conn_user_b_idx ON connections(user_b_id);

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id  uuid NOT NULL,
  blocked_id  uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  reason      text,
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Denormalised viewer→target degree cache. Recomputed on connection events.
-- degree: 1 = direct connection, 2 = friend-of-friend, 3 = 2nd-degree-of-friend.
CREATE TABLE IF NOT EXISTS network_edges (
  viewer_id    uuid NOT NULL,
  target_id    uuid NOT NULL,
  degree       smallint NOT NULL,
  mutual_count int NOT NULL DEFAULT 0,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (viewer_id, target_id),
  CONSTRAINT ne_degree_range CHECK (degree BETWEEN 1 AND 3)
);
CREATE INDEX ne_viewer_idx ON network_edges(viewer_id, degree, mutual_count DESC);
