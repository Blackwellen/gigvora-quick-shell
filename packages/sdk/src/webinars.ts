/**
 * Typed SDK surface for Domain 22 — Webinars
 * (Discovery, Live Rooms, Replays, Donations, Sales).
 *
 * Multi-step purchase per checkout rule:
 *   1. createPurchase({webinarId, quantity}) → pending
 *   2. confirmPurchase(id, billing+method+tos) → paid
 *
 * Live rooms expose `{ jitsiDomain, jitsiRoom }` so the web/Flutter clients
 * mount <JitsiRoom> directly (no extra negotiation step).
 */
export type WebinarStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'archived' | 'cancelled';

export interface WebinarSummary {
  id: string; title: string; description: string;
  host: { id: string; name: string };
  startsAt: string; durationMinutes: number;
  topics: string[]; thumbnailUrl: string | null;
  status: WebinarStatus;
  ticket: { kind: 'free' | 'paid' | 'donation' | 'enterprise'; priceCents: number; currency: string; capacity: number };
  registrations: number; donationsEnabled: boolean;
  jitsiRoom: string; replayUrl: string | null; replayDurationSec: number | null;
}

export interface DiscoveryFilters {
  q?: string; page?: number; pageSize?: number;
  status?: WebinarStatus[]; topic?: string[];
  price?: 'any' | 'free' | 'paid' | 'donation';
  sort?: 'relevance' | 'soonest' | 'popular' | 'newest';
  facetMode?: 'none' | 'compact' | 'full';
}

export interface WebinarsClient {
  discover(f: DiscoveryFilters): Promise<{ results: WebinarSummary[]; total: number; page: number; pageSize: number; facets: any; rankingMode: string; generatedAt: string }>;
  recommend(): Promise<{ rows: WebinarSummary[]; mode: string }>;
  insights(): Promise<{ live: number; scheduled: number; totalRegs: number; avgFillRate: number; donationsLast24h: number; salesLast24h: number; anomalyNote: string | null; generatedAt: string; mode: string }>;
  detail(id: string): Promise<WebinarSummary & { donations: any[] }>;
  liveRoom(id: string): Promise<{ webinarId: string; jitsiRoom: string; jitsiDomain: string; status: WebinarStatus }>;
  chat(id: string): Promise<{ id: string; from: string; text: string; at: string }[]>;
  postChat(id: string, text: string): Promise<{ id: string; from: string; text: string; at: string }>;
  create(payload: any): Promise<WebinarSummary>;
  transition(id: string, next: WebinarStatus): Promise<WebinarSummary>;
  register(id: string): Promise<{ ok: boolean; reason?: string }>;
  createPurchase(webinarId: string, quantity?: number): Promise<{ id: string; webinarId: string; amountCents: number; currency: string; status: string }>;
  confirmPurchase(purchaseId: string, payload: { paymentMethod: 'card' | 'paypal' | 'wallet' | 'invoice'; billing: { name: string; email: string; country: string; vatId?: string }; acceptTos: true }): Promise<{ id: string; status: string; receiptUrl: string | null }>;
  listPurchases(): Promise<any[]>;
  donate(webinarId: string, payload: { amountCents: number; currency?: 'GBP' | 'USD' | 'EUR'; message?: string; anonymous?: boolean }): Promise<{ id: string; status: string }>;
}

export const createWebinarsClient = (fetcher: typeof fetch, base = '/api/v1/webinars'): WebinarsClient => {
  const j = async (path: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`webinars ${path} ${r.status}`);
    return r.json();
  };
  const qs = (f: DiscoveryFilters) => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v !== undefined && (Array.isArray(v) ? v.forEach((x) => p.append(k, String(x))) : p.set(k, String(v))));
    return p.toString();
  };
  return {
    discover: (f) => j(`/discover?${qs(f)}`),
    recommend: () => j('/recommend'),
    insights: () => j('/insights'),
    detail: (id) => j(`/${id}`),
    liveRoom: (id) => j(`/${id}/live`),
    chat: (id) => j(`/${id}/chat`),
    postChat: (id, text) => j(`/${id}/chat`, { method: 'POST', body: JSON.stringify({ text }) }),
    create: (p) => j('', { method: 'POST', body: JSON.stringify(p) }),
    transition: (id, next) => j(`/${id}/transition`, { method: 'POST', body: JSON.stringify({ next }) }),
    register: (id) => j(`/${id}/register`, { method: 'POST', body: '{}' }),
    createPurchase: (webinarId, quantity = 1) => j('/purchases', { method: 'POST', body: JSON.stringify({ webinarId, quantity }) }),
    confirmPurchase: (id, payload) => j(`/purchases/${id}/confirm`, { method: 'POST', body: JSON.stringify(payload) }),
    listPurchases: () => j('/purchases'),
    donate: (id, payload) => j(`/${id}/donate`, { method: 'POST', body: JSON.stringify(payload) }),
  };
};
