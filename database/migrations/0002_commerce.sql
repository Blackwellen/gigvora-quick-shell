-- Commerce / work surfaces.
CREATE TABLE jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id),
  posted_by   UUID NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  location    TEXT, remote BOOLEAN DEFAULT true,
  salary_min  NUMERIC, salary_max NUMERIC, currency TEXT DEFAULT 'USD',
  status      TEXT NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL, description TEXT,
  budget      NUMERIC, currency TEXT DEFAULT 'USD',
  status      TEXT NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE proposals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  amount      NUMERIC NOT NULL, currency TEXT DEFAULT 'USD',
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'submitted',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gigs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL, description TEXT,
  packages    JSONB NOT NULL DEFAULT '[]',
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL, description TEXT,
  rate        NUMERIC, currency TEXT DEFAULT 'USD',
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    UUID NOT NULL REFERENCES users(id),
  seller_id   UUID NOT NULL REFERENCES users(id),
  item_type   TEXT NOT NULL,                     -- 'gig'|'service'|'custom'
  item_id     UUID NOT NULL,
  amount      NUMERIC NOT NULL, currency TEXT DEFAULT 'USD',
  status      TEXT NOT NULL DEFAULT 'pending',   -- pending|paid|delivered|disputed|cancelled
  payment_ref TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id),
  user_id     UUID REFERENCES users(id),
  amount      NUMERIC NOT NULL, currency TEXT DEFAULT 'USD',
  status      TEXT NOT NULL DEFAULT 'open',
  due_at      TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL, amount NUMERIC NOT NULL, currency TEXT DEFAULT 'USD',
  status      TEXT NOT NULL DEFAULT 'unfunded',
  funded_at   TIMESTAMPTZ, released_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhook_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL, event_id TEXT,
  payload     JSONB NOT NULL,
  signature   TEXT,
  status      TEXT NOT NULL DEFAULT 'received',
  attempts    INT NOT NULL DEFAULT 0,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

CREATE INDEX idx_orders_buyer    ON orders(buyer_id);
CREATE INDEX idx_orders_seller   ON orders(seller_id);
CREATE INDEX idx_milestones_proj ON milestones(project_id);
