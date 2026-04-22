-- Seed Domain 28 — Podcasts.
INSERT INTO podcast_shows (id, tenant_id, owner_id, title, slug, tagline, description, language, category, status, monetization) VALUES
  ('aaaa2800-0000-0000-0000-000000000001', 'tenant-demo',
   '11111111-1111-1111-1111-111111111111',
   'The Hiring Loop', 'the-hiring-loop',
   'Conversations about modern recruiting',
   'Weekly interviews with talent leaders and operators.',
   'en', 'Business / Careers', 'published', 'both')
ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO podcast_episodes (id, show_id, number, season, title, slug, description, audio_key, duration_seconds, status, publish_at, published_at) VALUES
  ('bbbb2800-0000-0000-0000-000000000001',
   'aaaa2800-0000-0000-0000-000000000001', 1, 1,
   'Pilot — Why hiring loops break',
   'pilot-why-hiring-loops-break',
   'A deep dive into where coordination fails inside enterprise hiring loops.',
   's3://gigvora-podcasts/the-hiring-loop/s01e01.mp3',
   2412, 'published', now() - interval '14 days', now() - interval '14 days'),
  ('bbbb2800-0000-0000-0000-000000000002',
   'aaaa2800-0000-0000-0000-000000000001', 2, 1,
   'Designing scorecards that actually predict performance',
   'designing-scorecards',
   'How to build a scorecard rubric that survives calibration.',
   's3://gigvora-podcasts/the-hiring-loop/s01e02.mp3',
   2843, 'published', now() - interval '7 days', now() - interval '7 days')
ON CONFLICT (show_id, season, number) DO NOTHING;

INSERT INTO podcast_chapters (id, episode_id, start_ms, title) VALUES
  ('cccc2800-0000-0000-0000-000000000001', 'bbbb2800-0000-0000-0000-000000000001', 0,       'Cold open'),
  ('cccc2800-0000-0000-0000-000000000002', 'bbbb2800-0000-0000-0000-000000000001', 90000,   'The coordination tax'),
  ('cccc2800-0000-0000-0000-000000000003', 'bbbb2800-0000-0000-0000-000000000001', 1380000, 'Where loops break')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcast_transcripts (id, episode_id, language, status, segments, summary) VALUES
  ('dddd2800-0000-0000-0000-000000000001',
   'bbbb2800-0000-0000-0000-000000000001', 'en', 'ready',
   '[{"startMs":0,"endMs":4000,"speaker":"host","text":"Welcome to The Hiring Loop."},
     {"startMs":4000,"endMs":12000,"speaker":"guest","text":"Glad to be here. Hiring loops break for predictable reasons."}]'::jsonb,
   'Pilot episode covering why enterprise hiring loops break and the coordination tax of multi-stage interviews.')
ON CONFLICT (episode_id) DO NOTHING;

INSERT INTO podcast_subscriptions (id, show_id, subscriber_id, tier) VALUES
  ('eeee2800-0000-0000-0000-000000000001', 'aaaa2800-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222', 'supporter'),
  ('eeee2800-0000-0000-0000-000000000002', 'aaaa2800-0000-0000-0000-000000000001',
   '33333333-3333-3333-3333-333333333333', 'free')
ON CONFLICT (show_id, subscriber_id) DO NOTHING;

INSERT INTO podcast_listens (id, episode_id, listener_id, started_at, listened_seconds, completed_pct, surface) VALUES
  ('ffff2800-0000-0000-0000-000000000001', 'bbbb2800-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222', now() - interval '2 days', 2280, 95, 'ios'),
  ('ffff2800-0000-0000-0000-000000000002', 'bbbb2800-0000-0000-0000-000000000001',
   NULL, now() - interval '6 hours', 432, 18, 'rss')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcast_sponsorships (id, episode_id, sponsor_name, position_ms, duration_ms, cpm_cents, impressions, revenue_cents, metadata) VALUES
  ('99992800-0000-0000-0000-000000000001',
   'bbbb2800-0000-0000-0000-000000000001',
   'Acme ATS', 60000, 45000, 2500, 4180, 10450,
   '{"placement":"pre-roll","contractId":"acme-ats-2026-q1"}'::jsonb),
  ('99992800-0000-0000-0000-000000000002',
   'bbbb2800-0000-0000-0000-000000000002',
   'Acme ATS', 1200000, 30000, 2200, 3120, 6864,
   '{"placement":"mid-roll"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
