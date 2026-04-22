-- Seed Domain 20 — Enterprise Hiring Workspace.
INSERT INTO hiring_workspaces (id, tenant_id, name, slug, owner_id, status, settings) VALUES
  ('eeee2000-0000-0000-0000-000000000001', 'tenant-demo', 'Acme Talent', 'acme-talent',
   '11111111-1111-1111-1111-111111111111', 'active',
   '{"timezone":"Europe/London","fiscalYearStart":"04-01"}'::jsonb)
ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO hiring_workspace_members (id, workspace_id, member_id, role) VALUES
  ('eeee2010-0000-0000-0000-000000000001', 'eeee2000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'owner'),
  ('eeee2010-0000-0000-0000-000000000002', 'eeee2000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222', 'recruiter'),
  ('eeee2010-0000-0000-0000-000000000003', 'eeee2000-0000-0000-0000-000000000001',
   '33333333-3333-3333-3333-333333333333', 'hiring_manager')
ON CONFLICT (workspace_id, member_id) DO NOTHING;

INSERT INTO hiring_pipelines (id, workspace_id, name, is_default, stages) VALUES
  ('eeee2020-0000-0000-0000-000000000001', 'eeee2000-0000-0000-0000-000000000001',
   'Standard Engineering', true,
   '[{"key":"applied","name":"Applied","slaHours":24,"kind":"intake"},
     {"key":"screen","name":"Recruiter Screen","slaHours":72,"kind":"screen"},
     {"key":"tech","name":"Technical Interview","slaHours":120,"kind":"interview"},
     {"key":"onsite","name":"Onsite Loop","slaHours":168,"kind":"interview"},
     {"key":"offer","name":"Offer","slaHours":48,"kind":"offer"},
     {"key":"hired","name":"Hired","slaHours":0,"kind":"terminal"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

UPDATE hiring_workspaces
   SET default_pipeline_id = 'eeee2020-0000-0000-0000-000000000001'
 WHERE id = 'eeee2000-0000-0000-0000-000000000001'
   AND default_pipeline_id IS DISTINCT FROM 'eeee2020-0000-0000-0000-000000000001';

INSERT INTO hiring_approval_policies (id, workspace_id, name, scope, rules, active) VALUES
  ('eeee2030-0000-0000-0000-000000000001', 'eeee2000-0000-0000-0000-000000000001',
   'Offer above £120k requires CFO', 'offer',
   '[{"whenAmountGt":120000,"approvers":[{"role":"cfo","count":1},{"role":"hiring_manager","count":1}]}]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hiring_metrics (id, workspace_id, week_start, open_reqs, new_apps, hires, avg_time_to_hire_days, funnel_snapshot) VALUES
  ('eeee2040-0000-0000-0000-000000000001', 'eeee2000-0000-0000-0000-000000000001',
   date_trunc('week', now()) - interval '1 week', 12, 84, 3, 28,
   '{"applied":84,"screen":40,"tech":18,"onsite":7,"offer":4,"hired":3}'::jsonb)
ON CONFLICT (workspace_id, week_start) DO NOTHING;
