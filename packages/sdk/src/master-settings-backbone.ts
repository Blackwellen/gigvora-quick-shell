/**
 * FD-17 — Master Settings Backbone (typed SDK).
 *
 * Single source of truth shared by NestJS (`/api/v1/master-settings/*`),
 * the React admin shell (`/admin/super/settings/*`) and the Flutter mobile
 * remote-config client. Every namespace below maps 1:1 to a physical settings
 * group surfaced in the Super-Admin terminal:
 *
 *   site       — public branding, default locale/timezone, robots posture
 *   finance    — fee splits, payout cadence, tax codes, FX policy
 *   notify     — channel rate caps, quiet hours, escalation matrix
 *   cms        — legal docs (Terms/Privacy/Cookies/DPA) + consent ledger
 *   mobile     — Flutter remote config, force-upgrade matrix, splash variant
 *   logo       — favicon + light/dark logo + OG defaults
 *   smtp       — outbound mail provider config (envelope-encrypted)
 *   connectors — third-party API keys (envelope-encrypted)
 *   apiKeys    — internal API keys (envelope-encrypted)
 *   db         — read-replica routing, retention, backup window
 *
 * Secret-bearing namespaces (smtp/connectors/apiKeys) are *envelope encrypted*
 * server-side: only KMS-decrypted values reach memory inside the NestJS
 * settings.secrets.service; the SDK never exposes plaintext.
 */

export type SettingsNamespace =
  | 'site' | 'finance' | 'notify' | 'cms' | 'mobile'
  | 'logo' | 'smtp' | 'connectors' | 'apiKeys' | 'db';

export type SettingsScope = 'platform' | 'tenant' | 'environment';
export type SettingsEnvironment = 'production' | 'staging' | 'preview' | 'all';

export interface SettingsEntry<V = unknown> {
  id: string;
  namespace: SettingsNamespace;
  key: string;
  value: V;
  scope: SettingsScope;
  environment: SettingsEnvironment;
  isSecret: boolean;
  /** When isSecret=true the SDK exposes only fingerprint + last 4 chars. */
  secretFingerprint?: string;
  secretLast4?: string;
  /** Two-person rule: pending change awaiting second approver. */
  pendingChange?: PendingSettingsChange;
  updatedAt: string;
  updatedBy?: string | null;
  version: number;
}

export interface PendingSettingsChange {
  id: string;
  proposedBy: string;
  proposedAt: string;
  reason: string;
  diff: { before: unknown; after: unknown };
  /** sa_admin or sa_root, must be different from proposedBy. */
  requiredApproverRole: 'sa_admin' | 'sa_root';
  expiresAt: string;
}

export interface SettingsBundle {
  namespace: SettingsNamespace;
  environment: SettingsEnvironment;
  entries: SettingsEntry[];
  fetchedAt: string;
  /** True when ANY entry is sealed by a kill-switch override. */
  sealedByKillSwitch: boolean;
}

/** ── CMS / legal ─────────────────────────────────────────────────────── */

export type LegalDocSlug = 'terms' | 'privacy' | 'cookies' | 'dpa' | 'aup' | 'community';
export interface LegalDoc {
  slug: LegalDocSlug;
  title: string;
  version: string;            // semver-ish: 2024.11.03
  effectiveAt: string;
  bodyMarkdown: string;
  changeSummary: string;
  publishedBy: string;
  requiresReConsent: boolean;
}
export interface ConsentRecord {
  id: string;
  userId: string;
  docSlug: LegalDocSlug;
  docVersion: string;
  acceptedAt: string;
  ip: string;
  userAgent: string;
  withdrawnAt?: string | null;
}

/** ── KPI assignment (binds FD-13 portal KPIs to internal portals) ────── */

export type KpiPortal = 'cs' | 'finance' | 'moderator' | 'marketing' | 'ops' | 'super';
export interface KpiDefinition {
  id: string;
  portal: KpiPortal;
  metric: string;             // e.g. "ticket_p95_seconds"
  target: number;
  unit: string;
  direction: 'lower_is_better' | 'higher_is_better';
  windowDays: number;
  ownerRole: string;
  active: boolean;
}
export interface KpiSnapshot {
  kpiId: string;
  observedAt: string;
  value: number;
  status: 'green' | 'amber' | 'red';
  trend: 'up' | 'flat' | 'down';
}

/** ── Portal entitlement matrix ───────────────────────────────────────── */

export type AdminRole =
  | 'viewer' | 'sa_operator' | 'sa_admin' | 'sa_root'
  | 'cs_agent' | 'cs_lead' | 'finance_analyst' | 'finance_lead'
  | 'moderator' | 'mod_lead' | 'marketing_ops' | 'marketing_lead'
  | 'platform_ops' | 'incident_commander';

export interface PortalEntitlement {
  portal: KpiPortal | 'audit' | 'dispute' | 'incidents';
  roles: AdminRole[];
  canRead: boolean;
  canWrite: boolean;
  /** Two-person rule kicks in when set. */
  requiresSecondApprover?: boolean;
}

/** ── Internal role lifecycle ─────────────────────────────────────────── */

export type RoleAccountStatus = 'active' | 'frozen' | 'pending_mfa' | 'archived';
export interface InternalRoleAccount {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  roles: AdminRole[];
  status: RoleAccountStatus;
  mfaEnrolled: boolean;
  lastSignInAt?: string | null;
  frozenAt?: string | null;
  frozenBy?: string | null;
  freezeReason?: string | null;
  mintedBy?: string | null;
  mintedAt: string;
}

/** ── Kill-switch matrix ──────────────────────────────────────────────── */

export type KillSwitchDomain =
  | 'payments' | 'payouts' | 'signups' | 'messaging'
  | 'reels' | 'webinars' | 'jobs_apply' | 'gigs_purchase'
  | 'mobile_push' | 'public_api';

export interface KillSwitchState {
  domain: KillSwitchDomain;
  active: boolean;
  reason?: string;
  activatedBy?: string | null;
  activatedAt?: string | null;
  expectedClearedAt?: string | null;
  /** Forces requestor + a different sa_root to flip. */
  requiresTwoPersonRule: true;
}

export interface KillSwitchMatrix {
  switches: KillSwitchState[];
  computedAt: string;
}
