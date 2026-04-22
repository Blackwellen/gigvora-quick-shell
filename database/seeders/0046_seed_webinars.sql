-- Seed Domain 22 — Webinars: scheduled live rooms, replays, paid + donation flows. Idempotent.

INSERT INTO webinars (id, host_id, host_name, title, description, starts_at, duration_minutes, topics, status, ticket_kind, price_cents, currency, capacity, registrations, donations_enabled, jitsi_room, visibility) VALUES
  ('22000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Demo One','Building Token-Driven Design Systems', 'Walkthrough of an oklch + motion-aware token model used in production.', now() + interval '5 days', 60, '["design","tokens","systems"]'::jsonb, 'scheduled','free',0,'GBP',1000,128,true,'webinar-design-systems-2026','public'),
  ('22000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Demo Two','Founder Finance 101: Runway, Burn, Pricing', 'Frameworks every early-stage founder should know before raising.', now() + interval '12 days', 75, '["founders","finance"]'::jsonb, 'scheduled','paid',2500,'GBP',300,87,true,'webinar-founder-finance-2026','public'),
  ('22000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','Demo Three','Open Source Sustainability', 'How maintainers fund their work and what sponsors should expect.', now() + interval '20 days', 90, '["oss","funding"]'::jsonb, 'scheduled','donation',0,'GBP',500,154,true,'webinar-oss-sustain-2026','public'),
  ('22000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Demo One','Past: Accessibility Deep Dive', 'Recording: WCAG 2.2 in modern React stacks.', now() - interval '14 days', 60, '["a11y","react"]'::jsonb, 'ended','free',0,'GBP',1000,420,false,'webinar-a11y-recap-2026','public')
ON CONFLICT (id) DO NOTHING;

INSERT INTO webinar_registrations (webinar_id, identity_id, email, status) VALUES
  ('22000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','demo2@example.com','registered'),
  ('22000000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','demo3@example.com','registered'),
  ('22000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','demo1@example.com','registered'),
  ('22000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','demo1@example.com','registered'),
  ('22000000-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','demo2@example.com','attended'),
  ('22000000-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333333','demo3@example.com','attended')
ON CONFLICT (webinar_id, identity_id) DO NOTHING;

INSERT INTO webinar_purchases (id, webinar_id, identity_id, quantity, amount_cents, currency, status, payment_method, provider_ref, confirmed_at) VALUES
  ('22100000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',1,2500,'GBP','paid','card','stripe_demo_1', now() - interval '1 day'),
  ('22100000-0000-0000-0000-000000000002','22000000-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333',2,5000,'GBP','confirmed','wallet','wallet_demo_1', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO webinar_donations (id, webinar_id, identity_id, amount_cents, currency, message, anonymous, status, captured_at) VALUES
  ('22200000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',1000,'GBP','Thanks for keeping OSS sustainable!',false,'captured', now() - interval '2 hours'),
  ('22200000-0000-0000-0000-000000000002','22000000-0000-0000-0000-000000000003',NULL,500,'GBP',NULL,true,'captured', now() - interval '4 hours'),
  ('22200000-0000-0000-0000-000000000003','22000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',2000,'GBP','Looking forward!',false,'captured', now() - interval '6 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO webinar_chat_messages (id, webinar_id, identity_id, body, pinned) VALUES
  ('22300000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Welcome everyone, replay starting now.',true),
  ('22300000-0000-0000-0000-000000000002','22000000-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','Question about colour-contrast tooling later please',false),
  ('22300000-0000-0000-0000-000000000003','22000000-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333333','Slides link please?',false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO webinar_replays (webinar_id, replay_url, duration_sec, views) VALUES
  ('22000000-0000-0000-0000-000000000004','https://media.example.com/replays/a11y-2026.mp4',3540,420)
ON CONFLICT (webinar_id) DO NOTHING;
