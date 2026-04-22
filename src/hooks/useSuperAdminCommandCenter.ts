/** Domain 74 — Super Admin Command Center hooks (live API + fixture fallback). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  SaOverview, FeatureFlag, PlatformOverride, PlatformIncident, SaAuditEvent, SaList,
} from '../../packages/sdk/src/super-admin-command-center';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/super-admin-command-center` : '';

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

const fxOverview: SaOverview = {
  kpis: {
    flagsByStatus: { active: 3, draft: 1, paused: 1 },
    overridesByStatus: { active: 3, paused: 1 },
    overridesByKind: { rate_limit: 1, cost_cap: 1, rollout: 1 },
    incidentsByStatus: { open: 1, mitigated: 1 },
    openIncidentsBySev: { sev2: 1 },
    auditEvents24h: 42, killSwitchesActive: 0,
  },
  flagsActive: [], overridesActive: [], openIncidents: [], recentAudit: [],
  insights: [{ id: 'sev2_open', severity: 'warn', title: '1 sev2 incident(s) open.' }],
  computedAt: new Date().toISOString(),
};

export function useSaOverview() {
  return useQuery<SaOverview>({
    queryKey: ['super-admin', 'overview'],
    queryFn: () => api<SaOverview>('/overview').catch(() => fxOverview),
    refetchInterval: 30_000,
  });
}
export function useSaFlags(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<SaList<FeatureFlag>>({
    queryKey: ['super-admin', 'flags', qs.toString()],
    queryFn: () => api<SaList<FeatureFlag>>(`/flags?${qs}`).catch(() => ({
      items: [], total: 0, meta: { source: 'fixture', role: 'viewer', page: 1, pageSize: 25 } as any,
    })),
  });
}
export function useSaCreateFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<FeatureFlag>('/flags', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin'] }),
  });
}
export function useSaUpdateFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<FeatureFlag>('/flags', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin'] }),
  });
}
export function useSaToggleFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; enabled: boolean }) =>
      api<FeatureFlag>('/flags/toggle', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin'] }),
  });
}
export function useSaRolloutFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; rolloutPct: number }) =>
      api<FeatureFlag>('/flags/rollout', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin'] }),
  });
}
export function useSaSetFlagStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; status: string }) =>
      api<FeatureFlag>('/flags/status', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin'] }),
  });
}

export function useSaOverrides(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<SaList<PlatformOverride>>({
    queryKey: ['super-admin', 'overrides', qs.toString()],
    queryFn: () => api<SaList<PlatformOverride>>(`/overrides?${qs}`).catch(() => ({
      items: [], total: 0, meta: { source: 'fixture', role: 'viewer', page: 1, pageSize: 25 } as any,
    })),
  });
}
export function useSaCreateOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<PlatformOverride>('/overrides', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin'] }),
  });
}
export function useSaUpdateOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<PlatformOverride>('/overrides', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin'] }),
  });
}

export function useSaIncidents(status?: string) {
  return useQuery<PlatformIncident[]>({
    queryKey: ['super-admin', 'incidents', status ?? ''],
    queryFn: () => api<PlatformIncident[]>(`/incidents${status ? `?status=${status}` : ''}`).catch(() => []),
  });
}
export function useSaCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<PlatformIncident>('/incidents', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin'] }),
  });
}
export function useSaTransitionIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; to: string; notes?: string }) =>
      api<PlatformIncident>('/incidents/transition', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin'] }),
  });
}

export function useSaAudit(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<{ items: SaAuditEvent[]; total: number }>({
    queryKey: ['super-admin', 'audit', qs.toString()],
    queryFn: () => api<{ items: SaAuditEvent[]; total: number }>(`/audit?${qs}`).catch(() => ({ items: [], total: 0 })),
  });
}
