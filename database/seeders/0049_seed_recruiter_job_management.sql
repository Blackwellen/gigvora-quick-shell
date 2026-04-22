DO $$
DECLARE
  v_pipe uuid := '00000000-0000-0000-0000-0000beef0001';
  v_s1 uuid := '00000000-0000-0000-0000-0000beef0002';
  v_s2 uuid := '00000000-0000-0000-0000-0000beef0003';
  v_s3 uuid := '00000000-0000-0000-0000-0000beef0004';
BEGIN
  INSERT INTO recruiter_pipelines (id, tenant_id, owner_id, name, description)
  VALUES (v_pipe, 'dev', gen_random_uuid(), 'Senior Frontend Engineer', 'Default pipeline for FE roles')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO recruiter_pipeline_stages (id, pipeline_id, position, name, kind, sla_hours)
  VALUES
    (v_s1, v_pipe, 0, 'Sourced', 'sourced', 168),
    (v_s2, v_pipe, 1, 'Phone screen', 'review', 72),
    (v_s3, v_pipe, 2, 'Technical', 'interview', 96)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO recruiter_candidate_assignments (pipeline_id, stage_id, candidate_identity_id, rating, status)
  SELECT v_pipe, v_s1, gen_random_uuid(), 4, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM recruiter_candidate_assignments WHERE pipeline_id = v_pipe);
END $$;
