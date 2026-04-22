/**
 * React Query hooks for Sales Navigator.
 * Defaults to live API; falls back to empty envelopes so the UI never blanks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API = (import.meta as any).env?.VITE_API_BASE_URL ?? '/api/v1';
const ROOT = `${API}/sales-navigator`;

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${ROOT}${path}`, { credentials: 'include' });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch { return fallback; }
}
async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${ROOT}${path}`, {
    method: 'POST', credentials: 'include',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${path} ${r.status}`);
  return r.json() as Promise<T>;
}
async function patch<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${ROOT}${path}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${path} ${r.status}`);
  return r.json() as Promise<T>;
}

export const useSnOverview = () =>
  useQuery({ queryKey: ['sn', 'overview'], queryFn: () => get(`/overview`, { data: {}, meta: {} }) });

export const useSnLeads = (filters: Record<string, any> = {}) =>
  useQuery({
    queryKey: ['sn', 'leads', filters],
    queryFn: () => get(`/leads?${new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v != null && v !== '').reduce((a, [k, v]) => ({ ...a, [k]: String(v) }), {}),
    )}`, { items: [], meta: { count: 0, page: 1, page_size: 25 } }),
  });

export const useSnLead = (id: string) =>
  useQuery({ queryKey: ['sn', 'lead', id], queryFn: () => get(`/leads/${id}`, null as any), enabled: !!id });

export const useCreateSnLead = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: any) => post(`/leads`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sn', 'leads'] }) });
};
export const useUpdateSnLead = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: any }) => patch(`/leads/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sn'] }) });
};
export const useSaveSnLead = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => post(`/leads/${id}/save`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sn', 'leads'] }) });
};

export const useSnLists = () =>
  useQuery({ queryKey: ['sn', 'lists'], queryFn: () => get(`/lists`, { items: [] }) });
export const useCreateSnList = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: any) => post(`/lists`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sn', 'lists'] }) });
};

export const useSnSequences = () =>
  useQuery({ queryKey: ['sn', 'sequences'], queryFn: () => get(`/sequences`, { items: [] }) });
export const useCreateSnSequence = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: any) => post(`/sequences`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sn', 'sequences'] }) });
};

export const useSnActivities = (leadId?: string) =>
  useQuery({ queryKey: ['sn', 'activities', leadId],
    queryFn: () => get(`/activities${leadId ? `?lead_id=${leadId}` : ''}`, { items: [] }) });
export const useCreateSnActivity = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: any) => post(`/activities`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sn', 'activities'] }) });
};

export const useSnGoals = () =>
  useQuery({ queryKey: ['sn', 'goals'], queryFn: () => get(`/goals`, { items: [] }) });
export const useCreateSnGoal = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: any) => post(`/goals`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sn', 'goals'] }) });
};

export const useSnSignals = (filters: Record<string, any> = {}) =>
  useQuery({
    queryKey: ['sn', 'signals', filters],
    queryFn: () => get(`/signals?${new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v != null).reduce((a, [k, v]) => ({ ...a, [k]: String(v) }), {}),
    )}`, { items: [] }),
  });

export const useSnAccountSearch = (q: string) =>
  useQuery({ queryKey: ['sn', 'accounts', q], queryFn: () => get(`/accounts/search?q=${encodeURIComponent(q)}`, { items: [] }), enabled: q.length >= 2 });

export const useSnSeats = (workspaceId?: string) =>
  useQuery({ queryKey: ['sn', 'seats', workspaceId],
    queryFn: () => get(`/seats?workspace_id=${workspaceId ?? ''}`, { items: [] }), enabled: !!workspaceId });
export const useInviteSnSeat = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: any) => post(`/seats`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sn', 'seats'] }) });
};
