/**
 * Domain 50 — Client / Buyer Dashboard hooks.
 *
 * Provides demoMode fallbacks so existing UI keeps rendering during the
 * mock → live transition. Hooks: overview, spend, proposals (with status
 * transitions), oversight (with status transitions), saved items, approvals.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

export type ProposalStatus = 'received' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
export type OversightStatus = 'planning' | 'active' | 'at_risk' | 'on_hold' | 'completed' | 'cancelled';
export type SpendStatus = 'pending' | 'cleared' | 'refunded' | 'disputed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export interface ClientKpis {
  spendClearedCents: number;
  spendPendingCents: number;
  activeProjects: number;
  atRiskProjects: number;
  pendingApprovals: number;
  openProposals: number;
  budgetUtilisation: number;
}

export interface ClientProposal {
  id: string;
  vendorName: string | null;
  title: string;
  summary: string | null;
  amountCents: number;
  currency: string;
  durationDays: number | null;
  status: ProposalStatus;
  matchScore: number | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface OversightProject {
  id: string;
  title: string;
  vendorName: string | null;
  status: OversightStatus;
  healthScore: number;
  budgetCents: number;
  spentCents: number;
  startedAt: string | null;
  dueAt: string | null;
}

export interface SpendRow {
  id: string;
  category: string;
  vendorName: string | null;
  amountCents: number;
  currency: string;
  status: SpendStatus;
  spendAt: string;
}

export interface ClientApproval {
  id: string;
  kind: string;
  title: string;
  amountCents: number | null;
  status: ApprovalStatus;
  dueAt: string | null;
  createdAt: string;
}

export interface ClientOverview {
  windowDays: number;
  kpis: ClientKpis;
  spendByCategory: Record<string, number>;
  proposals: ClientProposal[];
  oversight: OversightProject[];
  pendingApprovals: ClientApproval[];
  insights: { id: string; severity: 'info' | 'success' | 'warn' | 'error'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/client-dashboard';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

const DEMO_OVERVIEW: ClientOverview = {
  windowDays: 30,
  kpis: {
    spendClearedCents: 1_842_000,
    spendPendingCents: 312_000,
    activeProjects: 3,
    atRiskProjects: 1,
    pendingApprovals: 2,
    openProposals: 4,
    budgetUtilisation: 64.2,
  },
  spendByCategory: { project: 1_120_000, service: 480_000, gig: 242_000 },
  proposals: [
    { id: 'p1', vendorName: 'Atlas Studio', title: 'Phase-2 motion system', summary: 'Adds Lottie + interactive states.', amountCents: 480_000, currency: 'USD', durationDays: 14, status: 'shortlisted', matchScore: 0.86, expiresAt: null, createdAt: new Date().toISOString() },
    { id: 'p2', vendorName: 'Northwind Devs', title: 'Webhook reliability sprint', summary: 'Replays + DLQ + observability.', amountCents: 320_000, currency: 'USD', durationDays: 21, status: 'received', matchScore: 0.71, expiresAt: null, createdAt: new Date().toISOString() },
  ],
  oversight: [
    { id: 'o1', title: 'Brand refresh', vendorName: 'Atlas Studio', status: 'active', healthScore: 82, budgetCents: 1_500_000, spentCents: 920_000, startedAt: null, dueAt: null },
    { id: 'o2', title: 'API integration', vendorName: 'Northwind Devs', status: 'at_risk', healthScore: 48, budgetCents: 900_000, spentCents: 870_000, startedAt: null, dueAt: null },
  ],
  pendingApprovals: [
    { id: 'a1', kind: 'milestone', title: 'Brand refresh — milestone 2', amountCents: 500_000, status: 'pending', dueAt: null, createdAt: new Date().toISOString() },
  ],
  insights: [
    { id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live signals will replace this once the API is wired.' },
  ],
  computedAt: new Date().toISOString(),
};

// ---- Overview
export function useClientOverview(opts?: { demoMode?: boolean; windowDays?: number }) {
  const windowDays = opts?.windowDays ?? 30;
  const [data, setData] = useState<ClientOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      const res = await getJson<ClientOverview>(`${API}/overview?windowDays=${windowDays}`);
      setData(res);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO_OVERVIEW);
    } finally {
      setLoading(false);
    }
  }, [opts?.demoMode, windowDays]);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

// ---- Proposals
export function useClientProposals(filter: { status?: ProposalStatus; projectId?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<ClientProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO_OVERVIEW.proposals); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.projectId) params.set('projectId', filter.projectId);
      const res = await getJson<{ items: ClientProposal[] }>(`${API}/proposals?${params.toString()}`);
      setItems(res.items);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO_OVERVIEW.proposals);
    } finally {
      setLoading(false);
    }
  }, [filter.status, filter.projectId, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const transition = useCallback(async (id: string, status: ProposalStatus, reason?: string) => {
    await getJson(`${API}/proposals/${id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    await reload();
  }, [reload]);

  const shortlist = useCallback((id: string) => transition(id, 'shortlisted'), [transition]);
  const accept = useCallback((id: string, reason?: string) => transition(id, 'accepted', reason), [transition]);
  const reject = useCallback((id: string, reason?: string) => transition(id, 'rejected', reason), [transition]);

  return { items, loading, error, reload, transition, shortlist, accept, reject };
}

// ---- Oversight
export function useClientOversight(filter: { status?: OversightStatus } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<OversightProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO_OVERVIEW.oversight); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      const res = await getJson<{ items: OversightProject[] }>(`${API}/oversight?${params.toString()}`);
      setItems(res.items);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO_OVERVIEW.oversight);
    } finally {
      setLoading(false);
    }
  }, [filter.status, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const transition = useCallback(async (id: string, status: OversightStatus, note?: string) => {
    await getJson(`${API}/oversight/${id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, note }),
    });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, transition };
}

// ---- Spend
export function useClientSpend(filter: { category?: string; status?: SpendStatus } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<SpendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.category) params.set('category', filter.category);
      if (filter.status) params.set('status', filter.status);
      const res = await getJson<{ items: SpendRow[] }>(`${API}/spend?${params.toString()}`);
      setItems(res.items);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [filter.category, filter.status, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);
  return { items, loading, error, reload };
}

// ---- Approvals
export function useClientApprovals(opts?: { demoMode?: boolean; status?: ApprovalStatus }) {
  const [items, setItems] = useState<ClientApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO_OVERVIEW.pendingApprovals); return; }
      const qs = opts?.status ? `?status=${opts.status}` : '';
      const res = await getJson<ClientApproval[]>(`${API}/approvals${qs}`);
      setItems(res);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO_OVERVIEW.pendingApprovals);
    } finally {
      setLoading(false);
    }
  }, [opts?.demoMode, opts?.status]);

  useEffect(() => { reload(); }, [reload]);

  const decide = useCallback(async (id: string, decision: 'approved' | 'rejected' | 'escalated', note?: string) => {
    await getJson(`${API}/approvals/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision, note }),
    });
    await reload();
  }, [reload]);

  return useMemo(() => ({ items, loading, error, reload, decide }), [items, loading, error, reload, decide]);
}

// ---- Saved items
export function useClientSavedItems(opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const reload = useCallback(async () => {
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const res = await getJson<any[]>(`${API}/saved`);
      setItems(res);
    } catch { /* noop */ }
  }, [opts?.demoMode]);
  useEffect(() => { reload(); }, [reload]);

  const save = useCallback(async (body: { itemType: string; itemId: string; label?: string; notes?: string }) => {
    await getJson(`${API}/saved`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    await reload();
  }, [reload]);

  const unsave = useCallback(async (id: string) => {
    await getJson(`${API}/saved/${id}`, { method: 'DELETE' });
    await reload();
  }, [reload]);

  return { items, reload, save, unsave };
}
