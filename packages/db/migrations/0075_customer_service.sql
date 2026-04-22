-- Domain 67 — Customer Service Dashboard, Ticket Queues, Resolution Operations.

CREATE TABLE IF NOT EXISTS cs_tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference     TEXT NOT NULL UNIQUE CHECK (reference ~ '^CS-[A-Z0-9]{6,12}$'),
  requester_id  UUID NOT NULL,
  requester_email TEXT NOT NULL,
  requester_kind TEXT NOT NULL DEFAULT 'user' CHECK (requester_kind IN ('user','professional','enterprise','guest')),
  subject       TEXT NOT NULL CHECK (length(subject) BETWEEN 2 AND 200),
  body          TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'general' CHECK (category IN
                ('general','billing','dispute','account','technical','trust_safety','enterprise','refund','escalation')),
  priority      TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  channel       TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web','email','chat','phone','api','mobile')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
                ('draft','pending','active','waiting_customer','escalated','resolved','closed','reopened','refunded','archived')),
  assignee_id   UUID,
  queue_slug    TEXT NOT NULL DEFAULT 'general',
  sla_due_at    TIMESTAMPTZ,
  resolved_at   TIMESTAMPTZ,
  csat_score    INTEGER CHECK (csat_score BETWEEN 1 AND 5),
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_status_priority ON cs_tickets(status, priority, sla_due_at);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_requester      ON cs_tickets(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_assignee       ON cs_tickets(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_queue          ON cs_tickets(queue_slug, status);

CREATE TABLE IF NOT EXISTS cs_ticket_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES cs_tickets(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL,
  author_kind TEXT NOT NULL DEFAULT 'agent' CHECK (author_kind IN ('agent','customer','system','bot')),
  body        TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 8000),
  visibility  TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','internal')),
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_msgs_ticket ON cs_ticket_messages(ticket_id, created_at);

CREATE TABLE IF NOT EXISTS cs_ticket_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES cs_tickets(id) ON DELETE CASCADE,
  actor_id   UUID,
  action     TEXT NOT NULL,
  diff       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_events_ticket ON cs_ticket_events(ticket_id, created_at DESC);

CREATE OR REPLACE FUNCTION cs_events_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'cs_ticket_events is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_cs_events_no_update ON cs_ticket_events;
CREATE TRIGGER trg_cs_events_no_update BEFORE UPDATE OR DELETE ON cs_ticket_events
  FOR EACH ROW EXECUTE FUNCTION cs_events_immutable();

CREATE TABLE IF NOT EXISTS cs_macros (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9_-]{1,40}$'),
  label       TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general',
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed reference data (small + believable)
INSERT INTO cs_tickets (reference, requester_id, requester_email, subject, category, priority, status, queue_slug, sla_due_at)
VALUES
  ('CS-DEMO01', gen_random_uuid(), 'alex@example.com',  'Cannot withdraw funds',   'billing',  'high',   'pending',          'billing',     now() + interval '4 hours'),
  ('CS-DEMO02', gen_random_uuid(), 'mira@example.com',  'Refund for cancelled gig','refund',   'urgent', 'escalated',        'refunds',     now() + interval '1 hour'),
  ('CS-DEMO03', gen_random_uuid(), 'kai@example.com',   'Account locked',          'account',  'normal', 'waiting_customer', 'account',     now() + interval '12 hours'),
  ('CS-DEMO04', gen_random_uuid(), 'jen@example.com',   'API webhook failing',     'technical','normal', 'active',           'technical',   now() + interval '8 hours'),
  ('CS-DEMO05', gen_random_uuid(), 'ops@enterprise.io', 'Bulk seat invoice',       'enterprise','low',   'pending',          'enterprise',  now() + interval '24 hours')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO cs_macros (slug, label, body, category) VALUES
  ('greeting',     'Greeting',           'Hi, thanks for reaching out — looking into this now.', 'general'),
  ('refund_eta',   'Refund ETA',         'Refunds clear in 5–7 business days from approval.',     'refund'),
  ('kyc_required', 'KYC required',       'Please complete identity verification to proceed.',     'account'),
  ('escalating',   'Escalating',         'I am escalating this to our specialist team now.',     'escalation'),
  ('resolved',     'Resolved confirmation','We have applied the fix — please confirm and rate.', 'general')
ON CONFLICT (slug) DO NOTHING;
