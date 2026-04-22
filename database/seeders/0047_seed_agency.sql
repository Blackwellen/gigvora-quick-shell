-- Seed Domain 13 — Agency Pages, Service Presence & Public Proof Surfaces.
-- Idempotent.

INSERT INTO agencies (id, owner_id, slug, name, tagline, about, industry, size_band, founded_year, headquarters, website, logo_url, status, verified, follower_count, employee_count)
VALUES
  ('13000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','northstar-studio','Northstar Studio','Brand systems & product design for ambitious teams','We design tokenised brand systems and ship them as code.','Design','11-50',2018,'London','https://northstar.example.com','/logos/northstar.svg','active',true,820,32),
  ('13000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','helix-labs','Helix Labs','Engineering partner for fintech & climate','Full-stack delivery teams for regulated and high-trust products.','Engineering','51-200',2015,'Manchester','https://helixlabs.example.com','/logos/helix.svg','active',true,1450,118),
  ('13000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','meridian-research','Meridian Research','Strategy, research and synthesis for product teams','Mixed-methods research squads embedded with product orgs.','Research','11-50',2020,'Bristol','https://meridian.example.com','/logos/meridian.svg','active',false,310,18)
ON CONFLICT (id) DO NOTHING;

INSERT INTO agency_services (id, agency_id, title, slug, summary, price_band, status, position) VALUES
  ('13100000-0000-0000-0000-000000000001','13000000-0000-0000-0000-000000000001','Brand & token system','brand-token-system','Strategy, palette, typography and oklch token export.','£25k–£60k','active',0),
  ('13100000-0000-0000-0000-000000000002','13000000-0000-0000-0000-000000000001','Design system audit','design-system-audit','Two-week audit of an existing system with a remediation plan.','£8k–£15k','active',1),
  ('13100000-0000-0000-0000-000000000003','13000000-0000-0000-0000-000000000002','Embedded delivery squad','embedded-squad','3–6 person cross-functional squad for 12+ weeks.','£90k+','active',0),
  ('13100000-0000-0000-0000-000000000004','13000000-0000-0000-0000-000000000003','Generative research sprint','gen-research-sprint','5-week qual study with synthesis workshop.','£18k–£35k','active',0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO agency_team_members (id, agency_id, identity_id, name, role, title, position) VALUES
  ('13200000-0000-0000-0000-000000000001','13000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Demo One','founder','Founder & Design Director',0),
  ('13200000-0000-0000-0000-000000000002','13000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','Demo Two','lead','Principal Designer',1),
  ('13200000-0000-0000-0000-000000000003','13000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Demo Two','founder','Co-founder, CTO',0),
  ('13200000-0000-0000-0000-000000000004','13000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','Demo Three','founder','Founder & Lead Researcher',0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO agency_case_studies (id, agency_id, slug, title, client_name, summary, outcome, status, position) VALUES
  ('13300000-0000-0000-0000-000000000001','13000000-0000-0000-0000-000000000001','globex-rebrand','Globex full rebrand','Globex Inc.','12-week rebrand and token-driven design system rollout.','+38% activation, -22% support tickets','published',0),
  ('13300000-0000-0000-0000-000000000002','13000000-0000-0000-0000-000000000002','acme-payments-platform','Acme payments platform','Acme Bank','Built and scaled a regulated payments platform to 4M users.','99.99% uptime over 18 months','published',0),
  ('13300000-0000-0000-0000-000000000003','13000000-0000-0000-0000-000000000003','initech-onboarding-research','Initech onboarding research','Initech','Discovered why activation dropped 40% post-launch.','Roadmap that recovered activation in 2 quarters','published',0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO agency_reviews (id, agency_id, reviewer_id, rating, title, body, status, published_at) VALUES
  ('13400000-0000-0000-0000-000000000001','13000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',5,'Best partner we''ve worked with','Northstar shipped on time, on brand, and made our team better.','published', now() - interval '20 days'),
  ('13400000-0000-0000-0000-000000000002','13000000-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333',4,'Strong delivery, high standard','Helix''s squad held a high engineering bar throughout.','published', now() - interval '40 days'),
  ('13400000-0000-0000-0000-000000000003','13000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',5,'Genuinely changed our roadmap','Findings were clear, actionable, and well-presented.','published', now() - interval '10 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO agency_proofs (id, agency_id, kind, label, value, position) VALUES
  ('13500000-0000-0000-0000-000000000001','13000000-0000-0000-0000-000000000001','metric','Avg engagement uplift','+38%',0),
  ('13500000-0000-0000-0000-000000000002','13000000-0000-0000-0000-000000000001','award','D&AD Wood Pencil','2024',1),
  ('13500000-0000-0000-0000-000000000003','13000000-0000-0000-0000-000000000002','metric','Production uptime','99.99%',0),
  ('13500000-0000-0000-0000-000000000004','13000000-0000-0000-0000-000000000003','quote','Featured in','UX Collective',0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO agency_followers (agency_id, follower_id) VALUES
  ('13000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222'),
  ('13000000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333'),
  ('13000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111'),
  ('13000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;
