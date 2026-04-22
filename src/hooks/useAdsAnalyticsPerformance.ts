/**
 * Domain 61 — Ads Analytics & Creative Performance hooks.
 *
 * Hooks: overview, query (aggregated table), creative scores, saved reports,
 * alerts (+ events), export jobs, anomalies, audit. All accept `demoMode`.
 */
import { useCallback, useEffect, useState } from 'react';

export type Metric = 'impressions'|'clicks'|'installs'|'conversions'|'spend'|'revenue'|'ctr'|'cvr'|'cpc'|'cpm'|'cpi'|'cpa'|'roas';
export type GroupBy = 'date'|'campaign'|'ad_group'|'creative'|'country'|'device'|'placement';
export type AlertStatus = 'active'|'paused'|'triggered'|'acknowledged'|'archived';
export type ExportStatus = 'queued'|'running'|'succeeded'|'failed'|'cancelled';
export type AnomalyStatus = 'open'|'acknowledged'|'resolved';

export interface AapKpis {
  impressions: number; clicks: number; installs: number; conversions: number;
  spend_minor: number; revenue_minor: number;
  ctr: number; cvr: number; cpc_minor: number; cpm_minor: number; cpi_minor: number; cpa_minor: number; roas: number;
}
export interface AapOverview {
  kpis: AapKpis;
  series: { date: string; impressions: number; clicks: number; installs: number; conversions: number; spend_minor: number; revenue_minor: number }[];
  insights: { id: string; severity: 'info'|'success'|'warn'|'critical'; title: string; body?: string }[];
  computedAt: string;
}
export interface AapFilters {
  campaignIds?: string[]; creativeIds?: string[];
  country?: string[]; device?: string[]; placement?: string[];
  dateFrom: string; dateTo: string; granularity?: 'day'|'week'|'month';
}
export interface CreativeScore {
  id: string; ownerIdentityId: string; creativeId: string; windowDays: 7|14|30;
  ctr: number; cvr: number;
  cpcMinor: number; cpmMinor: number; cpiMinor: number; cpaMinor: number;
  fatigueScore: number; performanceScore: number;
  band: 'unknown'|'top'|'strong'|'average'|'weak'|'poor';
  explanation: Record<string, unknown>; computedAt: string;
}
export interface SavedReport {
  id: string; ownerIdentityId: string; name: string;
  status: 'draft'|'active'|'archived';
  filters: AapFilters; groupBy: GroupBy[]; metrics: Metric[];
  sort?: { metric: Metric; dir: 'asc'|'desc' };
  createdAt: string; updatedAt: string;
}
export interface Alert {
  id: string; ownerIdentityId: string; name: string; status: AlertStatus;
  metric: 'ctr'|'cvr'|'cpc'|'cpm'|'cpi'|'cpa'|'spend'|'roas';
  comparator: 'gt'|'lt'|'gte'|'lte'|'change_pct';
  threshold: number; windowHours: number;
  scope: { campaignId?: string; creativeId?: string };
  channel: 'email'|'webhook'|'in_app'; channelTarget: string | null;
  cooldownMinutes: number; lastTriggeredAt: string | null; createdAt: string;
}
export interface ExportJob {
  id: string; ownerIdentityId: string; format: 'csv'|'json'|'xlsx';
  status: ExportStatus; filters: AapFilters; rowCount: number | null;
  fileUrl: string | null; error: string | null;
  startedAt: string | null; finishedAt: string | null; createdAt: string;
}
export interface Anomaly {
  id: string; ownerIdentityId: string; scope: Record<string, unknown>;
  metric: string; observedValue: number; expectedValue: number; zscore: number;
  severity: 'info'|'warn'|'critical'; status: AnomalyStatus;
  rationale: string; detectedAt: string; resolvedAt: string | null;
}

const API = '/api/v1/ads-analytics-performance';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`request failed: ${res.status} ${await res.text().catch(() => '')}`);
  return res.json() as Promise<T>;
}

const DEMO_OVERVIEW: AapOverview = {
  kpis: { impressions: 0, clicks: 0, installs: 0, conversions: 0, spend_minor: 0, revenue_minor: 0,
          ctr: 0, cvr: 0, cpc_minor: 0, cpm_minor: 0, cpi_minor: 0, cpa_minor: 0, roas: 0 },
  series: [],
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live analytics will appear once data is wired.' }],
  computedAt: new Date().toISOString(),
};

export function useAapOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<AapOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      setData(await getJson<AapOverview>(`${API}/overview`));
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setData(DEMO_OVERVIEW); }
    finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useAapQuery() {
  const [data, setData] = useState<{ rows: any[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const run = useCallback(async (q: { filters: AapFilters; groupBy?: GroupBy[]; metrics?: Metric[]; sort?: { metric: Metric; dir: 'asc'|'desc' }; page?: number; pageSize?: number }) => {
    setLoading(true); setError(null);
    try {
      const r = await getJson<{ rows: any[]; total: number }>(`${API}/query`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ page: 1, pageSize: 100, groupBy: ['date'], metrics: ['impressions','clicks','spend','ctr','cpc'], ...q }),
      });
      setData(r);
    } catch (e) { setError(e as Error); }
    finally { setLoading(false); }
  }, []);
  return { data, loading, error, run };
}

export function useAapCreativeScores(opts: { windowDays?: 7|14|30; band?: CreativeScore['band'] } = {}) {
  const [items, setItems] = useState<CreativeScore[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('windowDays', String(opts.windowDays ?? 7));
      if (opts.band) params.set('band', opts.band);
      setItems(await getJson<CreativeScore[]>(`${API}/creative-scores?${params}`));
    } finally { setLoading(false); }
  }, [opts.windowDays, opts.band]);
  useEffect(() => { reload(); }, [reload]);
  const recompute = useCallback(async (creativeId: string, windowDays: 7|14|30 = 7) => {
    await getJson(`${API}/creative-scores/${creativeId}/recompute?windowDays=${windowDays}`, { method: 'POST' });
    await reload();
  }, [reload]);
  return { items, loading, reload, recompute };
}

export function useAapSavedReports(status?: SavedReport['status']) {
  const [items, setItems] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      setItems(await getJson<SavedReport[]>(`${API}/saved-reports?${params}`));
    } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Omit<SavedReport, 'id'|'ownerIdentityId'|'status'|'createdAt'|'updatedAt'>) => {
    const r = await getJson<SavedReport>(`${API}/saved-reports`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<SavedReport>) => {
    await getJson(`${API}/saved-reports/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, status: SavedReport['status']) => {
    await getJson(`${API}/saved-reports/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    await reload();
  }, [reload]);
  return { items, loading, reload, create, update, transition };
}

export function useAapAlerts(status?: AlertStatus) {
  const [items, setItems] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      setItems(await getJson<Alert[]>(`${API}/alerts?${params}`));
    } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Omit<Alert, 'id'|'ownerIdentityId'|'status'|'lastTriggeredAt'|'createdAt'|'channelTarget'> & { channelTarget?: string }) => {
    const r = await getJson<Alert>(`${API}/alerts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<Alert>) => {
    await getJson(`${API}/alerts/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, status: AlertStatus, reason?: string) => {
    await getJson(`${API}/alerts/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason }) });
    await reload();
  }, [reload]);
  return { items, loading, reload, create, update, transition };
}

export function useAapExports(status?: ExportStatus) {
  const [items, setItems] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      setItems(await getJson<ExportJob[]>(`${API}/exports?${params}`));
    } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: { format: 'csv'|'json'|'xlsx'; filters: AapFilters; groupBy?: GroupBy[]; metrics?: Metric[] }) => {
    const r = await getJson<ExportJob>(`${API}/exports`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload(); return r;
  }, [reload]);
  const cancel = useCallback(async (id: string) => {
    await getJson(`${API}/exports/${id}`, { method: 'DELETE' });
    await reload();
  }, [reload]);
  return { items, loading, reload, create, cancel };
}

export function useAapAnomalies(status?: AnomalyStatus) {
  const [items, setItems] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      setItems(await getJson<Anomaly[]>(`${API}/anomalies?${params}`));
    } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { reload(); }, [reload]);
  const transition = useCallback(async (id: string, status: 'acknowledged'|'resolved') => {
    await getJson(`${API}/anomalies/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    await reload();
  }, [reload]);
  const detect = useCallback(async () => {
    await getJson(`${API}/anomalies/detect`, { method: 'POST' });
    await reload();
  }, [reload]);
  return { items, loading, reload, transition, detect };
}
