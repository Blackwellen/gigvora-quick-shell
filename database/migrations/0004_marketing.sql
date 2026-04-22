-- Domain 02: Public Marketing, Acquisition & Conversion Surfaces
-- State machines: marketing_pages (draft|scheduled|published|archived),
--                 leads (new|qualified|nurturing|converted|disqualified),
--                 newsletter (pending|confirmed|unsubscribed|bounced),
--                 cta_experiments (draft|running|paused|completed),
--                 cta_variants (control|challenger), cta_events (impression|click|convert)

CREATE TABLE IF NOT EXISTS marketing_pages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  surface       text NOT NULL CHECK (surface IN ('showcase','landing','pricing','about','legal','solution','industry')),
  title         text NOT NULL,
  tagline       text,
  description   text,
  hero_image    text,
  body          jsonb NOT NULL DEFAULT '{}'::jsonb,        -- structured blocks
  seo           jsonb NOT NULL DEFAULT '{}'::jsonb,        -- title, description, og_image, canonical, noindex
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  published_at  timestamptz,
  scheduled_at  timestamptz,
  locale        text NOT NULL DEFAULT 'en-GB',
  org_id        uuid,
  author_id     uuid,
  version       integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketing_pages_status ON marketing_pages(status);
CREATE INDEX IF NOT EXISTS idx_marketing_pages_surface ON marketing_pages(surface);

CREATE TABLE IF NOT EXISTS marketing_leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  full_name     text,
  company       text,
  role          text,
  use_case      text,
  source_page   text,                -- slug or path
  source_cta    text,                -- cta_id
  utm           jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent       jsonb NOT NULL DEFAULT '{}'::jsonb, -- {marketing:true, terms_at:..., ip:..., ua:...}
  status        text NOT NULL DEFAULT 'new' CHECK (status IN ('new','qualified','nurturing','converted','disqualified')),
  score         integer NOT NULL DEFAULT 0,
  notes         text,
  assigned_to   uuid,
  converted_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_email ON marketing_leads(lower(email));
CREATE INDEX IF NOT EXISTS idx_marketing_leads_status ON marketing_leads(status);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL UNIQUE,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','unsubscribed','bounced')),
  list_topics     text[] NOT NULL DEFAULT '{}',
  confirm_token   text,
  unsubscribe_token text NOT NULL DEFAULT encode(gen_random_bytes(16),'hex'),
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz,
  source          text,
  utm             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cta_experiments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           text NOT NULL UNIQUE,           -- e.g. 'home.hero.cta'
  name          text NOT NULL,
  hypothesis    text,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','paused','completed')),
  started_at    timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cta_variants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES cta_experiments(id) ON DELETE CASCADE,
  label         text NOT NULL,                  -- e.g. 'control','challenger-a'
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb, -- copy, color, href
  weight        integer NOT NULL DEFAULT 50 CHECK (weight BETWEEN 0 AND 100),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cta_variants_experiment ON cta_variants(experiment_id);

CREATE TABLE IF NOT EXISTS cta_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES cta_experiments(id) ON DELETE CASCADE,
  variant_id    uuid NOT NULL REFERENCES cta_variants(id) ON DELETE CASCADE,
  event_type    text NOT NULL CHECK (event_type IN ('impression','click','convert')),
  visitor_id    text,                           -- anonymous cookie id
  user_id       uuid,
  page          text,
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cta_events_exp_variant ON cta_events(experiment_id, variant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_cta_events_created ON cta_events(created_at DESC);

CREATE TABLE IF NOT EXISTS marketing_consent_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  action      text NOT NULL CHECK (action IN ('opt_in','opt_out','confirm','bounce')),
  ip          inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consent_log_email ON marketing_consent_log(lower(email));
