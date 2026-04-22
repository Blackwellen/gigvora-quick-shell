-- Domain 29 — Projects Browse & Discovery — demo seed (idempotent).
INSERT INTO project_saved_searches (id, user_id, name, query, alert_cadence, results_last_run)
VALUES
  ('29000000-0000-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   'Senior React, remote, $5k+',
   '{"keywords":["react","typescript"],"workMode":"remote","budgetMin":500000}'::jsonb,
   'daily', 12),
  ('29000000-0000-0000-0000-000000000002'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   'Brand design sprints',
   '{"skills":["figma","branding"],"durationDays":14}'::jsonb,
   'weekly', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_bookmarks (id, user_id, project_id, notes)
VALUES
  ('29000000-0000-0000-0000-000000000101'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   '32000000-0000-0000-0000-000000000001'::uuid,
   'Great fit, follow up Mon')
ON CONFLICT DO NOTHING;

INSERT INTO project_views (id, user_id, project_id, source, dwell_ms, proposed)
VALUES
  ('29000000-0000-0000-0000-000000000201'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   '32000000-0000-0000-0000-000000000001'::uuid,
   'recommendation', 48000, false),
  ('29000000-0000-0000-0000-000000000202'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   '32000000-0000-0000-0000-000000000002'::uuid,
   'search', 22000, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_stats (project_id, views, unique_viewers, bookmarks, proposals, invites_sent, ranking_score)
VALUES
  ('32000000-0000-0000-0000-000000000001'::uuid, 320, 188, 42, 18, 6, 712),
  ('32000000-0000-0000-0000-000000000002'::uuid, 145, 102,  9,  4, 2, 488)
ON CONFLICT (project_id) DO NOTHING;

INSERT INTO project_browse_feedback (id, user_id, project_id, signal, detail)
VALUES
  ('29000000-0000-0000-0000-000000000301'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   '32000000-0000-0000-0000-000000000002'::uuid,
   'budget_too_low', 'Below my floor of $4k')
ON CONFLICT (id) DO NOTHING;
