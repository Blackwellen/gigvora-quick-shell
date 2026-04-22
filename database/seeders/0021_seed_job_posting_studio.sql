-- Seed Domain 23 — Job Posting Studio.
INSERT INTO job_postings (id, workspace_id, tenant_id, author_id, title, slug, status,
  employment_type, work_mode, location_city, location_country, salary_min, salary_max, salary_currency,
  description, responsibilities, requirements, perks, published_at) VALUES
  ('99990000-0000-0000-0000-000000000023',
   'eeee2000-0000-0000-0000-000000000001', 'tenant-demo',
   '11111111-1111-1111-1111-111111111111',
   'Senior Platform Engineer', 'senior-platform-engineer-london', 'published',
   'full_time', 'hybrid', 'London', 'GB', 95000, 130000, 'GBP',
   'Own the runtime that powers Gigvora ML and analytics services.',
   '["Design and operate the core platform","Own SLOs and incident response","Mentor mid-level engineers"]'::jsonb,
   '["7+ years backend","Kubernetes in production","Strong Postgres fundamentals"]'::jsonb,
   '["Hybrid 2 days/week","Learning budget £2k","Pension match 6%"]'::jsonb,
   now() - interval '8 days')
ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO job_posting_versions (id, posting_id, version, author_id, diff, snapshot) VALUES
  ('cccc2300-0000-0000-0000-000000000001', '99990000-0000-0000-0000-000000000023', 1,
   '11111111-1111-1111-1111-111111111111',
   '{"title":["+","Senior Platform Engineer"]}'::jsonb,
   '{"title":"Senior Platform Engineer","status":"draft"}'::jsonb),
  ('cccc2300-0000-0000-0000-000000000002', '99990000-0000-0000-0000-000000000023', 2,
   '11111111-1111-1111-1111-111111111111',
   '{"status":["draft","published"]}'::jsonb,
   '{"title":"Senior Platform Engineer","status":"published"}'::jsonb)
ON CONFLICT (posting_id, version) DO NOTHING;

INSERT INTO job_posting_distributions (id, posting_id, channel, external_id, status, published_at, cost) VALUES
  ('dddd2300-0000-0000-0000-000000000001', '99990000-0000-0000-0000-000000000023', 'gigvora',
   'gv-job-23-001', 'live', now() - interval '8 days', 0),
  ('dddd2300-0000-0000-0000-000000000002', '99990000-0000-0000-0000-000000000023', 'linkedin',
   'li-22918273', 'live', now() - interval '7 days', 39500)
ON CONFLICT (posting_id, channel) DO NOTHING;

INSERT INTO job_posting_suggestions (id, posting_id, kind, model_version, payload, accepted) VALUES
  ('eeee2300-0000-0000-0000-000000000001', '99990000-0000-0000-0000-000000000023',
   'inclusivity', 'jps.suggest.v1',
   '{"flags":[{"phrase":"rockstar","suggestion":"high performer"}]}'::jsonb, true),
  ('eeee2300-0000-0000-0000-000000000002', '99990000-0000-0000-0000-000000000023',
   'salary_benchmark', 'jps.suggest.v1',
   '{"market_p50":118000,"market_p75":135000,"verdict":"competitive"}'::jsonb, false)
ON CONFLICT (id) DO NOTHING;
