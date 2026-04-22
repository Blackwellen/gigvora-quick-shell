DO $$
DECLARE
  v_thread uuid := '00000000-0000-0000-0000-0000111b0001';
  v_alice uuid := '00000000-0000-0000-0000-0000111b0a01';
  v_bob uuid := '00000000-0000-0000-0000-0000111b0b01';
BEGIN
  INSERT INTO inbox_threads (id, tenant_id, kind, title, created_by_id, last_message_preview, participant_count)
  VALUES (v_thread, 'dev', 'direct', NULL, v_alice, 'Welcome!', 2)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO inbox_participants (thread_id, identity_id, role)
  VALUES (v_thread, v_alice, 'owner'), (v_thread, v_bob, 'member')
  ON CONFLICT (thread_id, identity_id) DO NOTHING;

  INSERT INTO inbox_messages (thread_id, sender_id, body, delivery_state)
  SELECT v_thread, v_alice, 'Welcome to Gigvora!', 'delivered'
  WHERE NOT EXISTS (SELECT 1 FROM inbox_messages WHERE thread_id = v_thread);
END $$;
