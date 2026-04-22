-- Domain — Moderation Queues (T&S)
CREATE TABLE IF NOT EXISTS moderation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid,
  target_type text NOT NULL CHECK (target_type IN ('post','profile','message','media','comment','review','project','gig','service','job')),
  target_id text NOT NULL,
  reason_code text NOT NULL CHECK (reason_code IN ('spam','harassment','hate','csam','illegal','impersonation','intellectual_property','other')),
  reason_detail text,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','triaging','escalated','resolved','dismissed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mod_reports_status_idx ON moderation_reports(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS mod_reports_target_idx ON moderation_reports(target_type, target_id);

CREATE TABLE IF NOT EXISTS moderation_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES moderation_reports(id) ON DELETE SET NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  decided_by uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('none','warn','hide','remove','suspend','ban','escalate_legal')),
  rationale text NOT NULL,
  appealable text NOT NULL DEFAULT 'yes' CHECK (appealable IN ('yes','no')),
  decided_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mod_decisions_target_idx ON moderation_decisions(target_type, target_id, decided_at DESC);

CREATE TABLE IF NOT EXISTS moderation_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES moderation_decisions(id) ON DELETE CASCADE,
  appellant_id uuid NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','upheld','overturned')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES moderation_reports(id) ON DELETE SET NULL,
  decision_id uuid REFERENCES moderation_decisions(id) ON DELETE SET NULL,
  actor_id uuid,
  event text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
