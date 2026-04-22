-- Domain 07 — Notifications, Real-Time Events, Activity Routing, Badges
-- Persists notifications, delivery attempts across multi-channel transports
-- (in-app, email, push, sms, webhook), per-user routing preferences, badges,
-- and a generic activity event stream consumed by the Socket.IO gateway.

CREATE TYPE notification_channel AS ENUM (
  'in_app','email','push','sms','webhook','slack'
);

CREATE TYPE notification_priority AS ENUM (
  'low','normal','high','urgent'
);

CREATE TYPE notification_status AS ENUM (
  'pending','queued','sent','delivered','read','dismissed','failed','suppressed'
);

CREATE TYPE delivery_status AS ENUM (
  'pending','sent','delivered','failed','bounced','dropped'
);

-- A single notification (one logical event per recipient). Fan-out into
-- multiple channels is recorded in notification_deliveries.
CREATE TABLE IF NOT EXISTS notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     uuid NOT NULL,           -- recipient
  org_id          uuid,
  topic           text NOT NULL,           -- e.g. 'order.completed', 'message.new'
  title           text NOT NULL,
  body            text,
  priority        notification_priority NOT NULL DEFAULT 'normal',
  status          notification_status NOT NULL DEFAULT 'pending',
  entity_type     text,
  entity_id       text,
  action_url      text,                    -- deep-link the click should go to
  category        text,                    -- 'mention','system','billing','social'
  group_key       text,                    -- collapse identical events into one card
  data            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  read_at         timestamptz,
  dismissed_at    timestamptz,
  expires_at      timestamptz
);
CREATE INDEX notifications_identity_idx ON notifications(identity_id, status, created_at DESC);
CREATE INDEX notifications_unread_idx   ON notifications(identity_id) WHERE read_at IS NULL AND dismissed_at IS NULL;
CREATE INDEX notifications_topic_idx    ON notifications(topic, created_at DESC);
CREATE INDEX notifications_group_idx    ON notifications(identity_id, group_key) WHERE group_key IS NOT NULL;

-- One row per channel attempted for a notification. Powers retry, audit, and
-- the operator delivery-log console.
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel         notification_channel NOT NULL,
  status          delivery_status NOT NULL DEFAULT 'pending',
  provider        text,                    -- 'resend','twilio','expo','slack'
  provider_msg_id text,
  attempts        int  NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  delivered_at    timestamptz,
  error           text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX notification_deliveries_status_idx ON notification_deliveries(status, last_attempt_at);
CREATE INDEX notification_deliveries_notif_idx  ON notification_deliveries(notification_id);

-- Per-user routing rules: which topics fire on which channels at which times.
-- Frontend Notification Settings page reads/writes these rows.
CREATE TABLE IF NOT EXISTS notification_preferences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     uuid NOT NULL,
  topic           text NOT NULL,           -- '*' allowed as catch-all
  channels        notification_channel[] NOT NULL DEFAULT '{in_app}',
  quiet_hours     jsonb NOT NULL DEFAULT '{}'::jsonb, -- {start:"22:00",end:"07:00",tz:"Europe/London"}
  digest          text NOT NULL DEFAULT 'realtime',   -- 'realtime'|'hourly'|'daily'|'off'
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identity_id, topic)
);
CREATE INDEX notification_preferences_identity_idx ON notification_preferences(identity_id);

-- Push / device tokens (Expo, FCM, APNs, Web Push).
CREATE TABLE IF NOT EXISTS device_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     uuid NOT NULL,
  platform        text NOT NULL,           -- 'web','ios','android','flutter'
  token           text NOT NULL,
  label           text,
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz,
  UNIQUE (identity_id, token)
);
CREATE INDEX device_tokens_identity_idx ON device_tokens(identity_id) WHERE revoked_at IS NULL;

-- Activity event stream (broader than notifications): every meaningful thing
-- that happens. Consumed by the Socket.IO gateway, the activity feed in the
-- right-rail, badges, and analytics ranking.
CREATE TABLE IF NOT EXISTS activity_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        uuid,                    -- who did it (null for system)
  identity_id     uuid,                    -- whose feed it lands in (null for org-wide)
  org_id          uuid,
  topic           text NOT NULL,
  verb            text NOT NULL,           -- 'created','updated','liked','mentioned'
  entity_type     text NOT NULL,
  entity_id       text NOT NULL,
  surface_keys    text[] NOT NULL DEFAULT '{}', -- which UI surfaces should refresh
  data            jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_events_identity_idx ON activity_events(identity_id, occurred_at DESC);
CREATE INDEX activity_events_entity_idx   ON activity_events(entity_type, entity_id, occurred_at DESC);
CREATE INDEX activity_events_topic_idx    ON activity_events(topic, occurred_at DESC);

-- Badge counters (durable; rebuilt by a periodic job from notifications +
-- activity_events). Frontend reads /badges to populate sidebar counters.
CREATE TABLE IF NOT EXISTS badge_counters (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     uuid NOT NULL,
  surface_key     text NOT NULL,           -- 'inbox','notifications','approvals'
  count           int  NOT NULL DEFAULT 0,
  variant         text NOT NULL DEFAULT 'default', -- 'default','warning','urgent'
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identity_id, surface_key)
);
CREATE INDEX badge_counters_identity_idx ON badge_counters(identity_id);

-- Webhook subscriptions for external consumers (third-party integrations).
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     uuid,
  org_id          uuid,
  topic_pattern   text NOT NULL,           -- 'order.*' supported
  url             text NOT NULL,
  secret          text NOT NULL,           -- HMAC signing secret
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_delivered_at timestamptz,
  failure_count   int NOT NULL DEFAULT 0
);
CREATE INDEX webhook_subscriptions_active_idx ON webhook_subscriptions(active, topic_pattern);
