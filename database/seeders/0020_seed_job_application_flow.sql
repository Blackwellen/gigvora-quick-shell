-- Seed Domain 22 — Job Application Flow.
INSERT INTO job_applications (id, job_posting_id, candidate_id, tenant_id, source, status, current_stage, submitted_at) VALUES
  ('aaaa2200-0000-0000-0000-000000000001',
   '99990000-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111',
   'tenant-demo', 'direct', 'screening', 'screen', now() - interval '3 days'),
  ('aaaa2200-0000-0000-0000-000000000002',
   '99990000-0000-0000-0000-000000000023', '22222222-2222-2222-2222-222222222222',
   'tenant-demo', 'referral', 'submitted', 'applied', now() - interval '6 hours')
ON CONFLICT (job_posting_id, candidate_id) DO NOTHING;

INSERT INTO job_application_answers (id, application_id, question_key, question_label, answer) VALUES
  ('bbbb2200-0000-0000-0000-000000000001', 'aaaa2200-0000-0000-0000-000000000001',
   'authorized_to_work', 'Authorized to work in target country?', '{"value":"yes"}'::jsonb),
  ('bbbb2200-0000-0000-0000-000000000002', 'aaaa2200-0000-0000-0000-000000000001',
   'years_experience', 'Years of experience', '{"value":7}'::jsonb)
ON CONFLICT (application_id, question_key) DO NOTHING;

INSERT INTO job_application_documents (id, application_id, kind, storage_key, filename, mime_type, size_bytes) VALUES
  ('cccc2200-0000-0000-0000-000000000001', 'aaaa2200-0000-0000-0000-000000000001',
   'resume', 's3://gigvora-applications/aaaa2200-0001-resume.pdf',
   'jane-resume.pdf', 'application/pdf', 245678)
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_application_events (id, application_id, kind, from_stage, to_stage, actor, detail) VALUES
  ('dddd2200-0000-0000-0000-000000000001', 'aaaa2200-0000-0000-0000-000000000001',
   'submitted', NULL, 'applied', 'candidate:11111111', '{}'::jsonb),
  ('dddd2200-0000-0000-0000-000000000002', 'aaaa2200-0000-0000-0000-000000000001',
   'advanced', 'applied', 'screen', 'recruiter:22222222', '{"note":"Strong portfolio."}'::jsonb)
ON CONFLICT (id) DO NOTHING;
