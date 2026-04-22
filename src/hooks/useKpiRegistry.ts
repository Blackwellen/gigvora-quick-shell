/** FD-13 — KPI registry hooks (super-admin builder + portal cards). */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const URL  = (p: string) => (BASE ? `${BASE}/api/v1/kpi-registry${p}` : '');

interface FetchOpts extends RequestInit { signal?: AbortSignal }
async function http<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = URL(path); if (!url) throw new Error('api_offline');
  const r = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) }, ...opts });
  if (!r.ok) throw new Error(`http_${r.status}`);
  return r.json();
}

export interface KpiDef {
  id: string; title: string; target_type: string; value_mode: string;
  unset_state: string; metric_key: string; format: string; unit: string | null;
  decimals: number; target_value: number | null; status: string;
  description: string | null; assignments?: { portal: string; position: number }[];
}

export interface KpiCard {
  id: string; title: string; format: string; unit: string | null; decimals: number;
  target_type: string; value_mode: string; unset_state: string; metric_key: string;
  position: number; visibility: string; target_value: number | null;
  latest: { value: number; prev_value: number | null; delta_pct: number | null; bucket_at: string } | null;
}

export function useKpis(opts: { portal?: string; status?: string } = {}) {
  return useQuery<KpiDef[]>({
    queryKey: ['kpis', opts],
    queryFn: () => http<KpiDef[]>(`?${new URLSearchParams(opts as any).toString()}`),
    staleTime: 30_000,
  });
}

export function useKpiPortalCards(portal: string) {
  return useQuery<KpiCard[]>({
    queryKey: ['kpi-portal-cards', portal],
    queryFn: () => http<KpiCard[]>(`/portal/${portal}/cards`),
    refetchInterval: 60_000,
  });
}

export function useKpiSeries(id: string, bucket: 'hour'|'day'|'week'|'month' = 'day', limit = 90) {
  return useQuery<{ bucket_at: string; value: number; prev_value: number | null; delta_pct: number | null }[]>({
    queryKey: ['kpi-series', id, bucket, limit],
    queryFn: () => http(`/${id}/series?bucket=${bucket}&limit=${limit}`),
    enabled: !!id,
  });
}

export function useCreateKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<KpiDef>) => http<KpiDef>('', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpis'] }),
  });
}

export function useUpdateKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<KpiDef> }) =>
      http<KpiDef>(`/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpis'] }),
  });
}

export function useAssignKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, portal, position = 0 }: { id: string; portal: string; position?: number }) =>
      http(`/${id}/assign`, { method: 'POST', body: JSON.stringify({ portal, position, visibility: 'all' }) }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['kpis'] });
      qc.invalidateQueries({ queryKey: ['kpi-portal-cards', v.portal] });
    },
  });
}

export function useEvaluateAllKpis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => http<{ evaluated: number; written: number }>('/evaluate-all', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpi-portal-cards'] }),
  });
}

/** Format a KPI value honouring format/unit/decimals + unset_state. */
export function formatKpiValue(card: { format: string; unit: string | null; decimals: number; unset_state: string; latest: KpiCard['latest'] }) {
  const v = card.latest?.value;
  if (v == null) {
    if (card.unset_state === 'dash') return '—';
    if (card.unset_state === 'zero') return '0';
    if (card.unset_state === 'placeholder') return '·';
    return '—';
  }
  const n = Number(v);
  const fixed = n.toFixed(card.decimals);
  if (card.format === 'currency') return `${card.unit ?? '$'}${fixed}`;
  if (card.format === 'percent')  return `${fixed}%`;
  if (card.format === 'duration') return `${fixed}${card.unit ?? 'd'}`;
  return Number(fixed).toLocaleString();
}
