/**
 * Domain 67 — Customer Service hooks.
 * Live API + UI-preserving fixture fallbacks so the dashboard never blanks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CsOverview, CsList, CsDetail, CsTicket, CsMacro, CsPrioritySuggestion,
} from '../../packages/sdk/src/customer-service';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/customer-service` : '';

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

const fxOverview: CsOverview = {
  kpis: { byStatus: { pending: 12, active: 8, resolved: 34, escalated: 2 },
          byPriority: { urgent: 1, high: 5, normal: 14 },
          breaches: 1, csat: { avg: 4.3, count: 22 } },
  queues: [{ status: 'pending', count: 12 }, { status: 'active', count: 8 }],
  recent: [], insights: [{ id: 'cs_healthy', severity: 'success', title: 'Customer service posture healthy.' }],
  computedAt: new Date().toISOString(),
};

export function useCsOverview() {
  return useQuery<CsOverview>({
    queryKey: ['cs', 'overview'],
    queryFn: () => api<CsOverview>('/overview').catch(() => fxOverview),
  });
}
export function useCsTickets(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<CsList>({
    queryKey: ['cs', 'tickets', qs.toString()],
    queryFn: () => api<CsList>(`/tickets?${qs}`).catch(() => ({
      items: [], total: 0,
      meta: { source: 'fixture', role: 'customer' as const, page: 1, pageSize: 25 },
    })),
  });
}
export function useCsTicket(id?: string) {
  return useQuery<CsDetail>({
    queryKey: ['cs', 'ticket', id],
    enabled: !!id,
    queryFn: () => api<CsDetail>(`/tickets/${id}`),
  });
}
export function useCsMacros() {
  return useQuery<{ items: CsMacro[] }>({
    queryKey: ['cs', 'macros'],
    queryFn: () => api<{ items: CsMacro[] }>('/macros').catch(() => ({ items: [] })),
  });
}
export function useCsCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<CsTicket>('/tickets', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cs'] }),
  });
}
export function useCsUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ticketId: string; patch: Record<string, unknown> }) =>
      api<CsTicket>('/tickets', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cs'] }),
  });
}
export function useCsTransitionTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ticketId: string; to: string; note?: string }) =>
      api<CsTicket>('/tickets/transition', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cs'] }),
  });
}
export function useCsPostMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ticketId: string; body: string; visibility?: 'public' | 'internal'; attachments?: any[] }) =>
      api('/messages', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['cs', 'ticket', vars.ticketId] }),
  });
}
export function useCsSuggestPriority() {
  return useMutation({
    mutationFn: (body: { subject: string; body?: string }) =>
      api<CsPrioritySuggestion>('/suggest-priority', { method: 'POST', body: JSON.stringify(body) }),
  });
}
