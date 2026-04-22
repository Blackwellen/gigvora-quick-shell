-- Idempotent dev seed for Contracts & SOW. Skipped automatically in production by the runner.
DO $$
DECLARE
  v_msa uuid := '00000000-0000-0000-0000-0000c0a70001';
  v_sow uuid := '00000000-0000-0000-0000-0000c0a70002';
  v_ver uuid := '00000000-0000-0000-0000-0000c0a70003';
BEGIN
  INSERT INTO master_agreements (id, tenant_id, client_org_id, vendor_org_id, title, status, effective_at)
  VALUES (v_msa, 'dev', gen_random_uuid(), gen_random_uuid(), 'Acme x Contoso MSA', 'executed', now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO sow_documents (id, tenant_id, msa_id, scope_kind, scope_id, title, total_cents, status)
  VALUES (v_sow, 'dev', v_msa, 'project', gen_random_uuid(), 'Q4 Brand refresh SOW', 4500000, 'sent')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO sow_versions (id, sow_id, version_number, author_id, body, is_current)
  VALUES (v_ver, v_sow, 1, gen_random_uuid(), '{"clauses":[{"k":"scope","v":"Brand identity refresh"}]}'::jsonb, true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO sow_events (sow_id, kind, payload)
  SELECT v_sow, 'sent', '{"channel":"email"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM sow_events WHERE sow_id = v_sow AND kind = 'sent');
END $$;
