-- Seed Domain 14 — Groups, Community Hubs & Member Conversations.
-- Idempotent. Assumes the groups schema (migration 0014_groups.sql) is applied.

INSERT INTO groups (id, owner_id, slug, name, description, kind, visibility, status, member_count)
VALUES
  ('14000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','design-systems','Design Systems Guild','Practitioners building tokenised, accessible design systems.','community','public','active',128),
  ('14000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','founders-london','Founders London','Working founders meeting monthly in central London.','community','private','active',42),
  ('14000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','open-source-uk','Open Source UK','Contributors and maintainers across the UK ecosystem.','community','public','active',310)
ON CONFLICT (id) DO NOTHING;

INSERT INTO group_members (group_id, identity_id, role, status) VALUES
  ('14000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','owner','active'),
  ('14000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','member','active'),
  ('14000000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','moderator','active'),
  ('14000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','owner','active'),
  ('14000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','member','active'),
  ('14000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','owner','active')
ON CONFLICT DO NOTHING;

INSERT INTO group_posts (id, group_id, author_id, body, status) VALUES
  ('14100000-0000-0000-0000-000000000001','14000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Kicking off a working group on motion-aware tokens. RSVP if interested.','active'),
  ('14100000-0000-0000-0000-000000000002','14000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','Sharing our oklch palette migration notes — happy to demo on Friday.','active'),
  ('14100000-0000-0000-0000-000000000003','14000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','Quarterly contributor sync next Tuesday — agenda in pinned thread.','active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO group_channels (id, group_id, slug, name, kind) VALUES
  ('14200000-0000-0000-0000-000000000001','14000000-0000-0000-0000-000000000001','general','General','text'),
  ('14200000-0000-0000-0000-000000000002','14000000-0000-0000-0000-000000000001','tokens','Tokens','text'),
  ('14200000-0000-0000-0000-000000000003','14000000-0000-0000-0000-000000000003','events','Events','text')
ON CONFLICT (id) DO NOTHING;
