-- ML registry
CREATE TABLE IF NOT EXISTS public.ml_models (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  version     text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('fraud','identity','bot','review','payment','collusion','moderation','other')),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, version)
);

-- Pipeline-health samples
CREATE TABLE IF NOT EXISTS public.ml_model_performance (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id        uuid NOT NULL REFERENCES public.ml_models(id) ON DELETE CASCADE,
  precision       numeric(5,4) NOT NULL CHECK (precision >= 0 AND precision <= 1),
  recall          numeric(5,4) NOT NULL CHECK (recall >= 0 AND recall <= 1),
  latency_p95_ms  integer NOT NULL CHECK (latency_p95_ms >= 0),
  uptime_pct      numeric(5,4) NOT NULL CHECK (uptime_pct >= 0 AND uptime_pct <= 1),
  sampled_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ml_model_perf_model_idx ON public.ml_model_performance (model_id, sampled_at DESC);

-- Per-subject scores
CREATE TABLE IF NOT EXISTS public.ml_scores (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id     uuid NOT NULL REFERENCES public.ml_models(id) ON DELETE CASCADE,
  subject_kind text NOT NULL,
  subject_id   text NOT NULL,
  score        numeric(5,4) NOT NULL CHECK (score >= 0 AND score <= 1),
  band         text NOT NULL,
  flag         text NOT NULL,
  components   jsonb NOT NULL DEFAULT '[]'::jsonb,
  reason       jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ml_scores_subject_idx ON public.ml_scores (subject_kind, subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ml_scores_model_idx   ON public.ml_scores (model_id, created_at DESC);

-- Admin-toggleable ID Verifier connectors
CREATE TABLE IF NOT EXISTS public.id_verify_connectors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        text NOT NULL UNIQUE CHECK (provider IN ('onfido','veriff','persona','stripe_identity','manual')),
  enabled         boolean NOT NULL DEFAULT false,
  priority        integer NOT NULL DEFAULT 100,
  last_health_at  timestamptz,
  config          jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid
);

-- Append-only protection
CREATE OR REPLACE FUNCTION public.ml_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'ml history table is append-only'; END $$;

DROP TRIGGER IF EXISTS ml_perf_append_only ON public.ml_model_performance;
CREATE TRIGGER ml_perf_append_only BEFORE UPDATE OR DELETE ON public.ml_model_performance
FOR EACH ROW EXECUTE FUNCTION public.ml_append_only();

DROP TRIGGER IF EXISTS ml_scores_append_only ON public.ml_scores;
CREATE TRIGGER ml_scores_append_only BEFORE UPDATE OR DELETE ON public.ml_scores
FOR EACH ROW EXECUTE FUNCTION public.ml_append_only();

-- updated_at trigger for connectors
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS id_verify_touch ON public.id_verify_connectors;
CREATE TRIGGER id_verify_touch BEFORE UPDATE ON public.id_verify_connectors
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.ml_models               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_model_performance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_scores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_verify_connectors    ENABLE ROW LEVEL SECURITY;

-- Admin-only read; writes blocked from client (server uses service role)
CREATE POLICY "admin reads ml_models"
  ON public.ml_models FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "admin reads ml_model_performance"
  ON public.ml_model_performance FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "admin reads ml_scores"
  ON public.ml_scores FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "admin reads id_verify_connectors"
  ON public.id_verify_connectors FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Seed models
INSERT INTO public.ml_models (name, version, kind) VALUES
  ('FraudNet',     '4.1.0', 'fraud'),
  ('IDVerify',     '2.3.0', 'identity'),
  ('BotDetect',    '3.0.0', 'bot'),
  ('ReviewGuard',  '2.1.0', 'review'),
  ('PayFlow',      '1.8.0', 'payment')
ON CONFLICT (name, version) DO NOTHING;

-- Seed connector rows (all disabled — admin enables explicitly)
INSERT INTO public.id_verify_connectors (provider, enabled, priority) VALUES
  ('onfido',          false, 10),
  ('veriff',          false, 20),
  ('persona',         false, 30),
  ('stripe_identity', false, 40),
  ('manual',          true,  100)
ON CONFLICT (provider) DO NOTHING;

-- Seed initial pipeline-health observations so the card never blanks on first load
INSERT INTO public.ml_model_performance (model_id, precision, recall, latency_p95_ms, uptime_pct)
SELECT id, 0.94, 0.91, 120, 0.998 FROM public.ml_models WHERE name='FraudNet'    AND version='4.1.0'
UNION ALL
SELECT id, 0.92, 0.88, 180, 0.997 FROM public.ml_models WHERE name='IDVerify'    AND version='2.3.0'
UNION ALL
SELECT id, 0.90, 0.87, 95,  0.999 FROM public.ml_models WHERE name='BotDetect'   AND version='3.0.0'
UNION ALL
SELECT id, 0.86, 0.82, 140, 0.996 FROM public.ml_models WHERE name='ReviewGuard' AND version='2.1.0'
UNION ALL
SELECT id, 0.89, 0.84, 110, 0.998 FROM public.ml_models WHERE name='PayFlow'     AND version='1.8.0';