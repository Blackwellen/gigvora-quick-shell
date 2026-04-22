/**
 * Domain 60 — Ads Manager (campaigns, builder, creatives, routing) hooks.
 *
 * Hooks: overview, campaigns (list/get/create/update/transition), creatives
 * (list/get/create/update/transition), ad groups + creative attachment,
 * routing rules, metrics, search, audit. All accept `demoMode`.
 */
import { useCallback, useEffect, useState } from 'react';

export type CampaignStatus = 'draft' | 'in_review' | 'approved' | 'active' | 'paused' | 'completed' | 'archived' | 'rejected';
export type CreativeStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'archived';
export type AdGroupStatus  = 'draft' | 'active' | 'paused' | 'archived';
export type CreativeFormat = 'image' | 'video' | 'carousel' | 'html5' | 'text';

export interface Campaign {
  id: string; ownerIdentityId: string; name: string; objective: string;
  status: CampaignStatus; budgetMinor: number; dailyBudgetMinor: number;
  spentMinor: number; currency: string;
  startAt: string | null; endAt: string | null;
  routingRules: Record<string, unknown>;
  qualityScore: number | null; rejectionReason: string | null;
  approvedByIdentityId: string | null; approvedAt: string | null;
  createdAt: string; updatedAt: string;
}
export interface Creative {
  id: string; ownerIdentityId: string; name: string; format: CreativeFormat;
  status: CreativeStatus; assetUrl: string | null; thumbnailUrl: string | null;
  headline: string | null; body: string | null; cta: string | null;
  destinationUrl: string | null; width: number | null; height: number | null;
  durationSec: number | null; fileSizeBytes: number | null;
  moderationScore: number | null; moderationFlags: string[];
  rejectionReason: string | null; createdAt: string; updatedAt: string;
}
export interface AdGroup {
  id: string; campaignId: string; name: string; status: AdGroupStatus;
  bidStrategy: 'cpc' | 'cpm' | 'cpa' | 'target_cpa'; bidAmountMinor: number;
  targeting: Record<string, unknown>;
}
export interface RoutingRule {
  id: string; campaignId: string; priority: number;
  conditionType: 'geo' | 'device' | 'language' | 'audience' | 'time' | 'placement';
  conditionValue: Record<string, unknown>;
  action: 'include' | 'exclude' | 'boost' | 'cap';
  actionValue: Record<string, unknown>; isActive: boolean;
}
export interface AmbOverview {
  kpis: { total: number; active: number; paused: number; inReview: number; rejected: number; spentMinor: number; budgetMinor: number };
  recentCampaigns: Campaign[];
  topByPerformance: { campaignId: string; name: string; status: string; totals: { impressions: number; clicks: number; conversions: number; spend_minor: number } }[];
  insights: { id: string; severity: 'info' | 'success' | 'warn' | 'error'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/ads-manager-builder';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

const DEMO_OVERVIEW: AmbOverview = {
  kpis: { total: 0, active: 0, paused: 0, inReview: 0, rejected: 0, spentMinor: 0, budgetMinor: 0 },
  recentCampaigns: [], topByPerformance: [],
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live data will appear once the API is wired.' }],
  computedAt: new Date().toISOString(),
};

export function useAmbOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<AmbOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      setData(await getJson<AmbOverview>(`${API}/overview`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO_OVERVIEW);
    } finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useAmbCampaigns(filter: { status?: CampaignStatus; objective?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.objective) params.set('objective', filter.objective);
      const r = await getJson<{ items: Campaign[] }>(`${API}/campaigns?${params}`);
      setItems(r.items);
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setItems([]); }
    finally { setLoading(false); }
  }, [filter.status, filter.objective, opts?.demoMode]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<Campaign> & { name: string; objective: string; budgetMinor: number }) => {
    const r = await getJson<Campaign>(`${API}/campaigns`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<Campaign>) => {
    await getJson(`${API}/campaigns/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, status: CampaignStatus, reason?: string) => {
    await getJson(`${API}/campaigns/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason }) });
    await reload();
  }, [reload]);
  return { items, loading, error, reload, create, update, transition };
}

export function useAmbCampaign(id: string | null) {
  const [data, setData] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!id) { setData(null); setLoading(false); return; }
    setLoading(true);
    try { setData(await getJson<Campaign>(`${API}/campaigns/${id}`)); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function useAmbCreatives(filter: { format?: CreativeFormat; status?: CreativeStatus; q?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.format) params.set('format', filter.format);
      if (filter.status) params.set('status', filter.status);
      if (filter.q) params.set('q', filter.q);
      setItems(await getJson<Creative[]>(`${API}/creatives?${params}`));
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setItems([]); }
    finally { setLoading(false); }
  }, [filter.format, filter.status, filter.q, opts?.demoMode]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<Creative> & { name: string; format: CreativeFormat }) => {
    const r = await getJson<Creative>(`${API}/creatives`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<Creative>) => {
    await getJson(`${API}/creatives/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, status: CreativeStatus, reason?: string) => {
    await getJson(`${API}/creatives/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason }) });
    await reload();
  }, [reload]);
  return { items, loading, error, reload, create, update, transition };
}

export function useAmbAdGroups(campaignId: string | null) {
  const [items, setItems] = useState<AdGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    if (!campaignId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try { setItems(await getJson<AdGroup[]>(`${API}/campaigns/${campaignId}/ad-groups`)); }
    finally { setLoading(false); }
  }, [campaignId]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<AdGroup> & { name: string; bidAmountMinor: number }) => {
    if (!campaignId) throw new Error('campaignId required');
    const r = await getJson<AdGroup>(`${API}/campaigns/${campaignId}/ad-groups`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload(); return r;
  }, [campaignId, reload]);
  const transition = useCallback(async (id: string, status: AdGroupStatus, reason?: string) => {
    await getJson(`${API}/ad-groups/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason }) });
    await reload();
  }, [reload]);
  const attach = useCallback(async (adGroupId: string, creativeId: string, weight = 100) => {
    if (!campaignId) throw new Error('campaignId required');
    await getJson(`${API}/campaigns/${campaignId}/ad-groups/${adGroupId}/creatives`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ creativeId, weight }),
    });
    await reload();
  }, [campaignId, reload]);
  const detach = useCallback(async (adGroupId: string, creativeId: string) => {
    if (!campaignId) throw new Error('campaignId required');
    await getJson(`${API}/campaigns/${campaignId}/ad-groups/${adGroupId}/creatives/${creativeId}`, { method: 'DELETE' });
    await reload();
  }, [campaignId, reload]);
  return { items, loading, reload, create, transition, attach, detach };
}

export function useAmbRoutingRules(campaignId: string | null) {
  const [items, setItems] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    if (!campaignId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try { setItems(await getJson<RoutingRule[]>(`${API}/campaigns/${campaignId}/routing-rules`)); }
    finally { setLoading(false); }
  }, [campaignId]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Omit<RoutingRule, 'id' | 'campaignId'>) => {
    if (!campaignId) throw new Error('campaignId required');
    await getJson(`${API}/campaigns/${campaignId}/routing-rules`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [campaignId, reload]);
  const remove = useCallback(async (ruleId: string) => {
    if (!campaignId) throw new Error('campaignId required');
    await getJson(`${API}/campaigns/${campaignId}/routing-rules/${ruleId}`, { method: 'DELETE' });
    await reload();
  }, [campaignId, reload]);
  return { items, loading, reload, create, remove };
}

export function useAmbMetrics(campaignId: string | null, range?: { from?: string; to?: string }) {
  const [data, setData] = useState<{ series: any[]; totals: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!campaignId) { setData(null); setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (range?.from) params.set('from', range.from);
      if (range?.to) params.set('to', range.to);
      setData(await getJson(`${API}/campaigns/${campaignId}/metrics?${params}`));
    } finally { setLoading(false); }
  }, [campaignId, range?.from, range?.to]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function useAmbSearch(q: { q?: string; subjectType?: 'campaign' | 'creative' } = {}) {
  const [data, setData] = useState<{ items: any[]; page: number; pageSize: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.q) params.set('q', q.q);
      if (q.subjectType) params.set('subjectType', q.subjectType);
      setData(await getJson(`${API}/search?${params}`));
    } finally { setLoading(false); }
  }, [q.q, q.subjectType]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}
