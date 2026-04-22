INSERT INTO workflow_definitions (slug, display_name, surface_kind, steps) VALUES
  ('create.project', 'Create project',  'wizard', '[{"key":"basics"},{"key":"scope"},{"key":"budget"},{"key":"team"},{"key":"review"}]'::jsonb),
  ('create.gig',     'Create gig',      'wizard', '[{"key":"basics"},{"key":"packages"},{"key":"media"},{"key":"review"}]'::jsonb),
  ('create.job',     'Create job',      'wizard', '[{"key":"basics"},{"key":"requirements"},{"key":"comp"},{"key":"pipeline"},{"key":"review"}]'::jsonb),
  ('create.service', 'Create service',  'wizard', '[{"key":"basics"},{"key":"engagement"},{"key":"pricing"},{"key":"review"}]'::jsonb),
  ('inspect.entity', 'Entity inspector','inspector', '[]'::jsonb),
  ('compose.post',   'Compose post',    'drawer', '[{"key":"compose"}]'::jsonb)
ON CONFLICT (slug) DO NOTHING;
