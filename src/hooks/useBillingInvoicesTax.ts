/**
 * Domain 58 — Billing, Invoices, Tax & Subscriptions hooks.
 *
 * Hooks: overview, profile, tax rates, invoices (CRUD + lifecycle + payment + refund + remind),
 * subscriptions (CRUD + lifecycle), disputes, audit. All support `demoMode`.
 */
import { useCallback, useEffect, useState } from 'react';

export type InvoiceStatus = 'draft' | 'open' | 'partially_paid' | 'paid' | 'void' | 'uncollectible' | 'refunded' | 'partially_refunded';
export type SubStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'incomplete';
export type DisputeStatus = 'opened' | 'under_review' | 'won' | 'lost' | 'accepted';

export interface CommercialProfile {
  id: string; ownerIdentityId: string; legalName: string; tradingName: string | null;
  taxId: string | null; taxScheme: string; defaultCurrency: string; billingEmail: string;
  addressLine1: string; addressLine2: string | null; city: string; region: string | null;
  postalCode: string; country: string; invoicePrefix: string; nextInvoiceSeq: number; paymentTermsDays: number;
}
export interface InvoiceLine { id?: string; description: string; quantity: number | string; unitPriceMinor: number; taxRateBp: number; amountMinor: number; }
export interface Invoice {
  id: string; ownerIdentityId: string; customerIdentityId: string | null;
  customerEmail: string; customerName: string; number: string; currency: string;
  subtotalMinor: number; taxMinor: number; discountMinor: number; totalMinor: number;
  paidMinor: number; refundedMinor: number; status: InvoiceStatus;
  issueDate: string | null; dueDate: string | null; paidAt: string | null;
  poNumber: string | null; notes: string | null; pdfUrl: string | null;
  reverseCharge: boolean; taxJurisdiction: string | null; subscriptionId: string | null;
  createdAt: string; updatedAt: string;
}
export interface Subscription {
  id: string; ownerIdentityId: string; customerIdentityId: string;
  productKey: string; planName: string; amountMinor: number; currency: string;
  interval: 'day' | 'week' | 'month' | 'year'; intervalCount: number; status: SubStatus;
  trialEndsAt: string | null; currentPeriodStart: string | null; currentPeriodEnd: string | null;
  cancelAt: string | null; cancelledAt: string | null; pausedAt: string | null;
  externalProvider: string | null; externalSubscriptionId: string | null; autoRenew: boolean;
}
export interface BitOverview {
  profile: CommercialProfile | null;
  kpis: { outstandingMinor: number; overdueMinor: number; mrrMinor: number; openInvoices: number; activeSubscriptions: number };
  aging: { not_due: number; d0_30: number; d31_60: number; d61_plus: number };
  recentInvoices: Invoice[];
  subscriptions: Subscription[];
  insights: { id: string; severity: 'info' | 'success' | 'warn' | 'error'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/billing-invoices-tax';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

const DEMO_OVERVIEW: BitOverview = {
  profile: null,
  kpis: { outstandingMinor: 120_00, overdueMinor: 0, mrrMinor: 19_00, openInvoices: 1, activeSubscriptions: 1 },
  aging: { not_due: 120_00, d0_30: 0, d31_60: 0, d61_plus: 0 },
  recentInvoices: [], subscriptions: [],
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live data will appear once the API is wired.' }],
  computedAt: new Date().toISOString(),
};

export function useBitOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<BitOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      setData(await getJson<BitOverview>(`${API}/overview`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO_OVERVIEW);
    } finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useBitProfile(opts?: { demoMode?: boolean }) {
  const [profile, setProfile] = useState<CommercialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setProfile(null); return; }
      setProfile(await getJson<CommercialProfile | null>(`${API}/profile`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setProfile(null);
    } finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  const save = useCallback(async (dto: Partial<CommercialProfile>) => {
    const r = await getJson<CommercialProfile>(`${API}/profile`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    setProfile(r);
    return r;
  }, []);
  return { profile, loading, error, refresh, save };
}

export function useBitInvoices(filter: { status?: InvoiceStatus; customerIdentityId?: string; search?: string; from?: string; to?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.customerIdentityId) params.set('customerIdentityId', filter.customerIdentityId);
      if (filter.search) params.set('search', filter.search);
      if (filter.from) params.set('from', filter.from);
      if (filter.to) params.set('to', filter.to);
      const res = await getJson<{ items: Invoice[] }>(`${API}/invoices?${params}`);
      setItems(res.items);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems([]);
    } finally { setLoading(false); }
  }, [filter.status, filter.customerIdentityId, filter.search, filter.from, filter.to, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: any) => {
    const r = await getJson<Invoice>(`${API}/invoices`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
    return r;
  }, [reload]);
  const update = useCallback(async (id: string, patch: any) => {
    const r = await getJson<Invoice>(`${API}/invoices/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
    await reload();
    return r;
  }, [reload]);
  const transition = useCallback(async (id: string, status: InvoiceStatus, reason?: string) => {
    await getJson(`${API}/invoices/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason }) });
    await reload();
  }, [reload]);
  const recordPayment = useCallback(async (id: string, amountMinor: number, provider = 'stripe', providerRef?: string) => {
    await getJson(`${API}/invoices/${id}/payments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amountMinor, provider, providerRef }) });
    await reload();
  }, [reload]);
  const refund = useCallback(async (id: string, amountMinor: number, reason: string) => {
    await getJson(`${API}/invoices/${id}/refund`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amountMinor, reason }) });
    await reload();
  }, [reload]);
  const remind = useCallback(async (id: string) => {
    await getJson(`${API}/invoices/${id}/remind`, { method: 'POST' });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, create, update, transition, recordPayment, refund, remind };
}

export function useBitInvoiceDetail(id: string | null) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try { setData(await getJson<any>(`${API}/invoices/${id}`)); }
    catch (e) { setError(e as Error); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { if (id) refresh(); }, [id, refresh]);
  return { data, loading, error, refresh };
}

export function useBitSubscriptions(filter: { status?: SubStatus } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      setItems(await getJson<Subscription[]>(`${API}/subscriptions?${params}`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems([]);
    } finally { setLoading(false); }
  }, [filter.status, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: any) => {
    await getJson(`${API}/subscriptions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, status: SubStatus, reason?: string) => {
    await getJson(`${API}/subscriptions/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason }) });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, create, transition };
}

export function useBitDisputes(opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      setItems(await getJson<any[]>(`${API}/disputes`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems([]);
    } finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { reload(); }, [reload]);
  const open = useCallback(async (dto: { invoiceId: string; amountMinor: number; reason: string; evidenceUrl?: string }) => {
    await getJson(`${API}/disputes`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, status: DisputeStatus, reason?: string) => {
    await getJson(`${API}/disputes/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason }) });
    await reload();
  }, [reload]);
  return { items, loading, error, reload, open, transition };
}

export async function computeTax(jurisdiction: string, subtotalMinor: number, opts: { category?: string; reverseCharge?: boolean } = {}) {
  return getJson<{ taxMinor: number; rateBp: number; reverseCharge: boolean }>(`${API}/tax/compute`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jurisdiction, subtotalMinor, category: opts.category ?? 'standard', reverseCharge: !!opts.reverseCharge }),
  });
}
