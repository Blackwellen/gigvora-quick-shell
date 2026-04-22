-- Seed Domain 19 — Candidate Availability & Matching. Idempotent via ON CONFLICT.

INSERT INTO candidate_availability_profiles (id, candidate_id, tenant_id, timezone, hours_per_week, notice_days, remote_pref, travel_pct, status) VALUES
  ('cccc1900-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'tenant-demo', 'Europe/London', 40, 30, 'hybrid', 10, 'open'),
  ('cccc1900-0000-0000-0000-000000000002',
   '22222222-2222-2222-2222-222222222222', 'tenant-demo', 'America/New_York', 32, 14, 'remote', 0, 'passive')
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidate_availability_windows (id, profile_id, day_of_week, start_minute, end_minute) VALUES
  ('cccc1901-0000-0000-0000-000000000001', 'cccc1900-0000-0000-0000-000000000001', 1, 540, 1020),
  ('cccc1901-0000-0000-0000-000000000002', 'cccc1900-0000-0000-0000-000000000001', 3, 540, 1020),
  ('cccc1901-0000-0000-0000-000000000003', 'cccc1900-0000-0000-0000-000000000002', 2, 600, 960)
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidate_matches (id, candidate_id, target_kind, target_id, tenant_id, score, score_breakdown, status) VALUES
  ('cccc1902-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'requisition',
   '99990000-0000-0000-0000-000000000019', 'tenant-demo', 87,
   '{"skills":0.9,"availability":0.85,"location":0.8}'::jsonb, 'shortlisted'),
  ('cccc1902-0000-0000-0000-000000000002',
   '22222222-2222-2222-2222-222222222222', 'project',
   '99990000-0000-0000-0000-000000000020', 'tenant-demo', 64,
   '{"skills":0.7,"availability":0.6,"location":0.55}'::jsonb, 'proposed')
ON CONFLICT (candidate_id, target_kind, target_id) DO NOTHING;
