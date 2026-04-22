/**
 * Domain 59 — Payouts, Escrow, Finance Operations & Hold Management hooks.
 *
 * Hooks: overview, accounts, schedule, payouts (init + transition), escrows
 * (hold/release/refund), holds (open + admin transition), disputes, ledger,
 * audit. All support `demoMode` for offline rendering.
 */
import { useCallback, useEffect, useState } from 'react';

export type PayoutStatus  = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
export type EscrowStatus  = 'held' | 'released' | 'refunded' | 'disputed' | 'partially_released';
export type HoldStatus    = 'open' | 'released' | 'escalated' | 'converted_to_dispute';
export type DisputeStatus = 'opened' | 'under_review' | 'resolved' | 'rejected';

export interface PayoutAccount {
  id: string; ownerIdentityId: string; rail: string; currency: string;
  countryCode: string; externalAccountId: string; displayName: string;
  status: 'pending_verification' | 'active' | 'disabled'; isDefault: boolean;
}
export interface Payout {
  id: string; ownerIdentityId: string; accountId: string;
  amountMinor: number; feeMinor: number; netAmountMinor: number; currency: string;
  status: PayoutStatus; reference: string; initiatedAt: string;
  completedAt: string | null; failureReason: string | null; retryCount: number;
}
export interface Escrow {
  id: string; payerIdentityId: string; payeeIdentityId: string;
  contextType: string; contextId: string; amountMinor: number;
  releasedMinor: number; refundedMinor: number; currency: string;
  status: EscrowStatus; heldAt: string; reference: string;
}
export interface Hold {
  id: string; subjectType: string; subjectId: string; ownerIdentityId: string;
  reasonCode: string; reasonDetail: string | null; status: HoldStatus;
  amountMinor: number; currency: string; openedAt: string; resolvedAt: string | null;
}
export interface Dispute {
  id: string; escrowId: string | null; payoutId: string | null;
  amountMinor: number; currency: string; reason: string; status: DisputeStatus;
  evidenceUrl: string | null; resolution: string | null; openedAt: string;
}
export interface PefOverview {
  kpis: { availableMinor: number; reservedMinor: number; pendingPayouts: number; openHolds: number; heldEscrowMinor: number };
  accounts: PayoutAccount[];
  schedule: { cadence: string; minAmountMinor: number; defaultAccountId: string | null } | null;
  recentPayouts: Payout[];
  escrows: Escrow[];
  holds: Hold[];
  insights: { id: string; severity: 'info' | 'success' | 'warn' | 'error'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/payouts-escrow-finops';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

const DEMO_OVERVIEW: PefOverview = {
  kpis: { availableMinor: 12_50, reservedMinor: 100_00, pendingPayouts: 1, openHolds: 0, heldEscrowMinor: 250_00 },
  accounts: [], schedule: { cadence: 'weekly', minAmountMinor: 50_00, defaultAccountId: null },
  recentPayouts: [], escrows: [], holds: [],
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live data will appear once the API is wired.' }],
  computedAt: new Date().toISOString(),
};

export function usePefOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<PefOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      setData(await getJson<PefOverview>(`${API}/overview`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO_OVERVIEW);
    } finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function usePefAccounts(opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<PayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      setItems(await getJson<PayoutAccount[]>(`${API}/accounts`));
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setItems([]); }
    finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: any) => {
    await getJson(`${API}/accounts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const setDefault = useCallback(async (id: string) => {
    await getJson(`${API}/accounts/${id}/default`, { method: 'POST' });
    await reload();
  }, [reload]);
  return { items, loading, error, reload, create, setDefault };
}

export function usePefPayouts(filter: { status?: PayoutStatus } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      const r = await getJson<{ items: Payout[] }>(`${API}/payouts?${params}`);
      setItems(r.items);
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setItems([]); }
    finally { setLoading(false); }
  }, [filter.status, opts?.demoMode]);
  useEffect(() => { reload(); }, [reload]);
  const initiate = useCallback(async (dto: { accountId: string; amountMinor: number; feeMinor?: number; currency?: string }) => {
    const r = await getJson<Payout>(`${API}/payouts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
    return r;
  }, [reload]);
  const transition = useCallback(async (id: string, status: PayoutStatus, reason?: string, externalRef?: string) => {
    await getJson(`${API}/payouts/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason, externalRef }) });
    await reload();
  }, [reload]);
  return { items, loading, error, reload, initiate, transition };
}

export function usePefSchedule() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setData(await getJson(`${API}/schedule`)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const save = useCallback(async (dto: { cadence: string; minAmountMinor: number; defaultAccountId?: string }) => {
    const r = await getJson(`${API}/schedule`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    setData(r);
    return r;
  }, []);
  return { data, loading, refresh, save };
}

export function usePefEscrows(filter: { role?: 'payer' | 'payee'; status?: EscrowStatus } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.role) params.set('role', filter.role);
      if (filter.status) params.set('status', filter.status);
      setItems(await getJson<Escrow[]>(`${API}/escrows?${params}`));
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setItems([]); }
    finally { setLoading(false); }
  }, [filter.role, filter.status, opts?.demoMode]);
  useEffect(() => { reload(); }, [reload]);
  const hold = useCallback(async (dto: any) => {
    const r = await getJson(`${API}/escrows/hold`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
    return r;
  }, [reload]);
  const release = useCallback(async (id: string, amountMinor: number, reason?: string) => {
    await getJson(`${API}/escrows/${id}/release`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amountMinor, reason }) });
    await reload();
  }, [reload]);
  const refund = useCallback(async (id: string, amountMinor: number, reason: string) => {
    await getJson(`${API}/escrows/${id}/refund`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amountMinor, reason }) });
    await reload();
  }, [reload]);
  return { items, loading, error, reload, hold, release, refund };
}

export function usePefHolds(filter: { status?: HoldStatus } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      setItems(await getJson<Hold[]>(`${API}/holds?${params}`));
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setItems([]); }
    finally { setLoading(false); }
  }, [filter.status, opts?.demoMode]);
  useEffect(() => { reload(); }, [reload]);
  const open = useCallback(async (dto: any) => {
    await getJson(`${API}/holds`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, status: HoldStatus, reason?: string) => {
    await getJson(`${API}/holds/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason }) });
    await reload();
  }, [reload]);
  return { items, loading, error, reload, open, transition };
}

export function usePefDisputes(filter: { status?: DisputeStatus } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      setItems(await getJson<Dispute[]>(`${API}/disputes?${params}`));
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setItems([]); }
    finally { setLoading(false); }
  }, [filter.status, opts?.demoMode]);
  useEffect(() => { reload(); }, [reload]);
  const open = useCallback(async (dto: any) => {
    await getJson(`${API}/disputes`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, status: DisputeStatus, resolution?: string) => {
    await getJson(`${API}/disputes/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, resolution }) });
    await reload();
  }, [reload]);
  return { items, loading, error, reload, open, transition };
}

export function usePefLedger(limit = 200) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setItems(await getJson<any[]>(`${API}/ledger?limit=${limit}`)); }
    finally { setLoading(false); }
  }, [limit]);
  useEffect(() => { refresh(); }, [refresh]);
  return { items, loading, refresh };
}
