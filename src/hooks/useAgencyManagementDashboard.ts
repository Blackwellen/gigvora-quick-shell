/**
 * Domain 52 — Agency Management Dashboard hooks.
 *
 * Hooks: overview, engagements (with status transitions), deliverables (with
 * ML risk scores + status transitions), utilization, invoices (with status
 * transitions). All hooks support `demoMode` for UI stability during the
 * mock → live transition.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

export type EngagementStatus = 'draft' | 'active' | 'at_risk' | 'on_hold' | 'completed' | 'cancelled';
export type DeliverableStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'written_off';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface AgencyKpis {
  activeEngagements: number;
  atRiskEngagements: number;
  totalEngagements: number;
  totalBudgetCents: number;
  totalSpentCents: number;
  arOutstandingCents: number;
  avgUtilization: number;
  blockedDeliverables: number;
  overdueDeliverables: number;
}

export interface AgencyEngagement {
  id: string;
  clientIdentityId: string;
  clientName: string;
  name: string;
  status: EngagementStatus;
  healthScore: number;
  budgetCents: number;
  spentCents: number;
  startsOn: string | null;
  endsOn: string | null;
  ownerIdentityId: string | null;
  tags: string[];
}

export interface AgencyDeliverable {
  id: string;
  engagementId: string;
  title: string;
  status: DeliverableStatus;
  priority: Priority;
  assigneeIdentityId: string | null;
  dueAt: string | null;
  blockedReason: string | null;
  completedAt: string | null;
  riskScore?: number | null;
}

export interface AgencyUtilizationRow {
  member_identity_id: string;
  member_name: string;
  role: string | null;
  avg_utilization: number;
  billable: number;
  capacity: number;
}

export interface AgencyInvoice {
  id: string;
  engagementId: string | null;
  clientIdentityId: string;
  number: string;
  status: InvoiceStatus;
  amountCents: number;
  currency: string;
  issuedOn: string | null;
  dueOn: string | null;
  paidOn: string | null;
}

export interface AgencyOverview {
  windowDays: number;
  kpis: AgencyKpis;
  engagements: AgencyEngagement[];
  deliverables: AgencyDeliverable[];
  utilization: AgencyUtilizationRow[];
  invoiceTotals: Record<string, { count: number; totalCents: number }>;
  insights: { id: string; severity: 'info' | 'success' | 'warn' | 'error'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/agency-management-dashboard';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

const DEMO: AgencyOverview = {
  windowDays: 30,
  kpis: {
    activeEngagements: 2, atRiskEngagements: 1, totalEngagements: 3,
    totalBudgetCents: 9_400_000, totalSpentCents: 5_950_000, arOutstandingCents: 1_350_000,
    avgUtilization: 75, blockedDeliverables: 0, overdueDeliverables: 1,
  },
  engagements: [
    { id: 'e1', clientIdentityId: 'c1', clientName: 'Acme Corp',  name: 'Brand Refresh Q1', status: 'active',  healthScore: 82, budgetCents: 5_000_000, spentCents: 2_400_000, startsOn: null, endsOn: null, ownerIdentityId: null, tags: [] },
    { id: 'e2', clientIdentityId: 'c2', clientName: 'Globex Inc', name: 'Website Build',    status: 'at_risk', healthScore: 54, budgetCents: 3_500_000, spentCents: 3_100_000, startsOn: null, endsOn: null, ownerIdentityId: null, tags: [] },
    { id: 'e3', clientIdentityId: 'c3', clientName: 'Initech',    name: 'SEO Retainer',     status: 'active',  healthScore: 88, budgetCents:   900_000, spentCents:   450_000, startsOn: null, endsOn: null, ownerIdentityId: null, tags: [] },
  ],
  deliverables: [
    { id: 'd1', engagementId: 'e1', title: 'Logo concepts v2',   status: 'in_progress', priority: 'high',   assigneeIdentityId: null, dueAt: null, blockedReason: null, completedAt: null, riskScore: 0.25 },
    { id: 'd2', engagementId: 'e2', title: 'Homepage handoff',   status: 'review',      priority: 'urgent', assigneeIdentityId: null, dueAt: null, blockedReason: null, completedAt: null, riskScore: 0.45 },
  ],
  utilization: [
    { member_identity_id: 'm1', member_name: 'Alex Designer', role: 'Design', avg_utilization: 0.80, billable: 32, capacity: 40 },
    { member_identity_id: 'm2', member_name: 'Sam Engineer',  role: 'Eng',    avg_utilization: 0.90, billable: 36, capacity: 40 },
    { member_identity_id: 'm3', member_name: 'Jess PM',       role: 'PM',     avg_utilization: 0.55, billable: 22, capacity: 40 },
  ],
  invoiceTotals: { paid: { count: 1, totalCents: 1_200_000 }, overdue: { count: 1, totalCents: 900_000 }, sent: { count: 1, totalCents: 450_000 } },
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live signals will replace this once the API is wired.' }],
  computedAt: new Date().toISOString(),
};

export function useAgencyOverview(opts?: { demoMode?: boolean; windowDays?: number }) {
  const windowDays = opts?.windowDays ?? 30;
  const [data, setData] = useState<AgencyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO); return; }
      setData(await getJson<AgencyOverview>(`${API}/overview?windowDays=${windowDays}`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO);
    } finally { setLoading(false); }
  }, [opts?.demoMode, windowDays]);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useAgencyEngagements(filter: { status?: EngagementStatus; clientIdentityId?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<AgencyEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO.engagements); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.clientIdentityId) params.set('clientIdentityId', filter.clientIdentityId);
      const res = await getJson<{ items: AgencyEngagement[] }>(`${API}/engagements?${params.toString()}`);
      setItems(res.items);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO.engagements);
    } finally { setLoading(false); }
  }, [filter.status, filter.clientIdentityId, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const transition = useCallback(async (id: string, status: EngagementStatus, reason?: string) => {
    await getJson(`${API}/engagements/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, transition };
}

export function useAgencyDeliverables(filter: { status?: DeliverableStatus; engagementId?: string; priority?: Priority } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<AgencyDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO.deliverables); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.engagementId) params.set('engagementId', filter.engagementId);
      if (filter.priority) params.set('priority', filter.priority);
      setItems(await getJson<AgencyDeliverable[]>(`${API}/deliverables?${params.toString()}`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO.deliverables);
    } finally { setLoading(false); }
  }, [filter.status, filter.engagementId, filter.priority, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const transition = useCallback(async (id: string, status: DeliverableStatus, extra?: { blockedReason?: string; note?: string }) => {
    await getJson(`${API}/deliverables/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    });
    await reload();
  }, [reload]);

  const start = useCallback((id: string) => transition(id, 'in_progress'), [transition]);
  const complete = useCallback((id: string) => transition(id, 'done'), [transition]);
  const block = useCallback((id: string, blockedReason: string) => transition(id, 'blocked', { blockedReason }), [transition]);

  return useMemo(() => ({ items, loading, error, reload, transition, start, complete, block }), [items, loading, error, reload, transition, start, complete, block]);
}

export function useAgencyUtilization(filter: { windowDays?: number; memberIdentityId?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<AgencyUtilizationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (opts?.demoMode) { setItems(DEMO.utilization); return; }
      const params = new URLSearchParams();
      if (filter.windowDays) params.set('windowDays', String(filter.windowDays));
      if (filter.memberIdentityId) params.set('memberIdentityId', filter.memberIdentityId);
      setItems(await getJson<AgencyUtilizationRow[]>(`${API}/utilization/summary?${params.toString()}`));
    } catch { /* noop */ } finally { setLoading(false); }
  }, [filter.windowDays, filter.memberIdentityId, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);
  return { items, loading, reload };
}

export function useAgencyInvoices(filter: { status?: InvoiceStatus; clientIdentityId?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<AgencyInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.clientIdentityId) params.set('clientIdentityId', filter.clientIdentityId);
      setItems(await getJson<AgencyInvoice[]>(`${API}/invoices?${params.toString()}`));
    } catch (e) {
      setError(e as Error);
    } finally { setLoading(false); }
  }, [filter.status, filter.clientIdentityId, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const transition = useCallback(async (id: string, status: InvoiceStatus, extra?: { paidOn?: string; note?: string }) => {
    await getJson(`${API}/invoices/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    });
    await reload();
  }, [reload]);

  const markPaid = useCallback((id: string, paidOn?: string) => transition(id, 'paid', { paidOn: paidOn ?? new Date().toISOString().slice(0, 10) }), [transition]);
  const markSent = useCallback((id: string) => transition(id, 'sent'), [transition]);

  return { items, loading, error, reload, transition, markPaid, markSent };
}
