/**
 * Domain 25 application service — Job Application Flow, Candidate Forms, Submission Review.
 *
 * Surfaces:
 *   - candidate form template CRUD + publish/archive
 *   - candidate draft create/update with optimistic concurrency
 *   - submit (idempotent) → triggers ML score + moderate
 *   - recruiter review queue + decisions (advance/reject/hold/offer) with scorecards
 *   - bulk decisions
 *   - candidate self-withdraw
 *   - tenant pipeline insights
 *
 * Realtime events through NotificationsGateway:
 *   application.created, application.updated, application.submitted,
 *   application.transitioned, application.withdrawn,
 *   review.decision, review.bulk
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  JobApplicationFlowRepository,
  type ApplicationRow,
  type FormTemplateRow,
  type ReviewRow,
} from './job-application-flow.repository';
import { JobApplicationFlowMlService } from './job-application-flow.ml.service';
import { JobApplicationFlowAnalyticsService } from './job-application-flow.analytics.service';
import { D25Emit } from '../domain-bus/domain-emissions';
import type { ApplicationDraft, ApplicationStatus } from './dto';

@Injectable()
export class JobApplicationFlowService {
  private readonly log = new Logger('JobApplicationFlow');
  constructor(
    private readonly repo: JobApplicationFlowRepository,
    private readonly ml: JobApplicationFlowMlService,
    private readonly analytics: JobApplicationFlowAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
    },
  ) {}

  // ---------- Templates ----------
  listTemplates(tenantId: string, jobId?: string) {
    return this.repo.listTemplates(tenantId, jobId).map(this.publicTemplate);
  }
  template(id: string) { const t = this.repo.template(id); return t ? this.publicTemplate(t) : null; }
  createTemplate(tenantId: string, payload: any) { return this.publicTemplate(this.repo.createTemplate(tenantId, payload)); }
  updateTemplate(id: string, patch: any) { return this.publicTemplate(this.repo.updateTemplate(id, patch)); }
  publishTemplate(id: string) { return this.publicTemplate(this.repo.publishTemplate(id)); }
  archiveTemplate(id: string) { return this.publicTemplate(this.repo.archiveTemplate(id)); }

  // ---------- Applications ----------
  list(tenantId: string, filters: { jobId?: string; status?: ApplicationStatus[]; q?: string; page: number; pageSize: number; sort: string }) {
    const rows = this.repo.listApplications(tenantId, filters);
    const sorted = [...rows].sort((a, b) => {
      switch (filters.sort) {
        case 'submitted': return +new Date(b.submittedAt ?? b.createdAt) - +new Date(a.submittedAt ?? a.createdAt);
        case 'score': return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
        case 'title': return a.candidateName.localeCompare(b.candidateName);
        default: return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      }
    });
    const start = (filters.page - 1) * filters.pageSize;
    return { items: sorted.slice(start, start + filters.pageSize).map(this.publicApp), total: sorted.length, page: filters.page, pageSize: filters.pageSize };
  }

  detail(applicationId: string) {
    const a = this.repo.application(applicationId); if (!a) return null;
    return { ...this.publicApp(a), reviews: this.repo.reviewsFor(applicationId), audit: this.repo.auditFor(applicationId) };
  }

  createDraft(tenantId: string, candidateId: string, name: string, email: string, payload: ApplicationDraft) {
    const tpl = this.repo.template(payload.templateId);
    if (!tpl) throw new Error('template_not_found');
    if (tpl.status !== 'published') throw new Error('template_not_published');
    const missing = tpl.consents.filter((c) => c.required && !payload.acceptedConsents?.includes(c.key));
    if (missing.length) throw new Error(`missing_required_consent:${missing.map((m) => m.key).join(',')}`);
    const row = this.repo.createDraft(tenantId, candidateId, name, email, payload);
    this.gateway?.emitToTopic(`tenant:${tenantId}:applications`, 'application.created', { id: row.id, jobId: row.jobId });
    return this.publicApp(row);
  }

  update(id: string, expectedVersion: number, patch: Partial<ApplicationDraft>, actorId: string) {
    const row = this.repo.updateApplication(id, expectedVersion, patch, actorId);
    this.gateway?.emitToTopic(`tenant:${row.tenantId}:applications`, 'application.updated', { id: row.id, version: row.version });
    return this.publicApp(row);
  }

  async submit(id: string, idempotencyKey: string, actorId: string) {
    const a = this.repo.application(id); if (!a) throw new Error('not_found');
    const stored = this.repo.consumeIdempotency(`submit:${idempotencyKey}`, a.id);
    if (stored !== a.id) return this.publicApp(a);
    const tpl = this.repo.template(a.templateId);
    if (tpl) {
      const missing = tpl.fields.filter((f) => f.required && (a.responses[f.key] == null || a.responses[f.key] === ''));
      if (missing.length) throw new Error(`missing_required:${missing.map((m) => m.key).join(',')}`);
      const missingFiles = tpl.fields.filter((f) => f.required && f.type === 'file' && !a.attachments.some((x) => x.key === f.key));
      if (missingFiles.length) throw new Error(`missing_required_attachment:${missingFiles.map((m) => m.key).join(',')}`);
    }
    const transitioned = this.repo.transition(id, 'submitted', actorId);
    const [scoreRes, modRes] = await Promise.all([this.ml.score(transitioned), this.ml.moderate(transitioned)]);
    this.repo.setScores(id, scoreRes.qualityScore ?? 50, scoreRes.matchScore ?? 50, modRes.flags ?? []);
    const fresh = this.repo.application(id)!;
    this.gateway?.emitToTopic(`tenant:${fresh.tenantId}:applications`, 'application.submitted', { id, qualityScore: fresh.qualityScore });
    this.gateway?.emitToUser(fresh.candidateId, 'application.submitted', { id, status: 'submitted' });
    D25Emit.submitted(fresh.tenantId, id, {
      applicationId: id,
      actorId,
      candidateId: fresh.candidateId,
      jobId: fresh.jobId,
      qualityScore: fresh.qualityScore,
      matchScore: fresh.matchScore,
      status: fresh.status,
    });
    return this.publicApp(fresh);
  }

  withdraw(id: string, actorId: string, reason?: string) {
    const a = this.repo.transition(id, 'withdrawn', actorId);
    a.withdrawReason = reason ?? null;
    this.gateway?.emitToTopic(`tenant:${a.tenantId}:applications`, 'application.withdrawn', { id });
    D25Emit.withdrawn(a.tenantId, id, { applicationId: id, actorId, reason, status: a.status, jobId: a.jobId });
    return this.publicApp(a);
  }

  // ---------- Reviews ----------
  reviewQueue(tenantId: string) { return this.repo.reviewQueue(tenantId).map(this.publicApp); }

  decide(applicationId: string, reviewerId: string, reviewerName: string, p: { decision: ReviewRow['decision']; stage: ReviewRow['stage']; note?: string; scorecard?: Record<string, number> }) {
    const review = this.repo.decideReview(applicationId, reviewerId, p.decision, p.note ?? null, p.scorecard ?? null);
    let nextStatus: ApplicationStatus | null = null;
    switch (p.decision) {
      case 'advance': nextStatus = p.stage === 'interview' || p.stage === 'final' ? 'interview' : 'under_review'; break;
      case 'reject': nextStatus = 'rejected'; break;
      case 'hold': nextStatus = 'on_hold'; break;
      case 'offer': nextStatus = 'offered'; break;
      case 'withdraw_invite': nextStatus = 'withdrawn'; break;
    }
    let app: ApplicationRow | null = this.repo.application(applicationId) ?? null;
    if (nextStatus && app && app.status !== nextStatus) {
      try { app = this.repo.transition(applicationId, nextStatus, reviewerId); }
      catch (e) { this.log.warn(`transition skipped: ${(e as Error).message}`); }
    }
    if (app) {
      this.gateway?.emitToTopic(`tenant:${app.tenantId}:applications`, 'review.decision', { applicationId, decision: p.decision, status: app.status });
      this.gateway?.emitToUser(app.candidateId, 'application.status', { id: applicationId, status: app.status });
      if (p.decision === 'advance') {
        D25Emit.advanced(app.tenantId, applicationId, {
          applicationId,
          reviewerId,
          reviewerName,
          stage: p.stage,
          note: p.note,
          status: app.status,
          candidateId: app.candidateId,
          jobId: app.jobId,
        });
      }
      if (p.decision === 'reject') {
        D25Emit.rejected(app.tenantId, applicationId, {
          applicationId,
          reviewerId,
          reviewerName,
          note: p.note,
          status: app.status,
          candidateId: app.candidateId,
          jobId: app.jobId,
        });
      }
      if (p.decision === 'withdraw_invite') {
        D25Emit.withdrawn(app.tenantId, applicationId, {
          applicationId,
          reviewerId,
          reviewerName,
          note: p.note,
          status: app.status,
          candidateId: app.candidateId,
          jobId: app.jobId,
        });
      }
    }
    return { review, application: app ? this.publicApp(app) : null };
  }

  bulk(tenantId: string, reviewerId: string, ids: string[], action: 'advance' | 'reject' | 'archive' | 'hold', note?: string) {
    const results = ids.map((id) => {
      try {
        if (action === 'archive') return { id, ok: true, app: this.publicApp(this.repo.transition(id, 'archived', reviewerId)) };
        const decision = action === 'advance' ? 'advance' : action === 'reject' ? 'reject' : 'hold';
        const stage = 'screening' as const;
        const out = this.decide(id, reviewerId, 'Bulk Reviewer', { decision: decision as any, stage, note });
        return { id, ok: true, app: out.application };
      } catch (e) { return { id, ok: false, error: (e as Error).message }; }
    });
    this.gateway?.emitToTopic(`tenant:${tenantId}:applications`, 'review.bulk', { count: ids.length, action });
    return { results };
  }

  insights(tenantId: string, jobId?: string) { return this.analytics.insights(tenantId, jobId); }

  // ---------- mappers ----------
  private publicTemplate = (t: FormTemplateRow) => ({
    id: t.id, tenantId: t.tenantId, jobId: t.jobId,
    title: t.title, description: t.description,
    fields: t.fields, consents: t.consents,
    status: t.status, version: t.version,
    createdAt: t.createdAt, updatedAt: t.updatedAt,
  });

  private publicApp = (a: ApplicationRow) => ({
    id: a.id, tenantId: a.tenantId, jobId: a.jobId, templateId: a.templateId,
    candidate: { id: a.candidateId, name: a.candidateName, email: a.candidateEmail },
    responses: a.responses, attachments: a.attachments,
    acceptedConsents: a.acceptedConsents, voluntary: a.voluntary ?? null,
    status: a.status, qualityScore: a.qualityScore, matchScore: a.matchScore, riskFlags: a.riskFlags,
    submittedAt: a.submittedAt, decidedAt: a.decidedAt, withdrawnAt: a.withdrawnAt, withdrawReason: a.withdrawReason,
    createdAt: a.createdAt, updatedAt: a.updatedAt, version: a.version,
  });
}
