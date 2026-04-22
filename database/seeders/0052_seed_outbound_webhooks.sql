INSERT INTO webhook_event_types (slug, domain, description) VALUES
  ('feed.post.created',        'feed',     'Fired when a new feed post is published'),
  ('feed.post.deleted',        'feed',     'Fired when a feed post is deleted'),
  ('inbox.message.created',    'inbox',    'Fired when an inbox message is sent'),
  ('contracts.sow.executed',   'contracts','Fired when a SOW is fully executed'),
  ('recruiter.candidate.hired','recruiter','Fired when a candidate reaches "hired"'),
  ('integrations.connection.connected', 'integrations', 'Fired when a connection is established'),
  ('integrations.connection.revoked',   'integrations', 'Fired when a connection is revoked')
ON CONFLICT (slug) DO NOTHING;
