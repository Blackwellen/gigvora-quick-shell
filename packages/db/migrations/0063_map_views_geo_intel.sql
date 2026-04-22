-- Domain 62 — Map Views, Location Targeting, Geo Intelligence & Place-Based Media.

CREATE TABLE IF NOT EXISTS mvg_places (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  name              TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
  category          TEXT CHECK (category IS NULL OR category IN ('venue','office','retail','event','coworking','other')),
  lat               DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng               DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  country           TEXT CHECK (country IS NULL OR length(country) = 2),
  region            TEXT CHECK (region IS NULL OR length(region) <= 80),
  city              TEXT CHECK (city IS NULL OR length(city) <= 120),
  postcode          TEXT CHECK (postcode IS NULL OR length(postcode) <= 20),
  address           TEXT CHECK (address IS NULL OR length(address) <= 500),
  meta              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mvg_places_owner ON mvg_places(owner_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_mvg_places_city  ON mvg_places(country, city);

CREATE TABLE IF NOT EXISTS mvg_geofences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  name              TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','paused','archived')),
  shape             TEXT NOT NULL CHECK (shape IN ('circle','polygon')),
  center_lat        DOUBLE PRECISION CHECK (center_lat IS NULL OR center_lat BETWEEN -90 AND 90),
  center_lng        DOUBLE PRECISION CHECK (center_lng IS NULL OR center_lng BETWEEN -180 AND 180),
  radius_meters     INTEGER CHECK (radius_meters IS NULL OR radius_meters BETWEEN 50 AND 200000),
  polygon           JSONB,
  bbox              JSONB,
  meta              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (shape = 'circle'  AND center_lat IS NOT NULL AND center_lng IS NOT NULL AND radius_meters IS NOT NULL) OR
    (shape = 'polygon' AND polygon IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_mvg_geofences_owner ON mvg_geofences(owner_identity_id, status);

CREATE TABLE IF NOT EXISTS mvg_audiences (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id  UUID NOT NULL,
  name               TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
  geofence_ids       JSONB NOT NULL DEFAULT '[]'::jsonb,
  include_countries  JSONB NOT NULL DEFAULT '[]'::jsonb,
  exclude_countries  JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_reach    INTEGER NOT NULL DEFAULT 0 CHECK (estimated_reach >= 0),
  meta               JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mvg_audiences_owner ON mvg_audiences(owner_identity_id, status);

CREATE TABLE IF NOT EXISTS mvg_place_media (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id            UUID NOT NULL REFERENCES mvg_places(id) ON DELETE CASCADE,
  owner_identity_id   UUID NOT NULL,
  kind                TEXT NOT NULL CHECK (kind IN ('image','video','audio','document')),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','scanned','approved','rejected')),
  url                 TEXT NOT NULL CHECK (length(url) BETWEEN 1 AND 2000),
  thumb_url           TEXT CHECK (thumb_url IS NULL OR length(thumb_url) <= 2000),
  bytes               INTEGER CHECK (bytes IS NULL OR bytes BETWEEN 0 AND 524288000),
  duration_ms         INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  moderation_score    REAL CHECK (moderation_score IS NULL OR (moderation_score >= 0 AND moderation_score <= 1)),
  moderation_reason   TEXT CHECK (moderation_reason IS NULL OR length(moderation_reason) <= 500),
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mvg_place_media_place ON mvg_place_media(place_id, status);

CREATE TABLE IF NOT EXISTS mvg_location_signals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  place_id          UUID,
  geofence_id       UUID,
  event_type        TEXT NOT NULL CHECK (event_type IN ('visit','click','impression','conversion')),
  lat               DOUBLE PRECISION CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng               DOUBLE PRECISION CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  occurred_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  country_code      TEXT CHECK (country_code IS NULL OR length(country_code) = 2),
  meta              JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_mvg_signals_owner ON mvg_location_signals(owner_identity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mvg_signals_place ON mvg_location_signals(place_id, occurred_at DESC);

-- Append-only signals
CREATE OR REPLACE FUNCTION mvg_signals_immutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'mvg_location_signals is append-only'; END $$;
DROP TRIGGER IF EXISTS trg_mvg_signals_no_update ON mvg_location_signals;
CREATE TRIGGER trg_mvg_signals_no_update BEFORE UPDATE OR DELETE ON mvg_location_signals
  FOR EACH ROW EXECUTE FUNCTION mvg_signals_immutable();

CREATE TABLE IF NOT EXISTS mvg_heatmap_cells (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID NOT NULL,
  cell_id           TEXT NOT NULL,
  resolution        INTEGER NOT NULL CHECK (resolution BETWEEN 4 AND 10),
  center_lat        DOUBLE PRECISION NOT NULL CHECK (center_lat BETWEEN -90 AND 90),
  center_lng        DOUBLE PRECISION NOT NULL CHECK (center_lng BETWEEN -180 AND 180),
  signals           INTEGER NOT NULL DEFAULT 0 CHECK (signals >= 0),
  conversions       INTEGER NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  intensity         REAL NOT NULL DEFAULT 0 CHECK (intensity >= 0 AND intensity <= 1),
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_mvg_cell UNIQUE (owner_identity_id, cell_id, resolution)
);
CREATE INDEX IF NOT EXISTS idx_mvg_cells_owner ON mvg_heatmap_cells(owner_identity_id, resolution);

CREATE TABLE IF NOT EXISTS mvg_audit_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_identity_id UUID,
  actor_identity_id UUID,
  actor_role        TEXT,
  action            TEXT NOT NULL,
  target_type       TEXT,
  target_id         UUID,
  diff              JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip                TEXT,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mvg_audit_owner ON mvg_audit_events(owner_identity_id, created_at DESC);

-- Seed
INSERT INTO mvg_places (id, owner_identity_id, name, status, category, lat, lng, country, city, address)
VALUES
  ('00000000-0000-0000-0000-000000006301'::uuid,
   '00000000-0000-0000-0000-0000000000e1'::uuid,
   'Gigvora HQ', 'active', 'office', 51.5145, -0.0982, 'GB', 'London', 'Shoreditch, London'),
  ('00000000-0000-0000-0000-000000006302'::uuid,
   '00000000-0000-0000-0000-0000000000e1'::uuid,
   'Manchester Studio', 'active', 'venue', 53.4808, -2.2426, 'GB', 'Manchester', 'Northern Quarter')
ON CONFLICT DO NOTHING;

INSERT INTO mvg_geofences (id, owner_identity_id, name, status, shape, center_lat, center_lng, radius_meters)
VALUES
  ('00000000-0000-0000-0000-000000006401'::uuid,
   '00000000-0000-0000-0000-0000000000e1'::uuid,
   'Central London 5km', 'active', 'circle', 51.5074, -0.1278, 5000)
ON CONFLICT DO NOTHING;
