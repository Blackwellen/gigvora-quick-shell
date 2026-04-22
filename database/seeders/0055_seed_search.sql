INSERT INTO command_palette_items (action_key, label, "group", default_keybind) VALUES
  ('navigate.feed',         'Go to feed',          'navigate', 'g f'),
  ('navigate.network',      'Go to network',       'navigate', 'g n'),
  ('navigate.inbox',        'Go to inbox',         'navigate', 'g i'),
  ('navigate.search',       'Open search',         'navigate', '/'),
  ('create.post',           'Create post',         'create',   'c p'),
  ('create.project',        'Create project',      'create',   'c r'),
  ('create.gig',            'Create gig',          'create',   'c g'),
  ('create.job',            'Create job',          'create',   'c j'),
  ('toggle.theme',          'Toggle theme',        'toggle',   't t'),
  ('admin.incident_mode',   'Toggle incident mode','admin',    NULL)
ON CONFLICT (action_key) DO NOTHING;

DO $$ BEGIN
  INSERT INTO search_index (tenant_id, index_name, external_id, title, body, tags)
  VALUES ('dev', 'companies', 'sample-co', 'Sample Co', 'Demo company indexed for FTS', '["demo","company"]'::jsonb)
  ON CONFLICT (tenant_id, index_name, external_id) DO NOTHING;
END $$;
