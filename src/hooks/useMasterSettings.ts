/**
 * useMasterSettings — TanStack Query hooks for the FD-17 master-settings
 * control plane. Routes go through `/api/v1/master-settings`. Every hook
 * ships deterministic seed data so the super-admin surface never blanks.
 *
 * Two-person rule: write hooks may return `{ status: 'pending_two_person',
 * pendingChangeId }`. A second sa_admin/sa_root must approve to commit.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1/master-settings${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`master-settings ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export type SettingsNamespace =
  | 'site' | 'finance' | 'notify' | 'cms' | 'mobile'
  | 'logo' | 'smtp' | 'connectors' | 'apiKeys' | 'db';
export type AdminRole =
  | 'viewer' | 'sa_operator' | 'sa_admin' | 'sa_root'
  | 'cs_agent' | 'cs_lead' | 'finance_analyst' | 'finance_lead'
  | 'moderator' | 'mod_lead' | 'marketing_ops' | 'marketing_lead'
  | 'platform_ops' | 'incident_commander';
export type KillSwitchDomain =
  | 'payments' | 'payouts' | 'signups' | 'messaging' | 'reels'
  | 'webinars' | 'jobs_apply' | 'gigs_purchase' | 'mobile_push' | 'public_api';

export interface SettingsEntry {
  id: string; namespace: SettingsNamespace; key: string; value: unknown;
  environment: 'production' | 'staging' | 'preview' | 'all';
  scope: 'platform' | 'tenant' | 'environment'; isSecret: boolean;
  secretFingerprint?: string; secretLast4?: string;
  version: number; updatedAt: string; updatedBy?: string | null;
}
export interface KpiDefinition {
  id: string; portal: string; metric: string; target: number; unit: string;
  direction: 'lower_is_better' | 'higher_is_better';
  windowDays: number; ownerRole: string; active: boolean;
}
export interface PortalEntitlement {
  portal: string; roles: AdminRole[]; canRead: boolean; canWrite: boolean;
  requiresSecondApprover: boolean;
}
export interface InternalAccount {
  id: string; userId: string; email: string; displayName: string;
  roles: AdminRole[]; status: 'active' | 'pending_mfa' | 'frozen';
  mfaEnrolled: boolean; mintedAt: string; frozenAt?: string | null; freezeReason?: string | null;
}
export interface KillSwitch {
  domain: KillSwitchDomain; active: boolean; reason?: string;
  activatedBy?: string; activatedAt?: string; expectedClearedAt?: string;
}
export interface LegalDoc {
  slug: string; title: string; version: string; effectiveAt: string;
  bodyMarkdown: string; changeSummary: string; requiresReConsent: boolean; publishedAt: string;
}
export interface AuditEntry {
  id: string; actorId: string; actorRole?: string; domain: string;
  action: string; targetId?: string; ip?: string; diff?: Record<string, unknown>; at: string;
}

function seed(ns: SettingsNamespace, key: string, value: unknown): SettingsEntry {
  return { id: `${ns}-${key}`, namespace: ns, key, value, environment: 'production',
    scope: 'platform', isSecret: false, version: 1, updatedAt: new Date().toISOString() };
}
function seedSecret(ns: SettingsNamespace, key: string, last4: string): SettingsEntry {
  return { id: `${ns}-${key}`, namespace: ns, key, value: { fingerprint: 'seed00000000', last4 },
    environment: 'production', scope: 'platform', isSecret: true,
    secretFingerprint: 'seed00000000', secretLast4: last4, version: 1, updatedAt: new Date().toISOString() };
}
const SEED_BUNDLE: Record<SettingsNamespace, SettingsEntry[]> = {
  site:    [seed('site','platform_name','Gigvora'), seed('site','support_email','support@gigvora.com'), seed('site','maintenance_mode',false)],
  finance: [seed('finance','commission_rate_default',0.10), seed('finance','payout_min_threshold',50), seed('finance','currency_default','GBP')],
  notify:  [seed('notify','email_per_user_per_day',20), seed('notify','push_quiet_hours','22:00-07:00')],
  cms:     [seed('cms','home_hero_headline','Hire fast. Work boldly.'), seed('cms','home_hero_subhead','The marketplace built for senior talent.')],
  mobile:  [seed('mobile','min_supported_ios','15.0'), seed('mobile','min_supported_android','11')],
  logo:    [seed('logo','primary_logo_url','/branding/gigvora.svg')],
  smtp:    [seedSecret('smtp','sendgrid_api_key','sg-AB12')],
  connectors: [seedSecret('connectors','slack_webhook_url','oolt')],
  apiKeys: [seedSecret('apiKeys','openai_api_key','k-9981')],
  db:      [seed('db','connection_pool_size',40)],
};
const SEED_KPIS: KpiDefinition[] = [
  { id: 'kpi_001', portal: 'moderation', metric: 'count_open_queue', target: 50, unit: 'count', direction: 'lower_is_better', windowDays: 1, ownerRole: 'mod_lead', active: true },
  { id: 'kpi_002', portal: 'moderation', metric: 'count_sla_breached', target: 0, unit: 'count', direction: 'lower_is_better', windowDays: 1, ownerRole: 'mod_lead', active: true },
  { id: 'kpi_003', portal: 'admin_ops', metric: 'count_open_tickets', target: 25, unit: 'count', direction: 'lower_is_better', windowDays: 1, ownerRole: 'platform_ops', active: true },
  { id: 'kpi_004', portal: 'admin_ops', metric: 'gauge_sessions_active', target: 100, unit: 'gauge', direction: 'higher_is_better', windowDays: 1, ownerRole: 'platform_ops', active: true },
  { id: 'kpi_005', portal: 'disputes', metric: 'count_open_disputes', target: 30, unit: 'count', direction: 'lower_is_better', windowDays: 7, ownerRole: 'cs_lead', active: true },
  { id: 'kpi_006', portal: 'finance', metric: 'count_pending_refunds', target: 10, unit: 'count', direction: 'lower_is_better', windowDays: 3, ownerRole: 'finance_lead', active: true },
  { id: 'kpi_007', portal: 'verification', metric: 'count_verif_queue', target: 20, unit: 'count', direction: 'lower_is_better', windowDays: 1, ownerRole: 'mod_lead', active: true },
];
const SEED_ENT: PortalEntitlement[] = [
  { portal: 'cs',           roles: ['cs_agent','cs_lead'],                          canRead: true, canWrite: true,  requiresSecondApprover: false },
  { portal: 'disputes',     roles: ['cs_lead','sa_admin'],                          canRead: true, canWrite: true,  requiresSecondApprover: true  },
  { portal: 'finance',      roles: ['finance_analyst','finance_lead','sa_admin'],   canRead: true, canWrite: true,  requiresSecondApprover: true  },
  { portal: 'moderation',   roles: ['moderator','mod_lead'],                        canRead: true, canWrite: true,  requiresSecondApprover: false },
  { portal: 'trust_safety', roles: ['mod_lead','sa_admin'],                         canRead: true, canWrite: true,  requiresSecondApprover: true  },
  { portal: 'verification', roles: ['mod_lead','sa_admin'],                         canRead: true, canWrite: true,  requiresSecondApprover: false },
  { portal: 'marketing',    roles: ['marketing_ops','marketing_lead'],              canRead: true, canWrite: true,  requiresSecondApprover: false },
  { portal: 'ads_ops',      roles: ['marketing_ops','marketing_lead','sa_admin'],   canRead: true, canWrite: true,  requiresSecondApprover: false },
  { portal: 'admin_ops',    roles: ['platform_ops','sa_admin','sa_root'],           canRead: true, canWrite: true,  requiresSecondApprover: true  },
  { portal: 'super_admin',  roles: ['sa_admin','sa_root'],                          canRead: true, canWrite: true,  requiresSecondApprover: true  },
];
const SEED_ACCOUNTS: InternalAccount[] = [
  { id: 'acc-1', userId: 'u-1', email: 'a.fenton@gigvora.com', displayName: 'A. Fenton', roles: ['sa_root'],  status: 'active', mfaEnrolled: true,  mintedAt: new Date().toISOString() },
  { id: 'acc-2', userId: 'u-2', email: 'r.kahan@gigvora.com',  displayName: 'R. Kahan',  roles: ['sa_admin'], status: 'active', mfaEnrolled: true,  mintedAt: new Date().toISOString() },
  { id: 'acc-3', userId: 'u-3', email: 's.osei@gigvora.com',   displayName: 'S. Osei',   roles: ['sa_admin'], status: 'active', mfaEnrolled: true,  mintedAt: new Date().toISOString() },
  { id: 'acc-4', userId: 'u-4', email: 'l.park@gigvora.com',   displayName: 'L. Park',   roles: ['finance_lead'], status: 'active', mfaEnrolled: true, mintedAt: new Date().toISOString() },
];
const SEED_KILL: KillSwitch[] = (['payments','payouts','signups','messaging','reels','webinars','jobs_apply','gigs_purchase','mobile_push','public_api'] as KillSwitchDomain[])
  .map((d) => ({ domain: d, active: false }));
const SEED_LEGAL: LegalDoc[] = [
  { slug: 'terms-of-service', title: 'Terms of Service', version: '2026-04-18.1', effectiveAt: new Date().toISOString(), bodyMarkdown: '', changeSummary: 'Initial publish.', requiresReConsent: false, publishedAt: new Date().toISOString() },
  { slug: 'privacy-policy',   title: 'Privacy Policy',   version: '2026-04-18.1', effectiveAt: new Date().toISOString(), bodyMarkdown: '', changeSummary: 'Initial publish.', requiresReConsent: false, publishedAt: new Date().toISOString() },
  { slug: 'acceptable-use',   title: 'Acceptable Use Policy', version: '2026-04-18.1', effectiveAt: new Date().toISOString(), bodyMarkdown: '', changeSummary: 'Initial publish.', requiresReConsent: false, publishedAt: new Date().toISOString() },
  { slug: 'cookie-policy',    title: 'Cookie Policy',    version: '2026-04-18.1', effectiveAt: new Date().toISOString(), bodyMarkdown: '', changeSummary: 'Initial publish.', requiresReConsent: false, publishedAt: new Date().toISOString() },
];

export function useSettingsBundle(namespace: SettingsNamespace, env: string = 'production') {
  return useQuery({
    queryKey: ['ms.bundle', namespace, env],
    queryFn: async () => {
      try { const r = await api<{ entries: SettingsEntry[]; sealedByKillSwitch: boolean }>(`/bundle?namespace=${namespace}&env=${env}`);
            return r.entries?.length ? r : { entries: SEED_BUNDLE[namespace] ?? [], sealedByKillSwitch: false }; }
      catch { return { entries: SEED_BUNDLE[namespace] ?? [], sealedByKillSwitch: false }; }
    },
    placeholderData: { entries: SEED_BUNDLE[namespace] ?? [], sealedByKillSwitch: false },
  });
}
export function useUpsertEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { namespace: SettingsNamespace; key: string; value: unknown; environment?: string; scope?: string; isSecret?: boolean; reason?: string }) =>
      api<{ status: 'committed' | 'pending_two_person'; entry?: SettingsEntry; pendingChangeId?: string }>(`/entry`, {
        method: 'PATCH', body: JSON.stringify({ environment: 'production', scope: 'platform', ...dto }),
      }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['ms.bundle', vars.namespace] }),
  });
}
export function useApprovePendingChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api(`/changes/${id}/approve`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ms.bundle'] }),
  });
}
export function useRejectPendingChange() {
  return useMutation({
    mutationFn: async (vars: { id: string; reason: string }) =>
      api(`/changes/${vars.id}/reject`, { method: 'POST', body: JSON.stringify({ reason: vars.reason }) }),
  });
}
export function useKpis(portal?: string) {
  return useQuery({
    queryKey: ['ms.kpis', portal ?? ''],
    queryFn: async () => {
      try { const r = await api<KpiDefinition[]>(`/kpis${portal ? `?portal=${portal}` : ''}`);
            return r.length ? r : SEED_KPIS.filter((k) => !portal || k.portal === portal); }
      catch { return SEED_KPIS.filter((k) => !portal || k.portal === portal); }
    },
    placeholderData: SEED_KPIS,
  });
}
export function useUpsertKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<KpiDefinition>) => api<KpiDefinition>(`/kpis`, { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ms.kpis'] }),
  });
}
export function useEntitlements() {
  return useQuery({
    queryKey: ['ms.entitlements'],
    queryFn: async () => { try { const r = await api<PortalEntitlement[]>(`/entitlements`); return r.length ? r : SEED_ENT; } catch { return SEED_ENT; } },
    placeholderData: SEED_ENT,
  });
}
export function useUpdateEntitlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: PortalEntitlement) => api<PortalEntitlement>(`/entitlements`, { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ms.entitlements'] }),
  });
}
export function useInternalAccounts() {
  return useQuery({
    queryKey: ['ms.accounts'],
    queryFn: async () => { try { const r = await api<InternalAccount[]>(`/roles/accounts`); return r.length ? r : SEED_ACCOUNTS; } catch { return SEED_ACCOUNTS; } },
    placeholderData: SEED_ACCOUNTS,
  });
}
export function useMintAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { email: string; displayName: string; roles: AdminRole[]; requireMfa: boolean }) =>
      api<InternalAccount>(`/roles/mint`, { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ms.accounts'] }),
  });
}
export function useFreezeAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; reason: string }) =>
      api<InternalAccount>(`/roles/${vars.id}/freeze`, { method: 'POST', body: JSON.stringify({ reason: vars.reason }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ms.accounts'] }),
  });
}
export function useUnfreezeAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api<InternalAccount>(`/roles/${id}/unfreeze`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ms.accounts'] }),
  });
}
export function useKillSwitches() {
  return useQuery({
    queryKey: ['ms.killSwitches'],
    queryFn: async () => { try { const r = await api<{ switches: KillSwitch[] }>(`/kill-switches`); return r.switches?.length ? r.switches : SEED_KILL; } catch { return SEED_KILL; } },
    placeholderData: SEED_KILL, refetchInterval: 60_000,
  });
}
export function useActivateKill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { domain: KillSwitchDomain; reason: string; expectedClearedAt?: string }) =>
      api(`/kill-switches/${vars.domain}/activate`, { method: 'POST', body: JSON.stringify({ reason: vars.reason, expectedClearedAt: vars.expectedClearedAt }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ms.killSwitches'] }),
  });
}
export function useClearKill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (domain: KillSwitchDomain) => api(`/kill-switches/${domain}/clear`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ms.killSwitches'] }),
  });
}
export function useLegalDocs() {
  return useQuery({
    queryKey: ['ms.legal'],
    queryFn: async () => { try { const r = await api<LegalDoc[]>(`/legal`); return r.length ? r : SEED_LEGAL; } catch { return SEED_LEGAL; } },
    placeholderData: SEED_LEGAL,
  });
}
export function usePublishLegal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<LegalDoc>) => api<LegalDoc>(`/legal`, { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ms.legal'] }),
  });
}
export function useRecordConsent() {
  return useMutation({
    mutationFn: async (dto: { userId: string; docSlug: string; docVersion: string }) =>
      api(`/consent`, { method: 'POST', body: JSON.stringify(dto) }),
  });
}
export function useAuditLog(opts: { domain?: string; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (opts.domain) qs.set('domain', opts.domain);
  if (opts.limit)  qs.set('limit', String(opts.limit));
  return useQuery({
    queryKey: ['ms.audit', opts.domain ?? '', opts.limit ?? 100],
    queryFn: async () => { try { return await api<AuditEntry[]>(`/audit?${qs.toString()}`); } catch { return [] as AuditEntry[]; } },
    placeholderData: [],
  });
}
