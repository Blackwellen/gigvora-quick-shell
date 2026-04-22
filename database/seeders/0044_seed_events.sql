-- Seed Domain 15 — Events, RSVPs & Networking Sessions. Idempotent.

INSERT INTO events (id, host_id, slug, title, type, format, status, visibility, description, starts_at, ends_at, timezone, location, capacity, price_cents, currency)
VALUES
  ('15000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','design-systems-summit-2026','Design Systems Summit 2026','conference','hybrid','scheduled','public','Two-day deep dive on tokens, theming and motion at scale.', now() + interval '30 days', now() + interval '32 days','Europe/London','London + Online',500,15000,'GBP'),
  ('15000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','founders-roundtable-q2','Founders Roundtable — Q2','roundtable','virtual','scheduled','private','Closed-door peer session for working founders.', now() + interval '14 days', now() + interval '14 days','Europe/London',NULL,30,0,'GBP'),
  ('15000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','open-source-london-meetup','Open Source London Meetup','meetup','in_person','scheduled','public','Casual meetup for OSS maintainers and contributors.', now() + interval '7 days', now() + interval '7 days','Europe/London','Shoreditch',80,0,'GBP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO event_rsvps (event_id, identity_id, status, guests) VALUES
  ('15000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','going',1),
  ('15000000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','interested',0),
  ('15000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','going',0),
  ('15000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','going',0),
  ('15000000-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','going',1)
ON CONFLICT (event_id, identity_id) DO NOTHING;

INSERT INTO event_speakers (id, event_id, identity_id, name, role, title) VALUES
  ('15100000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Demo One','host','Lead Designer'),
  ('15100000-0000-0000-0000-000000000002','15000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','Demo Two','speaker','Founder, Acme'),
  ('15100000-0000-0000-0000-000000000003','15000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','Demo Three','host','Maintainer, OSS-UK')
ON CONFLICT (id) DO NOTHING;
