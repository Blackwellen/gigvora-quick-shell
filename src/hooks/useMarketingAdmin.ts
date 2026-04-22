/** FD-15 Marketing Admin Portal hooks (live data). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/marketing-admin` : '';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!ROOT) throw new Error('api_unconfigured');
  const r = await fetch(`${ROOT}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'include',
  });
  if (!r.ok) throw new Error(`api_${r.status}`);
  return r.json() as Promise<T>;
}

// ── Ads moderation ─────
export interface AdRow {
  id: string; reference: string; advertiser: string; title: string; description?: string;
  format: 'image'|'video'|'text'; status: 'pending'|'approved'|'rejected'|'needs_changes'|'flagged';
  risk: 'low'|'medium'|'high'|'critical'; risk_score: number; flags: { code: string; severity: string }[];
  budget_cents: number; currency: string; submitted_at: string; landing_url?: string;
  audience?: string; placement?: string; preview?: string; ml_components?: any;
}
const FX_ADS: AdRow[] = [
  { id: 'fx-ad-1', reference: 'CR-2901', advertiser: 'PixelCraft Studio', title: 'Spring promo: 30% off all gigs', format: 'image', status: 'pending', risk: 'low',  risk_score: 12, flags: [], budget_cents: 84000, currency: 'GBP', submitted_at: new Date().toISOString() },
  { id: 'fx-ad-2', reference: 'CR-2900', advertiser: 'GrowthLab',         title: '2x ROI in 14 days — sales coaching',  format: 'video', status: 'pending', risk: 'high', risk_score: 78, flags: [{ code: 'unsubstantiated_claim', severity: 'high' }], budget_cents: 320000, currency: 'GBP', submitted_at: new Date().toISOString() },
];

export function useAdsQueue(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<{ items: AdRow[]; total: number }>({
    queryKey: ['mkt-admin', 'ads', qs.toString()],
    queryFn: () => api<{ items: AdRow[]; total: number }>(`/ads?${qs}`).catch(() => ({ items: FX_ADS, total: FX_ADS.length })),
  });
}
export function useAdsDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ids: string[]; action: 'approve'|'reject'|'flag'|'needs_changes'; reason: string }) =>
      api('/ads/decision', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mkt-admin', 'ads'] }),
  });
}
export function useScoreCreative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { advertiser: string; title: string; description?: string; landingUrl?: string; format: 'image'|'video'|'text'; budgetCents?: number }) =>
      api<{ ad: AdRow; ml: any }>('/ads/score', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mkt-admin', 'ads'] }),
  });
}

// ── Traffic ─────
export interface TrafficResp {
  kpis: { visitors: number; sessions: number; conversions: number; bot_hits: number; avg_duration_ms: number };
  sources: { source: string; visitors: number; hits: number }[];
  pages:    { page: string; visitors: number; avg_ms: number }[];
  countries:{ country: string; visitors: number }[];
  funnel:   { ctr: number; lead_rate: number; conversion_rate: number; health: string; insight: string; model: string };
}
const FX_TRAFFIC: TrafficResp = {
  kpis: { visitors: 142820, sessions: 198440, conversions: 4880, bot_hits: 3120, avg_duration_ms: 272000 },
  sources: [
    { source: 'direct',  visitors: 48420, hits: 62000 },
    { source: 'organic', visitors: 36180, hits: 51200 },
    { source: 'paid',    visitors: 22840, hits: 31500 },
    { source: 'social',  visitors: 12480, hits: 18800 },
  ],
  pages: [
    { page: '/',            visitors: 38420, avg_ms: 72000 },
    { page: '/jobs',        visitors: 18920, avg_ms: 262000 },
    { page: '/services',    visitors: 14260, avg_ms: 302000 },
  ],
  countries: [
    { country: 'United Kingdom', visitors: 41200 },
    { country: 'United States',  visitors: 38900 },
    { country: 'Germany',        visitors: 12400 },
  ],
  funnel: { ctr: 0.034, lead_rate: 0.07, conversion_rate: 0.11, health: 'healthy', insight: 'Funnel converting above target.', model: 'fixture' },
};
export function useTraffic(windowHours = 24) {
  return useQuery<TrafficResp>({
    queryKey: ['mkt-admin', 'traffic', windowHours],
    queryFn: () => api<TrafficResp>(`/traffic?windowHours=${windowHours}`).catch(() => FX_TRAFFIC),
    refetchInterval: 60_000,
  });
}

// ── IP intel ─────
export interface IpRow { ip: string; reputation: number; status: 'unknown'|'clean'|'watch'|'blocked'; flags: string[]; country?: string; hits_24h: number; unique_visitors_24h: number; last_seen_at?: string }
const FX_IPS: IpRow[] = [
  { ip: '185.220.101.5', reputation: 0.92, status: 'blocked', flags: ['tor','datacenter'], country: 'NL', hits_24h: 4180, unique_visitors_24h: 12 },
  { ip: '45.155.205.18', reputation: 0.78, status: 'watch',   flags: ['proxy'],            country: 'RU', hits_24h: 920,  unique_visitors_24h: 8 },
];
export function useIps() {
  return useQuery<{ items: IpRow[]; total: number }>({
    queryKey: ['mkt-admin', 'ips'],
    queryFn: () => api<{ items: IpRow[]; total: number }>(`/ips`).catch(() => ({ items: FX_IPS, total: FX_IPS.length })),
  });
}
export function useIpAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ips: string[]; action: 'watch'|'block'|'clear'; note?: string }) =>
      api('/ips/action', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mkt-admin', 'ips'] }),
  });
}

// ── Tasks ─────
export interface MktTask { id: string; reference: string; title: string; detail?: string; priority: 'low'|'normal'|'high'|'urgent'; status: 'open'|'in_progress'|'blocked'|'done'|'cancelled'; due_at?: string; assignee_id?: string; campaign_ref?: string; created_at: string }
const FX_TASKS: MktTask[] = [
  { id: 'fx-mt1', reference: 'MTSK-DEMO-1', title: 'Q4 SEO audit + sitemap regen', priority: 'high', status: 'open', created_at: new Date().toISOString() },
  { id: 'fx-mt2', reference: 'MTSK-DEMO-2', title: 'Approve holiday creative batch', priority: 'urgent', status: 'in_progress', created_at: new Date().toISOString() },
];
export function useMktTasks(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<{ items: MktTask[]; total: number }>({
    queryKey: ['mkt-admin', 'tasks', qs.toString()],
    queryFn: () => api<{ items: MktTask[]; total: number }>(`/tasks?${qs}`).catch(() => ({ items: FX_TASKS, total: FX_TASKS.length })),
  });
}
export function useMktCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; detail?: string; priority?: 'low'|'normal'|'high'|'urgent'; dueAt?: string }) =>
      api<MktTask>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mkt-admin', 'tasks'] }),
  });
}
export function useMktUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { taskId: string; patch: Record<string, unknown> }) =>
      api<MktTask>('/tasks', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mkt-admin', 'tasks'] }),
  });
}

// ── Notices ─────
export interface MktNotice { id: string; reference: string; title: string; body: string; audience: string; severity: 'info'|'warning'|'critical'; status: 'draft'|'published'|'expired'|'retracted'; published_at?: string }
const FX_NOTICES: MktNotice[] = [
  { id: 'fx-n1', reference: 'NT-0042', title: 'Holiday delivery delays', body: 'Some carriers report 2–4 day delays through 02 Jan.', audience: 'public', severity: 'warning', status: 'published', published_at: new Date().toISOString() },
];
export function useMktNotices() {
  return useQuery<{ items: MktNotice[]; total: number }>({
    queryKey: ['mkt-admin', 'notices'],
    queryFn: () => api<{ items: MktNotice[]; total: number }>(`/notices`).catch(() => ({ items: FX_NOTICES, total: FX_NOTICES.length })),
  });
}
export function useMktUpsertNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<MktNotice> & { title: string; body: string; audience: string; severity: string; status: string }) =>
      api<MktNotice>('/notices', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mkt-admin', 'notices'] }),
  });
}
