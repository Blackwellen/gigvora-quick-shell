-- Domain 46 — Seller Performance, Capacity, Availability, and Offer Optimization
CREATE TABLE IF NOT EXISTS seller_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'online',
  working_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  timezone text NOT NULL DEFAULT 'UTC',
  max_concurrent_orders integer NOT NULL DEFAULT 5,
  auto_pause_threshold integer NOT NULL DEFAULT 8,
  response_target_hours integer NOT NULL DEFAULT 2,
  vacation_start date,
  vacation_end date,
  vacation_message text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seller_availability_seller_idx ON seller_availability(seller_id);

CREATE TABLE IF NOT EXISTS seller_gig_capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  gig_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  queue_depth integer NOT NULL DEFAULT 0,
  max_queue integer NOT NULL DEFAULT 5,
  paused_at timestamptz,
  paused_reason text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seller_gig_capacity_seller_gig_idx ON seller_gig_capacity(seller_id, gig_id);

CREATE TABLE IF NOT EXISTS seller_performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  orders_completed integer NOT NULL DEFAULT 0,
  orders_cancelled integer NOT NULL DEFAULT 0,
  on_time_rate numeric(5,4) NOT NULL DEFAULT 0,
  response_rate numeric(5,4) NOT NULL DEFAULT 0,
  avg_response_minutes integer NOT NULL DEFAULT 0,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  repeat_buyer_rate numeric(5,4) NOT NULL DEFAULT 0,
  earnings numeric(12,2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seller_perf_seller_period_idx ON seller_performance_snapshots(seller_id, period_start);

CREATE TABLE IF NOT EXISTS seller_offer_optimizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  gig_id uuid,
  suggestion_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  detail text NOT NULL,
  expected_lift numeric(5,4),
  status text NOT NULL DEFAULT 'open',
  dismissed_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seller_offer_opt_seller_status_idx ON seller_offer_optimizations(seller_id, status);

CREATE TABLE IF NOT EXISTS seller_availability_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seller_avail_events_seller_idx ON seller_availability_events(seller_id, created_at);
