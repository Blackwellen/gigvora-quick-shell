-- Domain 70 — Moderator Dashboard, Content Enforcement, Messaging Incident Review.

CREATE TABLE IF NOT EXISTS mod_queue_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       TEXT NOT NULL UNIQUE,
  surface         TEXT NOT NULL CHECK (surface IN ('post','profile','message','media','comment','review','project','gig','service','job','dm_thread')),
  target_id       TEXT NOT NULL,
  reason_code     TEXT NOT NULL CHECK (reason_code IN
                  ('spam','harassment','hate','csam','illegal','impersonation','intellectual_property','self_harm','nsfw','scam','other')),
  reason_detail   TEXT,
  reporter_id     UUID,
  evidence        JSONB NOT NULL DEFAULT '[]'::jsonb,
  severity        TEXT NOT NULL DEFAULT 'normal' CHECK (severity IN ('low','normal','high','critical')),
  ml_score        INT  NOT NULL DEFAULT 50 CHECK (ml_score BETWEEN 0 AND 100),
  ml_band         TEXT NOT NULL DEFAULT 'normal' CHECK (ml_band IN ('normal','elevated','high','critical')),
  ml_reasons      JSONB NOT NULL DEFAULT '[]'::jsonb,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','triaging','holding','escalated','actioned','dismissed','closed')),
  queue           TEXT NOT NULL DEFAULT 'triage' CHECK (queue IN ('triage','review','escalation','messaging_incident','closed')),
  assigned_to     UUID,
  sla_due_at      TIMESTAMPTZ,
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_modq_status   ON mod_queue_items(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modq_queue    ON mod_queue_items(queue, ml_score DESC);
CREATE INDEX IF NOT EXISTS idx_modq_assignee ON mod_queue_items(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_modq_target   ON mod_queue_items(surface, target_id);

CREATE TABLE IF NOT EXISTS mod_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES mod_queue_items(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL,
  action      TEXT NOT NULL CHECK (action IN
              ('warn','hide','remove','quarantine','suspend','ban','escalate_legal','escalate_trust_safety','dismiss','restore','none')),
  rationale   TEXT NOT NULL,
  duration_h  INT,
  appealable  TEXT NOT NULL DEFAULT 'yes' CHECK (appealable IN ('yes','no')),
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_modact_item ON mod_actions(item_id, created_at DESC);

-- Messaging incident review (DM threads + auto-detected risk).
CREATE TABLE IF NOT EXISTS mod_messaging_incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID REFERENCES mod_queue_items(id) ON DELETE SET NULL,
  thread_id       TEXT NOT NULL,
  participants    JSONB NOT NULL DEFAULT '[]'::jsonb,
  signal          TEXT NOT NULL CHECK (signal IN
                  ('keyword','rate_limit','phishing','solicitation','grooming','self_harm','threat','spam','user_report','automation','other')),
  excerpt         TEXT,
  ml_score        INT NOT NULL DEFAULT 50 CHECK (ml_score BETWEEN 0 AND 100),
  ml_band         TEXT NOT NULL DEFAULT 'normal',
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','actioned','dismissed','escalated')),
  reviewed_by     UUID,
  reviewed_at     TIMESTAMPTZ,
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_modmsg_status ON mod_messaging_incidents(status, ml_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modmsg_thread ON mod_messaging_incidents(thread_id);

-- Append-only audit ledger.
CREATE TABLE IF NOT EXISTS mod_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID REFERENCES mod_queue_items(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES mod_messaging_incidents(id) ON DELETE CASCADE,
  actor_id    UUID,
  action      TEXT NOT NULL,
  from_state  TEXT,
  to_state    TEXT,
  diff        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_modevt_item ON mod_events(item_id, created_at DESC);

CREATE OR REPLACE FUNCTION mod_events_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'mod_events is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_modevt_no_update ON mod_events;
CREATE TRIGGER trg_modevt_no_update BEFORE UPDATE OR DELETE ON mod_events
  FOR EACH ROW EXECUTE FUNCTION mod_events_immutable();

-- Macros / canned actions.
CREATE TABLE IF NOT EXISTS mod_macros (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug      TEXT NOT NULL UNIQUE,
  label     TEXT NOT NULL,
  action    TEXT NOT NULL,
  template  TEXT NOT NULL,
  meta      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO mod_macros (slug,label,action,template) VALUES
 ('warn_spam',     'Warn — spam',           'warn',   'Your content was flagged as spam. Please review our community guidelines.'),
 ('hide_nsfw',     'Hide — NSFW',           'hide',   'Content hidden pending review for adult/sexual content.'),
 ('remove_hate',   'Remove — hate speech',  'remove', 'Removed for violating our policy on hate speech.'),
 ('suspend_24h',   'Suspend — 24h',         'suspend','Account suspended for 24 hours due to repeated violations.'),
 ('escalate_ts',   'Escalate — Trust & Safety','escalate_trust_safety','Escalated to Trust & Safety for senior review.')
ON CONFLICT (slug) DO NOTHING;

-- Seeds.
INSERT INTO mod_queue_items (reference, surface, target_id, reason_code, severity, ml_score, ml_band, status, queue, sla_due_at)
VALUES
 ('MOD-DEMO01','post',    'post-1001','spam',          'normal','40','normal',  'open',     'triage',            now()+interval '6 hours'),
 ('MOD-DEMO02','message', 'msg-2002', 'harassment',    'high',  '78','high',    'open',     'review',            now()+interval '3 hours'),
 ('MOD-DEMO03','media',   'media-3003','nsfw',         'high',  '85','high',    'triaging', 'review',            now()+interval '2 hours'),
 ('MOD-DEMO04','profile', 'user-4004','impersonation', 'high',  '70','high',    'open',     'review',            now()+interval '12 hours'),
 ('MOD-DEMO05','dm_thread','thread-5005','phishing',   'critical','94','critical','open',  'messaging_incident',now()+interval '1 hour'),
 ('MOD-DEMO06','comment', 'cmt-6006', 'hate',          'critical','91','critical','escalated','escalation',     now()+interval '2 hours')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO mod_messaging_incidents (thread_id, signal, excerpt, ml_score, ml_band, status)
VALUES
 ('thread-5005','phishing',     'Click this link to claim your reward...',           94,'critical','pending'),
 ('thread-5006','solicitation', 'Bypass the platform fees, pay me directly...',      72,'high',    'pending'),
 ('thread-5007','rate_limit',   'Same message sent to 47 users in 3 minutes',        68,'high',    'pending')
ON CONFLICT DO NOTHING;
