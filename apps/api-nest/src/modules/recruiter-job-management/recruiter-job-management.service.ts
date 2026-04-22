/**
 * Domain 26 application service — Recruiter Job Management.
 *
 * Surfaces:
 *   - requisition CRUD with optimistic concurrency + state machine
 *   - approver decision flow (approve/reject/escalate)
 *   - publish requisition → managed job (idempotent)
 *   - assign recruiters
 *   - bulk archive/pause/resume/cancel
 *   - managed job pause/resume/close
 *   - dashboard insights + ML priority/forecast
 *
 * Realtime events through NotificationsGateway:
 *   requisition.created, requisition.updated, requisition.transitioned,
 *   requisition.assigned, requisition.published, approval.decision,
 *   job.transitioned, dashboard.refresh
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  RecruiterJobManagementRepository,
  type ManagedJobRow, type RequisitionRow,
} from './recruiter-job-management.repository';
import { RecruiterJobManagementMlService } from './recruiter-job-management.ml.service';
import { RecruiterJobManagementAnalyticsService } from './recruiter-job-management.analytics.service';
import { D26Emit } from '../domain-bus/domain-emissions';
import type { JobStatus, RequisitionStatus } from './dto';

@Injectable()
export class RecruiterJobManagementService {
  private readonly log = new Logger('RecruiterJobMgmt');
  constructor(
    private readonly repo: RecruiterJobManagementRepository,
    private readonly ml: RecruiterJobManagementMlService,
    private readonly analytics: RecruiterJobManagementAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
    },
  ) {}

  // ---- Requisitions ----
  list(tenantId: string, f: { status?: RequisitionStatus[]; department?: string; hiringManagerId?: string; recruiterId?: string; q?: string; page: number; pageSize: number; sort: string }) {
    const rows = this.repo.list(tenantId, f);
    const sorted = [...rows].sort((a, b) => {
      switch (f.sort) {
        case 'created': return +new Date(b.createdAt) - +new Date(a.createdAt);
        case 'title': return a.title.localeCompare(b.title);
        case 'priority': return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
        default: return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      }
    });
    const start = (f.page - 1) * f.pageSize;
    return { items: sorted.slice(start, start + f.pageSize).map(this.publicReq), total: sorted.length, page: f.page, pageSize: f.pageSize };
  }

  detail(id: string) {
    const r = this.repo.get(id); if (!r) return null;
    const job = r.publishedJobId ? this.repo.job(r.publishedJobId) : null;
    return { ...this.publicReq(r), publishedJob: job ? this.publicJob(job) : null, audit: this.repo.auditFor(id) };
  }

  async create(tenantId: string, actorId: string, payload: any) {
    const row = this.repo.create(tenantId, actorId, payload);
    const [p, f] = await Promise.all([this.ml.priority(row), this.ml.forecast(row)]);
    this.repo.setIntelligence(row.id, p.priorityScore ?? 50, f.forecastDaysToFill ?? 30, f.riskFlags ?? []);
    const fresh = this.repo.get(row.id)!;
    this.gateway?.emitToTopic(`tenant:${tenantId}:requisitions`, 'requisition.created', { id: fresh.id });
    return this.publicReq(fresh);
  }

  update(id: string, expectedVersion: number, patch: any, actorId: string) {
    const row = this.repo.update(id, expectedVersion, patch, actorId);
    this.gateway?.emitToTopic(`tenant:${row.tenantId}:requisitions`, 'requisition.updated', { id: row.id, version: row.version });
    return this.publicReq(row);
  }

  transition(id: string, next: RequisitionStatus, actorId: string, reason?: string) {
    const row = this.repo.transition(id, next, actorId, reason);
    this.gateway?.emitToTopic(`tenant:${row.tenantId}:requisitions`, 'requisition.transitioned', { id, status: next });
    if (next === 'approved') {
      D26Emit.approved(row.tenantId, id, { requisitionId: id, actorId, reason, status: next, title: row.title });
    }
    if (next === 'opened') {
      D26Emit.opened(row.tenantId, id, { requisitionId: id, actorId, reason, status: next, title: row.title });
    }
    if (next === 'filled' || next === 'cancelled' || next === 'archived') {
      D26Emit.closed(row.tenantId, id, { requisitionId: id, actorId, reason, status: next, title: row.title });
    }
    if (next === 'pending_approval') {
      row.approvers.filter((a) => a.status === 'pending').forEach((a) => {
        this.gateway?.emitToUser(a.userId, 'approval.pending', { requisitionId: id, title: row.title });
      });
    }
    return this.publicReq(row);
  }

  decideApproval(id: string, approverId: string, decision: 'approve' | 'reject' | 'escalate', note?: string) {
    const row = this.repo.decideApproval(id, approverId, decision, note);
    this.gateway?.emitToTopic(`tenant:${row.tenantId}:requisitions`, 'approval.decision', { requisitionId: id, decision, status: row.status });
    this.gateway?.emitToUser(row.createdBy, 'approval.decision', { requisitionId: id, decision });
    return this.publicReq(row);
  }

  assign(id: string, recruiterIds: string[], actorId: string) {
    const row = this.repo.assign(id, recruiterIds, actorId);
    this.gateway?.emitToTopic(`tenant:${row.tenantId}:requisitions`, 'requisition.assigned', { id, recruiterIds });
    recruiterIds.forEach((u) => this.gateway?.emitToUser(u, 'requisition.assigned', { requisitionId: id, title: row.title }));
    return this.publicReq(row);
  }

  publish(id: string, idempotencyKey: string, channels: string[], actorId: string) {
    const { requisition, job } = this.repo.publishToJob(id, channels, idempotencyKey, actorId);
    this.gateway?.emitToTopic(`tenant:${requisition.tenantId}:requisitions`, 'requisition.published', { id, jobId: job.id });
    D26Emit.opened(requisition.tenantId, id, { requisitionId: id, jobId: job.id, actorId, channels, status: requisition.status });
    return { requisition: this.publicReq(requisition), job: this.publicJob(job) };
  }

  bulk(tenantId: string, ids: string[], action: 'archive' | 'pause' | 'resume' | 'cancel', actorId: string, reason?: string) {
    const map: Record<typeof action, RequisitionStatus> = { archive: 'archived', pause: 'paused', resume: 'opened', cancel: 'cancelled' };
    const next = map[action];
    const results = ids.map((id) => {
      try { return { id, ok: true, row: this.publicReq(this.repo.transition(id, next, actorId, reason)) }; }
      catch (e) { return { id, ok: false, error: (e as Error).message }; }
    });
    this.gateway?.emitToTopic(`tenant:${tenantId}:requisitions`, 'requisition.bulk', { action, count: ids.length });
    return { results };
  }

  // ---- Managed jobs ----
  listJobs(tenantId: string, f: { status?: JobStatus[]; q?: string; page: number; pageSize: number; sort: string }) {
    const rows = this.repo.listJobs(tenantId, f);
    const sorted = [...rows].sort((a, b) => {
      switch (f.sort) {
        case 'created': return +new Date(b.createdAt) - +new Date(a.createdAt);
        case 'title': return a.title.localeCompare(b.title);
        case 'applicants': return b.applicantsTotal - a.applicantsTotal;
        default: return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      }
    });
    const start = (f.page - 1) * f.pageSize;
    return { items: sorted.slice(start, start + f.pageSize).map(this.publicJob), total: sorted.length, page: f.page, pageSize: f.pageSize };
  }

  transitionJob(id: string, next: JobStatus, actorId: string) {
    const j = this.repo.transitionJob(id, next, actorId);
    this.gateway?.emitToTopic(`tenant:${j.tenantId}:requisitions`, 'job.transitioned', { id, status: next });
    if (next === 'closed' || next === 'archived') {
      D26Emit.closed(j.tenantId, j.requisitionId, { requisitionId: j.requisitionId, jobId: id, actorId, status: next });
    }
    return this.publicJob(j);
  }

  dashboard(tenantId: string) { return this.analytics.dashboard(tenantId); }

  // ---- mappers ----
  private publicReq = (r: RequisitionRow) => ({
    id: r.id, tenantId: r.tenantId,
    title: r.title, department: r.department, location: r.location,
    employmentType: r.employmentType, seniority: r.seniority,
    headcount: r.headcount, budgetAnnualGbp: r.budgetAnnualGbp,
    hiringManagerId: r.hiringManagerId, recruiterIds: r.recruiterIds,
    description: r.description, mustHaves: r.mustHaves, niceToHaves: r.niceToHaves,
    approvers: r.approvers, status: r.status,
    priorityScore: r.priorityScore, forecastDaysToFill: r.forecastDaysToFill, riskFlags: r.riskFlags,
    publishedJobId: r.publishedJobId,
    targetStartDate: r.targetStartDate, openedAt: r.openedAt, filledAt: r.filledAt, cancelledAt: r.cancelledAt, cancelReason: r.cancelReason,
    createdAt: r.createdAt, updatedAt: r.updatedAt, version: r.version, createdBy: r.createdBy,
  });

  private publicJob = (j: ManagedJobRow) => ({
    id: j.id, requisitionId: j.requisitionId, title: j.title, status: j.status,
    postingChannels: j.postingChannels,
    applicantsTotal: j.applicantsTotal, applicantsNew: j.applicantsNew, applicantsInPipeline: j.applicantsInPipeline,
    daysOpen: j.daysOpen, createdAt: j.createdAt, updatedAt: j.updatedAt,
  });
}
