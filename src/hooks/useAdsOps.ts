/** Domain 72 — Ads Ops hooks (live API + fixture fallback). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdsOpsOverview, AdsOpsReview, AdsOpsReviewDetail, AdsOpsCampaignControl,
  AdsOpsGeoRule, AdsOpsKeywordRule, AdsOpsList,
} from '../../packages/sdk/src/ads-ops';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/ads-ops` : '';

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

const fxOverview: AdsOpsOverview = {
  kpis: {
    reviewsByStatus: { pending: 2, reviewing: 1, holding: 1, approved: 1 },
    reviewsByQueue: { triage: 1, review: 2, escalation: 1 },
    reviewsByBand: { critical: 2, high: 1, normal: 1 },
    slaBreached: 0,
    campaignControls: { paused: 1 },
    geoRules: 4, keywordRules: 6,
  },
  queues: { triage: [], review: [], escalation: [] },
  campaignControls: [],
  insights: [{ id: 'ads_ops_healthy', severity: 'success', title: 'Ads Ops desk healthy.' }],
  computedAt: new Date().toISOString(),
};

export function useAdsOpsOverview() {
  return useQuery<AdsOpsOverview>({
    queryKey: ['ads-ops', 'overview'],
    queryFn: () => api<AdsOpsOverview>('/overview').catch(() => fxOverview),
    refetchInterval: 30_000,
  });
}
export function useAdsOpsReviews(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<AdsOpsList<AdsOpsReview>>({
    queryKey: ['ads-ops', 'reviews', qs.toString()],
    queryFn: () => api<AdsOpsList<AdsOpsReview>>(`/reviews?${qs}`).catch(() => ({
      items: [], total: 0, meta: { source: 'fixture', role: 'viewer', page: 1, pageSize: 25 } as any,
    })),
  });
}
export function useAdsOpsReview(id?: string) {
  return useQuery<AdsOpsReviewDetail>({
    queryKey: ['ads-ops', 'review', id], enabled: !!id,
    queryFn: () => api<AdsOpsReviewDetail>(`/reviews/${id}`),
  });
}
export function useAdsOpsCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<AdsOpsReview>('/reviews', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads-ops'] }),
  });
}
export function useAdsOpsTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { reviewId: string; to: string; note?: string }) =>
      api<AdsOpsReview>('/reviews/transition', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads-ops'] }),
  });
}
export function useAdsOpsAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { reviewId: string; assigneeId: string | null; queue?: string }) =>
      api<AdsOpsReview>('/reviews/assign', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads-ops'] }),
  });
}
export function useAdsOpsClaimNext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queue: string = 'triage') =>
      api<{ claimed: AdsOpsReview | null }>('/reviews/claim-next', { method: 'POST', body: JSON.stringify({ queue }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads-ops'] }),
  });
}
export function useAdsOpsDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api('/reviews/decide', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads-ops'] }),
  });
}
export function useAdsOpsCampaignControls() {
  return useQuery<AdsOpsCampaignControl[]>({
    queryKey: ['ads-ops', 'campaign-controls'],
    queryFn: () => api<AdsOpsCampaignControl[]>('/campaign-controls').catch(() => []),
  });
}
export function useAdsOpsSetCampaignControl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<AdsOpsCampaignControl>('/campaign-controls', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads-ops'] }),
  });
}
export function useAdsOpsGeoRules(filter: { scope?: string; scopeId?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<AdsOpsGeoRule[]>({
    queryKey: ['ads-ops', 'geo-rules', qs.toString()],
    queryFn: () => api<AdsOpsGeoRule[]>(`/geo-rules?${qs}`).catch(() => []),
  });
}
export function useAdsOpsAddGeoRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<AdsOpsGeoRule>('/geo-rules', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads-ops'] }),
  });
}
export function useAdsOpsRemoveGeoRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/geo-rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads-ops'] }),
  });
}
export function useAdsOpsKeywordRules(filter: { scope?: string; scopeId?: string; q?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<AdsOpsKeywordRule[]>({
    queryKey: ['ads-ops', 'keyword-rules', qs.toString()],
    queryFn: () => api<AdsOpsKeywordRule[]>(`/keyword-rules?${qs}`).catch(() => []),
  });
}
export function useAdsOpsAddKeywordRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<AdsOpsKeywordRule>('/keyword-rules', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads-ops'] }),
  });
}
export function useAdsOpsRemoveKeywordRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/keyword-rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads-ops'] }),
  });
}
