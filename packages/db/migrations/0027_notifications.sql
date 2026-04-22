-- Domain 27 — Notifications.
-- Owner: apps/api-nest/src/modules/notifications/
-- Source of truth: packages/db/src/schema/notifications.ts

CREATE TABLE IF NOT EXISTS notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  tenant_id    text NOT NULL,
  category     text NOT NULL
               CHECK (category IN ('hiring','messaging','billing','system','social','calendar','media')),
  topic        text NOT NULL,
  title        text NOT NULL,
  body         text NOT NULL DEFAULT '',
  link         text,
  priority     text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status       text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read','archived')),
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  group_key    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  read_at      timestamptz,
  archived_at  timestamptz
);
CREATE INDEX IF NOT EXISTS n_user_status_idx ON notifications(user_id, status, created_at);
CREATE INDEX IF NOT EXISTS n_group_idx       ON notifications(user_id, group_key);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL,
  category            text NOT NULL,
  inapp_enabled       boolean NOT NULL DEFAULT true,
  email_enabled       boolean NOT NULL DEFAULT true,
  push_enabled        boolean NOT NULL DEFAULT true,
  sms_enabled         boolean NOT NULL DEFAULT false,
  digest_cadence      text NOT NULL DEFAULT 'off' CHECK (digest_cadence IN ('off','hourly','daily','weekly')),
  quiet_hours_start   integer CHECK (quiet_hours_start IS NULL OR quiet_hours_start BETWEEN 0 AND 1439),
  quiet_hours_end     integer CHECK (quiet_hours_end   IS NULL OR quiet_hours_end   BETWEEN 0 AND 1439),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS np_user_category_idx ON notification_preferences(user_id, category);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id  uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel          text NOT NULL CHECK (channel IN ('inapp','email','push','sms','webhook')),
  target           text,
  status           text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed','suppressed')),
  attempts         integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error       text,
  sent_at          timestamptz,
  delivered_at     timestamptz
);
CREATE INDEX IF NOT EXISTS nd_notification_idx ON notification_deliveries(notification_id, channel);
CREATE INDEX IF NOT EXISTS nd_status_idx       ON notification_deliveries(status, sent_at);

CREATE TABLE IF NOT EXISTS notification_digests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  cadence       text NOT NULL CHECK (cadence IN ('hourly','daily','weekly')),
  window_start  timestamptz NOT NULL,
  window_end    timestamptz NOT NULL,
  item_count    integer NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  sent_at       timestamptz,
  summary       jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (window_end > window_start)
);
CREATE UNIQUE INDEX IF NOT EXISTS nd_user_window_idx ON notification_digests(user_id, cadence, window_start);

CREATE TABLE IF NOT EXISTS notification_devices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  platform      text NOT NULL CHECK (platform IN ('ios','android','web')),
  token         text NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ndv_user_token_idx ON notification_devices(user_id, token);
