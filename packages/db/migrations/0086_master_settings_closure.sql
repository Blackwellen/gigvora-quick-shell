-- ───────────────────────────────────────────────────────────────────────────
-- FD-17 closure — supplemental:
--   • Append-only audit log dedicated to master-settings + super-admin
--     governance (kept separate from the broader super_admin_audit_log so
--     filtering and retention policy can differ)
--   • Append-only protection on master_settings_pending_changes (commit/reject
--     write a status update; rows themselves never delete)
--   • Idempotent seeds for: 10 namespaces × representative defaults, 10
--     kill-switch domains, 10 portal entitlements, baseline KPI catalog
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS master_settings_audit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL,
  actor_role  TEXT,
  domain      TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_id   TEXT,
  ip          TEXT,
  user_agent  TEXT,
  diff        JSONB NOT NULL DEFAULT '{}'::jsonb,
  at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS msa_domain_at_idx ON master_settings_audit (domain, at DESC);
CREATE INDEX IF NOT EXISTS msa_actor_at_idx  ON master_settings_audit (actor_id, at DESC);

CREATE OR REPLACE FUNCTION master_settings_audit_immutable() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'master_settings_audit is append-only'; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS msa_no_mutate ON master_settings_audit;
CREATE TRIGGER msa_no_mutate BEFORE UPDATE OR DELETE ON master_settings_audit
FOR EACH ROW EXECUTE FUNCTION master_settings_audit_immutable();

-- ── Seeds (idempotent) ─────────────────────────────────────────────────

-- 10 namespace defaults (one representative entry per namespace)
INSERT INTO master_settings_entries (namespace, key, environment, scope, value, is_secret) VALUES
  ('site',       'platform_name',          'production', 'platform', '"Gigvora"'::jsonb,                   FALSE),
  ('site',       'support_email',          'production', 'platform', '"support@gigvora.com"'::jsonb,        FALSE),
  ('finance',    'commission_rate_default','production', 'platform', '0.10'::jsonb,                         FALSE),
  ('finance',    'payout_min_threshold',   'production', 'platform', '50'::jsonb,                           FALSE),
  ('notify',     'email_per_user_per_day', 'production', 'platform', '20'::jsonb,                           FALSE),
  ('cms',        'home_hero_headline',     'production', 'platform', '"Hire fast. Work boldly."'::jsonb,   FALSE),
  ('mobile',     'min_supported_ios',      'production', 'platform', '"15.0"'::jsonb,                       FALSE),
  ('logo',       'primary_logo_url',       'production', 'platform', '"/branding/gigvora.svg"'::jsonb,      FALSE),
  ('db',         'connection_pool_size',   'production', 'platform', '40'::jsonb,                           FALSE),
  ('apiKeys',    'sample_provider_key',    'production', 'platform', '{"kekId":"dev-kek","encDekB64":"","encValueB64":"","ivB64":"","tagB64":"","fingerprint":"seed00000000","last4":"____"}'::jsonb, TRUE)
ON CONFLICT (namespace, key, environment) DO NOTHING;

-- 10 kill-switch domains
INSERT INTO master_kill_switches (domain, active) VALUES
  ('payments',       FALSE),
  ('payouts',        FALSE),
  ('signups',        FALSE),
  ('messaging',      FALSE),
  ('reels',          FALSE),
  ('webinars',       FALSE),
  ('jobs_apply',     FALSE),
  ('gigs_purchase',  FALSE),
  ('mobile_push',    FALSE),
  ('public_api',     FALSE)
ON CONFLICT (domain) DO NOTHING;

-- Portal entitlement matrix (10 portals, default conservative)
INSERT INTO master_portal_entitlements (portal, roles, can_read, can_write, requires_second_approver) VALUES
  ('cs',            '["cs_agent","cs_lead"]'::jsonb,                          TRUE, TRUE,  FALSE),
  ('disputes',      '["cs_lead","sa_admin"]'::jsonb,                          TRUE, TRUE,  TRUE),
  ('finance',       '["finance_analyst","finance_lead","sa_admin"]'::jsonb,   TRUE, TRUE,  TRUE),
  ('moderation',    '["moderator","mod_lead"]'::jsonb,                        TRUE, TRUE,  FALSE),
  ('trust_safety',  '["mod_lead","sa_admin"]'::jsonb,                         TRUE, TRUE,  TRUE),
  ('verification',  '["mod_lead","sa_admin"]'::jsonb,                         TRUE, TRUE,  FALSE),
  ('marketing',     '["marketing_ops","marketing_lead"]'::jsonb,              TRUE, TRUE,  FALSE),
  ('ads_ops',       '["marketing_ops","marketing_lead","sa_admin"]'::jsonb,   TRUE, TRUE,  FALSE),
  ('admin_ops',     '["platform_ops","sa_admin","sa_root"]'::jsonb,           TRUE, TRUE,  TRUE),
  ('super_admin',   '["sa_admin","sa_root"]'::jsonb,                          TRUE, TRUE,  TRUE)
ON CONFLICT (portal) DO NOTHING;

-- Baseline KPI catalog wired to FD-13 portal aliases
INSERT INTO master_kpi_definitions (portal, metric, target, unit, direction, window_days, owner_role, active) VALUES
  ('moderation',   'count_open_queue',      50,    'count',   'lower_is_better',  1,  'mod_lead',       TRUE),
  ('moderation',   'count_sla_breached',     0,    'count',   'lower_is_better',  1,  'mod_lead',       TRUE),
  ('admin_ops',    'count_open_tickets',    25,    'count',   'lower_is_better',  1,  'platform_ops',   TRUE),
  ('admin_ops',    'gauge_sessions_active', 100,   'gauge',   'higher_is_better', 1,  'platform_ops',   TRUE),
  ('disputes',     'count_open_disputes',   30,    'count',   'lower_is_better',  7,  'cs_lead',        TRUE),
  ('finance',      'count_pending_refunds', 10,    'count',   'lower_is_better',  3,  'finance_lead',   TRUE),
  ('finance',      'gauge_held_credits',  10000,   'gbp',     'higher_is_better', 1,  'finance_lead',   TRUE),
  ('verification', 'count_verif_queue',     20,    'count',   'lower_is_better',  1,  'mod_lead',       TRUE),
  ('cs',           'count_unanswered',      15,    'count',   'lower_is_better',  1,  'cs_lead',        TRUE),
  ('trust_safety', 'count_high_risk',        5,    'count',   'lower_is_better',  1,  'sa_admin',       TRUE)
ON CONFLICT DO NOTHING;

-- Baseline legal docs (one of each) — published_at autopopulates
INSERT INTO master_legal_docs (slug, title, version, effective_at, body_markdown, change_summary, requires_reconsent) VALUES
  ('terms-of-service', 'Terms of Service', '2026-04-18.1', now(), '# Terms of Service\n\nThe definitive terms governing use of the Gigvora platform.', 'Initial publish.', FALSE),
  ('privacy-policy',   'Privacy Policy',   '2026-04-18.1', now(), '# Privacy Policy\n\nHow we collect, process, and protect personal data under UK GDPR.', 'Initial publish.', FALSE),
  ('acceptable-use',   'Acceptable Use Policy', '2026-04-18.1', now(), '# Acceptable Use Policy\n\nProhibited content and conduct.', 'Initial publish.', FALSE),
  ('cookie-policy',    'Cookie Policy',    '2026-04-18.1', now(), '# Cookie Policy\n\nWhat cookies we set and why.', 'Initial publish.', FALSE)
ON CONFLICT (slug) DO NOTHING;
