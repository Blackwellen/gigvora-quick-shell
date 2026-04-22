/**
 * Domain 64 — Pricing, Promotions, Offer Packaging & Monetization hooks.
 *
 * Hooks: overview, price books + entries, packages, promotions + redemptions,
 * preview (checkout calculator), quotes (owner + customer).
 */
import { useCallback, useEffect, useState } from 'react';

export type PriceBookStatus = 'draft'|'active'|'archived';
export type PackageStatus = 'draft'|'active'|'paused'|'archived';
export type PromoStatus = 'draft'|'active'|'paused'|'expired'|'archived';
export type QuoteStatus = 'draft'|'sent'|'accepted'|'expired'|'cancelled';
export type Tier = 'standard'|'starter'|'pro'|'enterprise'|'custom';
export type PromoKind = 'percent'|'fixed'|'free_trial';

export interface PriceBook {
  id: string; ownerIdentityId: string; name: string; currency: string;
  status: PriceBookStatus; isDefault: boolean; meta: Record<string, unknown>;
  createdAt: string; updatedAt: string;
}
export interface PriceEntry {
  id: string; priceBookId: string; ownerIdentityId: string;
  sku: string; tier: Tier; unitMinor: number; currency: string;
  minQuantity: number; validFrom: string; validUntil: string|null;
  meta: Record<string, unknown>;
}
export interface OfferPackage {
  id: string; ownerIdentityId: string; slug: string; name: string;
  tier: Tier; status: PackageStatus; priceMinor: number; currency: string;
  billingInterval: 'one_time'|'month'|'year'; features: string[];
  highlight: boolean; position: number; meta: Record<string, unknown>;
  createdAt: string; updatedAt: string;
}
export interface Promotion {
  id: string; ownerIdentityId: string; code: string; status: PromoStatus;
  kind: PromoKind; valueBps: number; valueMinor: number; currency: string;
  appliesTo: 'any'|'package'|'sku'|'first_purchase'; appliesToRefs: string[];
  maxRedemptions: number|null; perUserLimit: number; redeemedCount: number;
  startsAt: string|null; endsAt: string|null; minSubtotalMinor: number;
  meta: Record<string, unknown>; createdAt: string; updatedAt: string;
}
export interface PromoRedemption {
  id: string; promotionId: string; ownerIdentityId: string;
  redeemedByIdentityId: string; orderRef: string|null;
  discountMinor: number; currency: string; redeemedAt: string;
  meta: Record<string, unknown>;
}
export interface QuoteLine {
  packageId?: string; sku?: string; description: string;
  quantity: number; unitMinor: number;
}
export interface Quote {
  id: string; ownerIdentityId: string; customerIdentityId: string|null;
  status: QuoteStatus; subtotalMinor: number; discountMinor: number;
  taxMinor: number; totalMinor: number; currency: string;
  promoCode: string|null; lineItems: QuoteLine[];
  validUntil: string|null; acceptedAt: string|null;
  meta: Record<string, unknown>; createdAt: string; updatedAt: string;
}
export interface PreviewResult {
  subtotalMinor: number; discountMinor: number; taxMinor: number;
  totalMinor: number; currency: string;
  promo: { valid: boolean; reason: string|null; code: string } | null;
}
export interface PpmOverview {
  kpis: {
    priceBooks: number; packages: number; activePackages: number;
    promotions: number; activePromotions: number; totalRedeemed: number;
  };
  insights: { id: string; severity: 'info'|'success'|'warn'|'critical'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/pricing-promotions-monetization';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`request failed: ${res.status} ${await res.text().catch(() => '')}`);
  return res.json() as Promise<T>;
}
function jsonBody(method: string, body: unknown): RequestInit {
  return { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

const DEMO_OVERVIEW: PpmOverview = {
  kpis: { priceBooks: 0, packages: 0, activePackages: 0, promotions: 0, activePromotions: 0, totalRedeemed: 0 },
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Pricing data will appear once wired.' }],
  computedAt: new Date().toISOString(),
};

export function usePpmOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<PpmOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      setData(await getJson<PpmOverview>(`${API}/overview`));
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setData(DEMO_OVERVIEW); }
    finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function usePpmPriceBooks() {
  const [items, setItems] = useState<PriceBook[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try { setItems(await getJson<PriceBook[]>(`${API}/price-books`)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<PriceBook>) => {
    const r = await getJson<PriceBook>(`${API}/price-books`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<PriceBook>) => {
    await getJson(`${API}/price-books/${id}`, jsonBody('PATCH', dto));
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, s: PriceBookStatus) => {
    await getJson(`${API}/price-books/${id}/status`, jsonBody('PATCH', { status: s }));
    await reload();
  }, [reload]);
  return { items, loading, reload, create, update, transition };
}

export function usePpmPriceEntries(bookId: string | null) {
  const [items, setItems] = useState<PriceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const reload = useCallback(async () => {
    if (!bookId) { setItems([]); return; }
    setLoading(true);
    try { setItems(await getJson<PriceEntry[]>(`${API}/price-books/${bookId}/entries`)); }
    finally { setLoading(false); }
  }, [bookId]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<PriceEntry> & { priceBookId: string }) => {
    const r = await getJson<PriceEntry>(`${API}/price-entries`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const remove = useCallback(async (id: string) => {
    await getJson(`${API}/price-entries/${id}`, { method: 'DELETE' });
    await reload();
  }, [reload]);
  return { items, loading, reload, create, remove };
}

export function usePpmPackages(status?: PackageStatus) {
  const [items, setItems] = useState<OfferPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      setItems(await getJson<OfferPackage[]>(`${API}/packages?${params}`));
    } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<OfferPackage>) => {
    const r = await getJson<OfferPackage>(`${API}/packages`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<OfferPackage>) => {
    await getJson(`${API}/packages/${id}`, jsonBody('PATCH', dto));
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, s: PackageStatus) => {
    await getJson(`${API}/packages/${id}/status`, jsonBody('PATCH', { status: s }));
    await reload();
  }, [reload]);
  return { items, loading, reload, create, update, transition };
}

export function usePpmPromotions(status?: PromoStatus) {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      setItems(await getJson<Promotion[]>(`${API}/promotions?${params}`));
    } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<Promotion>) => {
    const r = await getJson<Promotion>(`${API}/promotions`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<Promotion>) => {
    await getJson(`${API}/promotions/${id}`, jsonBody('PATCH', dto));
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, s: PromoStatus) => {
    await getJson(`${API}/promotions/${id}/status`, jsonBody('PATCH', { status: s }));
    await reload();
  }, [reload]);
  const redemptions = useCallback(async (id: string) =>
    getJson<PromoRedemption[]>(`${API}/promotions/${id}/redemptions`), []);
  return { items, loading, reload, create, update, transition, redemptions };
}

/** Checkout-time price calculator. Stateless, callable on every keystroke. */
export function usePpmPreview() {
  const [data, setData] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const evaluate = useCallback(async (dto: {
    ownerIdentityId: string; redeemedByIdentityId?: string;
    subtotalMinor: number; currency: string;
    promoCode?: string; packageId?: string; sku?: string; taxRateBps?: number;
  }) => {
    setLoading(true); setError(null);
    try {
      const r = await getJson<PreviewResult>(`${API}/preview`, jsonBody('POST', dto));
      setData(r); return r;
    } catch (e) { setError(e as Error); throw e; }
    finally { setLoading(false); }
  }, []);
  return { data, loading, error, evaluate };
}

export function usePpmQuotes(role: 'owner'|'customer', status?: QuoteStatus) {
  const [items, setItems] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      const path = role === 'owner' ? 'quotes/owner' : 'quotes/customer';
      setItems(await getJson<Quote[]>(`${API}/${path}?${params}`));
    } finally { setLoading(false); }
  }, [role, status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: {
    customerIdentityId?: string; items: QuoteLine[]; promoCode?: string;
    taxRateBps?: number; validForDays?: number;
  }) => {
    const r = await getJson<Quote>(`${API}/quotes`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const transition = useCallback(async (id: string, s: QuoteStatus) => {
    await getJson(`${API}/quotes/${id}/status`, jsonBody('PATCH', { status: s }));
    await reload();
  }, [reload]);
  return { items, loading, reload, create, transition };
}
