/** Domain 69 — Dispute Ops React Query hooks (live API + fixture fallback). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DisputeOverview, DisputeCase, DisputeCaseDetail, DisputeList,
} from '../../packages/sdk/src/dispute-ops';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/dispute-ops` : '';

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

const fxOverview: DisputeOverview = {
  kpis: { byStatus: { pending: 2, mediation: 1, arbitration: 1 },
          byQueue: { triage: 2, mediation: 2, arbitration: 1 },
          bySeverity: { high: 2, normal: 1, critical: 1 }, slaBreached: 0 },
  queues: { triage: [], mediation: [], arbitration: [] },
  insights: [{ id: 'dop_healthy', severity: 'success', title: 'Dispute desk healthy.' }],
  riskScore: { score: 28, band: 'normal', model: 'deterministic-v1',
               factors: { open: 4, escalated: 0, slaBreached: 0 } },
  computedAt: new Date().toISOString(),
};

export function useDopOverview() {
  return useQuery<DisputeOverview>({
    queryKey: ['dop', 'overview'],
    queryFn: () => api<DisputeOverview>('/overview').catch(() => fxOverview),
  });
}
export function useDopCases(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<DisputeList<DisputeCase>>({
    queryKey: ['dop', 'cases', qs.toString()],
    queryFn: () => api<DisputeList<DisputeCase>>(`/cases?${qs}`).catch(() => ({
      items: [], total: 0, meta: { source: 'fixture', role: 'viewer', page: 1, pageSize: 25 } as any,
    })),
  });
}
export function useDopCase(id?: string) {
  return useQuery<DisputeCaseDetail>({
    queryKey: ['dop', 'case', id], enabled: !!id,
    queryFn: () => api<DisputeCaseDetail>(`/cases/${id}`),
  });
}
export function useDopCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<DisputeCase>('/cases', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dop'] }),
  });
}
export function useDopTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { caseId: string; to: string; note?: string }) =>
      api<DisputeCase>('/cases/transition', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dop'] }),
  });
}
export function useDopAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { caseId: string; assigneeId: string | null; queue?: string }) =>
      api<DisputeCase>('/cases/assign', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dop'] }),
  });
}
export function useDopClaimNext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queue: string = 'triage') =>
      api<{ claimed: DisputeCase | null }>('/cases/claim-next', { method: 'POST', body: JSON.stringify({ queue }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dop'] }),
  });
}
export function useDopPostMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api('/messages', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (_d, vars: any) => qc.invalidateQueries({ queryKey: ['dop', 'case', vars.caseId] }),
  });
}
export function useDopAddEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api('/evidence', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (_d, vars: any) => qc.invalidateQueries({ queryKey: ['dop', 'case', vars.caseId] }),
  });
}
export function useDopOpenArbitration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api('/arbitration/open', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dop'] }),
  });
}
export function useDopDecideArbitration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api('/arbitration/decide', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dop'] }),
  });
}
