/** Domain 68 — Finance Admin React Query hooks (live API + fixture fallback). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  FinOverview, FinRefund, FinHold, FinControl, FinLedgerEntry, FinList,
} from '../../packages/sdk/src/finance-admin';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/finance-admin` : '';

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

const fxOverview: FinOverview = {
  kpis: {
    refunds: { pending: { count: 4, amountMinor: 19000 }, succeeded: { count: 8, amountMinor: 42000 } },
    holds:   { active:  { count: 2, amountMinor: 75000 } },
    ledger30d: [],
  },
  controls: [], recentRefunds: [], holds: [],
  insights: [{ id: 'fin_healthy', severity: 'success', title: 'Finance posture healthy.' }],
  riskScore: { score: 22, band: 'normal', model: 'deterministic-v1', factors: { pendingRefunds: 4, failedRefunds: 0, activeHolds: 2 } },
  computedAt: new Date().toISOString(),
};

export function useFinOverview() {
  return useQuery<FinOverview>({
    queryKey: ['fin', 'overview'],
    queryFn: () => api<FinOverview>('/overview').catch(() => fxOverview),
  });
}
export function useFinRefunds(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<FinList<FinRefund>>({
    queryKey: ['fin', 'refunds', qs.toString()],
    queryFn: () => api<FinList<FinRefund>>(`/refunds?${qs}`).catch(() => ({
      items: [], total: 0, meta: { source: 'fixture', role: 'viewer', page: 1, pageSize: 25 } as any,
    })),
  });
}
export function useFinRefund(id?: string) {
  return useQuery<FinRefund>({
    queryKey: ['fin', 'refund', id], enabled: !!id,
    queryFn: () => api<FinRefund>(`/refunds/${id}`),
  });
}
export function useFinHolds(status?: string) {
  return useQuery<{ items: FinHold[] }>({
    queryKey: ['fin', 'holds', status ?? 'all'],
    queryFn: () => api<{ items: FinHold[] }>(`/holds${status ? `?status=${status}` : ''}`).catch(() => ({ items: [] })),
  });
}
export function useFinControls() {
  return useQuery<{ items: FinControl[] }>({
    queryKey: ['fin', 'controls'],
    queryFn: () => api<{ items: FinControl[] }>('/controls').catch(() => ({ items: [] })),
  });
}
export function useFinLedger(account?: string) {
  return useQuery<{ items: FinLedgerEntry[] }>({
    queryKey: ['fin', 'ledger', account ?? 'all'],
    queryFn: () => api<{ items: FinLedgerEntry[] }>(`/ledger${account ? `?account=${account}` : ''}`).catch(() => ({ items: [] })),
  });
}

export function useFinCreateRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<FinRefund>('/refunds', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fin'] }),
  });
}
export function useFinTransitionRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { refundId: string; to: string; note?: string }) =>
      api<FinRefund>('/refunds/transition', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fin'] }),
  });
}
export function useFinCreateHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<FinHold>('/holds', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fin', 'holds'] }),
  });
}
export function useFinReleaseHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { holdId: string; note?: string }) =>
      api<FinHold>('/holds/release', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fin', 'holds'] }),
  });
}
export function useFinSetControl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<FinControl>('/controls', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fin', 'controls'] }),
  });
}
