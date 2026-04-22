CREATE OR REPLACE FUNCTION public.ml_append_only() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN RAISE EXCEPTION 'ml history table is append-only'; END $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;