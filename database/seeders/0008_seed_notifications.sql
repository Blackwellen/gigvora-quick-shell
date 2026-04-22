-- Demo notifications, badges, and one webhook so the frontend can render
-- believable bell-icon counts and an activity feed.
INSERT INTO notifications (id, identity_id, topic, title, body, priority, status, entity_type, entity_id, action_url, category, data)
VALUES
  ('cccccccc-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'message.new','New message from Sarah','Re: contract for Q4 design sprint','high','sent',
   'thread','thr_demo_42','/messages/thr_demo_42','social','{"preview":"Hi! Just looping back…"}'::jsonb),
  ('cccccccc-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',
   'order.completed','Order #4291 paid','£4,900 received from Acme Co.','normal','sent',
   'order','ord_demo_4291','/orders/ord_demo_4291','billing','{"amount":4900,"currency":"GBP"}'::jsonb),
  ('cccccccc-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',
   'system.maintenance','Scheduled maintenance','Search index rebuild Sunday 02:00 UTC','low','read',
   NULL,NULL,'/status','system','{}'::jsonb),
  ('cccccccc-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222',
   'profile.endorsement','New endorsement','James endorsed your "Product Strategy" skill','normal','sent',
   'profile','me','/profile/me','social','{"skill":"Product Strategy"}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO notification_deliveries (notification_id, channel, status, provider, attempts, delivered_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001','in_app','delivered',NULL,1, now()),
  ('cccccccc-0000-0000-0000-000000000001','email','delivered','resend',1, now()),
  ('cccccccc-0000-0000-0000-000000000002','in_app','delivered',NULL,1, now()),
  ('cccccccc-0000-0000-0000-000000000004','in_app','delivered',NULL,1, now()),
  ('cccccccc-0000-0000-0000-000000000004','push','failed','expo',2, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO notification_preferences (identity_id, topic, channels, digest)
VALUES
  ('11111111-1111-1111-1111-111111111111','*',                ARRAY['in_app','email']::notification_channel[], 'realtime'),
  ('11111111-1111-1111-1111-111111111111','system.maintenance',ARRAY['in_app']::notification_channel[],         'daily'),
  ('22222222-2222-2222-2222-222222222222','*',                ARRAY['in_app','push']::notification_channel[],   'realtime')
ON CONFLICT (identity_id, topic) DO NOTHING;

INSERT INTO badge_counters (identity_id, surface_key, count, variant)
VALUES
  ('11111111-1111-1111-1111-111111111111','notifications',2,'default'),
  ('11111111-1111-1111-1111-111111111111','inbox',         5,'default'),
  ('11111111-1111-1111-1111-111111111111','approvals',     1,'warning'),
  ('22222222-2222-2222-2222-222222222222','notifications',1,'default')
ON CONFLICT (identity_id, surface_key) DO UPDATE SET count = EXCLUDED.count, updated_at = now();

INSERT INTO activity_events (actor_id, identity_id, topic, verb, entity_type, entity_id, surface_keys, data)
VALUES
  ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111',
   'message.new','created','thread','thr_demo_42', ARRAY['inbox','notifications'],
   '{"preview":"Hi! Just looping back…"}'::jsonb),
  (NULL,'11111111-1111-1111-1111-111111111111',
   'order.completed','updated','order','ord_demo_4291', ARRAY['orders','notifications'],
   '{"amount":4900}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO webhook_subscriptions (identity_id, topic_pattern, url, secret)
VALUES
  ('11111111-1111-1111-1111-111111111111','order.*','https://example.com/hooks/orders','whsec_demo_replace_me')
ON CONFLICT DO NOTHING;
