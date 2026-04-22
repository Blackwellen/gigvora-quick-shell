/**
 * Typed SDK for Domain 26 — Recruiter Job Management & Role Requisition Controls.
 */
export type RequisitionStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'opened' | 'paused'
  | 'filled' | 'cancelled' | 'archived';

export type JobStatus = 'draft' | 'active' | 'paused' | 'closed' | 'archived';

export interface Approver {
  userId: string; name: string; role: string; order: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  decidedAt: string | null; note: string | null;
}

export interface Requisition {
  id: string; tenantId: string;
  title: string; department: string; location: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'executive';
  headcount: number; budgetAnnualGbp: number | null;
  hiringManagerId: string; recruiterIds: string[];
  description: string; mustHaves: string[]; niceToHaves: string[];
  approvers: Approver[];
  status: RequisitionStatus;
  priorityScore: number | null; forecastDaysToFill: number | null; riskFlags: string[];
  publishedJobId: string | null;
  targetStartDate: string | null; openedAt: string | null; filledAt: string | null;
  cancelledAt: string | null; cancelReason: string | null;
  createdAt: string; updatedAt: string; version: number; createdBy: string;
}

export interface ManagedJob {
  id: string; requisitionId: string; title: string; status: JobStatus;
  postingChannels: string[];
  applicantsTotal: number; applicantsNew: number; applicantsInPipeline: number;
  daysOpen: number; createdAt: string; updatedAt: string;
}

export interface RequisitionListFilters {
  status?: RequisitionStatus[]; department?: string; hiringManagerId?: string; recruiterId?: string;
  q?: string; page?: number; pageSize?: number; sort?: 'updated' | 'created' | 'title' | 'priority';
}

export interface JobListFilters {
  status?: JobStatus[]; q?: string; page?: number; pageSize?: number;
  sort?: 'updated' | 'created' | 'title' | 'applicants';
}

export interface RecruiterJobManagementClient {
  list(filters: RequisitionListFilters): Promise<{ items: Requisition[]; total: number; page: number; pageSize: number }>;
  detail(id: string): Promise<Requisition & { publishedJob: ManagedJob | null; audit: any[] }>;
  create(payload: Partial<Requisition> & { title: string; department: string; location: string; hiringManagerId: string }): Promise<Requisition>;
  update(id: string, expectedVersion: number, patch: Partial<Requisition>): Promise<Requisition>;
  transition(id: string, next: RequisitionStatus, reason?: string): Promise<Requisition>;
  approve(id: string, decision: 'approve' | 'reject' | 'escalate', note?: string): Promise<Requisition>;
  assign(id: string, recruiterIds: string[]): Promise<Requisition>;
  publish(id: string, idempotencyKey: string, channels?: string[]): Promise<{ requisition: Requisition; job: ManagedJob }>;
  bulk(body: { ids: string[]; action: 'archive' | 'pause' | 'resume' | 'cancel'; reason?: string }): Promise<{ results: { id: string; ok: boolean; row?: Requisition; error?: string }[] }>;

  listJobs(filters: JobListFilters): Promise<{ items: ManagedJob[]; total: number; page: number; pageSize: number }>;
  jobTransition(id: string, next: JobStatus): Promise<ManagedJob>;

  dashboard(): Promise<any>;
}

export const createRecruiterJobManagementClient = (fetcher: typeof fetch, base = '/api/v1/recruiter-job-management'): RecruiterJobManagementClient => {
  const j = async (p: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${p}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`recruiter-job-management ${p} ${r.status}`);
    return r.json();
  };
  const qs = (f: Record<string, unknown>) => {
    const u = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v !== undefined && (Array.isArray(v) ? v.forEach((x) => u.append(k, String(x))) : u.set(k, String(v))));
    return u.toString();
  };
  return {
    list: (f) => j(`/requisitions?${qs(f as any)}`),
    detail: (id) => j(`/requisitions/${id}`),
    create: (p) => j('/requisitions', { method: 'POST', body: JSON.stringify(p) }),
    update: (id, expectedVersion, patch) => j(`/requisitions/${id}`, { method: 'PUT', body: JSON.stringify({ expectedVersion, patch }) }),
    transition: (id, next, reason) => j(`/requisitions/${id}/transition`, { method: 'POST', body: JSON.stringify({ next, reason }) }),
    approve: (id, decision, note) => j(`/requisitions/${id}/approval`, { method: 'POST', body: JSON.stringify({ decision, note }) }),
    assign: (id, recruiterIds) => j(`/requisitions/${id}/assign`, { method: 'POST', body: JSON.stringify({ recruiterIds }) }),
    publish: (id, idempotencyKey, channels) => j(`/requisitions/${id}/publish`, { method: 'POST', body: JSON.stringify({ idempotencyKey, postingChannels: channels ?? ['internal', 'careers_site'] }) }),
    bulk: (body) => j('/requisitions/bulk', { method: 'POST', body: JSON.stringify(body) }),

    listJobs: (f) => j(`/jobs?${qs(f as any)}`),
    jobTransition: (id, next) => j(`/jobs/${id}/transition`, { method: 'POST', body: JSON.stringify({ next }) }),

    dashboard: () => j('/dashboard'),
  };
};
