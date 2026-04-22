/** FD-16 — CS delegated tasks hooks. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export interface CsTask {
  id: string; reference: string; title: string; detail?: string | null;
  assignee_id?: string | null; ticket_id?: string | null;
  priority: 'low'|'normal'|'high'|'urgent';
  status: 'open'|'in_progress'|'blocked'|'done'|'cancelled';
  due_at?: string | null; created_at: string;
}

const FX: CsTask[] = [
  { id: 'fx-t1', reference: 'TSK-DEMO-1', title: 'Verify ID for CS-9176 reinstatement',  priority: 'high',   status: 'in_progress', created_at: new Date().toISOString() },
  { id: 'fx-t2', reference: 'TSK-DEMO-2', title: 'Refund batch reconciliation',           priority: 'normal', status: 'open',        created_at: new Date().toISOString() },
  { id: 'fx-t3', reference: 'TSK-DEMO-3', title: 'Draft macro for EU payments delay',     priority: 'high',   status: 'open',        created_at: new Date().toISOString() },
];

export function useCsTasks(filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<{ items: CsTask[]; total: number }>({
    queryKey: ['cs', 'tasks', qs.toString()],
    queryFn: () => api<{ items: CsTask[]; total: number }>(`/tasks?${qs}`).catch(() => ({ items: FX, total: FX.length })),
  });
}
export function useCsCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; detail?: string; priority?: string; dueAt?: string }) =>
      api<CsTask>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cs', 'tasks'] }),
  });
}
export function useCsUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { taskId: string; patch: Record<string, unknown> }) =>
      api<CsTask>('/tasks', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cs', 'tasks'] }),
  });
}
