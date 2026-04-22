-- Domain: Inbox (1:1 + group messaging)
CREATE TABLE IF NOT EXISTS inbox_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  kind text NOT NULL DEFAULT 'direct' CHECK (kind IN ('direct','group','broadcast','support','system')),
  title text,
  created_by_id uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text NOT NULL DEFAULT '',
  participant_count integer NOT NULL DEFAULT 0 CHECK (participant_count >= 0),
  archived boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inbox_thread_tenant_recent_idx ON inbox_threads(tenant_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS inbox_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES inbox_threads(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','guest')),
  muted_until timestamptz,
  last_read_at timestamptz,
  last_read_message_id uuid,
  unread_count integer NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS inbox_part_unique_idx ON inbox_participants(thread_id, identity_id);
CREATE INDEX IF NOT EXISTS inbox_part_identity_idx ON inbox_participants(identity_id, unread_count);

CREATE TABLE IF NOT EXISTS inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES inbox_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL DEFAULT '',
  content_type text NOT NULL DEFAULT 'text' CHECK (content_type IN ('text','markdown','html','system')),
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  reply_to_id uuid REFERENCES inbox_messages(id) ON DELETE SET NULL,
  edited_at timestamptz,
  deleted_at timestamptz,
  delivery_state text NOT NULL DEFAULT 'sent' CHECK (delivery_state IN ('queued','sent','delivered','failed')),
  reactions jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inbox_msg_thread_time_idx ON inbox_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inbox_msg_sender_idx ON inbox_messages(sender_id, created_at);

CREATE TABLE IF NOT EXISTS inbox_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES inbox_messages(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS inbox_receipt_unique_idx ON inbox_read_receipts(message_id, identity_id);

CREATE TABLE IF NOT EXISTS inbox_typing_pings (
  thread_id uuid NOT NULL REFERENCES inbox_threads(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (thread_id, identity_id)
);
