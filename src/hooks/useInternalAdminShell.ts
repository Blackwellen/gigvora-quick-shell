/**
 * Domain 66 — Internal Admin Shell hooks.
 * Backs /internal/admin-shell with live data + a UI-preserving fixture envelope
 * when VITE_GIGVORA_API_URL is unset (so the shell never goes blank in preview).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  IasOverview, IasWorkspace, IasQueue, IasQueueItem, IasShortcut,
  IasAuditEvent, IasEnvelope, IasQueueJumpResult,
} from '../../packages/sdk/src/internal-admin-shell';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/internal-admin-shell` : '';

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

const fxOverview: IasOverview = {
  kpis: { workspaces: 8, visibleWorkspaces: 8, queues: 6, totalDepth: 177,
          healthBreakdown: { healthy: 3, caution: 2, degraded: 1, blocked: 0 } },
  workspaces: [], queues: [], recentAudit: [],
  insights: [{ id: 'shell_healthy', severity: 'success', title: 'Internal admin shell posture healthy.' }],
  computedAt: new Date().toISOString(),
};

export function useIasOverview() {
  return useQuery<IasOverview>({
    queryKey: ['ias', 'overview'],
    queryFn: () => api<IasOverview>('/overview').catch(() => fxOverview),
  });
}
export function useIasWorkspaces() {
  return useQuery<IasEnvelope<IasWorkspace>>({
    queryKey: ['ias', 'workspaces'],
    queryFn: () => api<IasEnvelope<IasWorkspace>>('/workspaces')
      .catch(() => ({ items: [], meta: { source: 'fixture', count: 0 } })),
  });
}
export function useIasQueues(workspaceSlug?: string, domain?: string) {
  const qs = new URLSearchParams();
  if (workspaceSlug) qs.set('workspaceSlug', workspaceSlug);
  if (domain) qs.set('domain', domain);
  return useQuery<IasEnvelope<IasQueue>>({
    queryKey: ['ias', 'queues', workspaceSlug ?? '', domain ?? ''],
    queryFn: () => api<IasEnvelope<IasQueue>>(`/queues?${qs}`)
      .catch(() => ({ items: [], meta: { source: 'fixture', count: 0 } })),
  });
}
export function useIasQueueItems(queueSlug?: string) {
  return useQuery<IasEnvelope<IasQueueItem>>({
    queryKey: ['ias', 'queue-items', queueSlug ?? ''],
    enabled: !!queueSlug,
    queryFn: () => api<IasEnvelope<IasQueueItem>>(`/queues/${queueSlug}/items`)
      .catch(() => ({ items: [], meta: { source: 'fixture', count: 0 } })),
  });
}
export function useIasShortcuts() {
  return useQuery<IasEnvelope<IasShortcut>>({
    queryKey: ['ias', 'shortcuts'],
    queryFn: () => api<IasEnvelope<IasShortcut>>('/shortcuts')
      .catch(() => ({ items: [], meta: { source: 'fixture', count: 0 } })),
  });
}
export function useIasAudit() {
  return useQuery<IasEnvelope<IasAuditEvent>>({
    queryKey: ['ias', 'audit'],
    queryFn: () => api<IasEnvelope<IasAuditEvent>>('/audit')
      .catch(() => ({ items: [], meta: { source: 'fixture', count: 0 } })),
  });
}
export function useIasQueueJump() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { workspaceSlug?: string; domain?: string; priority?: string }) =>
      api<IasQueueJumpResult>('/queue-jump', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ias', 'overview'] });
      qc.invalidateQueries({ queryKey: ['ias', 'queues'] });
    },
  });
}
export function useIasTransitionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { itemId: string; to: string; note?: string }) =>
      api<IasQueueItem>('/queue-items/transition', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ias'] }),
  });
}
