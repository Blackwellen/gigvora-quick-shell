/** Domain 71 — Trust & Safety / ML hooks (live API + fixture fallback). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  TsmlOverview, TsmlCase, TsmlCaseDetail, TsmlSignal, TsmlWatchlist, TsmlList,
} from '../../packages/sdk/src/trust-safety-ml';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/trust-safety-ml` : '';

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

const fxOverview: TsmlOverview = {
  kpis: { casesByStatus: { open: 3, reviewing: 1, escalated: 1 },
          casesByQueue: { triage: 1, review: 2, escalation: 2 },
          casesByBand: { critical: 2, high: 2, elevated: 1 },
          signalsByBand: { critical: 2, high: 2, elevated: 1 },
          signalsOpen: 6, slaBreached: 0, watchlist: { blocklist: 1, watchlist: 1 } },
  queues: { triage: [], review: [], escalation: [] },
  openSignals: [], watchlist: [],
  insights: [{ id: 'tsml_healthy', severity: 'success', title: 'Trust & Safety desk healthy.' }],
  riskScore: { score: 38, band: 'elevated', model: 'desk-risk-deterministic-v1',
               factors: { open: 4, escalated: 1, slaBreached: 0, criticalSignals: 2, highSignals: 2 } },
  computedAt: new Date().toISOString(),
};

export function useTsmlOverview() {
  return useQuery<TsmlOverview>({
    queryKey: ['tsml', 'overview'],
    queryFn: () => api<TsmlOverview>('/overview').catch(() => fxOverview),
    refetchInterval: 30_000,
  });
}
export function useTsmlSignals(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<TsmlList<TsmlSignal>>({
    queryKey: ['tsml', 'signals', qs.toString()],
    queryFn: () => api<TsmlList<TsmlSignal>>(`/signals?${qs}`).catch(() => ({
      items: [], total: 0, meta: { source: 'fixture', role: 'viewer', page: 1, pageSize: 25 } as any,
    })),
  });
}
export function useTsmlCreateSignal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<TsmlSignal>('/signals', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tsml'] }),
  });
}
export function useTsmlCases(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<TsmlList<TsmlCase>>({
    queryKey: ['tsml', 'cases', qs.toString()],
    queryFn: () => api<TsmlList<TsmlCase>>(`/cases?${qs}`).catch(() => ({
      items: [], total: 0, meta: { source: 'fixture', role: 'viewer', page: 1, pageSize: 25 } as any,
    })),
  });
}
export function useTsmlCase(id?: string) {
  return useQuery<TsmlCaseDetail>({
    queryKey: ['tsml', 'case', id], enabled: !!id,
    queryFn: () => api<TsmlCaseDetail>(`/cases/${id}`),
  });
}
export function useTsmlCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<TsmlCase>('/cases', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tsml'] }),
  });
}
export function useTsmlTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { caseId: string; to: string; note?: string }) =>
      api<TsmlCase>('/cases/transition', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tsml'] }),
  });
}
export function useTsmlAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { caseId: string; assigneeId: string | null; queue?: string }) =>
      api<TsmlCase>('/cases/assign', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tsml'] }),
  });
}
export function useTsmlClaimNext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queue: string = 'triage') =>
      api<{ claimed: TsmlCase | null }>('/cases/claim-next', { method: 'POST', body: JSON.stringify({ queue }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tsml'] }),
  });
}
export function useTsmlDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api('/cases/decide', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tsml'] }),
  });
}
export function useTsmlMlReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { caseId: string; agreed: boolean; note?: string }) =>
      api('/cases/ml-review', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tsml'] }),
  });
}
export function useTsmlWatchlist(filter: { listKind?: string; subjectKind?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<TsmlWatchlist[]>({
    queryKey: ['tsml', 'watchlist', qs.toString()],
    queryFn: () => api<TsmlWatchlist[]>(`/watchlist?${qs}`).catch(() => []),
  });
}
export function useTsmlAddWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<TsmlWatchlist>('/watchlist', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tsml'] }),
  });
}
export function useTsmlRemoveWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/watchlist/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tsml'] }),
  });
}
