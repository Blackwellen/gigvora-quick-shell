/**
 * Typed SDK for Domain 24 — Job Posting Studio, Credits, Publication Controls.
 *
 *  - Optimistic concurrency on edits (pass expectedVersion).
 *  - Multi-step credit checkout (createPurchase → confirmPurchase) per checkout rule.
 *  - Publish requires an idempotency key.
 */
export type JobStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'expired' | 'archived' | 'rejected';

export interface JobSummary {
  id: string; tenantId: string;
  owner: { id: string; name: string };
  title: string; summary: string; description: string;
  employment: string; workplace: string; location: string;
  salary: { minCents: number; maxCents: number; currency: string } | null;
  skills: string[]; benefits: string[]; applyUrl: string | null;
  visibility: string; promoted: boolean; promotionTier: string;
  status: JobStatus; channels: string[];
  applications: number; impressions: number;
  publishedAt: string | null; expiresAt: string | null;
  createdAt: string; updatedAt: string; version: number;
}

export interface ListFilters { q?: string; status?: JobStatus[]; page?: number; pageSize?: number; sort?: 'updated' | 'created' | 'title' | 'applications' }

export interface CreditPack { id: string; postings: number; priceCents: number; currency: string }

export interface JobPostingStudioClient {
  list(f: ListFilters): Promise<{ items: JobSummary[]; total: number; page: number; pageSize: number }>;
  detail(id: string): Promise<JobSummary & { approval: any; audit: any[] }>;
  create(payload: any): Promise<JobSummary>;
  update(id: string, expectedVersion: number, patch: any): Promise<JobSummary>;
  quality(id: string): Promise<{ score: number; tips: string[]; mode: string }>;
  moderate(id: string): Promise<{ risk: number; flags: string[]; mode: string }>;
  submit(id: string): Promise<any>;
  decide(id: string, decision: 'approve' | 'reject' | 'request_changes', note?: string): Promise<any>;
  publish(id: string, body: { promotionTier?: string; durationDays?: number; channels?: string[]; idempotencyKey: string }): Promise<JobSummary>;
  pause(id: string): Promise<JobSummary>;
  resume(id: string): Promise<JobSummary>;
  archive(id: string): Promise<JobSummary>;
  approvalQueue(): Promise<any[]>;
  packs(): Promise<CreditPack[]>;
  balance(): Promise<{ balance: number; ledger: any[] }>;
  createPurchase(packId: CreditPack['id']): Promise<{ id: string; postings: number; amountCents: number; currency: string; status: string }>;
  confirmPurchase(purchaseId: string, payload: { paymentMethod: 'card' | 'invoice' | 'wallet'; billing: { name: string; email: string; country: string; vatId?: string }; acceptTos: true }): Promise<{ id: string; status: string; receiptUrl: string | null }>;
  listPurchases(): Promise<any[]>;
  insights(): Promise<any>;
}

export const createJobPostingStudioClient = (fetcher: typeof fetch, base = '/api/v1/job-posting-studio'): JobPostingStudioClient => {
  const j = async (p: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${p}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`job-posting-studio ${p} ${r.status}`);
    return r.json();
  };
  const qs = (f: ListFilters) => {
    const u = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v !== undefined && (Array.isArray(v) ? v.forEach((x) => u.append(k, String(x))) : u.set(k, String(v))));
    return u.toString();
  };
  return {
    list: (f) => j(`/jobs?${qs(f)}`),
    detail: (id) => j(`/jobs/${id}`),
    create: (p) => j('/jobs', { method: 'POST', body: JSON.stringify(p) }),
    update: (id, expectedVersion, patch) => j(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify({ expectedVersion, patch }) }),
    quality: (id) => j(`/jobs/${id}/quality`),
    moderate: (id) => j(`/jobs/${id}/moderate`),
    submit: (id) => j(`/jobs/${id}/submit`, { method: 'POST', body: '{}' }),
    decide: (id, decision, note) => j(`/jobs/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, note }) }),
    publish: (id, body) => j(`/jobs/${id}/publish`, { method: 'POST', body: JSON.stringify(body) }),
    pause: (id) => j(`/jobs/${id}/pause`, { method: 'POST', body: '{}' }),
    resume: (id) => j(`/jobs/${id}/resume`, { method: 'POST', body: '{}' }),
    archive: (id) => j(`/jobs/${id}/archive`, { method: 'POST', body: '{}' }),
    approvalQueue: () => j('/approvals'),
    packs: () => j('/credits/packs'),
    balance: () => j('/credits/balance'),
    createPurchase: (packId) => j('/credits/purchases', { method: 'POST', body: JSON.stringify({ packId }) }),
    confirmPurchase: (id, payload) => j(`/credits/purchases/${id}/confirm`, { method: 'POST', body: JSON.stringify(payload) }),
    listPurchases: () => j('/credits/purchases'),
    insights: () => j('/insights'),
  };
};
