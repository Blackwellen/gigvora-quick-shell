/** Domain 73 — Verification & Compliance hooks (live API + fixture fallback). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  VcOverview, VcCase, VcCaseDetail, VcWatchlistEntry, VcList,
} from '../../packages/sdk/src/verification-compliance';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/verification-compliance` : '';

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

const fxOverview: VcOverview = {
  kpis: {
    casesByStatus:  { pending: 1, reviewing: 2, holding: 1, escalated: 2, approved: 1 },
    casesByQueue:   { triage: 1, review: 3, escalation: 2 },
    casesByBand:    { critical: 2, high: 1, elevated: 1, normal: 2 },
    casesByProgram: { kyc: 1, kyb: 1, aml: 1, sanctions: 1, right_to_work: 1, professional_licence: 1, address: 1 },
    slaBreached: 1, expiringSoon: 0, watchlist: 2,
  },
  queues: { triage: [], review: [], escalation: [] },
  watchlist: [],
  insights: [{ id: 'sla_breached', severity: 'critical', title: '1 verification case past SLA — work them now.' }],
  deskRisk: { score: 38, band: 'elevated', model: 'vc-desk-risk-v1', factors: { sla_breached: 1, critical: 2, high: 1 } },
  computedAt: new Date().toISOString(),
};

export function useVerificationOverview() {
  return useQuery<VcOverview>({
    queryKey: ['verification-compliance', 'overview'],
    queryFn: () => api<VcOverview>('/overview').catch(() => fxOverview),
    refetchInterval: 30_000,
  });
}
export function useVerificationCases(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<VcList<VcCase>>({
    queryKey: ['verification-compliance', 'cases', qs.toString()],
    queryFn: () => api<VcList<VcCase>>(`/cases?${qs}`).catch(() => ({
      items: [], total: 0, meta: { source: 'fixture', role: 'viewer', page: 1, pageSize: 25 } as any,
    })),
  });
}
export function useVerificationCase(id?: string) {
  return useQuery<VcCaseDetail>({
    queryKey: ['verification-compliance', 'case', id], enabled: !!id,
    queryFn: () => api<VcCaseDetail>(`/cases/${id}`),
  });
}
export function useVerificationCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<VcCase>('/cases', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-compliance'] }),
  });
}
export function useVerificationTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { caseId: string; to: string; note?: string }) =>
      api<VcCase>('/cases/transition', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-compliance'] }),
  });
}
export function useVerificationAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { caseId: string; assigneeId: string | null; queue?: string }) =>
      api<VcCase>('/cases/assign', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-compliance'] }),
  });
}
export function useVerificationClaimNext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queue: string = 'triage') =>
      api<{ claimed: VcCase | null }>('/cases/claim-next', { method: 'POST', body: JSON.stringify({ queue }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-compliance'] }),
  });
}
export function useVerificationDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api('/cases/decide', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-compliance'] }),
  });
}
export function useVerificationAddDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api('/documents', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-compliance'] }),
  });
}
export function useVerificationReviewDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { documentId: string; status: 'accepted' | 'rejected' | 'expired' }) =>
      api('/documents/review', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-compliance'] }),
  });
}
export function useVerificationRunCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { caseId: string; provider: string; checkType: string }) =>
      api('/checks/run', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-compliance'] }),
  });
}
export function useVerificationWatchlist(filter: { subjectKind?: string; severity?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<VcWatchlistEntry[]>({
    queryKey: ['verification-compliance', 'watchlist', qs.toString()],
    queryFn: () => api<VcWatchlistEntry[]>(`/watchlist?${qs}`).catch(() => []),
  });
}
export function useVerificationAddWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<VcWatchlistEntry>('/watchlist', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-compliance'] }),
  });
}
export function useVerificationRemoveWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/watchlist/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-compliance'] }),
  });
}
