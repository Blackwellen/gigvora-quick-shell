-- Domain 48 — User Dashboard, Personal Overview, and Guided Next Actions
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  widget_key text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  size text NOT NULL DEFAULT 'md',
  visible boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dashboard_widgets_user_idx ON dashboard_widgets(user_id, role);

CREATE TABLE IF NOT EXISTS dashboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  stale_at timestamptz
);
CREATE INDEX IF NOT EXISTS dashboard_snapshots_user_idx ON dashboard_snapshots(user_id, role, computed_at DESC);

CREATE TABLE IF NOT EXISTS dashboard_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  kind text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  href text,
  priority integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','snoozed','done','dismissed')),
  due_at timestamptz,
  snooze_until timestamptz,
  completed_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dashboard_actions_user_idx ON dashboard_actions(user_id, status, priority DESC);

CREATE TABLE IF NOT EXISTS dashboard_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  target_type text,
  target_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dashboard_events_user_idx ON dashboard_events(user_id, occurred_at DESC);
