/**
 * Domain 53 — Enterprise & Company Dashboard hooks.
 *
 * Hooks: overview, requisitions (with status transitions), purchase orders
 * (with ML risk scores + status transitions), team members, tasks
 * (with status transitions), spend ledger.
 * All hooks support `demoMode` for UI stability during the mock → live transition.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

export type RequisitionStatus = 'draft' | 'open' | 'on_hold' | 'filled' | 'cancelled';
export type PurchaseOrderStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'received' | 'cancelled';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface EnterpriseKpis {
  openRequisitions: number;
  onHoldRequisitions: number;
  totalApplicants: number;
  pendingPoApprovals: number;
  totalSpendCents: number;
  headcount: number;
  onboarding: number;
  blockedTasks: number;
  overdueTasks: number;
}

export interface EdRequisition {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  seniority: string;
  headcount: number;
  status: RequisitionStatus;
  budgetCents: number;
  applicants: number;
  ownerIdentityId: string | null;
  openedOn: string | null;
  targetFillBy: string | null;
}

export interface EdPurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  category: string | null;
  status: PurchaseOrderStatus;
  amountCents: number;
  currency: string;
  requesterIdentityId: string | null;
  approverIdentityId: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  receivedOn: string | null;
  notes: string | null;
  riskScore?: number | null;
}

export interface EdTeamMember {
  id: string;
  memberIdentityId: string;
  fullName: string;
  role: string | null;
  department: string | null;
  status: 'active' | 'onboarding' | 'offboarding' | 'inactive';
  startedOn: string | null;
}

export interface EdTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  category: string | null;
  assigneeIdentityId: string | null;
  dueAt: string | null;
  blockedReason: string | null;
  completedAt: string | null;
}

export interface EdSpendByCategory {
  category: string;
  count: number;
  total_cents: number;
}

export interface EnterpriseOverview {
  windowDays: number;
  kpis: EnterpriseKpis;
  requisitions: EdRequisition[];
  purchaseOrders: EdPurchaseOrder[];
  members: EdTeamMember[];
  tasks: EdTask[];
  spendByCategory: EdSpendByCategory[];
  poTotals: Record<string, { count: number; totalCents: number }>;
  insights: { id: string; severity: 'info' | 'success' | 'warn' | 'error'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/enterprise-dashboard';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

const DEMO: EnterpriseOverview = {
  windowDays: 30,
  kpis: {
    openRequisitions: 2, onHoldRequisitions: 1, totalApplicants: 87,
    pendingPoApprovals: 1, totalSpendCents: 22_550_000,
    headcount: 3, onboarding: 1, blockedTasks: 1, overdueTasks: 0,
  },
  requisitions: [
    { id: 'r1', title: 'Senior Backend Engineer', department: 'Engineering', location: 'Remote', seniority: 'senior', headcount: 2, status: 'open', budgetCents: 18_000_000, applicants: 47, ownerIdentityId: null, openedOn: null, targetFillBy: null },
    { id: 'r2', title: 'Product Designer', department: 'Design', location: 'London', seniority: 'mid', headcount: 1, status: 'on_hold', budgetCents: 10_000_000, applicants: 22, ownerIdentityId: null, openedOn: null, targetFillBy: null },
  ],
  purchaseOrders: [
    { id: 'p1', poNumber: 'PO-2025-0001', vendorName: 'Atlassian', category: 'software', status: 'submitted', amountCents: 1_200_000, currency: 'USD', requesterIdentityId: null, approverIdentityId: null, submittedAt: null, decidedAt: null, receivedOn: null, notes: null, riskScore: 0.35 },
    { id: 'p2', poNumber: 'PO-2025-0002', vendorName: 'Dell', category: 'hardware', status: 'approved', amountCents: 850_000, currency: 'USD', requesterIdentityId: null, approverIdentityId: null, submittedAt: null, decidedAt: null, receivedOn: null, notes: null, riskScore: 0.1 },
  ],
  members: [
    { id: 'm1', memberIdentityId: 'mi1', fullName: 'Priya Patel', role: 'Engineering Manager', department: 'Engineering', status: 'active', startedOn: null },
    { id: 'm2', memberIdentityId: 'mi2', fullName: 'Marco Rossi', role: 'Senior Engineer', department: 'Engineering', status: 'active', startedOn: null },
    { id: 'm3', memberIdentityId: 'mi3', fullName: 'Yuki Tanaka', role: 'Designer', department: 'Design', status: 'onboarding', startedOn: null },
  ],
  tasks: [
    { id: 't1', title: 'Approve Q2 procurement plan', status: 'in_progress', priority: 'high', category: 'procurement', assigneeIdentityId: null, dueAt: null, blockedReason: null, completedAt: null },
    { id: 't2', title: 'Onboard new designer', status: 'todo', priority: 'normal', category: 'ops', assigneeIdentityId: null, dueAt: null, blockedReason: null, completedAt: null },
    { id: 't3', title: 'GDPR DPA renewal', status: 'blocked', priority: 'urgent', category: 'compliance', assigneeIdentityId: null, dueAt: null, blockedReason: 'Awaiting legal sign-off', completedAt: null },
  ],
  spendByCategory: [
    { category: 'payroll', count: 1, total_cents: 18_000_000 },
    { category: 'services', count: 1, total_cents: 2_500_000 },
    { category: 'software', count: 1, total_cents: 1_200_000 },
    { category: 'hardware', count: 1, total_cents: 850_000 },
  ],
  poTotals: { submitted: { count: 1, totalCents: 1_200_000 }, approved: { count: 1, totalCents: 850_000 }, draft: { count: 1, totalCents: 2_500_000 } },
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live signals will replace this once the API is wired.' }],
  computedAt: new Date().toISOString(),
};

export function useEnterpriseOverview(opts?: { demoMode?: boolean; windowDays?: number }) {
  const windowDays = opts?.windowDays ?? 30;
  const [data, setData] = useState<EnterpriseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO); return; }
      setData(await getJson<EnterpriseOverview>(`${API}/overview?windowDays=${windowDays}`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO);
    } finally { setLoading(false); }
  }, [opts?.demoMode, windowDays]);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useEnterpriseRequisitions(filter: { status?: RequisitionStatus; department?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<EdRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO.requisitions); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.department) params.set('department', filter.department);
      const res = await getJson<{ items: EdRequisition[] }>(`${API}/requisitions?${params.toString()}`);
      setItems(res.items);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO.requisitions);
    } finally { setLoading(false); }
  }, [filter.status, filter.department, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const transition = useCallback(async (id: string, status: RequisitionStatus, reason?: string) => {
    await getJson(`${API}/requisitions/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, transition };
}

export function useEnterprisePurchaseOrders(filter: { status?: PurchaseOrderStatus; category?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<EdPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO.purchaseOrders); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.category) params.set('category', filter.category);
      setItems(await getJson<EdPurchaseOrder[]>(`${API}/purchase-orders?${params.toString()}`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO.purchaseOrders);
    } finally { setLoading(false); }
  }, [filter.status, filter.category, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const transition = useCallback(async (id: string, status: PurchaseOrderStatus, extra?: { reason?: string; receivedOn?: string }) => {
    await getJson(`${API}/purchase-orders/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    });
    await reload();
  }, [reload]);

  const approve = useCallback((id: string) => transition(id, 'approved'), [transition]);
  const reject = useCallback((id: string, reason: string) => transition(id, 'rejected', { reason }), [transition]);
  const markReceived = useCallback((id: string, receivedOn?: string) => transition(id, 'received', { receivedOn: receivedOn ?? new Date().toISOString().slice(0, 10) }), [transition]);

  return useMemo(() => ({ items, loading, error, reload, transition, approve, reject, markReceived }), [items, loading, error, reload, transition, approve, reject, markReceived]);
}

export function useEnterpriseTeam(filter: { status?: 'active' | 'onboarding' | 'offboarding' | 'inactive'; department?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<EdTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (opts?.demoMode) { setItems(DEMO.members); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.department) params.set('department', filter.department);
      setItems(await getJson<EdTeamMember[]>(`${API}/team/members?${params.toString()}`));
    } catch { /* noop */ } finally { setLoading(false); }
  }, [filter.status, filter.department, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);
  return { items, loading, reload };
}

export function useEnterpriseTasks(filter: { status?: TaskStatus; category?: string; priority?: Priority } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<EdTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO.tasks); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.category) params.set('category', filter.category);
      if (filter.priority) params.set('priority', filter.priority);
      setItems(await getJson<EdTask[]>(`${API}/team/tasks?${params.toString()}`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO.tasks);
    } finally { setLoading(false); }
  }, [filter.status, filter.category, filter.priority, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const transition = useCallback(async (id: string, status: TaskStatus, extra?: { blockedReason?: string; note?: string }) => {
    await getJson(`${API}/team/tasks/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    });
    await reload();
  }, [reload]);

  const start = useCallback((id: string) => transition(id, 'in_progress'), [transition]);
  const complete = useCallback((id: string) => transition(id, 'done'), [transition]);
  const block = useCallback((id: string, blockedReason: string) => transition(id, 'blocked', { blockedReason }), [transition]);

  return { items, loading, error, reload, transition, start, complete, block };
}
