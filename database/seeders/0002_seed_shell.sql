-- Seed shell domain with realistic orgs, memberships, saved views, recents
-- Assumes a demo user exists at id '00000000-0000-0000-0000-000000000001'

INSERT INTO orgs (id, slug, name, plan, status, owner_id, settings)
VALUES
  ('11111111-1111-1111-1111-111111111111','personal','Personal','free','active',
   '00000000-0000-0000-0000-000000000001','{"isPersonal":true}'),
  ('22222222-2222-2222-2222-222222222222','acme','Acme Corp','team','active',
   '00000000-0000-0000-0000-000000000001','{"industry":"saas"}'),
  ('33333333-3333-3333-3333-333333333333','techstartup','TechStartup Inc','enterprise','active',
   '00000000-0000-0000-0000-000000000001','{"industry":"fintech"}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO memberships (org_id, user_id, role, state)
VALUES
  ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','owner','active'),
  ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000001','admin','active'),
  ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000001','member','active')
ON CONFLICT (org_id, user_id) DO NOTHING;

INSERT INTO saved_views (user_id, label, route, pinned, position)
VALUES
  ('00000000-0000-0000-0000-000000000001','Active Hiring Pipeline','/recruiter-pro',true,0),
  ('00000000-0000-0000-0000-000000000001','My Open Projects','/projects',true,1),
  ('00000000-0000-0000-0000-000000000001','Finance Overview','/finance',false,2),
  ('00000000-0000-0000-0000-000000000001','Team Workspace','/org',false,3);

INSERT INTO recent_items (user_id, kind, label, route, visited_at)
VALUES
  ('00000000-0000-0000-0000-000000000001','job','Senior React Developer','/jobs/sr-react', now() - interval '2 minutes'),
  ('00000000-0000-0000-0000-000000000001','project','Project Alpha Workspace','/projects/alpha/workspace', now() - interval '8 minutes'),
  ('00000000-0000-0000-0000-000000000001','profile','Sarah K. — Profile','/profile/sarah-k', now() - interval '15 minutes'),
  ('00000000-0000-0000-0000-000000000001','gig','Logo Design Gig','/gigs/logo-design', now() - interval '1 hour'),
  ('00000000-0000-0000-0000-000000000001','message','Thread with Marcus T.','/inbox/marcus-t', now() - interval '2 hours');

INSERT INTO shell_prefs (user_id, active_role, active_org_id)
VALUES ('00000000-0000-0000-0000-000000000001','user','11111111-1111-1111-1111-111111111111')
ON CONFLICT (user_id) DO NOTHING;
