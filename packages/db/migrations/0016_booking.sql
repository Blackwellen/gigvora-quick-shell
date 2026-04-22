-- Domain 16 — Booking
-- Owns: bookable resources, recurring availability, materialised slots,
-- soft holds during checkout, immutable confirmed bookings, audit trail.
-- Source of truth: packages/db/src/schema/booking.ts
-- Owner runtime: apps/api-nest/src/modules/booking/

CREATE TABLE IF NOT EXISTS booking_resources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   text NOT NULL,
  owner_id    uuid NOT NULL,
  kind        text NOT NULL,
  ref_id      text NOT NULL,
  name        text NOT NULL,
  timezone    text NOT NULL DEFAULT 'UTC',
  active      boolean NOT NULL DEFAULT true,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_resources_tenant_idx ON booking_resources(tenant_id, kind, active);
CREATE INDEX IF NOT EXISTS booking_resources_ref_idx    ON booking_resources(kind, ref_id);

CREATE TABLE IF NOT EXISTS booking_availability (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id   uuid NOT NULL REFERENCES booking_resources(id) ON DELETE CASCADE,
  weekday       integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_minutes integer NOT NULL CHECK (start_minutes BETWEEN 0 AND 1440),
  end_minutes   integer NOT NULL CHECK (end_minutes   BETWEEN 0 AND 1440),
  valid_from    timestamptz,
  valid_until   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (end_minutes > start_minutes)
);
CREATE INDEX IF NOT EXISTS booking_availability_resource_idx ON booking_availability(resource_id, weekday);

CREATE TABLE IF NOT EXISTS booking_slots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id   uuid NOT NULL REFERENCES booking_resources(id) ON DELETE CASCADE,
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  capacity      integer NOT NULL DEFAULT 1 CHECK (capacity > 0),
  booked_count  integer NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
  status        text NOT NULL DEFAULT 'open',
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (booked_count <= capacity)
);
CREATE INDEX        IF NOT EXISTS booking_slots_range_idx  ON booking_slots(resource_id, starts_at);
CREATE UNIQUE INDEX IF NOT EXISTS booking_slots_unique_idx ON booking_slots(resource_id, starts_at);

CREATE TABLE IF NOT EXISTS booking_holds (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id     uuid NOT NULL REFERENCES booking_slots(id) ON DELETE CASCADE,
  holder_id   uuid NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_holds_expires_idx ON booking_holds(expires_at);
CREATE INDEX IF NOT EXISTS booking_holds_slot_idx    ON booking_holds(slot_id);

CREATE TABLE IF NOT EXISTS bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     text NOT NULL,
  resource_id   uuid NOT NULL REFERENCES booking_resources(id),
  slot_id       uuid NOT NULL REFERENCES booking_slots(id),
  booker_id     uuid NOT NULL,
  status        text NOT NULL DEFAULT 'confirmed',
  amount_cents  integer NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency      text NOT NULL DEFAULT 'USD',
  notes         text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  confirmed_at  timestamptz NOT NULL DEFAULT now(),
  cancelled_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_tenant_idx   ON bookings(tenant_id, status);
CREATE INDEX IF NOT EXISTS bookings_booker_idx   ON bookings(booker_id);
CREATE INDEX IF NOT EXISTS bookings_resource_idx ON bookings(resource_id, confirmed_at);

CREATE TABLE IF NOT EXISTS booking_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  actor       text NOT NULL,
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb,
  at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_events_booking_idx ON booking_events(booking_id, at);
