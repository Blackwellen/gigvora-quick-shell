-- Auth seeder is intentionally minimal — credentials are created at signup.
DO $$
DECLARE
  v_id1 uuid := '00000000-0000-0000-0000-00001de70001';
BEGIN
  -- Only seed if identity exists from 0053
  IF EXISTS (SELECT 1 FROM identities WHERE id = v_id1) THEN
    INSERT INTO auth_credentials (identity_id, password_hash, password_updated_at)
    VALUES (v_id1, '$argon2id$v=19$m=65536,t=3,p=4$DEV_HASH_DO_NOT_USE_IN_PROD', now())
    ON CONFLICT (identity_id) DO NOTHING;
  END IF;
END $$;
