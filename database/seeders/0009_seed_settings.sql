-- Realistic locale + timezone catalogue and demo preferences.
INSERT INTO locales (code, label, native_label, enabled, rtl) VALUES
  ('en-GB','English (UK)','English (UK)',     true,  false),
  ('en-US','English (US)','English (US)',     true,  false),
  ('fr-FR','French (France)','Français',      true,  false),
  ('de-DE','German (Germany)','Deutsch',      true,  false),
  ('es-ES','Spanish (Spain)','Español',       true,  false),
  ('pt-BR','Portuguese (Brazil)','Português', true,  false),
  ('ja-JP','Japanese','日本語',                true,  false),
  ('ar-SA','Arabic (Saudi Arabia)','العربية', true,  true),
  ('he-IL','Hebrew (Israel)','עברית',         true,  true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO timezones (code, label, utc_offset) VALUES
  ('Europe/London',     'London',         '+00:00'),
  ('Europe/Paris',      'Paris',          '+01:00'),
  ('America/New_York',  'New York',       '-05:00'),
  ('America/Los_Angeles','Los Angeles',   '-08:00'),
  ('Asia/Tokyo',        'Tokyo',          '+09:00'),
  ('Asia/Dubai',        'Dubai',          '+04:00'),
  ('Australia/Sydney',  'Sydney',         '+11:00')
ON CONFLICT (code) DO NOTHING;

-- Demo preferences for the seed user.
INSERT INTO settings (identity_id, scope, namespace, key, value) VALUES
  ('11111111-1111-1111-1111-111111111111','user','general',     'theme',                '"dark"'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','general',     'density',              '"comfortable"'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','locale',      'language',             '"en-GB"'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','locale',      'timezone',             '"Europe/London"'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','locale',      'date_format',          '"DD/MM/YYYY"'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','locale',      'currency',             '"GBP"'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','accessibility','reduce_motion',       'false'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','accessibility','high_contrast',       'false'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','accessibility','font_scale',          '1.0'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','accessibility','keyboard_only',       'false'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','privacy',     'profile_visibility',   '"public"'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','privacy',     'searchable_by_email',  'true'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','privacy',     'data_sharing_marketing','false'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','profile',     'show_activity_feed',   'true'::jsonb),
  ('11111111-1111-1111-1111-111111111111','user','profile',     'show_endorsements',    'true'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO connected_accounts (identity_id, provider, external_id, display_name, scopes, last_used_at)
VALUES
  ('11111111-1111-1111-1111-111111111111','google','google_user_42','demo@gmail.com',
   ARRAY['email','profile','calendar.read'], now()),
  ('11111111-1111-1111-1111-111111111111','github','gh_user_88','demo-dev',
   ARRAY['repo:read','user:email'], now() - interval '3 days')
ON CONFLICT DO NOTHING;

INSERT INTO settings_audit (identity_id, actor_id, namespace, key, old_value, new_value, source) VALUES
  ('11111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111',
   'general','theme','"light"'::jsonb,'"dark"'::jsonb,'web'),
  ('11111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111',
   'locale','timezone','"UTC"'::jsonb,'"Europe/London"'::jsonb,'web');
