-- Seed Domain 27 — Notifications.
INSERT INTO notifications (id, user_id, tenant_id, category, topic, title, body, link, priority, status, payload, group_key) VALUES
  ('aaaa2700-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'tenant-demo',
   'hiring', 'application.advanced',
   'Your application advanced to Tech Interview',
   'Acme — Senior Platform Engineer moved you to Tech Interview.',
   '/hire/applications/aaaa2200-0000-0000-0000-000000000001',
   'high', 'unread',
   '{"applicationId":"aaaa2200-0000-0000-0000-000000000001","stage":"tech"}'::jsonb,
   'application:aaaa2200-0000-0000-0000-000000000001'),
  ('aaaa2700-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111', 'tenant-demo',
   'calendar', 'interview.scheduled',
   'Interview scheduled for Wednesday',
   'Tech interview with Acme has been scheduled.',
   '/calendar', 'normal', 'read',
   '{"slotId":"22222100-0000-0000-0000-000000000001"}'::jsonb,
   'interview:1111210o')
ON CONFLICT (id) DO NOTHING;

UPDATE notifications SET read_at = now() - interval '20 minutes'
 WHERE id = 'aaaa2700-0000-0000-0000-000000000002' AND read_at IS NULL;

INSERT INTO notification_preferences (id, user_id, category, inapp_enabled, email_enabled, push_enabled, sms_enabled, digest_cadence, quiet_hours_start, quiet_hours_end) VALUES
  ('bbbb2700-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'hiring',
   true, true, true, false, 'off', 1320, 480),
  ('bbbb2700-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111', 'marketing'::text,
   true, false, false, false, 'weekly', NULL, NULL)
ON CONFLICT (user_id, category) DO NOTHING;

INSERT INTO notification_deliveries (id, notification_id, channel, target, status, attempts, sent_at, delivered_at) VALUES
  ('cccc2700-0000-0000-0000-000000000001', 'aaaa2700-0000-0000-0000-000000000001',
   'inapp', NULL, 'delivered', 1, now() - interval '1 hour', now() - interval '1 hour'),
  ('cccc2700-0000-0000-0000-000000000002', 'aaaa2700-0000-0000-0000-000000000001',
   'email', 'jane@candidate.test', 'delivered', 1,
   now() - interval '1 hour', now() - interval '1 hour' + interval '4 seconds'),
  ('cccc2700-0000-0000-0000-000000000003', 'aaaa2700-0000-0000-0000-000000000001',
   'push', 'apns:abc123', 'failed', 3, now() - interval '50 minutes', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification_devices (id, user_id, platform, token, active, last_seen_at) VALUES
  ('dddd2700-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'ios',
   'apns:abc123', true, now() - interval '2 hours')
ON CONFLICT (user_id, token) DO NOTHING;

INSERT INTO notification_digests (id, user_id, cadence, window_start, window_end, item_count, sent_at, summary) VALUES
  ('eeee2700-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'daily',
   date_trunc('day', now()) - interval '1 day',
   date_trunc('day', now()), 7, date_trunc('day', now()) + interval '7 hours',
   '{"hiring":4,"calendar":2,"system":1}'::jsonb)
ON CONFLICT (user_id, cadence, window_start) DO NOTHING;
