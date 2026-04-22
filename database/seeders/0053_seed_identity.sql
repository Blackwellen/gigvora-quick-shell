DO $$
DECLARE
  v_id1 uuid := '00000000-0000-0000-0000-00001de70001';
  v_id2 uuid := '00000000-0000-0000-0000-00001de70002';
BEGIN
  INSERT INTO identities (id, tenant_id, primary_email, email_verified, primary_handle, display_name)
  VALUES
    (v_id1, 'dev', 'alice@example.dev', true, 'alice', 'Alice Founder'),
    (v_id2, 'dev', 'bob@example.dev',   true, 'bob',   'Bob Recruiter')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO identity_handles (identity_id, handle, kind)
  VALUES (v_id1, 'alice', 'primary'), (v_id2, 'bob', 'primary')
  ON CONFLICT (handle) DO NOTHING;
END $$;
