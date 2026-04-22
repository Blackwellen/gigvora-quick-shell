/**
 * Domain 56 — Resource Planning, Utilization, Capacity & Assignment hooks.
 *
 * Hooks: overview (KPIs + utilization grid), resources (CRUD), projects (CRUD + status),
 * assignments (CRUD + state transitions), time-off, utilization grid, ML recommendations.
 * All hooks support `demoMode` for UI stability during the mock → live transition.
 */
import { useCallback, useEffect, useState } from 'react';

export type ResourceStatus = 'active' | 'inactive';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type AssignmentStatus = 'draft' | 'proposed' | 'confirmed' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type TimeOffKind = 'pto' | 'sick' | 'holiday' | 'other';

export interface RpuResource {
  id: string; fullName: string; email: string; role: string; team: string | null;
  location: string | null; timezone: string; costRate: string | null; billRate: string | null;
  weeklyCapacityHours: number; skills: string[]; status: ResourceStatus;
  createdAt: string; updatedAt: string;
}
export interface RpuProject {
  id: string; name: string; code: string; clientName: string | null;
  startDate: string | null; endDate: string | null; budgetHours: number | null;
  status: ProjectStatus; createdAt: string; updatedAt: string;
}
export interface RpuAssignment {
  id: string; resourceId: string; projectId: string; role: string | null;
  startDate: string; endDate: string; hoursPerWeek: string;
  status: AssignmentStatus; notes: string | null; cancelledReason: string | null;
  createdAt: string; updatedAt: string;
}
export interface RpuUtilizationRow {
  resource_id: string; full_name: string; team: string | null;
  weekly_capacity_hours: number; capacity_hours: string; booked_hours: string;
  pto_hours: string; available_hours: string; utilization_ratio: string;
}
export interface RpuOverview {
  kpis: {
    activeResources: number; activeProjects: number; assignmentsInWindow: number;
    avgUtilizationPct: number; overbookedResources: number; underbookedResources: number;
  };
  window: { from: string; to: string };
  utilization: RpuUtilizationRow[];
  insights: { id: string; severity: 'info' | 'success' | 'warn' | 'error'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/resource-planning-utilization';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

const DEMO_OVERVIEW: RpuOverview = {
  kpis: {
    activeResources: 3, activeProjects: 2, assignmentsInWindow: 3,
    avgUtilizationPct: 62.5, overbookedResources: 0, underbookedResources: 1,
  },
  window: { from: new Date().toISOString().slice(0, 10),
            to: new Date(Date.now() + 28 * 86400_000).toISOString().slice(0, 10) },
  utilization: [
    { resource_id: 'r1', full_name: 'Priya Patel', team: 'Platform', weekly_capacity_hours: 40,
      capacity_hours: '160.00', booked_hours: '120.00', pto_hours: '0.00', available_hours: '40.00', utilization_ratio: '0.7500' },
    { resource_id: 'r2', full_name: 'Marco Rossi', team: 'Design', weekly_capacity_hours: 40,
      capacity_hours: '160.00', booked_hours: '80.00', pto_hours: '40.00', available_hours: '40.00', utilization_ratio: '0.5000' },
    { resource_id: 'r3', full_name: 'Aisha Khan', team: 'Delivery', weekly_capacity_hours: 40,
      capacity_hours: '160.00', booked_hours: '100.00', pto_hours: '0.00', available_hours: '60.00', utilization_ratio: '0.6250' },
  ],
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live signals will replace this once the API is wired.' }],
  computedAt: new Date().toISOString(),
};

export function useRpuOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<RpuOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      setData(await getJson<RpuOverview>(`${API}/overview`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO_OVERVIEW);
    } finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useRpuResources(filter: { status?: ResourceStatus; team?: string; search?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<RpuResource[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); setTotal(0); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.team) params.set('team', filter.team);
      if (filter.search) params.set('search', filter.search);
      const res = await getJson<{ items: RpuResource[]; total: number }>(`${API}/resources?${params}`);
      setItems(res.items); setTotal(res.total);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) { setItems([]); setTotal(0); }
    } finally { setLoading(false); }
  }, [filter.status, filter.team, filter.search, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: Partial<RpuResource> & { fullName: string; email: string; role: string }) => {
    await getJson(`${API}/resources`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const update = useCallback(async (id: string, patch: Partial<RpuResource>) => {
    await getJson(`${API}/resources/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
    await reload();
  }, [reload]);

  return { items, total, loading, error, reload, create, update };
}

export function useRpuProjects(filter: { status?: ProjectStatus; search?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<RpuProject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); setTotal(0); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.search) params.set('search', filter.search);
      const res = await getJson<{ items: RpuProject[]; total: number }>(`${API}/projects?${params}`);
      setItems(res.items); setTotal(res.total);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) { setItems([]); setTotal(0); }
    } finally { setLoading(false); }
  }, [filter.status, filter.search, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: Partial<RpuProject> & { name: string; code: string }) => {
    await getJson(`${API}/projects`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const update = useCallback(async (id: string, patch: Partial<RpuProject>) => {
    await getJson(`${API}/projects/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, status: ProjectStatus) => {
    await getJson(`${API}/projects/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    await reload();
  }, [reload]);

  return { items, total, loading, error, reload, create, update, transition };
}

export function useRpuAssignments(filter: { status?: AssignmentStatus; resourceId?: string; projectId?: string; from?: string; to?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<RpuAssignment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); setTotal(0); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.resourceId) params.set('resourceId', filter.resourceId);
      if (filter.projectId) params.set('projectId', filter.projectId);
      if (filter.from) params.set('from', filter.from);
      if (filter.to) params.set('to', filter.to);
      const res = await getJson<{ items: RpuAssignment[]; total: number }>(`${API}/assignments?${params}`);
      setItems(res.items); setTotal(res.total);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) { setItems([]); setTotal(0); }
    } finally { setLoading(false); }
  }, [filter.status, filter.resourceId, filter.projectId, filter.from, filter.to, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: { resourceId: string; projectId: string; startDate: string; endDate: string; hoursPerWeek: number; role?: string; status?: AssignmentStatus; notes?: string }) => {
    await getJson(`${API}/assignments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const update = useCallback(async (id: string, patch: Partial<RpuAssignment>) => {
    await getJson(`${API}/assignments/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, status: AssignmentStatus, reason?: string) => {
    await getJson(`${API}/assignments/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason }) });
    await reload();
  }, [reload]);

  const propose = useCallback((id: string) => transition(id, 'proposed'), [transition]);
  const confirm = useCallback((id: string) => transition(id, 'confirmed'), [transition]);
  const activate = useCallback((id: string) => transition(id, 'active'), [transition]);
  const hold = useCallback((id: string) => transition(id, 'on_hold'), [transition]);
  const complete = useCallback((id: string) => transition(id, 'completed'), [transition]);
  const cancel = useCallback((id: string, reason: string) => transition(id, 'cancelled', reason), [transition]);

  return { items, total, loading, error, reload, create, update, transition, propose, confirm, activate, hold, complete, cancel };
}

export function useRpuUtilization(from: string, to: string, opts?: { resourceId?: string; team?: string; demoMode?: boolean }) {
  const [items, setItems] = useState<RpuUtilizationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO_OVERVIEW.utilization); return; }
      const params = new URLSearchParams({ from, to });
      if (opts?.resourceId) params.set('resourceId', opts.resourceId);
      if (opts?.team) params.set('team', opts.team);
      setItems(await getJson<RpuUtilizationRow[]>(`${API}/utilization?${params}`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO_OVERVIEW.utilization);
    } finally { setLoading(false); }
  }, [from, to, opts?.resourceId, opts?.team, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);
  return { items, loading, error, reload };
}

export function useRpuTimeOff(filter: { resourceId?: string; from?: string; to?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.resourceId) params.set('resourceId', filter.resourceId);
      if (filter.from) params.set('from', filter.from);
      if (filter.to) params.set('to', filter.to);
      setItems(await getJson<any[]>(`${API}/time-off?${params}`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems([]);
    } finally { setLoading(false); }
  }, [filter.resourceId, filter.from, filter.to, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: { resourceId: string; startDate: string; endDate: string; kind?: TimeOffKind; hoursPerDay?: number; notes?: string }) => {
    await getJson(`${API}/time-off`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const remove = useCallback(async (id: string) => {
    await getJson(`${API}/time-off/${id}`, { method: 'DELETE' });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, create, remove };
}

export async function recommendForProject(projectId: string, role?: string) {
  const params = new URLSearchParams({ projectId });
  if (role) params.set('role', role);
  return getJson<{ source: string; candidates: any[] }>(`${API}/recommend?${params}`);
}
