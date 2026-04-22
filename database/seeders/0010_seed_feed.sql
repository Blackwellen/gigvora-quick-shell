-- Realistic posts, reactions, comments, follows, opportunity cards.
INSERT INTO posts (id, author_id, kind, status, visibility, body, tags, reaction_count, comment_count) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','11111111-1111-1111-1111-111111111111','text','published','public',
   'Just shipped a new design system token pass — high-roundedness, oklch colour, motion-aware. Feedback welcome!',
   ARRAY['design','design-systems','launched'], 24, 7),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','22222222-2222-2222-2222-222222222222','milestone','published','public',
   'Hit 500 sessions delivered on Gigvora. Thank you to every client and collaborator who made this possible.',
   ARRAY['milestone','gratitude'], 142, 18),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3','33333333-3333-3333-3333-333333333333','opportunity','published','public',
   'We''re hiring a Senior React engineer in London. Remote-friendly, equity, strong design culture.',
   ARRAY['hiring','react','london'], 56, 22),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4','11111111-1111-1111-1111-111111111111','poll','published','public',
   'What state library are you using in 2026?', ARRAY['react','state'], 9, 31)
ON CONFLICT DO NOTHING;

UPDATE posts SET poll = '{"question":"State library 2026?","options":[{"label":"Zustand","votes":48},{"label":"Jotai","votes":22},{"label":"Redux Toolkit","votes":31},{"label":"Other","votes":12}],"closesAt":null}'::jsonb
  WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4';

UPDATE posts SET opportunity = '{"kind":"job","refId":"job-001","title":"Senior React Engineer","location":"London / Remote","comp":"£90k–£120k + equity","deadline":"2026-05-15"}'::jsonb
  WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3';

INSERT INTO post_reactions (post_id, actor_id, kind) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','22222222-2222-2222-2222-222222222222','celebrate'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','11111111-1111-1111-1111-111111111111','support'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3','11111111-1111-1111-1111-111111111111','insightful')
ON CONFLICT DO NOTHING;

INSERT INTO post_comments (post_id, author_id, body) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','22222222-2222-2222-2222-222222222222','Love the oklch move — perceptual uniformity is a game changer.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','33333333-3333-3333-3333-333333333333','Massive milestone, well earned.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3','11111111-1111-1111-1111-111111111111','Sharing with my network!');

INSERT INTO follows (follower_id, followee_id) VALUES
  ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222'),
  ('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333'),
  ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO post_saves (actor_id, post_id) VALUES
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3')
ON CONFLICT DO NOTHING;

-- Fan-out index for the seed user
INSERT INTO feed_index (viewer_id, post_id, score, reason) VALUES
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 0.92, 'follow'),
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 0.88, 'opportunity'),
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 0.71, 'follow'),
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 0.55, 'recommended')
ON CONFLICT DO NOTHING;

INSERT INTO opportunity_cards (kind, ref_id, title, org_name, location, comp_min, comp_max, tags, deadline_at) VALUES
  ('job',    gen_random_uuid(), 'Senior React Engineer',   'Acme Labs',     'London / Remote', 90000, 120000, ARRAY['react','typescript','london'],     now() + interval '30 days'),
  ('gig',    gen_random_uuid(), 'Brand identity refresh',  'Northwind Co.', 'Remote',           3000,   8000, ARRAY['branding','identity'],              now() + interval '14 days'),
  ('service',gen_random_uuid(), 'Fractional product lead', 'Various',       'Remote',          12000,  20000, ARRAY['product','leadership','fractional'],now() + interval '60 days'),
  ('event',  gen_random_uuid(), 'React Summit London',     'React Summit',  'London',          NULL,   NULL,  ARRAY['conference','react','networking'],  now() + interval '45 days');
