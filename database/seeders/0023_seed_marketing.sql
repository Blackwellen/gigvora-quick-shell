-- Seed Domain 25 — Marketing.
INSERT INTO marketing_segments (id, tenant_id, name, description, filter_expr, estimated_size, refreshed_at) VALUES
  ('aaaa2500-0000-0000-0000-000000000001', 'tenant-demo', 'Active recruiters last 30d',
   'Recruiters with >=1 login in the last 30 days',
   '{"role":"recruiter","loginWithinDays":30}'::jsonb, 184, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO marketing_templates (id, tenant_id, name, channel, subject, body, variables) VALUES
  ('bbbb2500-0000-0000-0000-000000000001', 'tenant-demo',
   'Weekly hiring digest', 'email',
   '{{firstName}}, your hiring week at a glance',
   '<p>Hi {{firstName}},</p><p>You moved {{advancedCount}} candidates forward this week.</p>',
   '["firstName","advancedCount"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO marketing_campaigns (id, tenant_id, owner_id, name, channel, status, subject, body, template_id, segment_id, scheduled_at, sent_at) VALUES
  ('cccc2500-0000-0000-0000-000000000001', 'tenant-demo',
   '11111111-1111-1111-1111-111111111111',
   'Hiring digest — week 16', 'email', 'sent',
   'Your hiring week at a glance',
   '<p>Hi {{firstName}}, here is your weekly summary…</p>',
   'bbbb2500-0000-0000-0000-000000000001',
   'aaaa2500-0000-0000-0000-000000000001',
   now() - interval '2 days', now() - interval '2 days' + interval '5 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO marketing_send_batches (id, campaign_id, status, recipient_count, success_count, failure_count, started_at, completed_at) VALUES
  ('dddd2500-0000-0000-0000-000000000001', 'cccc2500-0000-0000-0000-000000000001',
   'completed', 184, 181, 3,
   now() - interval '2 days' + interval '5 minutes',
   now() - interval '2 days' + interval '12 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO marketing_recipient_events (id, campaign_id, batch_id, recipient_id, recipient_address, event, detail) VALUES
  ('eeee2500-0000-0000-0000-000000000001', 'cccc2500-0000-0000-0000-000000000001',
   'dddd2500-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'recruiter@acme.test', 'delivered', '{}'::jsonb),
  ('eeee2500-0000-0000-0000-000000000002', 'cccc2500-0000-0000-0000-000000000001',
   'dddd2500-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'recruiter@acme.test', 'opened', '{"client":"gmail-web"}'::jsonb),
  ('eeee2500-0000-0000-0000-000000000003', 'cccc2500-0000-0000-0000-000000000001',
   'dddd2500-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   'manager@acme.test', 'bounced', '{"reason":"mailbox-full"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
