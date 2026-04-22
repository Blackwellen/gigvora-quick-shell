-- Domain 25 — Marketing.
-- Owner: apps/api-nest/src/modules/marketing/
-- Source of truth: packages/db/src/schema/marketing.ts

CREATE TABLE IF NOT EXISTS marketing_segments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       text NOT NULL,
  name            text NOT NULL,
  description     text,
  filter_expr     jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_size  integer NOT NULL DEFAULT 0 CHECK (estimated_size >= 0),
  refreshed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ms_tenant_idx ON marketing_segments(tenant_id);

CREATE TABLE IF NOT EXISTS marketing_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   text NOT NULL,
  name        text NOT NULL,
  channel     text NOT NULL CHECK (channel IN ('email','inapp','sms','push','webhook')),
  subject     text,
  body        text NOT NULL DEFAULT '',
  variables   jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     text NOT NULL,
  owner_id      uuid NOT NULL,
  name          text NOT NULL,
  channel       text NOT NULL CHECK (channel IN ('email','inapp','sms','push','webhook')),
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','scheduled','sending','sent','paused','archived')),
  subject       text,
  body          text NOT NULL DEFAULT '',
  template_id   uuid REFERENCES marketing_templates(id) ON DELETE SET NULL,
  segment_id    uuid REFERENCES marketing_segments(id)  ON DELETE SET NULL,
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mc_tenant_status_idx ON marketing_campaigns(tenant_id, status);

CREATE TABLE IF NOT EXISTS marketing_send_batches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      uuid NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','completed','failed')),
  recipient_count  integer NOT NULL DEFAULT 0 CHECK (recipient_count >= 0),
  success_count    integer NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  failure_count    integer NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  started_at       timestamptz,
  completed_at     timestamptz,
  CHECK (success_count + failure_count <= recipient_count),
  CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);
CREATE INDEX IF NOT EXISTS msb_campaign_idx ON marketing_send_batches(campaign_id, status);

CREATE TABLE IF NOT EXISTS marketing_recipient_events (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id        uuid NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  batch_id           uuid REFERENCES marketing_send_batches(id) ON DELETE SET NULL,
  recipient_id       uuid NOT NULL,
  recipient_address  text,
  event              text NOT NULL
                     CHECK (event IN ('queued','sent','delivered','opened','clicked','bounced','complained','unsubscribed','failed')),
  detail             jsonb NOT NULL DEFAULT '{}'::jsonb,
  at                 timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mre_campaign_idx  ON marketing_recipient_events(campaign_id, event, at);
CREATE INDEX IF NOT EXISTS mre_recipient_idx ON marketing_recipient_events(recipient_id, at);
