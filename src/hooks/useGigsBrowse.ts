/**
 * Domain 41 — React data hook for Gigs Browse, Search, Marketplace Discovery.
 *
 * Calls the api-nest /api/v1/gigs-browse/* surface via the bearer token in
 * localStorage('gigvora.token'). When no backend is reachable (no
 * VITE_GIGVORA_API_URL or no token) it returns a `demoMode: true` envelope
 * with deterministic seed data so the existing UI stays functional.
 *
 * Used by GigsDiscoveryPage, GigsSearchPage, GigDetailPage. Does NOT
 * change the UI — only swaps the data source.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const baseUrl = (import.meta as { env?: Record<string, string | undefined> })
  .env?.VITE_GIGVORA_API_URL?.replace(/\/$/, '') || '';

function token(): string {
  try { return localStorage.getItem('gigvora.token') || ''; } catch { return ''; }
}

export interface GigBrowseFiltersInput {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'orders' | 'fastest';
  category?: string;
  subcategory?: string;
  priceMin?: number;
  priceMax?: number;
  deliveryDaysMax?: number;
  ratingMin?: number;
  proSellerOnly?: boolean;
  fastDeliveryOnly?: boolean;
  acceptsRevisionsOnly?: boolean;
  skills?: string[];
  languages?: string[];
  industries?: string[];
}

export interface GigBrowseResult {
  id: string; title: string; slug: string;
  category: string; subcategory: string | null;
  thumbnailUrl: string | null;
  seller: { id: string; name: string; avatarUrl: string | null; isProSeller: boolean; level: string };
  pricing: { fromCents: number; currency: string };
  delivery: { minDays: number; maxDays: number };
  rating: { avg: number; count: number };
  orders: number;
  status: string; visibility: string;
  isFeatured: boolean; hasFastDelivery: boolean; acceptsRevisions: boolean;
  skills: string[]; languages: string[]; industries: string[];
  matchScore: number | null;
  bookmarked: boolean;
  publishedAt: string | null;
}

export interface GigSearchEnvelope {
  results: GigBrowseResult[];
  total: number;
  page: number;
  pageSize: number;
  facets: Record<string, Array<{ value: string; count: number }>> | null;
  rankingMode: 'ml' | 'fallback' | 'recency' | 'popularity';
  generatedAt: string;
  demoMode?: boolean;
}

function isLive(): boolean {
  return Boolean(baseUrl);
}

async function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const url = new URL(`${baseUrl}${path}`);
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v == null || v === '') return;
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, String(x)));
    else url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString(), {
    headers: token() ? { Authorization: `Bearer ${token()}` } : undefined,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function apiSend<T>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Local fallback envelope so the UI stays functional in demo mode. */
function demoEnvelope(filters: GigBrowseFiltersInput): GigSearchEnvelope {
  const seed: GigBrowseResult[] = Array.from({ length: 12 }).map((_, i) => ({
    id: `demo-gig-${i}`,
    title: `Demo gig #${i + 1}`,
    slug: `demo-gig-${i + 1}`,
    category: ['design', 'development', 'writing', 'video', 'marketing'][i % 5],
    subcategory: null,
    thumbnailUrl: null,
    seller: { id: `demo-seller-${i}`, name: `Demo seller ${i + 1}`, avatarUrl: null, isProSeller: i % 4 === 0, level: 'level-1' },
    pricing: { fromCents: (25 + i * 7) * 100, currency: 'GBP' },
    delivery: { minDays: 1 + (i % 3), maxDays: 5 + (i % 4) },
    rating: { avg: 4.2 + (i % 5) * 0.1, count: 30 + i * 3 },
    orders: 50 + i * 11,
    status: 'active', visibility: 'public',
    isFeatured: i % 6 === 0, hasFastDelivery: i % 3 === 0, acceptsRevisions: true,
    skills: ['demo'], languages: ['English'], industries: ['Software'],
    matchScore: null, bookmarked: false,
    publishedAt: new Date(Date.now() - i * 3_600_000).toISOString(),
  }));
  return {
    results: seed, total: seed.length, page: filters.page ?? 1, pageSize: filters.pageSize ?? 24,
    facets: null, rankingMode: 'fallback', generatedAt: new Date().toISOString(), demoMode: true,
  };
}

export function useGigsBrowse(filters: GigBrowseFiltersInput) {
  const [data, setData] = useState<GigSearchEnvelope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reqId = useRef(0);

  // Stable key so we don't refetch on every render
  const key = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchPage = useCallback(async () => {
    const myReq = ++reqId.current;
    setLoading(true); setError(null);
    try {
      const env: GigSearchEnvelope = isLive()
        ? await apiGet<GigSearchEnvelope>('/api/v1/gigs-browse/search', filters as Record<string, unknown>)
        : demoEnvelope(filters);
      if (myReq === reqId.current) setData(env);
    } catch (e) {
      if (myReq === reqId.current) {
        setError(e instanceof Error ? e : new Error('Failed to load gigs'));
        // Still surface a usable envelope so the UI never blanks out.
        setData(demoEnvelope(filters));
      }
    } finally {
      if (myReq === reqId.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { void fetchPage(); }, [fetchPage]);

  return { data, loading, error, refetch: fetchPage, isLive: isLive() };
}

export function useGigBrowseDetail(idOrSlug: string | undefined) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(idOrSlug));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!idOrSlug) return;
    let cancelled = false;
    setLoading(true); setError(null);
    (async () => {
      try {
        const out = isLive() ? await apiGet(`/api/v1/gigs-browse/${idOrSlug}`) : null;
        if (!cancelled) setData(out);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error('Failed to load gig'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [idOrSlug]);

  return { data, loading, error, isLive: isLive() };
}

export async function toggleGigBookmark(gigId: string): Promise<{ gigId: string; bookmarked: boolean }> {
  if (!isLive()) return { gigId, bookmarked: false };
  return apiSend(`/api/v1/gigs-browse/${gigId}/bookmark`, 'POST');
}

export async function listGigBookmarks(): Promise<string[]> {
  if (!isLive()) return [];
  return apiGet<string[]>('/api/v1/gigs-browse/bookmarks');
}

export async function listSavedGigSearches(): Promise<unknown[]> {
  if (!isLive()) return [];
  return apiGet<unknown[]>('/api/v1/gigs-browse/saved');
}

export async function upsertSavedGigSearch(body: {
  id?: string;
  label: string;
  filters: GigBrowseFiltersInput;
  alertsEnabled?: boolean;
  alertCadence?: 'off' | 'realtime' | 'daily' | 'weekly';
  pinned?: boolean;
  channel?: 'inapp' | 'email' | 'inapp+email';
}): Promise<unknown> {
  if (!isLive()) return { ...body, id: 'demo' };
  return apiSend('/api/v1/gigs-browse/saved', 'POST', body);
}

export async function removeSavedGigSearch(id: string): Promise<boolean> {
  if (!isLive()) return true;
  const out = await apiSend<{ removed: boolean }>(`/api/v1/gigs-browse/saved/${id}`, 'DELETE');
  return out.removed;
}
