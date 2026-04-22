-- ───────────────────────────────────────────────────────────────────────────
-- Domain — ML Pipeline Registry, Performance Samples, Per-Subject Scores,
--          and ID-Verifier Connector matrix.
--
-- Lives in the user's own Postgres (DATABASE_URL), NEVER in Lovable Cloud.
-- These tables back:
--   • MlPipelineHealthCard (TS + Moderator dashboards)
--   • Per-row mlScore lookups in trust-safety / moderation tables
--   • Admin-toggleable ID Verifier provider matrix (Onfido/Veriff/Persona/
--     Stripe Identity/Manual) including envelope-encrypted credentials
--
-- Append-only enforcement is via triggers on the history tables. Connectors
-- table allows updates so admins can toggle/edit, with a separate audit log.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ml_models (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  version     TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN
              ('fraud','identity','bot','review','payment','collusion','moderation','ranker','other')),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, version)
);
CREATE INDEX IF NOT EXISTS idx_ml_models_kind ON ml_models(kind, active);

CREATE TABLE IF NOT EXISTS ml_model_performance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id        UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  precision       NUMERIC(5,4) NOT NULL CHECK (precision  BETWEEN 0 AND 1),
  recall          NUMERIC(5,4) NOT NULL CHECK (recall     BETWEEN 0 AND 1),
  latency_p95_ms  INTEGER      NOT NULL CHECK (latency_p95_ms >= 0),
  uptime_pct      NUMERIC(5,4) NOT NULL CHECK (uptime_pct BETWEEN 0 AND 1),
  sample_size     INTEGER      NOT NULL DEFAULT 0,
  sampled_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ml_perf_model ON ml_model_performance(model_id, sampled_at DESC);

CREATE TABLE IF NOT EXISTS ml_scores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id     UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  subject_kind TEXT NOT NULL,
  subject_id   TEXT NOT NULL,
  score        NUMERIC(5,4) NOT NULL CHECK (score BETWEEN 0 AND 1),
  band         TEXT NOT NULL,
  flag         TEXT NOT NULL,
  components   JSONB NOT NULL DEFAULT '[]'::jsonb,
  reason       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ml_scores_subject ON ml_scores(subject_kind, subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_scores_model   ON ml_scores(model_id, created_at DESC);

-- Append-only protection on history tables
CREATE OR REPLACE FUNCTION ml_history_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'ml history table is append-only (table=%)', TG_TABLE_NAME; END $$;

DROP TRIGGER IF EXISTS ml_perf_append_only   ON ml_model_performance;
CREATE TRIGGER ml_perf_append_only   BEFORE UPDATE OR DELETE ON ml_model_performance
FOR EACH ROW EXECUTE FUNCTION ml_history_append_only();

DROP TRIGGER IF EXISTS ml_scores_append_only ON ml_scores;
CREATE TRIGGER ml_scores_append_only BEFORE UPDATE OR DELETE ON ml_scores
FOR EACH ROW EXECUTE FUNCTION ml_history_append_only();

-- ───────────────────────────────────────────────────────────────────────────
-- ID-Verifier connectors (admin-toggleable provider matrix).
--   • config_public: non-secret JSON (region, webhook URL, callback prefix)
--   • config_secret_ciphertext: AES-256-GCM ciphertext of provider API key
--   • config_secret_iv / config_secret_tag: GCM IV + auth tag
--   • config_secret_key_version: which envelope key encrypted it
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS id_verify_connectors (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider                    TEXT NOT NULL UNIQUE CHECK (provider IN
                              ('onfido','veriff','persona','stripe_identity','manual')),
  enabled                     BOOLEAN NOT NULL DEFAULT false,
  priority                    INTEGER NOT NULL DEFAULT 100,
  health                      TEXT NOT NULL DEFAULT 'unknown'
                              CHECK (health IN ('healthy','degraded','down','unknown')),
  last_health_at              TIMESTAMPTZ,
  config_public               JSONB NOT NULL DEFAULT '{}'::jsonb,
  config_secret_ciphertext    TEXT,
  config_secret_iv            TEXT,
  config_secret_tag           TEXT,
  config_secret_key_version   INTEGER,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                  UUID
);
CREATE INDEX IF NOT EXISTS idx_idverify_priority ON id_verify_connectors(enabled, priority);

CREATE OR REPLACE FUNCTION touch_updated_at_idverify() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS id_verify_touch ON id_verify_connectors;
CREATE TRIGGER id_verify_touch BEFORE UPDATE ON id_verify_connectors
FOR EACH ROW EXECUTE FUNCTION touch_updated_at_idverify();

-- Audit log for any change to the connector matrix
CREATE TABLE IF NOT EXISTS id_verify_connector_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id  UUID NOT NULL REFERENCES id_verify_connectors(id) ON DELETE CASCADE,
  actor_id      UUID,
  action        TEXT NOT NULL CHECK (action IN
                ('enable','disable','rotate_secret','update_config','health_probe','create')),
  before        JSONB,
  after         JSONB,
  ip            TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_idverify_events_connector ON id_verify_connector_events(connector_id, created_at DESC);

-- Seed the five known providers if missing (so admins always see the full matrix)
INSERT INTO id_verify_connectors (provider, enabled, priority)
VALUES ('onfido', false, 10),
       ('veriff', false, 20),
       ('persona', false, 30),
       ('stripe_identity', false, 40),
       ('manual', true, 100)
ON CONFLICT (provider) DO NOTHING;

-- Seed canonical models so the health card has rows even before first sample
INSERT INTO ml_models (name, version, kind, active) VALUES
  ('FraudNet',    '4.1.0', 'fraud',    true),
  ('IDVerify',    '2.3.0', 'identity', true),
  ('BotDetect',   '3.0.0', 'bot',      true),
  ('ReviewGuard', '2.1.0', 'review',   true),
  ('PayFlow',     '1.8.0', 'payment',  true)
ON CONFLICT (name, version) DO NOTHING;
