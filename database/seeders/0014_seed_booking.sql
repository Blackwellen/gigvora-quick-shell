-- Seed data for Domain 16 — Booking.
-- Two bookable resources (a coach + a workshop room), one week of availability,
-- four materialised slots with one already confirmed booking + audit event.
-- Idempotent: re-running is a no-op thanks to ON CONFLICT.

INSERT INTO booking_resources (id, tenant_id, owner_id, kind, ref_id, name, timezone, active, metadata) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000016', 'tenant-demo',
   '11111111-1111-1111-1111-111111111111', 'person',     'coach-sarah',  'Sarah Chen — Coaching', 'Europe/London', true,
   '{"durationMinutes":60,"priceCents":15000}'::jsonb),
  ('bbbbbbbb-0000-0000-0000-000000000016', 'tenant-demo',
   '22222222-2222-2222-2222-222222222222', 'room',       'room-atrium',  'Atrium Workshop Room',  'Europe/London', true,
   '{"capacity":12}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Mon–Fri 09:00–17:00 for the coach
INSERT INTO booking_availability (resource_id, weekday, start_minutes, end_minutes) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000016', 1, 540, 1020),
  ('aaaaaaaa-0000-0000-0000-000000000016', 2, 540, 1020),
  ('aaaaaaaa-0000-0000-0000-000000000016', 3, 540, 1020),
  ('aaaaaaaa-0000-0000-0000-000000000016', 4, 540, 1020),
  ('aaaaaaaa-0000-0000-0000-000000000016', 5, 540, 1020),
  ('bbbbbbbb-0000-0000-0000-000000000016', 3, 600, 1080)
ON CONFLICT DO NOTHING;

INSERT INTO booking_slots (id, resource_id, starts_at, ends_at, capacity, booked_count, status) VALUES
  ('cccccccc-0001-0000-0000-000000000016', 'aaaaaaaa-0000-0000-0000-000000000016',
   now() + interval '1 day',  now() + interval '1 day' + interval '1 hour',  1, 1, 'full'),
  ('cccccccc-0002-0000-0000-000000000016', 'aaaaaaaa-0000-0000-0000-000000000016',
   now() + interval '2 days', now() + interval '2 days' + interval '1 hour', 1, 0, 'open'),
  ('cccccccc-0003-0000-0000-000000000016', 'aaaaaaaa-0000-0000-0000-000000000016',
   now() + interval '3 days', now() + interval '3 days' + interval '1 hour', 1, 0, 'open'),
  ('cccccccc-0004-0000-0000-000000000016', 'bbbbbbbb-0000-0000-0000-000000000016',
   now() + interval '5 days', now() + interval '5 days' + interval '8 hours', 12, 3, 'open')
ON CONFLICT (resource_id, starts_at) DO NOTHING;

INSERT INTO bookings (id, tenant_id, resource_id, slot_id, booker_id, status, amount_cents, currency, notes) VALUES
  ('dddddddd-0001-0000-0000-000000000016', 'tenant-demo',
   'aaaaaaaa-0000-0000-0000-000000000016',
   'cccccccc-0001-0000-0000-000000000016',
   '33333333-3333-3333-3333-333333333333',
   'confirmed', 15000, 'USD', 'Intro coaching session.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO booking_events (booking_id, kind, actor, detail) VALUES
  ('dddddddd-0001-0000-0000-000000000016', 'booking.confirmed', 'system:seed',
   '{"slotId":"cccccccc-0001-0000-0000-000000000016"}'::jsonb);
