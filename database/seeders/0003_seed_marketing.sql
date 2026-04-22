-- Realistic seeds for Domain 02 marketing surfaces.
INSERT INTO marketing_pages (slug, surface, title, tagline, description, status, published_at, seo) VALUES
 ('home', 'landing', 'Gigvora', 'The operating platform for modern professional work',
  'Hire, sell, network, and grow on a single enterprise-grade platform.', 'published', now(),
  '{"og_image":"/og/home.jpg","canonical":"https://gigvora.lovable.app/"}'::jsonb),
 ('pricing', 'pricing', 'Pricing', 'Free to start. Scale when you''re ready.',
  'Free, Pro, Team, and Enterprise tiers with transparent feature gating.', 'published', now(),
  '{"og_image":"/og/pricing.jpg"}'::jsonb),
 ('about', 'about', 'About Gigvora', 'Built for professionals who ship.',
  'Our mission, team, and operating principles.', 'published', now(), '{}'::jsonb),
 ('showcase/jobs', 'showcase', 'Jobs', 'Find roles built for ambitious professionals.', NULL, 'published', now(), '{}'::jsonb),
 ('showcase/enterprise-connect', 'showcase', 'Enterprise Connect', 'Procurement-grade B2B sourcing and contracting.', NULL, 'published', now(), '{}'::jsonb),
 ('solution/recruiting', 'solution', 'Recruiting', 'Unify sourcing, screening, and hiring.', NULL, 'draft', NULL, '{}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO cta_experiments (key, name, hypothesis, status, started_at) VALUES
 ('home.hero.cta', 'Home Hero CTA copy', 'Action verbs convert better than nouns.', 'running', now() - interval '7 days'),
 ('pricing.primary', 'Pricing primary CTA', 'Free trial framing beats demo framing.', 'running', now() - interval '3 days')
ON CONFLICT (key) DO NOTHING;

INSERT INTO cta_variants (experiment_id, label, payload, weight)
SELECT id, 'control', '{"label":"Get started","href":"/auth/sign-up"}'::jsonb, 50 FROM cta_experiments WHERE key='home.hero.cta'
ON CONFLICT DO NOTHING;
INSERT INTO cta_variants (experiment_id, label, payload, weight)
SELECT id, 'challenger-a', '{"label":"Start building free","href":"/auth/sign-up"}'::jsonb, 50 FROM cta_experiments WHERE key='home.hero.cta'
ON CONFLICT DO NOTHING;
INSERT INTO cta_variants (experiment_id, label, payload, weight)
SELECT id, 'control', '{"label":"Book a demo","href":"/contact"}'::jsonb, 50 FROM cta_experiments WHERE key='pricing.primary'
ON CONFLICT DO NOTHING;
INSERT INTO cta_variants (experiment_id, label, payload, weight)
SELECT id, 'challenger-a', '{"label":"Start 14-day trial","href":"/auth/sign-up"}'::jsonb, 50 FROM cta_experiments WHERE key='pricing.primary'
ON CONFLICT DO NOTHING;

INSERT INTO marketing_leads (email, full_name, company, role, use_case, source_page, status, score) VALUES
 ('alice@northwind.test','Alice Mercer','Northwind','VP Talent','Hiring 20 engineers in Q3','/showcase/recruiter-pro','qualified',72),
 ('ben@stark.test','Ben Stark','Stark Industries','Procurement Lead','Vendor consolidation','/showcase/enterprise-connect','nurturing',54),
 ('cleo@independent.test','Cleo Park',NULL,'Freelancer','Sell design services','/showcase/services','new',18)
ON CONFLICT DO NOTHING;

INSERT INTO newsletter_subscribers (email, status, list_topics, confirmed_at) VALUES
 ('reader1@example.com','confirmed', ARRAY['product','launches'], now()),
 ('reader2@example.com','pending', ARRAY['product'], NULL)
ON CONFLICT (email) DO NOTHING;
