-- Seed Domain 26 — Media Viewer.
INSERT INTO media_playback_sessions (id, asset_id, viewer_id, tenant_id, surface, client, started_at, ended_at, watched_seconds, completed_pct, exit_reason) VALUES
  ('aaaa2600-0000-0000-0000-000000000001',
   '88880000-0000-0000-0000-000000000026',
   '11111111-1111-1111-1111-111111111111',
   'tenant-demo', 'web', 'Chrome 124 / macOS',
   now() - interval '1 hour', now() - interval '1 hour' + interval '4 minutes 12 seconds',
   252, 92, 'ended'),
  ('aaaa2600-0000-0000-0000-000000000002',
   '88880000-0000-0000-0000-000000000026',
   NULL, 'tenant-demo', 'reels', 'iOS 17',
   now() - interval '20 minutes', now() - interval '20 minutes' + interval '11 seconds',
   11, 8, 'swipe')
ON CONFLICT (id) DO NOTHING;

INSERT INTO media_playback_segments (id, session_id, start_ms, end_ms, speed, buffering_ms) VALUES
  ('bbbb2600-0000-0000-0000-000000000001', 'aaaa2600-0000-0000-0000-000000000001', 0,      120000, 100, 250),
  ('bbbb2600-0000-0000-0000-000000000002', 'aaaa2600-0000-0000-0000-000000000001', 120000, 252000, 125, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO media_qoe_samples (id, session_id, bitrate_kbps, resolution, dropped_frames, rebuffer_ms, startup_ms) VALUES
  ('cccc2600-0000-0000-0000-000000000001', 'aaaa2600-0000-0000-0000-000000000001', 4500, '1080p', 2, 250, 410)
ON CONFLICT (id) DO NOTHING;

INSERT INTO media_asset_stats (asset_id, views, unique_viewers, avg_watch_seconds, completion_rate_bp) VALUES
  ('88880000-0000-0000-0000-000000000026', 1284, 932, 168, 6420)
ON CONFLICT (asset_id) DO UPDATE SET
  views = EXCLUDED.views, unique_viewers = EXCLUDED.unique_viewers,
  avg_watch_seconds = EXCLUDED.avg_watch_seconds,
  completion_rate_bp = EXCLUDED.completion_rate_bp,
  recomputed_at = now();

INSERT INTO media_viewer_reactions (id, session_id, asset_id, viewer_id, kind, at_ms, detail) VALUES
  ('dddd2600-0000-0000-0000-000000000001',
   'aaaa2600-0000-0000-0000-000000000001',
   '88880000-0000-0000-0000-000000000026',
   '11111111-1111-1111-1111-111111111111',
   'like', 92000, '{}'::jsonb),
  ('dddd2600-0000-0000-0000-000000000002',
   'aaaa2600-0000-0000-0000-000000000001',
   '88880000-0000-0000-0000-000000000026',
   '11111111-1111-1111-1111-111111111111',
   'timestamp_comment', 188000, '{"text":"This bit was super clear"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
