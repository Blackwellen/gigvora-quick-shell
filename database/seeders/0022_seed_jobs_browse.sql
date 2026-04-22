-- Seed Domain 24 — Jobs Browse & Discovery.
INSERT INTO job_saved_searches (id, user_id, name, query, alert_cadence, last_run_at, results_last_run) VALUES
  ('aaaa2400-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'Platform Eng — London hybrid',
   '{"keywords":["platform","kubernetes"],"locations":["London"],"workMode":"hybrid","salaryMin":90000}'::jsonb,
   'daily', now() - interval '6 hours', 14)
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_bookmarks (id, user_id, posting_id, notes) VALUES
  ('bbbb2400-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   '99990000-0000-0000-0000-000000000023',
   'Strong fit on Postgres + SLOs')
ON CONFLICT (user_id, posting_id) DO NOTHING;

INSERT INTO job_views (id, user_id, posting_id, source, dwell_ms, applied) VALUES
  ('cccc2400-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', '99990000-0000-0000-0000-000000000023',
   'recommendation', 87000, true),
  ('cccc2400-0000-0000-0000-000000000002',
   NULL, '99990000-0000-0000-0000-000000000023',
   'external', 12500, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_posting_stats (posting_id, views, unique_viewers, bookmarks, applies, ctr_bp, ranking_score) VALUES
  ('99990000-0000-0000-0000-000000000023', 412, 287, 19, 24, 583, 78)
ON CONFLICT (posting_id) DO UPDATE SET
  views = EXCLUDED.views, unique_viewers = EXCLUDED.unique_viewers,
  bookmarks = EXCLUDED.bookmarks, applies = EXCLUDED.applies,
  ctr_bp = EXCLUDED.ctr_bp, ranking_score = EXCLUDED.ranking_score,
  recomputed_at = now();

INSERT INTO job_browse_feedback (id, user_id, posting_id, signal, detail) VALUES
  ('dddd2400-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222', '99990000-0000-0000-0000-000000000023',
   'seniority_mismatch', 'Looking for staff-level not senior')
ON CONFLICT (id) DO NOTHING;
