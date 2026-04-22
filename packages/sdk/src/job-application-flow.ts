/**
 * Typed SDK for Domain 25 — Job Application Flow, Candidate Forms, Submission Review.
 *
 *  - Optimistic concurrency on candidate edits (pass expectedVersion).
 *  - Idempotent submission (idempotencyKey).
 *  - Recruiter decisions and bulk actions.
 */
export type ApplicationStatus =
  | 'draft' | 'submitted' | 'under_review' | 'interview' | 'on_hold'
  | 'offered' | 'rejected' | 'withdrawn' | 'archived';

export type FormFieldType =
  | 'short_text' | 'long_text' | 'email' | 'phone' | 'url'
  | 'select' | 'multi_select' | 'file' | 'date' | 'number' | 'boolean' | 'address';

export interface FormField {
  key: string; label: string; type: FormFieldType; required: boolean;
  helpText?: string; options?: string[]; maxLength?: number; acceptMime?: string[];
  visibility?: 'public' | 'private' | 'internal';
}

export interface FormTemplate {
  id: string; tenantId: string; jobId: string;
  title: string; description: string;
  fields: FormField[];
  consents: { key: string; label: string; required: boolean }[];
  status: 'draft' | 'published' | 'archived';
  version: number; createdAt: string; updatedAt: string;
}

export interface Attachment {
  key: string; fileName: string; storageUrl: string; sizeBytes: number; mime: string;
}

export interface Application {
  id: string; tenantId: string; jobId: string; templateId: string;
  candidate: { id: string; name: string; email: string };
  responses: Record<string, unknown>;
  attachments: Attachment[];
  acceptedConsents: string[];
  voluntary: { diversity?: Record<string, string> } | null;
  status: ApplicationStatus;
  qualityScore: number | null;
  matchScore: number | null;
  riskFlags: string[];
  submittedAt: string | null; decidedAt: string | null;
  withdrawnAt: string | null; withdrawReason: string | null;
  createdAt: string; updatedAt: string; version: number;
}

export interface ApplicationListFilters {
  jobId?: string;
  status?: ApplicationStatus[];
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: 'updated' | 'submitted' | 'score' | 'title';
}

export interface JobApplicationFlowClient {
  // templates
  listTemplates(jobId?: string): Promise<{ items: FormTemplate[] }>;
  template(id: string): Promise<FormTemplate>;
  createTemplate(payload: Partial<FormTemplate> & { jobId: string; title: string; fields: FormField[] }): Promise<FormTemplate>;
  updateTemplate(id: string, patch: Partial<FormTemplate>): Promise<FormTemplate>;
  publishTemplate(id: string): Promise<FormTemplate>;
  archiveTemplate(id: string): Promise<FormTemplate>;

  // applications
  list(filters: ApplicationListFilters): Promise<{ items: Application[]; total: number; page: number; pageSize: number }>;
  detail(id: string): Promise<Application & { reviews: any[]; audit: any[] }>;
  createDraft(payload: { jobId: string; templateId: string; responses?: Record<string, unknown>; attachments?: Attachment[]; acceptedConsents?: string[]; voluntary?: any }): Promise<Application>;
  update(id: string, expectedVersion: number, patch: any): Promise<Application>;
  submit(id: string, idempotencyKey: string): Promise<Application>;
  withdraw(id: string, reason?: string): Promise<Application>;

  // reviews
  reviewQueue(): Promise<{ items: Application[] }>;
  decide(id: string, body: { decision: 'advance' | 'reject' | 'hold' | 'offer' | 'withdraw_invite'; stage?: 'screening' | 'interview' | 'final' | 'offer'; note?: string; scorecard?: Record<string, number> }): Promise<{ review: any; application: Application | null }>;
  bulk(body: { ids: string[]; action: 'advance' | 'reject' | 'archive' | 'hold'; note?: string }): Promise<{ results: { id: string; ok: boolean; app?: Application; error?: string }[] }>;

  insights(jobId?: string): Promise<any>;
}

export const createJobApplicationFlowClient = (fetcher: typeof fetch, base = '/api/v1/job-application-flow'): JobApplicationFlowClient => {
  const j = async (p: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${p}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`job-application-flow ${p} ${r.status}`);
    return r.json();
  };
  const qs = (f: Record<string, unknown>) => {
    const u = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v !== undefined && (Array.isArray(v) ? v.forEach((x) => u.append(k, String(x))) : u.set(k, String(v))));
    return u.toString();
  };
  return {
    listTemplates: (jobId) => j(`/templates${jobId ? `?jobId=${encodeURIComponent(jobId)}` : ''}`),
    template: (id) => j(`/templates/${id}`),
    createTemplate: (p) => j('/templates', { method: 'POST', body: JSON.stringify(p) }),
    updateTemplate: (id, patch) => j(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
    publishTemplate: (id) => j(`/templates/${id}/publish`, { method: 'POST', body: '{}' }),
    archiveTemplate: (id) => j(`/templates/${id}/archive`, { method: 'POST', body: '{}' }),

    list: (f) => j(`/applications?${qs(f as any)}`),
    detail: (id) => j(`/applications/${id}`),
    createDraft: (p) => j('/applications', { method: 'POST', body: JSON.stringify(p) }),
    update: (id, expectedVersion, patch) => j(`/applications/${id}`, { method: 'PUT', body: JSON.stringify({ expectedVersion, patch }) }),
    submit: (id, idempotencyKey) => j(`/applications/${id}/submit`, { method: 'POST', body: JSON.stringify({ idempotencyKey }) }),
    withdraw: (id, reason) => j(`/applications/${id}/withdraw`, { method: 'POST', body: JSON.stringify({ reason }) }),

    reviewQueue: () => j('/reviews/queue'),
    decide: (id, body) => j(`/applications/${id}/decision`, { method: 'POST', body: JSON.stringify(body) }),
    bulk: (body) => j('/applications/bulk', { method: 'POST', body: JSON.stringify(body) }),

    insights: (jobId) => j(`/insights${jobId ? `?jobId=${encodeURIComponent(jobId)}` : ''}`),
  };
};
