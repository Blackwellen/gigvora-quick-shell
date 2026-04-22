-- Domain 31 — Proposal Review, Compare, Shortlist & Award — demo seed (idempotent).
INSERT INTO proposal_reviews (id, proposal_id, project_id, reviewer_id, decision, rationale, decided_at)
VALUES
  ('31000000-0000-0000-0000-000000000001'::uuid,
   '30000000-0000-0000-0000-000000000101'::uuid,
   '32000000-0000-0000-0000-000000000001'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   'shortlisted', 'Strong portfolio, realistic timeline.', now() - interval '1 day')
ON CONFLICT (proposal_id, reviewer_id) DO NOTHING;

INSERT INTO proposal_scorecards (id, proposal_id, reviewer_id, rubric_id, scores, weighted_total, notes)
VALUES
  ('31000000-0000-0000-0000-000000000101'::uuid,
   '30000000-0000-0000-0000-000000000101'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   'default',
   '{"fit":5,"price":4,"timeline":5,"comms":4}'::jsonb,
   86, 'Send DM to confirm Monday start.')
ON CONFLICT (proposal_id, reviewer_id) DO NOTHING;

INSERT INTO proposal_shortlists (id, project_id, owner_id, name, proposal_ids, pinned)
VALUES
  ('31000000-0000-0000-0000-000000000201'::uuid,
   '32000000-0000-0000-0000-000000000001'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   'Top 3',
   '["30000000-0000-0000-0000-000000000101"]'::jsonb,
   true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO proposal_comparisons (id, project_id, owner_id, proposal_ids, axes, snapshot)
VALUES
  ('31000000-0000-0000-0000-000000000301'::uuid,
   '32000000-0000-0000-0000-000000000001'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   '["30000000-0000-0000-0000-000000000101"]'::jsonb,
   '["price","duration","rating","match"]'::jsonb,
   '{"generatedAt":"seed"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO proposal_awards (id, project_id, proposal_id, awarded_by, awarded_at, status, amount_cents, currency, metadata)
VALUES
  ('31000000-0000-0000-0000-000000000401'::uuid,
   '32000000-0000-0000-0000-000000000001'::uuid,
   '30000000-0000-0000-0000-000000000101'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   now() - interval '2 hours',
   'pending', 650000, 'USD',
   '{"source":"seed"}'::jsonb)
ON CONFLICT (proposal_id) DO NOTHING;

INSERT INTO proposal_review_events (id, project_id, proposal_id, actor_id, event, detail)
VALUES
  ('31000000-0000-0000-0000-000000000501'::uuid,
   '32000000-0000-0000-0000-000000000001'::uuid,
   '30000000-0000-0000-0000-000000000101'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   'shortlisted', '{"rubric":"default"}'::jsonb),
  ('31000000-0000-0000-0000-000000000502'::uuid,
   '32000000-0000-0000-0000-000000000001'::uuid,
   '30000000-0000-0000-0000-000000000101'::uuid,
   '22222222-2222-2222-2222-222222222222'::uuid,
   'awarded', '{"amountCents":650000}'::jsonb)
ON CONFLICT (id) DO NOTHING;
