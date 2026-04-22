INSERT INTO integration_providers (slug, display_name, category, auth_kind, scopes, docs_url) VALUES
  ('stripe',    'Stripe',     'payments',  'apikey', '["read_write"]'::jsonb, 'https://stripe.com/docs/api'),
  ('github',    'GitHub',     'storage',   'oauth2', '["repo","user"]'::jsonb, 'https://docs.github.com'),
  ('google',    'Google',     'comms',     'oauth2', '["calendar","gmail.send"]'::jsonb, 'https://developers.google.com'),
  ('slack',     'Slack',      'comms',     'oauth2', '["chat:write","channels:read"]'::jsonb, 'https://api.slack.com'),
  ('openai',    'OpenAI',     'ai',        'apikey', '["completions"]'::jsonb, 'https://platform.openai.com/docs'),
  ('anthropic', 'Anthropic',  'ai',        'apikey', '["messages"]'::jsonb, 'https://docs.anthropic.com'),
  ('hubspot',   'HubSpot',    'crm',       'oauth2', '["contacts.read","contacts.write"]'::jsonb, 'https://developers.hubspot.com'),
  ('salesforce','Salesforce', 'crm',       'oauth2', '["api","refresh_token"]'::jsonb, 'https://developer.salesforce.com')
ON CONFLICT (slug) DO NOTHING;
