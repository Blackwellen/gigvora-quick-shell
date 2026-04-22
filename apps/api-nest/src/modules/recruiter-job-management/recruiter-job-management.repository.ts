/**
 * Domain 26 repository — Recruiter Job Management & Role Requisition Controls.
 *
 * In-memory + seeded persistence aligned with future Drizzle tables:
 *   recruiter_requisitions, recruiter_requisition_approvers,
 *   recruiter_managed_jobs, recruiter_requisition_audit.
 *
 * State machines enforced here:
 *   Requisition: draft → pending_approval → approved → opened → paused ↔ opened → filled | cancelled → archived
 *   Job:         draft → active → paused ↔ active → closed → archived
 *   Approval:    pending → approved | rejected | escalated
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { RequisitionStatus, JobStatus } from './dto';

export type ApproverRow = {
  userId: string; name: string; role: string; order: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  decidedAt: string | null; note: string | null;
};

export type RequisitionRow = {
  id: string; tenantId: string;
  title: string; department: string; location: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'executive';
  headcount: number; budgetAnnualGbp: number | null;
  hiringManagerId: string; recruiterIds: string[];
  description: string; mustHaves: string[]; niceToHaves: string[];
  approvers: ApproverRow[];
  status: RequisitionStatus;
  priorityScore: number | null;
  forecastDaysToFill: number | null;
  riskFlags: string[];
  publishedJobId: string | null;
  targetStartDate: string | null;
  openedAt: string | null;
  filledAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string; updatedAt: string; version: number;
  createdBy: string;
};

export type ManagedJobRow = {
  id: string; tenantId: string; requisitionId: string;
  title: string; status: JobStatus;
  postingChannels: string[];
  applicantsTotal: number;
  applicantsNew: number;
  applicantsInPipeline: number;
  daysOpen: number;
  createdAt: string; updatedAt: string;
};

type AuditRow = { id: string; requisitionId: string | null; tenantId: string; actor: string; action: string; diff: any; at: string };

const REQ_ALLOWED: Record<RequisitionStatus, RequisitionStatus[]> = {
  draft: ['pending_approval', 'cancelled', 'archived'],
  pending_approval: ['approved', 'cancelled', 'draft'],
  approved: ['opened', 'cancelled'],
  opened: ['paused', 'filled', 'cancelled'],
  paused: ['opened', 'cancelled', 'archived'],
  filled: ['archived'],
  cancelled: ['archived'],
  archived: [],
};

const JOB_ALLOWED: Record<JobStatus, JobStatus[]> = {
  draft: ['active', 'archived'],
  active: ['paused', 'closed'],
  paused: ['active', 'closed'],
  closed: ['archived'],
  archived: [],
};

@Injectable()
export class RecruiterJobManagementRepository {
  private readonly log = new Logger('RecruiterJobMgmtRepo');
  private requisitions = new Map<string, RequisitionRow>();
  private jobs = new Map<string, ManagedJobRow>();
  private audit: AuditRow[] = [];
  private idempotency = new Map<string, string>();

  constructor() { this.seed(); }

  private seed() {
    const tenantId = 'tenant-demo';
    const samples: Array<Partial<RequisitionRow> & { title: string; status: RequisitionStatus }> = [
      { title: 'Senior Backend Engineer', department: 'Engineering', location: 'Remote · UK', status: 'opened', headcount: 2, seniority: 'senior' },
      { title: 'Product Designer', department: 'Design', location: 'London', status: 'pending_approval', headcount: 1 },
      { title: 'Lead Recruiter', department: 'People', location: 'Remote · EU', status: 'approved', headcount: 1, seniority: 'lead' },
      { title: 'Customer Success Manager', department: 'CS', location: 'Manchester', status: 'paused', headcount: 1 },
      { title: 'Data Engineer', department: 'Engineering', location: 'Remote · UK', status: 'draft', headcount: 1, seniority: 'mid' },
    ];

    samples.forEach((s, i) => {
      const id = randomUUID();
      const now = new Date(Date.now() - (i + 1) * 86_400_000).toISOString();
      const approvers: ApproverRow[] = [
        { userId: 'mgr-jordan', name: 'Jordan Hiring Manager', role: 'Hiring Manager', order: 0,
          status: s.status === 'pending_approval' ? 'pending' : 'approved', decidedAt: s.status === 'pending_approval' ? null : now, note: null },
        { userId: 'fin-mira', name: 'Mira Finance', role: 'Finance', order: 1,
          status: s.status === 'approved' || s.status === 'opened' || s.status === 'paused' || s.status === 'filled' ? 'approved' : 'pending', decidedAt: null, note: null },
      ];
      const row: RequisitionRow = {
        id, tenantId,
        title: s.title, department: s.department!, location: s.location!,
        employmentType: 'full_time', seniority: (s.seniority as any) ?? 'mid',
        headcount: s.headcount ?? 1, budgetAnnualGbp: 95_000 + i * 5_000,
        hiringManagerId: 'mgr-jordan', recruiterIds: ['rec-alex'],
        description: 'Detailed JD here…', mustHaves: ['TypeScript', 'Postgres'], niceToHaves: ['Kafka'],
        approvers, status: s.status,
        priorityScore: 50 + i * 8, forecastDaysToFill: 18 + i * 3, riskFlags: [],
        publishedJobId: null,
        targetStartDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        openedAt: ['opened', 'paused', 'filled'].includes(s.status) ? now : null,
        filledAt: null, cancelledAt: null, cancelReason: null,
        createdAt: now, updatedAt: now, version: 1, createdBy: 'rec-alex',
      };
      this.requisitions.set(id, row);

      if (row.status === 'opened' || row.status === 'paused') {
        const jobId = randomUUID();
        this.jobs.set(jobId, {
          id: jobId, tenantId, requisitionId: id,
          title: row.title, status: row.status === 'opened' ? 'active' : 'paused',
          postingChannels: ['internal', 'careers_site'],
          applicantsTotal: 12 + i * 6, applicantsNew: 2 + i, applicantsInPipeline: 4 + i,
          daysOpen: i * 4 + 6, createdAt: now, updatedAt: now,
        });
        row.publishedJobId = jobId;
      }
    });
    this.log.log(`seeded ${this.requisitions.size} requisitions, ${this.jobs.size} managed jobs`);
  }

  // ---- Requisitions ----
  list(tenantId: string, f: { status?: RequisitionStatus[]; department?: string; hiringManagerId?: string; recruiterId?: string; q?: string }) {
    return [...this.requisitions.values()].filter((r) => {
      if (r.tenantId !== tenantId) return false;
      if (f.status?.length && !f.status.includes(r.status)) return false;
      if (f.department && r.department !== f.department) return false;
      if (f.hiringManagerId && r.hiringManagerId !== f.hiringManagerId) return false;
      if (f.recruiterId && !r.recruiterIds.includes(f.recruiterId)) return false;
      if (f.q) {
        const blob = `${r.title} ${r.department} ${r.location} ${r.description}`.toLowerCase();
        if (!blob.includes(f.q.toLowerCase())) return false;
      }
      return true;
    });
  }
  get(id: string) { return this.requisitions.get(id); }

  create(tenantId: string, actorId: string, payload: any): RequisitionRow {
    const now = new Date().toISOString();
    const approvers: ApproverRow[] = (payload.approvers ?? []).map((a: any) => ({
      ...a, status: 'pending' as const, decidedAt: null, note: null,
    }));
    const row: RequisitionRow = {
      id: randomUUID(), tenantId,
      title: payload.title, department: payload.department, location: payload.location,
      employmentType: payload.employmentType ?? 'full_time',
      seniority: payload.seniority ?? 'mid',
      headcount: payload.headcount ?? 1, budgetAnnualGbp: payload.budgetAnnualGbp ?? null,
      hiringManagerId: payload.hiringManagerId, recruiterIds: payload.recruiterIds ?? [],
      description: payload.description ?? '', mustHaves: payload.mustHaves ?? [], niceToHaves: payload.niceToHaves ?? [],
      approvers, status: 'draft',
      priorityScore: null, forecastDaysToFill: null, riskFlags: [],
      publishedJobId: null,
      targetStartDate: payload.targetStartDate ?? null,
      openedAt: null, filledAt: null, cancelledAt: null, cancelReason: null,
      createdAt: now, updatedAt: now, version: 1, createdBy: actorId,
    };
    this.requisitions.set(row.id, row);
    this.audit.push({ id: randomUUID(), requisitionId: row.id, tenantId, actor: actorId, action: 'requisition.created', diff: null, at: now });
    return row;
  }

  update(id: string, expectedVersion: number, patch: any, actorId: string): RequisitionRow {
    const r = this.get(id); if (!r) throw new Error('not_found');
    if (r.version !== expectedVersion) throw new Error('version_conflict');
    if (r.status !== 'draft' && r.status !== 'pending_approval') throw new Error('locked_for_edit');
    Object.assign(r, patch, { updatedAt: new Date().toISOString(), version: r.version + 1 });
    this.audit.push({ id: randomUUID(), requisitionId: id, tenantId: r.tenantId, actor: actorId, action: 'requisition.updated', diff: patch, at: r.updatedAt });
    return r;
  }

  transition(id: string, next: RequisitionStatus, actorId: string, reason?: string): RequisitionRow {
    const r = this.get(id); if (!r) throw new Error('not_found');
    if (!REQ_ALLOWED[r.status].includes(next)) throw new Error(`invalid_transition:${r.status}->${next}`);
    r.status = next; r.updatedAt = new Date().toISOString(); r.version += 1;
    if (next === 'opened' && !r.openedAt) r.openedAt = r.updatedAt;
    if (next === 'filled') r.filledAt = r.updatedAt;
    if (next === 'cancelled') { r.cancelledAt = r.updatedAt; r.cancelReason = reason ?? null; }
    this.audit.push({ id: randomUUID(), requisitionId: id, tenantId: r.tenantId, actor: actorId, action: `requisition.${next}`, diff: { reason }, at: r.updatedAt });
    return r;
  }

  decideApproval(id: string, approverId: string, decision: 'approve' | 'reject' | 'escalate', note?: string): RequisitionRow {
    const r = this.get(id); if (!r) throw new Error('not_found');
    if (r.status !== 'pending_approval') throw new Error('not_pending');
    const ap = r.approvers.find((a) => a.userId === approverId);
    if (!ap) throw new Error('not_approver');
    ap.status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'escalated';
    ap.decidedAt = new Date().toISOString(); ap.note = note ?? null;
    if (decision === 'reject') {
      r.status = 'draft'; r.updatedAt = ap.decidedAt; r.version += 1;
    } else if (decision === 'approve' && r.approvers.every((a) => a.status === 'approved')) {
      r.status = 'approved'; r.updatedAt = ap.decidedAt; r.version += 1;
    }
    this.audit.push({ id: randomUUID(), requisitionId: id, tenantId: r.tenantId, actor: approverId, action: `approval.${decision}`, diff: { note }, at: ap.decidedAt });
    return r;
  }

  assign(id: string, recruiterIds: string[], actorId: string): RequisitionRow {
    const r = this.get(id); if (!r) throw new Error('not_found');
    r.recruiterIds = recruiterIds; r.updatedAt = new Date().toISOString(); r.version += 1;
    this.audit.push({ id: randomUUID(), requisitionId: id, tenantId: r.tenantId, actor: actorId, action: 'requisition.assigned', diff: { recruiterIds }, at: r.updatedAt });
    return r;
  }

  publishToJob(id: string, channels: string[], idempotencyKey: string, actorId: string): { requisition: RequisitionRow; job: ManagedJobRow } {
    const r = this.get(id); if (!r) throw new Error('not_found');
    if (r.status !== 'approved') throw new Error('not_approved');
    const cached = this.idempotency.get(`publish:${idempotencyKey}`);
    if (cached) {
      const existing = this.jobs.get(cached);
      if (existing) return { requisition: r, job: existing };
    }
    const jobId = randomUUID(); const now = new Date().toISOString();
    const job: ManagedJobRow = {
      id: jobId, tenantId: r.tenantId, requisitionId: r.id,
      title: r.title, status: 'active', postingChannels: channels,
      applicantsTotal: 0, applicantsNew: 0, applicantsInPipeline: 0,
      daysOpen: 0, createdAt: now, updatedAt: now,
    };
    this.jobs.set(jobId, job);
    this.idempotency.set(`publish:${idempotencyKey}`, jobId);
    r.publishedJobId = jobId;
    this.transition(id, 'opened', actorId);
    this.audit.push({ id: randomUUID(), requisitionId: id, tenantId: r.tenantId, actor: actorId, action: 'requisition.published', diff: { jobId, channels }, at: now });
    return { requisition: r, job };
  }

  setIntelligence(id: string, priorityScore: number, forecastDaysToFill: number, riskFlags: string[]) {
    const r = this.get(id); if (!r) return;
    r.priorityScore = priorityScore; r.forecastDaysToFill = forecastDaysToFill; r.riskFlags = riskFlags;
    r.updatedAt = new Date().toISOString();
  }

  auditFor(id: string) { return this.audit.filter((a) => a.requisitionId === id).slice(-50).reverse(); }

  // ---- Managed jobs ----
  listJobs(tenantId: string, f: { status?: JobStatus[]; q?: string }) {
    return [...this.jobs.values()].filter((j) => {
      if (j.tenantId !== tenantId) return false;
      if (f.status?.length && !f.status.includes(j.status)) return false;
      if (f.q && !j.title.toLowerCase().includes(f.q.toLowerCase())) return false;
      return true;
    });
  }
  job(id: string) { return this.jobs.get(id); }

  transitionJob(id: string, next: JobStatus, actorId: string): ManagedJobRow {
    const j = this.job(id); if (!j) throw new Error('not_found');
    if (!JOB_ALLOWED[j.status].includes(next)) throw new Error(`invalid_transition:${j.status}->${next}`);
    j.status = next; j.updatedAt = new Date().toISOString();
    this.audit.push({ id: randomUUID(), requisitionId: j.requisitionId, tenantId: j.tenantId, actor: actorId, action: `job.${next}`, diff: null, at: j.updatedAt });
    return j;
  }
}
