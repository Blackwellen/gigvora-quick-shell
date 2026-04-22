/** Domain 70 — Moderator Dashboard hooks (live API + fixture fallback). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ModOverview, ModItem, ModItemDetail, MessagingIncident, ModMacro, ModList,
} from '../../packages/sdk/src/moderator-dashboard';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/moderator-dashboard` : '';

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

const fxOverview: ModOverview = {
  kpis: { byStatus: { open: 3, triaging: 1, escalated: 1 },
          byQueue: { triage: 1, review: 3, escalation: 1, messaging_incident: 1 },
          bySeverity: { high: 3, critical: 2, normal: 1 }, slaBreached: 0,
          messagingByStatus: { pending: 3 } },
  queues: { triage: [], review: [], escalation: [] },
  messagingIncidents: [],
  insights: [{ id: 'mod_healthy', severity: 'success', title: 'Moderation desk healthy.' }],
  riskScore: { score: 32, band: 'normal', model: 'deterministic-v1',
               factors: { open: 4, escalated: 1, slaBreached: 0, pendingIncidents: 3 } },
  computedAt: new Date().toISOString(),
};

export function useModOverview() {
  return useQuery<ModOverview>({
    queryKey: ['mod', 'overview'],
    queryFn: () => api<ModOverview>('/overview').catch(() => fxOverview),
    refetchInterval: 30_000,
  });
}
export function useModItems(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<ModList<ModItem>>({
    queryKey: ['mod', 'items', qs.toString()],
    queryFn: () => api<ModList<ModItem>>(`/items?${qs}`).catch(() => ({
      items: [], total: 0, meta: { source: 'fixture', role: 'viewer', page: 1, pageSize: 25 } as any,
    })),
  });
}
export function useModItem(id?: string) {
  return useQuery<ModItemDetail>({
    queryKey: ['mod', 'item', id], enabled: !!id,
    queryFn: () => api<ModItemDetail>(`/items/${id}`),
  });
}
export function useModCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<ModItem>('/items', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mod'] }),
  });
}
export function useModTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { itemId: string; to: string; note?: string }) =>
      api<ModItem>('/items/transition', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mod'] }),
  });
}
export function useModAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { itemId: string; assigneeId: string | null; queue?: string }) =>
      api<ModItem>('/items/assign', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mod'] }),
  });
}
export function useModClaimNext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queue: string = 'triage') =>
      api<{ claimed: ModItem | null }>('/items/claim-next', { method: 'POST', body: JSON.stringify({ queue }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mod'] }),
  });
}
export function useModAct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api('/items/act', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mod'] }),
  });
}
export function useModBulkAct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { itemIds: string[]; action: string; rationale: string }) =>
      api('/items/bulk-act', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mod'] }),
  });
}
export function useModMessagingIncidents(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<ModList<MessagingIncident>>({
    queryKey: ['mod', 'messaging-incidents', qs.toString()],
    queryFn: () => api<ModList<MessagingIncident>>(`/messaging-incidents?${qs}`).catch(() => ({
      items: [], total: 0, meta: { source: 'fixture', role: 'viewer', page: 1, pageSize: 25 } as any,
    })),
  });
}
export function useModReviewIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { incidentId: string; to: string; rationale?: string }) =>
      api<MessagingIncident>('/messaging-incidents/review', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mod'] }),
  });
}
export function useModMacros() {
  return useQuery<ModMacro[]>({
    queryKey: ['mod', 'macros'],
    queryFn: () => api<ModMacro[]>('/macros').catch(() => []),
  });
}
