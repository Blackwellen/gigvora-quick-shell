-- Domain — Notifications v2
CREATE TABLE IF NOT EXISTS notification_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel IN ('push','email','sms','in_app','webhook')),
  destination text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_identity_id, channel, destination)
);
CREATE INDEX IF NOT EXISTS notif_channels_owner_idx ON notification_channels(owner_identity_id, active);

CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('push','email','sms','in_app','webhook')),
  subject text,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  locale text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, channel, locale)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('mention','message','payment','system','opportunity','reminder','project','hire','review')),
  template_key text,
  channel text NOT NULL CHECK (channel IN ('push','email','sms','in_app','webhook')),
  subject text,
  body text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','read','failed','cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failure_reason text,
  retry_count integer NOT NULL DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 10),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notif_owner_status_idx ON notifications(owner_identity_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS notif_scheduled_idx ON notifications(status, scheduled_for) WHERE status = 'queued';

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id uuid NOT NULL,
  category text NOT NULL,
  channel_push boolean NOT NULL DEFAULT true,
  channel_email boolean NOT NULL DEFAULT true,
  channel_sms boolean NOT NULL DEFAULT false,
  channel_in_app boolean NOT NULL DEFAULT true,
  quiet_hours_start text,
  quiet_hours_end text,
  timezone text NOT NULL DEFAULT 'UTC',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_identity_id, category)
);
