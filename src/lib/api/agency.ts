/**
 * Domain 13 — Agency typed envelope client.
 * Thin TanStack-Query-friendly wrapper around the live NestJS endpoints
 * exposed by `apps/api-nest/src/modules/agency`. Mirrors the shape of the
 * existing in-memory page mocks so swapping is mechanical.
 *
 * Auth: bearer token from localStorage 'gigvora.token' (when present).
 * Base URL: VITE_GIGVORA_API_URL or '/api' (relative fallback).
 */

const baseUrl =
  ((import.meta as any).env?.VITE_GIGVORA_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  try {
    const tok = localStorage.getItem('gigvora.token');
    if (tok) headers.set('Authorization', `Bearer ${tok}`);
  } catch { /* SSR/no-storage */ }
  const r = await fetch(`${baseUrl}${path}`, { ...init, headers });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}

const qs = (q: Record<string, unknown>) => {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => { if (v != null && v !== '') p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

// ---- DTO surface (kept close to the NestJS DTOs) ---------------------------
export type AgencyStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface AgencyEnvelope {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  tagline?: string | null;
  industry?: string | null;
  size?: string | null;
  founded?: string | null;
  headquarters?: string | null;
  website?: string | null;
  about?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  specialties: string[];
  languages: string[];
  engagementModels: string[];
  values: string[];
  status: AgencyStatus;
  visibility: 'public' | 'network' | 'private';
  verified: boolean;
  acceptingProjects: boolean;
  followerCount: number;
  ratingAvg: number;        // x100
  ratingCount: number;
  completedProjects: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyServiceItem {
  id: string; agencyId: string; name: string; description?: string | null;
  priceFromCents?: number | null; priceToCents?: number | null; currency: string;
  duration?: string | null; popular: boolean; status: 'active'|'paused'|'archived'; position: number;
}

export interface AgencyTeamItem {
  id: string; agencyId: string; identityId?: string | null; name: string; role: string;
  skills: string[]; available: boolean; badge?: string | null; avatarUrl?: string | null; position: number;
}

export interface AgencyCaseStudy {
  id: string; agencyId: string; title: string; client?: string | null; outcome?: string | null;
  body?: string | null; coverUrl?: string | null; tags: string[];
  status: 'draft'|'pending'|'published'|'archived'|'rejected'; views: number;
  publishedAt?: string | null; createdAt: string; updatedAt: string;
}

export interface AgencyReview {
  id: string; agencyId: string; authorId?: string | null; authorName?: string | null;
  authorCompany?: string | null; rating: number; title?: string | null; body?: string | null;
  pros?: string | null; cons?: string | null; status: 'visible'|'hidden'|'flagged'; createdAt: string;
}

export interface AgencyProof {
  id: string; agencyId: string; kind: string; label: string; issuer?: string | null;
  evidenceUrl?: string | null; issuedAt?: string | null; expiresAt?: string | null;
  verified: boolean; verifiedAt?: string | null;
}

export interface AgencyInquiry {
  id: string; agencyId: string; serviceId?: string | null; contactName: string;
  contactEmail: string; company?: string | null; budget?: string | null; message: string;
  status: 'new'|'contacted'|'qualified'|'won'|'lost'|'spam'; createdAt: string;
}

export interface AgencySummary {
  views7d: number; followers: number; inquiriesOpen: number; inquiriesTotal: number;
  caseStudiesPublished: number; ratingAvg: number; ratingCount: number; healthBand: 'healthy'|'watch'|'at_risk';
}

export interface ListEnvelope<T> { items: T[]; total: number; limit: number; hasMore: boolean }

// ---- API namespace ---------------------------------------------------------
export const agencyApi = {
  list: (q: Partial<{ q: string; industry: string; status: AgencyStatus; limit: number; offset: number }> = {}) =>
    req<ListEnvelope<AgencyEnvelope>>(`/api/v1/agencies${qs(q)}`),

  detail: (idOrSlug: string) =>
    req<AgencyEnvelope>(`/api/v1/agencies/${encodeURIComponent(idOrSlug)}`),

  services: (id: string) => req<ListEnvelope<AgencyServiceItem>>(`/api/v1/agencies/${id}/services`),
  team:     (id: string) => req<ListEnvelope<AgencyTeamItem>>(`/api/v1/agencies/${id}/team`),
  caseStudies: (id: string) => req<ListEnvelope<AgencyCaseStudy>>(`/api/v1/agencies/${id}/case-studies`),
  reviews:  (id: string) => req<ListEnvelope<AgencyReview>>(`/api/v1/agencies/${id}/reviews`),
  proofs:   (id: string) => req<ListEnvelope<AgencyProof>>(`/api/v1/agencies/${id}/proofs`),
  summary:  (id: string) => req<AgencySummary>(`/api/v1/agencies/${id}/summary`),
  inquiries:(id: string) => req<ListEnvelope<AgencyInquiry>>(`/api/v1/agencies/${id}/inquiries`),

  follow:   (id: string) => req<{ ok: true }>(`/api/v1/agencies/${id}/follow`,   { method: 'POST' }),
  unfollow: (id: string) => req<{ ok: true }>(`/api/v1/agencies/${id}/unfollow`, { method: 'POST' }),

  createInquiry: (id: string, body: Omit<AgencyInquiry, 'id'|'agencyId'|'status'|'createdAt'> & { consent?: { marketing?: boolean } }) =>
    req<AgencyInquiry>(`/api/v1/agencies/${id}/inquiries`, { method: 'POST', body: JSON.stringify(body) }),

  publish:  (id: string) => req<AgencyEnvelope>(`/api/v1/agencies/${id}/publish`, { method: 'POST' }),
  pause:    (id: string) => req<AgencyEnvelope>(`/api/v1/agencies/${id}/pause`,   { method: 'POST' }),
  archive:  (id: string) => req<{ ok: true }>(`/api/v1/agencies/${id}`, { method: 'DELETE' }),
  restore:  (id: string) => req<AgencyEnvelope>(`/api/v1/agencies/${id}/restore`, { method: 'POST' }),

  update: (id: string, patch: Partial<AgencyEnvelope>) =>
    req<AgencyEnvelope>(`/api/v1/agencies/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
};

/** True only when an API base URL is configured. Pages should fall back to mock data otherwise. */
export const agencyApiAvailable = (): boolean => baseUrl.length > 0;
