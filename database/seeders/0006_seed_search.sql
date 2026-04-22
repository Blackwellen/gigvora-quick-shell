-- Command palette catalogue (mirrors web ⌘K shortcuts in src/components/search/*)
INSERT INTO command_palette_actions (id, label, category, hint, icon, shortcut, href, required_role, required_entitlement, position) VALUES
 ('goto.inbox',         'Open Inbox',          'navigate', 'Messages, threads & search',  'Inbox',         'g i', '/inbox',           NULL, NULL, 10),
 ('goto.feed',          'Open Feed',           'navigate', 'Social activity stream',      'Newspaper',     'g f', '/feed',            NULL, NULL, 11),
 ('goto.work',          'Open Work Hub',       'navigate', 'Tasks, milestones, approvals','Briefcase',     'g w', '/work',            NULL, NULL, 12),
 ('goto.hire',          'Open Hire',           'navigate', 'Candidates & pipelines',      'Users',         'g h', '/hire',            'professional', 'recruiter-pro', 13),
 ('goto.plans',         'Open Plans',          'navigate', 'Compare & change plan',       'CreditCard',    'g p', '/plans',           NULL, NULL, 14),
 ('goto.settings',      'Open Settings',       'navigate', 'Preferences & integrations',  'Settings',      'g s', '/settings',        NULL, NULL, 15),
 ('create.gig',         'Create Gig',          'create',   'Productized package',         'Sparkles',      'c g', '/gigs/new',        'professional', NULL, 20),
 ('create.service',     'Create Service',      'create',   'Consultative offering',       'Wrench',        'c s', '/services/new',    'professional', NULL, 21),
 ('create.job',         'Post a Job',          'create',   'Open a new role',             'BriefcaseBusiness','c j', '/jobs/new',     NULL, NULL, 22),
 ('create.project',     'Create Project',      'create',   'New project workspace',       'FolderPlus',    'c p', '/projects/new',    NULL, NULL, 23),
 ('admin.terminal',     'Admin Terminal',      'admin',    'Operations & moderation',     'ShieldAlert',   NULL,  '/admin',           'admin', NULL, 90),
 ('help.shortcuts',     'Keyboard Shortcuts',  'help',     'See all shortcuts',           'Keyboard',      '?',   '/help/shortcuts',  NULL, NULL, 99)
ON CONFLICT (id) DO UPDATE SET
  label=EXCLUDED.label, category=EXCLUDED.category, hint=EXCLUDED.hint, icon=EXCLUDED.icon,
  shortcut=EXCLUDED.shortcut, href=EXCLUDED.href, required_role=EXCLUDED.required_role,
  required_entitlement=EXCLUDED.required_entitlement, position=EXCLUDED.position;

-- Realistic seed documents across the 10 indexes
INSERT INTO search_documents (id, index_name, title, body, tags, url, visibility) VALUES
 ('u_sarah',    'users',     'Sarah Chen',           'Senior product designer, Figma, design systems', ARRAY['design','figma','remote'], '/profile/sarah-chen','public'),
 ('u_marcus',   'users',     'Marcus Johnson',       'Full-stack engineer, React, Node, AWS',          ARRAY['engineer','react','aws'],  '/profile/marcus','public'),
 ('j_eng_001',  'jobs',      'Senior React Engineer','Hybrid, London. Greenfield enterprise SaaS.',    ARRAY['react','london','hybrid'], '/jobs/eng-001','public'),
 ('p_creator_mobile_v2', 'projects', 'Creator mobile redesign', 'Mobile-first workflow and profile overhaul', ARRAY['mobile','redesign'], '/projects/creator-mobile-v2','org'),
 ('g_logo_001', 'gigs',      'Logo & brand kit',     '48h delivery, 3 concepts, source files',         ARRAY['logo','brand','express'],  '/gigs/logo-001','public'),
 ('s_audit_seo','services',  'Technical SEO audit',  'Crawl, performance, schema, redirects',          ARRAY['seo','audit'],             '/services/seo-audit','public'),
 ('c_acme',     'companies', 'Acme Corp',            'B2B SaaS, 250 staff, London HQ',                 ARRAY['saas','london'],           '/companies/acme','public'),
 ('e_summit_25','events',    'Founders Summit 2025', 'Two-day in-person event, Paris',                 ARRAY['summit','paris'],          '/events/summit-25','public'),
 ('m_reel_01',  'media',     'Brand reel — spring',  'Short-form vertical reel, 30s',                  ARRAY['reel','video'],            '/media/reel-01','public'),
 ('grp_design', 'groups',    'UK Design Leaders',    'Private group for senior designers',             ARRAY['design','community'],      '/groups/design-leaders','public')
ON CONFLICT (index_name, id) DO UPDATE SET title=EXCLUDED.title, body=EXCLUDED.body, tags=EXCLUDED.tags, url=EXCLUDED.url;

-- Demo cross-links (gig ↔ company, project ↔ user)
INSERT INTO cross_links (source_index, source_id, target_index, target_id, relation, weight) VALUES
 ('gigs','g_logo_001','companies','c_acme','attached_to', 1.0),
 ('projects','p_creator_mobile_v2','users','u_sarah','depends_on',  0.9),
 ('jobs','j_eng_001','companies','c_acme','attached_to',  1.0)
ON CONFLICT DO NOTHING;

-- Seeded saved searches for Domain 03 demo identities
INSERT INTO saved_searches (identity_id, name, query, scope, pinned, notify) VALUES
 ('22222222-2222-2222-2222-222222222222', 'React jobs in London', 'react london', 'jobs', true, true),
 ('22222222-2222-2222-2222-222222222222', 'New design gigs',      'logo brand',   'gigs', false, false)
ON CONFLICT DO NOTHING;
