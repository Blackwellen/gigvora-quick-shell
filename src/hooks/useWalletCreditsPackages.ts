/**
 * Domain 57 — Wallet, Credits, Packages & Purchase Flows hooks.
 *
 * Hooks: overview, wallet + ledger + reconcile, packages catalog/owner CRUD,
 * purchases (create/confirm/fail/cancel/refund), credits (spend/grant), payouts.
 * All hooks support `demoMode` so the existing UI keeps rendering during the
 * mock → live transition.
 */
import { useCallback, useEffect, useState } from 'react';

export type PackageStatus = 'draft' | 'active' | 'paused' | 'archived';
export type PackageKind = 'credits' | 'subscription' | 'one_time' | 'service_pack';
export type PurchaseStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface Wallet {
  id: string; ownerIdentityId: string; currency: string;
  cashBalanceMinor: number; creditBalance: number; heldBalanceMinor: number;
  status: 'active' | 'frozen';
}
export interface Package {
  id: string; ownerIdentityId: string; slug: string; name: string; description: string | null;
  kind: PackageKind; priceMinor: number; currency: string; creditsGranted: number;
  billingInterval: 'month' | 'year' | null; trialDays: number; vatRateBp: number;
  status: PackageStatus; features: string[];
}
export interface Purchase {
  id: string; buyerIdentityId: string; packageId: string | null; packageSnapshot: any;
  amountMinor: number; vatMinor: number; currency: string; creditsGranted: number;
  status: PurchaseStatus; refundedMinor: number;
  provider: string; providerRef: string | null; providerClientSecret: string | null;
  receiptUrl: string | null; invoiceNumber: string | null;
  failureReason: string | null;
  createdAt: string; updatedAt: string;
}
export interface LedgerEntry {
  id: string; walletId: string; kind: string; amountMinor: number; credits: number;
  currency: string; reference: string | null; createdAt: string;
}
export interface WcpOverview {
  wallet: Wallet;
  kpis: { cashBalanceMinor: number; creditBalance: number; heldBalanceMinor: number;
          lifetimeSpendMinor: number; purchaseCount: number; payoutCount: number };
  recentPurchases: Purchase[];
  recentLedger: LedgerEntry[];
  insights: { id: string; severity: 'info' | 'success' | 'warn' | 'error'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/wallet-credits-packages';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

const DEMO_WALLET: Wallet = {
  id: 'demo-wallet', ownerIdentityId: 'demo', currency: 'GBP',
  cashBalanceMinor: 12_500, creditBalance: 250, heldBalanceMinor: 0, status: 'active',
};
const DEMO_OVERVIEW: WcpOverview = {
  wallet: DEMO_WALLET,
  kpis: { cashBalanceMinor: 12_500, creditBalance: 250, heldBalanceMinor: 0,
          lifetimeSpendMinor: 49_99, purchaseCount: 3, payoutCount: 0 },
  recentPurchases: [],
  recentLedger: [],
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live signals will replace this once the API is wired.' }],
  computedAt: new Date().toISOString(),
};

export function useWcpOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<WcpOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      setData(await getJson<WcpOverview>(`${API}/overview`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO_OVERVIEW);
    } finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useWcpWallet(opts?: { demoMode?: boolean }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setWallet(DEMO_WALLET); setLedger([]); return; }
      const [w, l] = await Promise.all([
        getJson<Wallet>(`${API}/wallet`),
        getJson<LedgerEntry[]>(`${API}/wallet/ledger?limit=200`),
      ]);
      setWallet(w); setLedger(l);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) { setWallet(DEMO_WALLET); setLedger([]); }
    } finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);

  const reconcile = useCallback(() => getJson<{ drift: { cash: number; credit: number } }>(`${API}/wallet/reconcile`), []);
  return { wallet, ledger, loading, error, refresh, reconcile };
}

export function useWcpPackages(filter: { status?: PackageStatus; kind?: PackageKind; search?: string; ownerScope?: 'owner' | 'catalog' } = { ownerScope: 'owner' }, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<Package[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); setTotal(0); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.kind) params.set('kind', filter.kind);
      if (filter.search) params.set('search', filter.search);
      const path = filter.ownerScope === 'catalog' ? 'packages/catalog' : 'packages';
      const res = await getJson<{ items: Package[]; total: number }>(`${API}/${path}?${params}`);
      setItems(res.items); setTotal(res.total);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) { setItems([]); setTotal(0); }
    } finally { setLoading(false); }
  }, [filter.status, filter.kind, filter.search, filter.ownerScope, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: Partial<Package> & { slug: string; name: string; priceMinor: number }) => {
    await getJson(`${API}/packages`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const update = useCallback(async (id: string, patch: Partial<Package>) => {
    await getJson(`${API}/packages/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, status: PackageStatus) => {
    await getJson(`${API}/packages/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    await reload();
  }, [reload]);

  return { items, total, loading, error, reload, create, update, transition };
}

export function useWcpPurchases(filter: { status?: PurchaseStatus; from?: string; to?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.from) params.set('from', filter.from);
      if (filter.to) params.set('to', filter.to);
      const res = await getJson<{ items: Purchase[] }>(`${API}/purchases?${params}`);
      setItems(res.items);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems([]);
    } finally { setLoading(false); }
  }, [filter.status, filter.from, filter.to, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: { packageId: string; idempotencyKey: string; currency?: string }) => {
    const r = await getJson<Purchase>(`${API}/purchases`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
    return r;
  }, [reload]);
  const confirm = useCallback(async (id: string, providerRef: string, receiptUrl?: string) => {
    const r = await getJson<Purchase>(`${API}/purchases/${id}/confirm`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ providerRef, receiptUrl }) });
    await reload();
    return r;
  }, [reload]);
  const fail = useCallback(async (id: string, reason: string) => {
    await getJson(`${API}/purchases/${id}/fail`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reason }) });
    await reload();
  }, [reload]);
  const cancel = useCallback(async (id: string) => {
    await getJson(`${API}/purchases/${id}/cancel`, { method: 'POST' });
    await reload();
  }, [reload]);
  const refund = useCallback(async (id: string, amountMinor: number, reason: string) => {
    await getJson(`${API}/purchases/${id}/refund`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amountMinor, reason }) });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, create, confirm, fail, cancel, refund };
}

export function useWcpPayouts(opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      setItems(await getJson<any[]>(`${API}/payouts`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems([]);
    } finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: { amountMinor: number; currency?: string; scheduledFor?: string }) => {
    await getJson(`${API}/payouts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, create };
}

export async function spendCredits(amount: number, reference: string, meta?: Record<string, any>) {
  return getJson<Wallet>(`${API}/credits/spend`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount, reference, meta }) });
}
export async function grantCredits(ownerIdentityId: string, amount: number, reason: string) {
  return getJson<Wallet>(`${API}/credits/grant`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ownerIdentityId, amount, reason }) });
}
