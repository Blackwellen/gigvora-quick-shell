/**
 * Domain 48 — User Dashboard hooks.
 *
 * Provides demoMode fallbacks so existing UI keeps rendering during the
 * transition from mock data to live API.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

export type DashboardRole = 'user' | 'professional' | 'enterprise';
export type ActionStatus = 'pending' | 'snoozed' | 'done' | 'dismissed';

export interface DashboardKpis {
  [key: string]: number | string;
}
export interface DashboardInsight {
  id: string;
  severity: 'info' | 'success' | 'warn' | 'error';
  title: string;
  body?: string;
}
export interface DashboardAction {
  id: string;
  kind: string;
  title: string;
  description?: string;
  href?: string | null;
  priority: number;
  status: ActionStatus;
  dueAt?: string | null;
}
export interface DashboardOverview {
  role: DashboardRole;
  kpis: DashboardKpis;
  insights: DashboardInsight[];
  activity: { id: string; kind: string; title: string; at: string }[];
  nextActions: DashboardAction[];
  widgets: any[];
  computedAt?: string;
  staleAt?: string;
}

const API = '/api/v1/user-dashboard';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

const DEMO_OVERVIEW: Record<DashboardRole, DashboardOverview> = {
  user: {
    role: 'user',
    kpis: { savedItems: 6, ordersOpen: 1, bookingsUpcoming: 2, unreadMessages: 3 },
    insights: [{ id: 'd1', severity: 'info', title: 'Demo mode', body: 'Live signals will replace this once wired.' }],
    activity: [],
    nextActions: [],
    widgets: [],
  },
  professional: {
    role: 'professional',
    kpis: { activeOrders: 4, earningsMtd: 2840, openOpportunities: 7, rating: 4.8 },
    insights: [],
    activity: [],
    nextActions: [],
    widgets: [],
  },
  enterprise: {
    role: 'enterprise',
    kpis: { openReqs: 12, spendMtd: 18420, vendorsActive: 9, pendingApprovals: 3 },
    insights: [],
    activity: [],
    nextActions: [],
    widgets: [],
  },
};

export function useDashboardOverview(role: DashboardRole = 'user', opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (force = false) => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) {
        setData(DEMO_OVERVIEW[role]);
      } else {
        const res = await getJson<DashboardOverview>(`${API}/overview?role=${role}${force ? '&refresh=true' : ''}`);
        setData(res);
      }
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO_OVERVIEW[role]);
    } finally {
      setLoading(false);
    }
  }, [role, opts?.demoMode]);

  useEffect(() => { refresh(false); }, [refresh]);

  return { data, loading, error, refresh };
}

export function useDashboardActions(role: DashboardRole = 'user', opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<DashboardAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const res = await getJson<DashboardAction[]>(`${API}/actions?role=${role}&status=pending`);
      setItems(res);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [role, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const complete = useCallback(async (id: string) => {
    await getJson(`${API}/actions/${id}/complete`, { method: 'POST' });
    await reload();
  }, [reload]);

  const dismiss = useCallback(async (id: string) => {
    await getJson(`${API}/actions/${id}/dismiss`, { method: 'POST' });
    await reload();
  }, [reload]);

  const snooze = useCallback(async (id: string, untilIso: string) => {
    await getJson(`${API}/actions/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'snoozed', snoozeUntil: untilIso }),
    });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, complete, dismiss, snooze };
}

export function useDashboardWidgets(role: DashboardRole = 'user') {
  const [items, setItems] = useState<any[]>([]);
  const reload = useCallback(async () => {
    try {
      const res = await getJson<any[]>(`${API}/widgets?role=${role}`);
      setItems(res);
    } catch { /* noop */ }
  }, [role]);
  useEffect(() => { reload(); }, [reload]);

  const upsert = useCallback(async (body: any) => {
    await getJson(`${API}/widgets`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role, ...body }),
    });
    await reload();
  }, [reload, role]);

  const reorder = useCallback(async (order: { id: string; position: number }[]) => {
    await getJson(`${API}/widgets/reorder`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role, order }),
    });
    await reload();
  }, [reload, role]);

  const remove = useCallback(async (id: string) => {
    await getJson(`${API}/widgets/${id}`, { method: 'DELETE' });
    await reload();
  }, [reload]);

  return useMemo(() => ({ items, reload, upsert, reorder, remove }), [items, reload, upsert, reorder, remove]);
}
