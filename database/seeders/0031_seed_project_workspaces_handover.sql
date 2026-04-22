-- Domain 33 — Project Workspaces & Handover — demo seed (idempotent).
INSERT INTO project_workspaces (id, tenant_id, project_id, contract_id, buyer_id, provider_id, title, status, started_at, metadata)
VALUES
  ('33000000-0000-0000-0000-000000000001'::uuid, 'demo-tenant',
   '32000000-0000-0000-0000-000000000001'::uuid,
   '36000000-0000-0000-0000-000000000001'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   'React dashboard refresh',
   'active', now() - interval '5 days',
   '{"source":"csa.contract.activated"}'::jsonb)
ON CONFLICT (contract_id) DO NOTHING;

INSERT INTO project_milestones (id, workspace_id, ordering, title, description, amount_cents, currency, due_at, status, submitted_at, approved_at)
VALUES
  ('33000000-0000-0000-0000-000000000101'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid, 1,
   'Discovery + audit', 'Audit current views and ship a written plan.',
   150000, 'USD', now() + interval '2 days',
   'approved', now() - interval '2 days', now() - interval '1 day'),
  ('33000000-0000-0000-0000-000000000102'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid, 2,
   'Build core shell', 'TanStack + Tailwind shell with first 3 routes.',
   350000, 'USD', now() + interval '10 days',
   'in_progress', NULL, NULL),
  ('33000000-0000-0000-0000-000000000103'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid, 3,
   'Polish + handover', 'Handover doc + Loom + final QA.',
   150000, 'USD', now() + interval '18 days',
   'pending', NULL, NULL)
ON CONFLICT (workspace_id, ordering) DO NOTHING;

INSERT INTO project_deliverables (id, workspace_id, milestone_id, uploader_id, file_key, file_name, mime_type, size_bytes, status, notes)
VALUES
  ('33000000-0000-0000-0000-000000000201'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid,
   '33000000-0000-0000-0000-000000000101'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   'workspaces/33000000-0000-0000-0000-000000000001/discovery.pdf',
   'discovery.pdf', 'application/pdf', 320000,
   'accepted', 'Approved as final discovery doc.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_handover_checklists (id, workspace_id, ordering, label, required, done, done_by, done_at)
VALUES
  ('33000000-0000-0000-0000-000000000301'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid, 1, 'Source code repo transferred', true, false, NULL, NULL),
  ('33000000-0000-0000-0000-000000000302'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid, 2, 'Production access revoked', true, false, NULL, NULL),
  ('33000000-0000-0000-0000-000000000303'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid, 3, 'Handover walkthrough recorded', true, false, NULL, NULL),
  ('33000000-0000-0000-0000-000000000304'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid, 4, 'Final invoice submitted', true, false, NULL, NULL)
ON CONFLICT (workspace_id, ordering) DO NOTHING;

INSERT INTO project_final_reports (id, workspace_id, author_id, summary, outcomes, ratings, status)
VALUES
  ('33000000-0000-0000-0000-000000000401'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   'Draft summary — to be completed at handover.',
   '[]'::jsonb,
   '{}'::jsonb,
   'draft')
ON CONFLICT (workspace_id) DO NOTHING;

INSERT INTO project_workspace_events (id, workspace_id, actor_id, event, detail)
VALUES
  ('33000000-0000-0000-0000-000000000501'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   'workspace.minted',
   '{"contractId":"36000000-0000-0000-0000-000000000001"}'::jsonb),
  ('33000000-0000-0000-0000-000000000502'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   'milestone.submitted',
   '{"milestoneId":"33000000-0000-0000-0000-000000000101"}'::jsonb),
  ('33000000-0000-0000-0000-000000000503'::uuid,
   '33000000-0000-0000-0000-000000000001'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   'milestone.approved',
   '{"milestoneId":"33000000-0000-0000-0000-000000000101"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
