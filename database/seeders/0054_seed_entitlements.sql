DO $$
DECLARE
  v_free uuid := '00000000-0000-0000-0000-0000e1740001';
  v_pro  uuid := '00000000-0000-0000-0000-0000e1740002';
  v_team uuid := '00000000-0000-0000-0000-0000e1740003';
  v_ent  uuid := '00000000-0000-0000-0000-0000e1740004';
BEGIN
  INSERT INTO plans (id, slug, display_name, tier, price_cents, interval, features) VALUES
    (v_free, 'free',       'Free',        0,    0,    'month', '[{"key":"feed.posts","limit":50}]'::jsonb),
    (v_pro,  'pro',        'Pro',         1, 1900,    'month', '[{"key":"feed.posts","limit":500},{"key":"recruiter.boolean_search"}]'::jsonb),
    (v_team, 'team',       'Team',        2, 4900,    'month', '[{"key":"team.seats","limit":10}]'::jsonb),
    (v_ent,  'enterprise', 'Enterprise',  3, 0,       'month', '[{"key":"sso"},{"key":"audit.export"}]'::jsonb)
  ON CONFLICT (slug) DO NOTHING;
END $$;
