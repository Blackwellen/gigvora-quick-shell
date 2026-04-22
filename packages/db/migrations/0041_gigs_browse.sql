-- Domain 41 — Gigs Browse, Search, and Marketplace Discovery
-- Idempotent migration. Run with `psql $DATABASE_URL -f 0041_gigs_browse.sql`.

CREATE TABLE IF NOT EXISTS gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  company_id UUID,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL DEFAULT '',
  search_vector TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  visibility TEXT NOT NULL DEFAULT 'public',
  source TEXT NOT NULL DEFAULT 'internal',
  pricing_from_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  delivery_days_min INTEGER NOT NULL DEFAULT 1,
  delivery_days_max INTEGER NOT NULL DEFAULT 7,
  rating_avg INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  conversion_bp INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_pro_seller BOOLEAN NOT NULL DEFAULT FALSE,
  has_fast_delivery BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_revisions BOOLEAN NOT NULL DEFAULT TRUE,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  industries JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gigs_status_chk CHECK (status IN ('draft','pending_review','active','paused','archived','escalated')),
  CONSTRAINT gigs_visibility_chk CHECK (visibility IN ('public','unlisted','private')),
  CONSTRAINT gigs_price_chk CHECK (pricing_from_cents >= 0),
  CONSTRAINT gigs_delivery_chk CHECK (delivery_days_min <= delivery_days_max)
);
CREATE INDEX IF NOT EXISTS gigs_status_idx   ON gigs(status);
CREATE INDEX IF NOT EXISTS gigs_category_idx ON gigs(category);
CREATE INDEX IF NOT EXISTS gigs_owner_idx    ON gigs(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS gigs_slug_uidx ON gigs(slug);
CREATE INDEX IF NOT EXISTS gigs_price_idx    ON gigs(pricing_from_cents);
CREATE INDEX IF NOT EXISTS gigs_rating_idx   ON gigs(rating_avg);

CREATE TABLE IF NOT EXISTS gig_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  delivery_days INTEGER NOT NULL,
  revisions INTEGER NOT NULL DEFAULT 1,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT gig_packages_tier_chk CHECK (tier IN ('basic','standard','premium','custom')),
  CONSTRAINT gig_packages_price_chk CHECK (price_cents >= 0)
);
CREATE INDEX IF NOT EXISTS gig_packages_gig_idx ON gig_packages(gig_id);
CREATE UNIQUE INDEX IF NOT EXISTS gig_packages_gig_tier_uidx ON gig_packages(gig_id, tier);

CREATE TABLE IF NOT EXISTS gig_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  extra_delivery_days INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT gig_addons_price_chk CHECK (price_cents >= 0)
);
CREATE INDEX IF NOT EXISTS gig_addons_gig_idx ON gig_addons(gig_id);

CREATE TABLE IF NOT EXISTS gig_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  bytes INTEGER,
  scan_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gig_media_kind_chk CHECK (kind IN ('image','video','pdf','audio')),
  CONSTRAINT gig_media_scan_chk CHECK (scan_status IN ('pending','clean','infected','skipped'))
);
CREATE INDEX IF NOT EXISTS gig_media_gig_idx ON gig_media(gig_id);

CREATE TABLE IF NOT EXISTS gig_skills (
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  PRIMARY KEY (gig_id, skill)
);
CREATE INDEX IF NOT EXISTS gig_skills_skill_idx ON gig_skills(skill);

CREATE TABLE IF NOT EXISTS gigs_browse_saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  label TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  state TEXT NOT NULL DEFAULT 'active',
  alerts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  alert_cadence TEXT NOT NULL DEFAULT 'off',
  channel TEXT NOT NULL DEFAULT 'inapp',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gigs_saved_state_chk CHECK (state IN ('inactive','active','snoozed','archived')),
  CONSTRAINT gigs_saved_cadence_chk CHECK (alert_cadence IN ('off','realtime','daily','weekly'))
);
CREATE INDEX IF NOT EXISTS gigs_saved_owner_idx ON gigs_browse_saved_searches(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS gigs_saved_owner_label_uidx ON gigs_browse_saved_searches(owner_id, label);

CREATE TABLE IF NOT EXISTS gigs_browse_bookmarks (
  owner_id UUID NOT NULL,
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, gig_id)
);
CREATE INDEX IF NOT EXISTS gigs_bookmarks_gig_idx ON gigs_browse_bookmarks(gig_id);

CREATE TABLE IF NOT EXISTS gigs_browse_ranking_signals (
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  bucket_hour TIMESTAMPTZ NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  bookmarks INTEGER NOT NULL DEFAULT 0,
  orders INTEGER NOT NULL DEFAULT 0,
  refunds INTEGER NOT NULL DEFAULT 0,
  ctr INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (gig_id, bucket_hour)
);
CREATE INDEX IF NOT EXISTS gigs_signals_hour_idx ON gigs_browse_ranking_signals(bucket_hour);

CREATE TABLE IF NOT EXISTS gigs_browse_view_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  identity_id UUID,
  source TEXT NOT NULL DEFAULT 'browse',
  query TEXT,
  position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gigs_view_events_gig_idx      ON gigs_browse_view_events(gig_id);
CREATE INDEX IF NOT EXISTS gigs_view_events_identity_idx ON gigs_browse_view_events(identity_id);
CREATE INDEX IF NOT EXISTS gigs_view_events_time_idx     ON gigs_browse_view_events(created_at);
