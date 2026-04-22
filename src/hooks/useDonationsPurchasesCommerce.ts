/**
 * Domain 63 — Donations, Purchases, Creator Commerce & Patronage hooks.
 *
 * Hooks: overview, storefront, products, tiers, pledges (patron+creator),
 * orders (buyer+creator), donations, ledger. All accept demoMode where applicable.
 */
import { useCallback, useEffect, useState } from 'react';

export type StorefrontStatus = 'draft'|'active'|'paused'|'archived';
export type ProductStatus = 'draft'|'active'|'paused'|'archived';
export type TierStatus = 'draft'|'active'|'archived';
export type PledgeStatus = 'active'|'paused'|'cancelled'|'past_due';
export type OrderStatus = 'pending'|'paid'|'fulfilled'|'refunded'|'failed'|'cancelled';
export type DonationStatus = 'pending'|'paid'|'refunded'|'failed';

export interface Storefront {
  id: string; ownerIdentityId: string; handle: string; displayName: string;
  status: StorefrontStatus; acceptDonations: boolean; acceptPatronage: boolean;
  currency: string; payoutAccountId: string|null; meta: Record<string, unknown>;
  createdAt: string; updatedAt: string;
}
export interface Product {
  id: string; storefrontId: string; ownerIdentityId: string;
  kind: 'digital'|'physical'|'service'|'tip'; status: ProductStatus;
  title: string; description: string; priceMinor: number; currency: string;
  taxCategory: 'standard'|'reduced'|'zero'|'exempt';
  inventoryRemaining: number|null; meta: Record<string, unknown>;
  createdAt: string; updatedAt: string;
}
export interface Tier {
  id: string; storefrontId: string; ownerIdentityId: string; status: TierStatus;
  name: string; monthlyPriceMinor: number; currency: string;
  perks: string[]; meta: Record<string, unknown>; createdAt: string; updatedAt: string;
}
export interface Pledge {
  id: string; storefrontId: string; ownerIdentityId: string;
  patronIdentityId: string; tierId: string; status: PledgeStatus;
  monthlyPriceMinor: number; currency: string;
  startedAt: string; cancelledAt: string|null; nextChargeAt: string|null;
  providerSubscriptionId: string|null; meta: Record<string, unknown>;
}
export interface OrderLine { productId: string; title: string; kind: string; quantity: number; unitMinor: number; currency: string; taxCategory: string }
export interface Order {
  id: string; storefrontId: string; ownerIdentityId: string; buyerIdentityId: string;
  status: OrderStatus; subtotalMinor: number; taxMinor: number; feeMinor: number;
  totalMinor: number; netToCreatorMinor: number; currency: string;
  taxRegion: string|null; vatRateBps: number; lineItems: OrderLine[];
  providerRef: string|null; providerStatus: string|null;
  paidAt: string|null; fulfilledAt: string|null; refundedAt: string|null;
  cancelReason: string|null; idempotencyKey: string|null;
  meta: Record<string, unknown>; createdAt: string; updatedAt: string;
}
export interface Donation {
  id: string; storefrontId: string; ownerIdentityId: string;
  donorIdentityId: string|null; donorDisplayName: string|null; isAnonymous: boolean;
  status: DonationStatus; amountMinor: number; feeMinor: number; netMinor: number;
  currency: string; message: string|null; providerRef: string|null;
  paidAt: string|null; refundedAt: string|null; idempotencyKey: string|null;
  meta: Record<string, unknown>; createdAt: string;
}
export interface LedgerEntry {
  id: string; storefrontId: string; ownerIdentityId: string;
  entryType: 'credit'|'debit'|'refund'|'fee'|'payout'|'reversal';
  amountMinor: number; currency: string; description: string;
  sourceType: 'order'|'donation'|'pledge'|'adjustment'|'payout';
  sourceId: string|null; providerRef: string|null; occurredAt: string;
  meta: Record<string, unknown>;
}
export interface DpcOverview {
  kpis: {
    storefrontStatus: StorefrontStatus|'none'; products: number; activeTiers?: number;
    activePledges: number; mrrMinor: number; lifetimeMinor: number;
    orders: number; donations: number; currency?: string;
  };
  insights: { id: string; severity: 'info'|'success'|'warn'|'critical'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/donations-purchases-commerce';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`request failed: ${res.status} ${await res.text().catch(() => '')}`);
  return res.json() as Promise<T>;
}
function jsonBody(method: string, body: unknown): RequestInit {
  return { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

const DEMO_OVERVIEW: DpcOverview = {
  kpis: { storefrontStatus: 'none', products: 0, activePledges: 0, mrrMinor: 0, lifetimeMinor: 0, orders: 0, donations: 0 },
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live commerce data will appear once wired.' }],
  computedAt: new Date().toISOString(),
};

export function useDpcOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<DpcOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      setData(await getJson<DpcOverview>(`${API}/overview`));
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setData(DEMO_OVERVIEW); }
    finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useDpcStorefront() {
  const [data, setData] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try { setData(await getJson<Storefront>(`${API}/storefront/me`)); }
    catch { setData(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<Storefront>) => {
    const r = await getJson<Storefront>(`${API}/storefront`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (dto: Partial<Storefront>) => {
    await getJson(`${API}/storefront`, jsonBody('PATCH', dto));
    await reload();
  }, [reload]);
  const transition = useCallback(async (status: StorefrontStatus) => {
    await getJson(`${API}/storefront/status`, jsonBody('PATCH', { status }));
    await reload();
  }, [reload]);
  return { data, loading, reload, create, update, transition };
}

export function useDpcProducts(status?: ProductStatus) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      setItems(await getJson<Product[]>(`${API}/products?${params}`));
    } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<Product>) => {
    const r = await getJson<Product>(`${API}/products`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<Product>) => {
    await getJson(`${API}/products/${id}`, jsonBody('PATCH', dto));
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, s: ProductStatus) => {
    await getJson(`${API}/products/${id}/status`, jsonBody('PATCH', { status: s }));
    await reload();
  }, [reload]);
  return { items, loading, reload, create, update, transition };
}

export function useDpcTiers(status?: TierStatus) {
  const [items, setItems] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      setItems(await getJson<Tier[]>(`${API}/tiers?${params}`));
    } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<Tier>) => {
    const r = await getJson<Tier>(`${API}/tiers`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<Tier>) => {
    await getJson(`${API}/tiers/${id}`, jsonBody('PATCH', dto));
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, s: TierStatus) => {
    await getJson(`${API}/tiers/${id}/status`, jsonBody('PATCH', { status: s }));
    await reload();
  }, [reload]);
  return { items, loading, reload, create, update, transition };
}

export function useDpcPledges(role: 'patron'|'creator', status?: PledgeStatus) {
  const [items, setItems] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      const path = role === 'patron' ? 'pledges/mine' : 'pledges/creator';
      setItems(await getJson<Pledge[]>(`${API}/${path}?${params}`));
    } finally { setLoading(false); }
  }, [role, status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (tierId: string) => {
    const r = await getJson<Pledge>(`${API}/pledges`, jsonBody('POST', { tierId }));
    await reload(); return r;
  }, [reload]);
  const transition = useCallback(async (id: string, s: PledgeStatus) => {
    await getJson(`${API}/pledges/${id}/status`, jsonBody('PATCH', { status: s }));
    await reload();
  }, [reload]);
  return { items, loading, reload, create, transition };
}

export function useDpcOrders(role: 'buyer'|'creator', status?: OrderStatus) {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      const path = role === 'buyer' ? 'orders/mine' : 'orders/creator';
      setItems(await getJson<Order[]>(`${API}/${path}?${params}`));
    } finally { setLoading(false); }
  }, [role, status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: { storefrontId: string; items: { productId: string; quantity: number }[]; taxRegion?: string; idempotencyKey: string }) => {
    const r = await getJson<Order>(`${API}/orders`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const confirm = useCallback(async (id: string, providerRef: string) => {
    const r = await getJson<Order>(`${API}/orders/${id}/confirm`, jsonBody('POST', { providerRef }));
    await reload(); return r;
  }, [reload]);
  const fulfill = useCallback(async (id: string) => {
    await getJson(`${API}/orders/${id}/fulfill`, { method: 'POST' });
    await reload();
  }, [reload]);
  const cancel = useCallback(async (id: string, reason: string) => {
    await getJson(`${API}/orders/${id}/cancel`, jsonBody('POST', { reason }));
    await reload();
  }, [reload]);
  const refund = useCallback(async (id: string, amountMinor: number, reason: string) => {
    await getJson(`${API}/orders/${id}/refund`, jsonBody('POST', { amountMinor, reason }));
    await reload();
  }, [reload]);
  return { items, loading, reload, create, confirm, fulfill, cancel, refund };
}

export function useDpcDonations(role: 'donor'|'creator', status?: DonationStatus) {
  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      const path = role === 'donor' ? 'donations/mine' : 'donations/creator';
      setItems(await getJson<Donation[]>(`${API}/${path}?${params}`));
    } finally { setLoading(false); }
  }, [role, status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: { storefrontId: string; amountMinor: number; currency?: string; message?: string; isAnonymous?: boolean; donorDisplayName?: string; idempotencyKey: string }) => {
    const r = await getJson<Donation>(`${API}/donations`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const confirm = useCallback(async (id: string, providerRef: string) => {
    const r = await getJson<Donation>(`${API}/donations/${id}/confirm`, jsonBody('POST', { providerRef }));
    await reload(); return r;
  }, [reload]);
  const refund = useCallback(async (id: string, amountMinor: number, reason: string) => {
    await getJson(`${API}/donations/${id}/refund`, jsonBody('POST', { amountMinor, reason }));
    await reload();
  }, [reload]);
  return { items, loading, reload, create, confirm, refund };
}

export function useDpcLedger(limit = 200) {
  const [items, setItems] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try { setItems(await getJson<LedgerEntry[]>(`${API}/ledger?limit=${limit}`)); }
    finally { setLoading(false); }
  }, [limit]);
  useEffect(() => { reload(); }, [reload]);
  return { items, loading, reload };
}
