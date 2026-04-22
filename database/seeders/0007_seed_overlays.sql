-- Demo overlay sessions and a follow-through workflow so the frontend can
-- rehydrate believable in-flight overlays.
INSERT INTO overlay_sessions (id, identity_id, kind, surface_key, status, origin, route, entity_type, entity_id, payload)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'drawer','jobs.editor','open','user','/jobs/draft-123','job','draft-123',
   '{"step":"compensation","draft":{"title":"Senior PM","salary":"95000"}}'::jsonb),
  ('aaaaaaaa-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222',
   'wizard','gigs.create','open','user','/gigs/new','gig',NULL,
   '{"step":3,"packages":[{"tier":"basic","price":150}]}'::jsonb),
  ('aaaaaaaa-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',
   'inspector','profile.preview','dismissed','user','/profile/me','profile','me',
   '{"tab":"reviews"}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO overlay_workflows (id, identity_id, template_key, status, current_step, total_steps, context)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'purchase_followup','active','review_prompt',4,
   '{"orderId":"ord_demo_42","amount":4900,"currency":"GBP"}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO overlay_workflow_steps (workflow_id, step_key, position, status)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001','checkout_success', 1,'completed'),
  ('bbbbbbbb-0000-0000-0000-000000000001','receipt_view',     2,'completed'),
  ('bbbbbbbb-0000-0000-0000-000000000001','review_prompt',    3,'open'),
  ('bbbbbbbb-0000-0000-0000-000000000001','next_action',      4,'pending')
ON CONFLICT (workflow_id, step_key) DO NOTHING;

INSERT INTO detached_windows (identity_id, channel_key, surface_key, route, state)
VALUES
  ('22222222-2222-2222-2222-222222222222','dw-pro-inbox-1','messaging.inbox','/messages',
   '{"thread":"thr_demo","unread":3}'::jsonb)
ON CONFLICT (identity_id, channel_key) DO NOTHING;
