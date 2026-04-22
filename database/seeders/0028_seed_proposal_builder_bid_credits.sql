-- Domain 30 — Proposal Builder & Bid Credits — demo seed (idempotent).
INSERT INTO bid_credit_wallets (id, owner_id, tenant_id, balance, held, lifetime_purchased, lifetime_consumed)
VALUES
  ('30000000-0000-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   'demo-tenant', 80, 4, 100, 16)
ON CONFLICT (owner_id, tenant_id) DO NOTHING;

INSERT INTO proposals (id, tenant_id, project_id, author_id, status, cover_letter, bid_amount_cents, currency, duration_days, milestones, credits_held, submitted_at)
VALUES
  ('30000000-0000-0000-0000-000000000101'::uuid, 'demo-tenant',
   '32000000-0000-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   'submitted',
   'I have shipped 6 React/TS dashboards in the last 12 months and can start Monday.',
   650000, 'USD', 21,
   '[{"title":"Discovery","amount":150000},{"title":"Build","amount":350000},{"title":"Polish","amount":150000}]'::jsonb,
   2, now() - interval '2 days'),
  ('30000000-0000-0000-0000-000000000102'::uuid, 'demo-tenant',
   '32000000-0000-0000-0000-000000000002'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid,
   'draft',
   'Draft — refining scope before I send.',
   320000, 'USD', 14, '[]'::jsonb, 0, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO proposal_attachments (id, proposal_id, file_key, file_name, mime_type, size_bytes)
VALUES
  ('30000000-0000-0000-0000-000000000201'::uuid,
   '30000000-0000-0000-0000-000000000101'::uuid,
   'proposals/30000000-0000-0000-0000-000000000101/case-study.pdf',
   'case-study.pdf', 'application/pdf', 482000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO proposal_revisions (id, proposal_id, version, snapshot, author_id)
VALUES
  ('30000000-0000-0000-0000-000000000301'::uuid,
   '30000000-0000-0000-0000-000000000101'::uuid, 1,
   '{"bid":650000,"durationDays":21}'::jsonb,
   '11111111-1111-1111-1111-111111111111'::uuid)
ON CONFLICT (proposal_id, version) DO NOTHING;

INSERT INTO bid_credit_ledger (id, wallet_id, type, amount, balance_after, held_after, proposal_id, reference)
VALUES
  ('30000000-0000-0000-0000-000000000401'::uuid,
   '30000000-0000-0000-0000-000000000001'::uuid,
   'purchase', 100, 100, 0, NULL, 'pack:starter'),
  ('30000000-0000-0000-0000-000000000402'::uuid,
   '30000000-0000-0000-0000-000000000001'::uuid,
   'consume', -16, 84, 0, NULL, 'historic'),
  ('30000000-0000-0000-0000-000000000403'::uuid,
   '30000000-0000-0000-0000-000000000001'::uuid,
   'hold', -2, 82, 2,
   '30000000-0000-0000-0000-000000000101'::uuid, 'submit:proposal'),
  ('30000000-0000-0000-0000-000000000404'::uuid,
   '30000000-0000-0000-0000-000000000001'::uuid,
   'hold', -2, 80, 4,
   '30000000-0000-0000-0000-000000000101'::uuid, 'boost:proposal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bid_credit_purchases (id, wallet_id, pack_id, credits, amount_cents, currency, status, idempotency_key, confirmed_at)
VALUES
  ('30000000-0000-0000-0000-000000000501'::uuid,
   '30000000-0000-0000-0000-000000000001'::uuid,
   'starter-100', 100, 4900, 'USD', 'confirmed',
   'seed-bcp-starter-100', now() - interval '7 days')
ON CONFLICT (idempotency_key) DO NOTHING;
