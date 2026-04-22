-- Seed data for Domain 18 — Calls.
-- One persistent client room + one ad-hoc internal room. Two calls: one
-- completed with two participants + recording + transcript, one missed.
-- Idempotent via ON CONFLICT.

INSERT INTO call_rooms (id, tenant_id, owner_id, kind, topic, provider, capacity, recording_enabled, transcript_enabled) VALUES
  ('11110000-0000-0000-0000-000000000018', 'tenant-demo',
   '11111111-1111-1111-1111-111111111111', 'scheduled', 'Acme weekly sync',  'livekit',  6, true,  true),
  ('22220000-0000-0000-0000-000000000018', 'tenant-demo',
   '22222222-2222-2222-2222-222222222222', 'adhoc',     'Internal pairing',  'internal', 4, false, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO calls (id, room_id, tenant_id, initiator_id, status, started_at, ended_at, duration_seconds, ended_reason, quality_score) VALUES
  ('aaaa1800-0000-0000-0000-000000000001',
   '11110000-0000-0000-0000-000000000018', 'tenant-demo',
   '11111111-1111-1111-1111-111111111111', 'ended',
   now() - interval '2 days' - interval '30 minutes',
   now() - interval '2 days', 1800, 'hangup', 87),
  ('aaaa1800-0000-0000-0000-000000000002',
   '22220000-0000-0000-0000-000000000018', 'tenant-demo',
   '22222222-2222-2222-2222-222222222222', 'missed',
   NULL, NULL, 0, 'timeout', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_participants (call_id, participant_id, role, joined_at, left_at) VALUES
  ('aaaa1800-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'host',
   now() - interval '2 days' - interval '30 minutes',
   now() - interval '2 days'),
  ('aaaa1800-0000-0000-0000-000000000001',
   '33333333-3333-3333-3333-333333333333', 'participant',
   now() - interval '2 days' - interval '29 minutes',
   now() - interval '2 days')
ON CONFLICT (call_id, participant_id) DO NOTHING;

INSERT INTO call_recordings (call_id, storage_key, mime_type, duration_seconds, size_bytes, status, expires_at) VALUES
  ('aaaa1800-0000-0000-0000-000000000001',
   's3://gigvora-recordings/2026/04/aaaa1800-0001.mp4',
   'video/mp4', 1800, 73400320, 'ready', now() + interval '90 days');

INSERT INTO call_transcripts (call_id, language, status, segments, summary) VALUES
  ('aaaa1800-0000-0000-0000-000000000001', 'en', 'ready',
   '[{"startMs":0,"endMs":4200,"speakerId":"11111111-1111-1111-1111-111111111111","text":"Thanks for jumping on, let me share the dashboard."},{"startMs":4200,"endMs":9100,"speakerId":"33333333-3333-3333-3333-333333333333","text":"Looks good — can we walk through milestone two?"}]'::jsonb,
   'Reviewed dashboard, walked through milestone two, agreed on Thursday handover.')
ON CONFLICT (call_id) DO NOTHING;

INSERT INTO call_events (call_id, kind, actor, detail) VALUES
  ('aaaa1800-0000-0000-0000-000000000001', 'call.started', 'system:seed', '{}'::jsonb),
  ('aaaa1800-0000-0000-0000-000000000001', 'call.ended',   'system:seed', '{"reason":"hangup"}'::jsonb),
  ('aaaa1800-0000-0000-0000-000000000002', 'call.missed',  'system:seed', '{"reason":"timeout"}'::jsonb);
