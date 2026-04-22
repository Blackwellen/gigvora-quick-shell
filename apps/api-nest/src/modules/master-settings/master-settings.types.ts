/** Mirrors packages/sdk/src/master-settings-backbone.ts; kept duplicated so
 * NestJS doesn't take an SDK dep cycle. Update both in lock-step. */
export type SettingsNamespace =
  | 'site' | 'finance' | 'notify' | 'cms' | 'mobile'
  | 'logo' | 'smtp' | 'connectors' | 'apiKeys' | 'db';
export type SettingsScope = 'platform' | 'tenant' | 'environment';
export type SettingsEnvironment = 'production' | 'staging' | 'preview' | 'all';
export type AdminRole =
  | 'viewer' | 'sa_operator' | 'sa_admin' | 'sa_root'
  | 'cs_agent' | 'cs_lead' | 'finance_analyst' | 'finance_lead'
  | 'moderator' | 'mod_lead' | 'marketing_ops' | 'marketing_lead'
  | 'platform_ops' | 'incident_commander';
export type KillSwitchDomain =
  | 'payments' | 'payouts' | 'signups' | 'messaging'
  | 'reels' | 'webinars' | 'jobs_apply' | 'gigs_purchase'
  | 'mobile_push' | 'public_api';

/** Namespaces where the two-person rule is mandatory. */
export const TWO_PERSON_NAMESPACES: ReadonlySet<SettingsNamespace> = new Set([
  'smtp', 'connectors', 'apiKeys', 'finance',
]);

/** Namespaces whose values are envelope-encrypted at rest. */
export const SECRET_NAMESPACES: ReadonlySet<SettingsNamespace> = new Set([
  'smtp', 'connectors', 'apiKeys',
]);
