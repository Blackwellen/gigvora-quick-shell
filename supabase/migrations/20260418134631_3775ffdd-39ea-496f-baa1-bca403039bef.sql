-- Remove enterprise ML/ID-verifier tables that were placed in Lovable Cloud by mistake.
-- Per the no-domain-code-in-supabase rule, these belong in packages/db (user's own Postgres).

DROP TRIGGER IF EXISTS ml_perf_append_only ON public.ml_model_performance;
DROP TRIGGER IF EXISTS ml_scores_append_only ON public.ml_scores;
DROP TRIGGER IF EXISTS id_verify_touch ON public.id_verify_connectors;

DROP TABLE IF EXISTS public.ml_scores CASCADE;
DROP TABLE IF EXISTS public.ml_model_performance CASCADE;
DROP TABLE IF EXISTS public.ml_models CASCADE;
DROP TABLE IF EXISTS public.id_verify_connectors CASCADE;

-- Only drop helper functions if no other tables still depend on them.
-- touch_updated_at / ml_append_only might be reused; drop ONLY ml_append_only since
-- that one was specifically for the ML history tables.
DROP FUNCTION IF EXISTS public.ml_append_only() CASCADE;