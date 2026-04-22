-- Seed Domain 08 — Settings catalogue + a few demo identity preferences.
-- Idempotent: re-run safe via ON CONFLICT.

INSERT INTO settings_catalogue (kind, code, label, active) VALUES
  ('locale','en-GB','English (United Kingdom)',true),
  ('locale','en-US','English (United States)',true),
  ('locale','fr-FR','Français (France)',true),
  ('locale','es-ES','Español (España)',true),
  ('locale','de-DE','Deutsch (Deutschland)',true),
  ('locale','pt-BR','Português (Brasil)',true),
  ('locale','ja-JP','日本語 (日本)',true),
  ('timezone','Europe/London','London (GMT/BST)',true),
  ('timezone','America/New_York','New York (EST/EDT)',true),
  ('timezone','America/Los_Angeles','Los Angeles (PST/PDT)',true),
  ('timezone','Europe/Paris','Paris (CET/CEST)',true),
  ('timezone','Asia/Tokyo','Tokyo (JST)',true),
  ('timezone','Asia/Singapore','Singapore (SGT)',true),
  ('timezone','UTC','UTC',true),
  ('currency','GBP','British Pound',true),
  ('currency','USD','US Dollar',true),
  ('currency','EUR','Euro',true)
ON CONFLICT (kind, code) DO NOTHING;

-- Demo identity preferences (users 1111…/2222…/3333… seeded elsewhere).
INSERT INTO settings (id, identity_id, namespace, key, value, scope) VALUES
  ('80000001-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','appearance','theme','"dark"'::jsonb,'user'),
  ('80000001-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','appearance','font_scale','1.0'::jsonb,'user'),
  ('80000001-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','locale','language','"en-GB"'::jsonb,'user'),
  ('80000001-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','timezone','tz','"Europe/London"'::jsonb,'user'),
  ('80000001-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','notifications','email_digest','"weekly"'::jsonb,'user'),
  ('80000001-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','privacy','profile_visibility','"network"'::jsonb,'user'),
  ('80000001-0000-0000-0000-000000000007','22222222-2222-2222-2222-222222222222','appearance','theme','"system"'::jsonb,'user'),
  ('80000001-0000-0000-0000-000000000008','22222222-2222-2222-2222-222222222222','locale','language','"en-US"'::jsonb,'user'),
  ('80000001-0000-0000-0000-000000000009','33333333-3333-3333-3333-333333333333','accessibility','reduced_motion','true'::jsonb,'user')
ON CONFLICT (identity_id, namespace, key) DO NOTHING;

INSERT INTO settings_connected_accounts (id, identity_id, provider, external_id, display_name, scopes, status) VALUES
  ('80000002-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','google','google_demo_1','demo@gmail.com','["email","profile","calendar.read"]'::jsonb,'active'),
  ('80000002-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','linkedin','li_demo_1','demo-linkedin','["r_basicprofile","r_emailaddress"]'::jsonb,'active'),
  ('80000002-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','github','gh_demo_1','demo-gh','["read:user","read:org"]'::jsonb,'active')
ON CONFLICT (identity_id, provider, external_id) DO NOTHING;

INSERT INTO settings_data_requests (id, identity_id, kind, status, reason) VALUES
  ('80000003-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','export','completed','Annual archive'),
  ('80000003-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','rectify','pending','Update display name')
ON CONFLICT DO NOTHING;
