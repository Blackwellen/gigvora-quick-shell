-- Seed Domain 11 — Profiles & Reputation
INSERT INTO profile_extended (identity_id, handle, display_name, headline, summary, location, open_to_freelance, hourly_rate_cents, visibility)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'jane.doe', 'Jane Doe', 'Senior Product Designer · Design Systems', 'Designer building enterprise SaaS for 8+ years.', 'London, UK', true, 15000, 'public'),
  ('00000000-0000-0000-0000-000000000002', 'alex.chen', 'Alex Chen', 'Full-stack Engineer · Postgres & TypeScript', 'Engineer specialising in performance and DX.', 'Manchester, UK', true, 12500, 'public')
ON CONFLICT (identity_id) DO NOTHING;

INSERT INTO profile_skills (identity_id, skill, level, endorsement_count, position) VALUES
  ('00000000-0000-0000-0000-000000000001','Figma','expert',24,0),
  ('00000000-0000-0000-0000-000000000001','Design Systems','expert',18,1),
  ('00000000-0000-0000-0000-000000000001','User Research','intermediate',9,2),
  ('00000000-0000-0000-0000-000000000002','TypeScript','expert',31,0),
  ('00000000-0000-0000-0000-000000000002','PostgreSQL','expert',22,1)
ON CONFLICT DO NOTHING;

INSERT INTO profile_badges (identity_id, code, label) VALUES
  ('00000000-0000-0000-0000-000000000001','verified','ID Verified'),
  ('00000000-0000-0000-0000-000000000001','top_rated','Top Rated'),
  ('00000000-0000-0000-0000-000000000002','verified','ID Verified')
ON CONFLICT DO NOTHING;

INSERT INTO profile_verifications (identity_id, kind, status, verified_at) VALUES
  ('00000000-0000-0000-0000-000000000001','email','active', now()),
  ('00000000-0000-0000-0000-000000000001','id_document','active', now()),
  ('00000000-0000-0000-0000-000000000002','email','active', now())
ON CONFLICT DO NOTHING;

INSERT INTO profile_reputation (identity_id, score, band, components) VALUES
  ('00000000-0000-0000-0000-000000000001', 87.4, 'top', '{"reviews":4.9,"completion":0.96,"verifications":2,"activity":0.8,"endorsements":51}'),
  ('00000000-0000-0000-0000-000000000002', 71.2, 'trusted', '{"reviews":4.7,"completion":0.92,"verifications":1,"activity":0.6,"endorsements":53}')
ON CONFLICT (identity_id) DO NOTHING;
