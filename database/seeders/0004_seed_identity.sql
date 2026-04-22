-- Demo identities. password is 'Password123!' for both, hashed with bcrypt cost 12.
INSERT INTO identities (id, email, email_verified, password_hash, display_name, status)
VALUES
  ('11111111-1111-1111-1111-111111111111','demo.user@gigvora.dev', true,
   '$2b$12$Q4q2J1h4P8kKQ7m3sJk0eOIB6m6Yl0ZMHcvM1hQjEi0eC4lq0qM5q','Demo User','active'),
  ('22222222-2222-2222-2222-222222222222','demo.pro@gigvora.dev', true,
   '$2b$12$Q4q2J1h4P8kKQ7m3sJk0eOIB6m6Yl0ZMHcvM1hQjEi0eC4lq0qM5q','Demo Pro','active'),
  ('33333333-3333-3333-3333-333333333333','locked@gigvora.dev', true,
   '$2b$12$Q4q2J1h4P8kKQ7m3sJk0eOIB6m6Yl0ZMHcvM1hQjEi0eC4lq0qM5q','Locked Account','locked')
ON CONFLICT (email) DO NOTHING;

INSERT INTO onboarding_progress (identity_id, status, current_step, payload, completed_at) VALUES
  ('11111111-1111-1111-1111-111111111111','completed', NULL,
   '{"profile":{"headline":"Product designer"},"goals":["find-work"]}'::jsonb, now()),
  ('22222222-2222-2222-2222-222222222222','in_progress','expertise','{"profile":{"headline":"Senior dev"}}'::jsonb, NULL)
ON CONFLICT (identity_id) DO NOTHING;

INSERT INTO verifications (identity_id, kind, status, evidence) VALUES
  ('22222222-2222-2222-2222-222222222222','badge_professional','approved','{"reviewed_via":"seed"}'::jsonb),
  ('22222222-2222-2222-2222-222222222222','id_document','pending','{"doc":"passport.jpg"}'::jsonb)
ON CONFLICT DO NOTHING;
