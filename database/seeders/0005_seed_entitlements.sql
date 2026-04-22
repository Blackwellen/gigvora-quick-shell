-- Plans (mirrors src/types/role.ts PLAN_CONFIGS)
INSERT INTO plans (id, label, description, price_monthly, price_annual, entitlements, limits, highlight, badge, position) VALUES
 ('free','Free','Get started with basic features', 0, 0, '{}',
  '{"proposals":5,"projects":2,"gigSlots":3,"teamMembers":1,"storage":"500 MB"}'::jsonb, false, NULL, 0),
 ('starter','Starter','For growing professionals', 19, 190,
  '{creation-studio-pro,document-studio}',
  '{"proposals":20,"projects":10,"gigSlots":10,"teamMembers":3,"storage":"5 GB"}'::jsonb, false, 'Popular', 1),
 ('pro','Pro','Unlock advanced tools and priority support', 49, 490,
  '{creation-studio-pro,document-studio,advanced-analytics,priority-support,recruiter-pro,ads-manager}',
  '{"proposals":100,"projects":50,"gigSlots":50,"teamMembers":10,"storage":"50 GB"}'::jsonb, true, NULL, 2),
 ('business','Business','For teams and agencies', 99, 990,
  '{recruiter-pro,sales-navigator,ads-manager,creation-studio-pro,advanced-analytics,priority-support,custom-branding,api-access,team-management,document-studio,bulk-messaging}',
  '{"proposals":500,"projects":200,"gigSlots":200,"teamMembers":50,"storage":"200 GB"}'::jsonb, false, NULL, 3),
 ('enterprise','Enterprise','Custom solutions at scale', 0, 0,
  '{recruiter-pro,sales-navigator,ads-manager,creation-studio-pro,enterprise-connect,advanced-analytics,priority-support,custom-branding,api-access,sso,team-management,document-studio,bulk-messaging}',
  '{"proposals":-1,"projects":-1,"gigSlots":-1,"teamMembers":-1,"storage":"Unlimited"}'::jsonb, false, NULL, 4)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label, description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly, price_annual = EXCLUDED.price_annual,
  entitlements = EXCLUDED.entitlements, limits = EXCLUDED.limits,
  highlight = EXCLUDED.highlight, badge = EXCLUDED.badge, position = EXCLUDED.position,
  updated_at = now();

-- Demo grants for Domain 03 seeded identities
INSERT INTO role_grants (identity_id, role, status, meta) VALUES
 ('11111111-1111-1111-1111-111111111111','user','active','{"seed":true}'::jsonb),
 ('22222222-2222-2222-2222-222222222222','user','active','{"seed":true}'::jsonb),
 ('22222222-2222-2222-2222-222222222222','professional','active','{"seed":true}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO subscriptions (identity_id, plan_id, status, billing_cycle, current_period_end, meta) VALUES
 ('11111111-1111-1111-1111-111111111111','free','active','monthly', now() + interval '30 days', '{"seed":true}'::jsonb),
 ('22222222-2222-2222-2222-222222222222','pro','active','monthly', now() + interval '30 days', '{"seed":true}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO entitlement_overrides (identity_id, feature, grant, reason, status) VALUES
 ('22222222-2222-2222-2222-222222222222','sales-navigator', true, 'beta-tester', 'active')
ON CONFLICT DO NOTHING;
