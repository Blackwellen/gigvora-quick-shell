-- Seed connection requests, accepted connections, and degree cache.
INSERT INTO connection_requests (id, requester_id, recipient_id, status, message, responded_at) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc01','22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','accepted','Loved your design system post — would love to connect.', now() - interval '2 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02','33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','pending','We''re hiring; let''s connect.', NULL),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03','44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111','pending', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Materialised symmetric connections (canonical lo<hi ordering).
INSERT INTO connections (user_a_id, user_b_id) VALUES
  ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222'),
  ('22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333'),
  ('22222222-2222-2222-2222-222222222222','44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- Degree cache for viewer 1111... :
--   1° → 2222
--   2° → 3333, 4444 (via 2222)
INSERT INTO network_edges (viewer_id, target_id, degree, mutual_count) VALUES
  ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222', 1, 0),
  ('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333', 2, 1),
  ('11111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444', 2, 1)
ON CONFLICT DO NOTHING;
