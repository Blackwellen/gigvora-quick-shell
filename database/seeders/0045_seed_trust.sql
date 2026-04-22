-- Seed Domain 16 — Reviews, Trust Badges, References & Verifications. Idempotent.

INSERT INTO reviews (id, author_id, author_name, subject_kind, subject_id, rating, title, body, pros, cons, status, helpful_count, published_at) VALUES
  ('16000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','Demo Two','user','11111111-1111-1111-1111-111111111111',5,'Outstanding partner','Delivered a complex design system token migration ahead of schedule with zero regressions.','["Clear comms","Great craft"]'::jsonb,'[]'::jsonb,'published',24, now() - interval '14 days'),
  ('16000000-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333','Demo Three','agency','agency-acme',4,'Strong delivery','Solid project execution and thorough handover docs.','["Reliable","Documented"]'::jsonb,'["Pricing rigid"]'::jsonb,'published',9, now() - interval '7 days'),
  ('16000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Demo One','company','company-globex',5,'Great client','Clear briefs, fast feedback, paid on time.','["Decisive","Respectful"]'::jsonb,'[]'::jsonb,'published',12, now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO review_responses (id, review_id, author_id, body) VALUES
  ('16100000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Thanks — was a pleasure collaborating.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO review_reactions (review_id, actor_id, kind) VALUES
  ('16000000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','helpful'),
  ('16000000-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','helpful')
ON CONFLICT DO NOTHING;

INSERT INTO trust_badges (id, subject_kind, subject_id, badge_key, meta) VALUES
  ('16200000-0000-0000-0000-000000000001','user','11111111-1111-1111-1111-111111111111','top_rated','{"avg":4.9,"reviews":24}'::jsonb),
  ('16200000-0000-0000-0000-000000000002','user','11111111-1111-1111-1111-111111111111','verified_pro','{"verifiedAt":"2026-01-15"}'::jsonb),
  ('16200000-0000-0000-0000-000000000003','user','22222222-2222-2222-2222-222222222222','fast_responder','{"avgReplyMinutes":42}'::jsonb),
  ('16200000-0000-0000-0000-000000000004','agency','agency-acme','enterprise_ready','{"sla":"24h"}'::jsonb)
ON CONFLICT (subject_kind, subject_id, badge_key) DO NOTHING;

INSERT INTO references_t (id, subject_id, contact_name, contact_email, relationship, status, responded_at, payload) VALUES
  ('16300000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Alex Manager','alex.manager@example.com','line_manager','verified', now() - interval '20 days','{"endorsement":"Top performer"}'::jsonb),
  ('16300000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Sam Client','sam.client@example.com','client','pending',NULL,'{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO trust_verifications (id, subject_id, kind, status, started_at, completed_at, payload) VALUES
  ('16400000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','identity','verified', now() - interval '60 days', now() - interval '59 days','{"provider":"persona","docType":"passport"}'::jsonb),
  ('16400000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','email','verified', now() - interval '60 days', now() - interval '60 days','{}'::jsonb),
  ('16400000-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','identity','pending', now() - interval '2 days',NULL,'{"provider":"persona"}'::jsonb)
ON CONFLICT (subject_id, kind) DO NOTHING;

INSERT INTO trust_scores (subject_kind, subject_id, score, band, components) VALUES
  ('user','11111111-1111-1111-1111-111111111111',92,'verified','{"reviews":48,"verifications":24,"references":20}'::jsonb),
  ('user','22222222-2222-2222-2222-222222222222',76,'trusted','{"reviews":30,"verifications":12,"references":34}'::jsonb),
  ('user','33333333-3333-3333-3333-333333333333',61,'trusted','{"reviews":18,"verifications":8,"references":35}'::jsonb),
  ('agency','agency-acme',88,'verified','{"reviews":42,"verifications":24,"references":22}'::jsonb)
ON CONFLICT (subject_kind, subject_id) DO NOTHING;
