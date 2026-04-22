-- Seed data for Domain 17 — Calendar.
-- Two calendars (a personal + a team), three events (one recurring weekly
-- standup with two attendees, one one-off review, one cancelled), and one
-- internal share grant. Idempotent via ON CONFLICT.

INSERT INTO calendars (id, tenant_id, owner_id, name, color, timezone, is_primary, visibility, provider) VALUES
  ('11110000-0000-0000-0000-000000000017', 'tenant-demo',
   '11111111-1111-1111-1111-111111111111', 'Sarah — Personal', '#3B82F6', 'Europe/London', true, 'private', 'internal'),
  ('22220000-0000-0000-0000-000000000017', 'tenant-demo',
   '22222222-2222-2222-2222-222222222222', 'Atrium Studio Team', '#10B981', 'Europe/London', false, 'team',    'internal')
ON CONFLICT (id) DO NOTHING;

-- Recurring weekly standup (RRULE), one-off review meeting, one cancelled.
INSERT INTO calendar_events
  (id, calendar_id, tenant_id, organizer_id, title, description, location, meeting_url,
   starts_at, ends_at, timezone, recurrence_rule, status, visibility, busy)
VALUES
  ('aaaa1700-0000-0000-0000-000000000001',
   '22220000-0000-0000-0000-000000000017', 'tenant-demo',
   '22222222-2222-2222-2222-222222222222',
   'Weekly Studio Standup', '15-min sync to align on the week.', 'Atrium Room', 'https://meet.example.com/standup',
   date_trunc('day', now()) + interval '1 day' + interval '9 hours',
   date_trunc('day', now()) + interval '1 day' + interval '9 hours 15 minutes',
   'Europe/London', 'FREQ=WEEKLY;BYDAY=MO', 'confirmed', 'default', true),
  ('aaaa1700-0000-0000-0000-000000000002',
   '11110000-0000-0000-0000-000000000017', 'tenant-demo',
   '11111111-1111-1111-1111-111111111111',
   'Quarterly review with Acme', 'Review Q1 deliverables.', NULL, 'https://meet.example.com/acme-review',
   date_trunc('day', now()) + interval '3 days' + interval '14 hours',
   date_trunc('day', now()) + interval '3 days' + interval '15 hours',
   'Europe/London', NULL, 'confirmed', 'default', true),
  ('aaaa1700-0000-0000-0000-000000000003',
   '11110000-0000-0000-0000-000000000017', 'tenant-demo',
   '11111111-1111-1111-1111-111111111111',
   'Cancelled — Vendor pitch', 'Vendor postponed.', NULL, NULL,
   date_trunc('day', now()) + interval '4 days' + interval '11 hours',
   date_trunc('day', now()) + interval '4 days' + interval '11 hours 30 minutes',
   'Europe/London', NULL, 'cancelled', 'default', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO calendar_attendees (event_id, attendee_id, email, display_name, role, rsvp, rsvp_at) VALUES
  ('aaaa1700-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'sarah@example.com', 'Sarah Chen', 'required', 'accepted', now()),
  ('aaaa1700-0000-0000-0000-000000000001',
   '33333333-3333-3333-3333-333333333333', 'amir@example.com',  'Amir Patel', 'required', 'tentative', now()),
  ('aaaa1700-0000-0000-0000-000000000002',
   NULL, 'buyer@acme.example.com', 'Acme Buyer', 'required', 'pending', NULL)
ON CONFLICT (event_id, email) DO NOTHING;

INSERT INTO calendar_shares (calendar_id, grantee_id, scope) VALUES
  ('22220000-0000-0000-0000-000000000017',
   '11111111-1111-1111-1111-111111111111', 'write')
ON CONFLICT (calendar_id, grantee_id) DO NOTHING;
