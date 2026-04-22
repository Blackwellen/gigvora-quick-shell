-- Seed Domain 21 — Interview Planning.
INSERT INTO interview_loops (id, workspace_id, requisition_id, candidate_id, stage_key, status, target_completion_at) VALUES
  ('11112100-0000-0000-0000-000000000001', 'eeee2000-0000-0000-0000-000000000001',
   '99990000-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111',
   'tech', 'in_progress', now() + interval '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO interview_slots (id, loop_id, kind, starts_at, ends_at, meeting_link, status) VALUES
  ('22222100-0000-0000-0000-000000000001', '11112100-0000-0000-0000-000000000001',
   'tech', now() + interval '2 days', now() + interval '2 days' + interval '60 minutes',
   'https://meet.gigvora.dev/abc-tech', 'scheduled')
ON CONFLICT (id) DO NOTHING;

INSERT INTO interview_panelists (id, slot_id, interviewer_id, role, response_status) VALUES
  ('33332100-0000-0000-0000-000000000001', '22222100-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222', 'lead', 'accepted'),
  ('33332100-0000-0000-0000-000000000002', '22222100-0000-0000-0000-000000000001',
   '33333333-3333-3333-3333-333333333333', 'interviewer', 'tentative')
ON CONFLICT (slot_id, interviewer_id) DO NOTHING;

INSERT INTO interview_scorecards (id, slot_id, interviewer_id, loop_id, status, recommendation, scores, notes) VALUES
  ('44442100-0000-0000-0000-000000000001', '22222100-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222', '11112100-0000-0000-0000-000000000001',
   'draft', NULL,
   '{"problem_solving":3,"system_design":3,"communication":4}'::jsonb,
   'Solid first impression — strong on collaboration signals.')
ON CONFLICT (slot_id, interviewer_id) DO NOTHING;
