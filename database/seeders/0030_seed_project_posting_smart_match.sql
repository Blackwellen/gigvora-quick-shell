-- Domain 32 — Project Posting Studio, Smart Match & Invite Flows — demo seed (idempotent).
INSERT INTO projects (id, tenant_id, owner_id, title, slug, summary, description, category, skills,
                      budget_type, budget_min_cents, budget_max_cents, currency, duration_days,
                      work_mode, location, status, visibility, approval_state, published_at, metadata)
VALUES
  ('32000000-0000-0000-0000-000000000001'::uuid, 'demo-tenant',
   '22222222-2222-2222-2222-222222222222'::uuid,
   'React dashboard refresh',
   'react-dashboard-refresh',
   'Modernise our internal admin dashboard.',
   'Replace legacy jQuery views with a typed React + Tailwind shell.',
   'engineering',
   '["react","typescript","tailwind"]'::jsonb,
   'fixed', 500000, 800000, 'USD', 21,
   'remote', NULL, 'published', 'public', 'approved',
   now() - interval '3 days',
   '{"seniority":"senior"}'::jsonb),
  ('32000000-0000-0000-0000-000000000002'::uuid, 'demo-tenant',
   '22222222-2222-2222-2222-222222222222'::uuid,
   'Brand sprint — Q3 launch',
   'brand-sprint-q3',
   'Two-week brand sprint for product launch.',
   'Logo refresh, typography system, social kit.',
   'design',
   '["figma","branding","typography"]'::jsonb,
   'range', 250000, 400000, 'USD', 14,
   'remote', NULL, 'published', 'public', 'approved',
   now() - interval '1 day',
   '{}'::jsonb)
ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO project_approvals (id, project_id, step, approver_id, decision, rationale, decided_at)
VALUES
  ('32000000-0000-0000-0000-000000000101'::uuid,
   '32000000-0000-0000-0000-000000000001'::uuid, 1,
   '33333333-3333-3333-3333-333333333333'::uuid,
   'approved', 'Budget within department cap.', now() - interval '3 days')
ON CONFLICT (project_id, step) DO NOTHING;

INSERT INTO project_match_runs (id, project_id, model_version, diversify_enabled, candidate_count, metadata)
VALUES
  ('32000000-0000-0000-0000-000000000201'::uuid,
   '32000000-0000-0000-0000-000000000001'::uuid,
   'fallback-v1', true, 3, '{"source":"seed"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_match_candidates (id, run_id, candidate_id, score, rank, reasons)
VALUES
  ('32000000-0000-0000-0000-000000000301'::uuid,
   '32000000-0000-0000-0000-000000000201'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid, 880, 1,
   '["skills:react","skills:typescript","availability:immediate"]'::jsonb),
  ('32000000-0000-0000-0000-000000000302'::uuid,
   '32000000-0000-0000-0000-000000000201'::uuid,
   '44444444-4444-4444-4444-444444444444'::uuid, 742, 2,
   '["skills:react","timezone:overlap"]'::jsonb),
  ('32000000-0000-0000-0000-000000000303'::uuid,
   '32000000-0000-0000-0000-000000000201'::uuid,
   '55555555-5555-5555-5555-555555555555'::uuid, 690, 3,
   '["skills:tailwind","rating:4.8"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_invites (id, project_id, inviter_id, candidate_id, status, message, sent_at, expires_at)
VALUES
  ('32000000-0000-0000-0000-000000000401'::uuid,
   '32000000-0000-0000-0000-000000000001'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   'sent', 'Loved your portfolio — interested?',
   now() - interval '1 day', now() + interval '6 days')
ON CONFLICT (project_id, candidate_id) DO NOTHING;

INSERT INTO project_boost_wallets (id, owner_id, tenant_id, balance, lifetime_purchased, lifetime_consumed)
VALUES
  ('32000000-0000-0000-0000-000000000501'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   'demo-tenant', 18, 25, 7)
ON CONFLICT (owner_id, tenant_id) DO NOTHING;

INSERT INTO project_boost_ledger (id, wallet_id, type, amount, balance_after, project_id, reference)
VALUES
  ('32000000-0000-0000-0000-000000000601'::uuid,
   '32000000-0000-0000-0000-000000000501'::uuid,
   'purchase', 25, 25, NULL, 'pack:boost-25'),
  ('32000000-0000-0000-0000-000000000602'::uuid,
   '32000000-0000-0000-0000-000000000501'::uuid,
   'consume', -7, 18,
   '32000000-0000-0000-0000-000000000001'::uuid, 'boost:7d')
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_boost_purchases (id, wallet_id, pack_id, credits, amount_cents, currency, status, idempotency_key, confirmed_at)
VALUES
  ('32000000-0000-0000-0000-000000000701'::uuid,
   '32000000-0000-0000-0000-000000000501'::uuid,
   'boost-25', 25, 9900, 'USD', 'confirmed',
   'seed-pbp-boost-25', now() - interval '5 days')
ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO project_outbound_webhooks (id, tenant_id, event, target_url, payload, status, attempts, delivered_at)
VALUES
  ('32000000-0000-0000-0000-000000000801'::uuid,
   'demo-tenant', 'pps.project.published',
   'https://example.test/hooks/pps',
   '{"projectId":"32000000-0000-0000-0000-000000000001"}'::jsonb,
   'sent', 1, now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;
