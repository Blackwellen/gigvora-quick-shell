-- Domain 22 — Webinars: Discovery, Live Rooms, Replays, Sales & Donations.
-- Mirrors packages/db/src/schema/webinars.ts. Owned by apps/api-nest/src/modules/webinars/.
-- Never run against Lovable Cloud Supabase.

CREATE TABLE IF NOT EXISTS webinars (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id           uuid NOT NULL,
  host_name         text NOT NULL CHECK (length(host_name) BETWEEN 1 AND 160),
  title             text NOT NULL CHECK (length(title) BETWEEN 3 AND 200),
  description       text NOT NULL DEFAULT '',
  starts_at         timestamptz NOT NULL,
  ends_at           timestamptz,
  duration_minutes  integer NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 5 AND 480),
  topics            jsonb NOT NULL DEFAULT '[]'::jsonb,
  thumbnail_url     text,
  status            text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft','scheduled','live','ended','archived','cancelled')),
  ticket_kind       text NOT NULL DEFAULT 'free' CHECK (ticket_kind IN ('free','paid','donation','enterprise')),
  price_cents       integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency          text NOT NULL DEFAULT 'GBP' CHECK (currency IN ('GBP','USD','EUR')),
  capacity          integer NOT NULL DEFAULT 500 CHECK (capacity BETWEEN 1 AND 50000),
  registrations     integer NOT NULL DEFAULT 0 CHECK (registrations >= 0),
  donations_enabled boolean NOT NULL DEFAULT true,
  jitsi_room        text NOT NULL,
  replay_url        text,
  visibility        text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','unlisted','private','enterprise_only')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at),
  CHECK (registrations <= capacity)
);
CREATE INDEX IF NOT EXISTS webinars_starts_at_idx  ON webinars(starts_at);
CREATE INDEX IF NOT EXISTS webinars_host_idx       ON webinars(host_id);
CREATE INDEX IF NOT EXISTS webinars_status_idx     ON webinars(status);
CREATE INDEX IF NOT EXISTS webinars_visibility_idx ON webinars(visibility);

CREATE TABLE IF NOT EXISTS webinar_registrations (
  webinar_id    uuid NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  identity_id   uuid NOT NULL,
  email         text,
  status        text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','attended','no_show','cancelled')),
  registered_at timestamptz NOT NULL DEFAULT now(),
  attended_at   timestamptz,
  PRIMARY KEY (webinar_id, identity_id)
);
CREATE INDEX IF NOT EXISTS webreg_ident_idx   ON webinar_registrations(identity_id);
CREATE INDEX IF NOT EXISTS webreg_status_idx  ON webinar_registrations(status);

CREATE TABLE IF NOT EXISTS webinar_purchases (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id     uuid NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  identity_id    uuid NOT NULL,
  quantity       integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 20),
  amount_cents   integer NOT NULL CHECK (amount_cents >= 0),
  currency       text NOT NULL DEFAULT 'GBP' CHECK (currency IN ('GBP','USD','EUR')),
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','paid','failed','refunded')),
  payment_method text,
  provider_ref   text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  confirmed_at   timestamptz,
  refunded_at    timestamptz
);
CREATE INDEX IF NOT EXISTS webpur_web_idx    ON webinar_purchases(webinar_id);
CREATE INDEX IF NOT EXISTS webpur_ident_idx  ON webinar_purchases(identity_id);
CREATE INDEX IF NOT EXISTS webpur_status_idx ON webinar_purchases(status);

CREATE TABLE IF NOT EXISTS webinar_donations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id   uuid NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  identity_id  uuid,
  amount_cents integer NOT NULL CHECK (amount_cents >= 100 AND amount_cents <= 1000000),
  currency     text NOT NULL DEFAULT 'GBP' CHECK (currency IN ('GBP','USD','EUR')),
  message      text CHECK (message IS NULL OR length(message) <= 280),
  anonymous    boolean NOT NULL DEFAULT false,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','captured','failed','refunded')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  captured_at  timestamptz,
  refunded_at  timestamptz
);
CREATE INDEX IF NOT EXISTS webdon_web_idx    ON webinar_donations(webinar_id);
CREATE INDEX IF NOT EXISTS webdon_ident_idx  ON webinar_donations(identity_id);
CREATE INDEX IF NOT EXISTS webdon_status_idx ON webinar_donations(status);

CREATE TABLE IF NOT EXISTS webinar_chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id  uuid NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL,
  body        text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  pinned      boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS webchat_web_idx ON webinar_chat_messages(webinar_id, created_at);

CREATE TABLE IF NOT EXISTS webinar_replays (
  webinar_id   uuid PRIMARY KEY REFERENCES webinars(id) ON DELETE CASCADE,
  replay_url   text NOT NULL,
  duration_sec integer NOT NULL DEFAULT 0 CHECK (duration_sec >= 0),
  views        integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);
