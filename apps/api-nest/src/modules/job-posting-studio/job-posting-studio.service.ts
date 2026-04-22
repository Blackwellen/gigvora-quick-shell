/**
 * Domain 24 application service — Job Posting Studio, Credits, Publication Controls.
 *
 * Surfaces:
 *  - draft CRUD + optimistic-concurrency edits
 *  - quality + moderation (ML-bridged with deterministic fallback)
 *  - submit-for-review → approve/reject (recruiter approval queue)
 *  - publish/pause/expire/archive with credit consumption
 *  - multi-step credit purchase (pending → paid) per checkout rule
 *  - tenant insights via analytics service
 *  - audit trail + idempotency on publish
 *
 * Realtime events through NotificationsGateway:
 *  job.created, job.updated, job.transitioned, job.published,
 *  job.approval.submitted, job.approval.decided,
 *  credits.purchase.confirmed, credits.applied
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { JobPostingStudioRepository, CREDIT_PACKS, type JobRow } from './job-posting-studio.repository';
import { JobPostingStudioMlService } from './job-posting-studio.ml.service';
import { JobPostingStudioAnalyticsService } from './job-posting-studio.analytics.service';
import { D24Emit } from '../domain-bus/domain-emissions';
import type { JobDraft } from './dto';

@Injectable()
export class JobPostingStudioService {
  private readonly log = new Logger('JobPostingStudio');
  constructor(
    private readonly repo: JobPostingStudioRepository,
    private readonly ml: JobPostingStudioMlService,
    private readonly analytics: JobPostingStudioAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
    },
  ) {}

  publish(jobId: string, actorId: string, opts: { promotionTier: string; durationDays: number; channels: string[]; idempotencyKey: string }) {
    const j = this.repo.byId(jobId); if (!j) throw new Error('not_found');
    // Idempotency — if same key already produced a publish, return current state
    const stored = this.repo.consumeIdempotency(`publish:${opts.idempotencyKey}`, j.id);
    if (stored !== j.id) return this.toPublic(j);
    if (this.repo.balance(j.tenantId) < 1) throw new Error('insufficient_credits');
    this.repo.applyCredit(j.tenantId, -1, `publish:${jobId}`, jobId);
    D24Emit.creditsConsumed(j.tenantId, jobId, { jobId, delta: -1, reason: 'publish' });
    j.channels = opts.channels; j.promotionTier = opts.promotionTier;
    j.expiresAt = new Date(Date.now() + opts.durationDays * 86_400_000).toISOString();
    this.repo.transition(jobId, 'active', actorId);
    this.gateway?.emitToTopic(`tenant:${j.tenantId}:jobs`, 'job.published', { id: jobId, expiresAt: j.expiresAt });
    D24Emit.postingPublished(j.tenantId, jobId, {
      jobId,
      expiresAt: j.expiresAt,
      channels: opts.channels,
      promotionTier: opts.promotionTier,
      actorId,
    });
    return this.toPublic(j);
  }

  pause(jobId: string, actorId: string) {
    const row = this.repo.transition(jobId, 'paused', actorId);
    D24Emit.postingPaused(row.tenantId, jobId, { jobId, actorId, status: row.status });
    return this.toPublic(row);
  }
  resume(jobId: string, actorId: string) { return this.toPublic(this.repo.transition(jobId, 'active', actorId)); }
  archive(jobId: string, actorId: string) {
    const row = this.repo.transition(jobId, 'archived', actorId);
    D24Emit.postingArchived(row.tenantId, jobId, { jobId, actorId, status: row.status });
    return this.toPublic(row);
  }

  // Credits
  packs() { return CREDIT_PACKS; }
  balance(tenantId: string) { return { balance: this.repo.balance(tenantId), ledger: this.repo.ledgerFor(tenantId) }; }
  createPurchase(tenantId: string, buyerId: string, packId: string) { return this.repo.createPurchase(tenantId, buyerId, packId); }
  confirmPurchase(purchaseId: string, buyerId: string) {
    const p = this.repo.confirmPurchase(purchaseId, buyerId);
    this.gateway?.emitToUser(buyerId, 'credits.purchase.confirmed', { id: p.id, postings: p.postings });
    this.gateway?.emitToTopic(`tenant:${p.tenantId}:credits`, 'credits.applied', { delta: p.postings, ref: p.id });
    D24Emit.creditsPurchased(p.tenantId, p.id, { purchaseId: p.id, buyerId, postings: p.postings });
    return p;
  }
  listPurchases(tenantId: string) { return this.repo.listPurchases(tenantId); }

  insights(tenantId: string) { return this.analytics.insights(tenantId); }

  private toPublic(j: JobRow) {
    return {
      id: j.id, tenantId: j.tenantId, owner: { id: j.ownerId, name: j.ownerName },
      title: j.title, summary: j.summary, description: j.description,
      employment: j.employment, workplace: j.workplace, location: j.location,
      salary: j.salaryMinCents != null && j.salaryMaxCents != null ? { minCents: j.salaryMinCents, maxCents: j.salaryMaxCents, currency: j.currency } : null,
      skills: j.skills, benefits: j.benefits, applyUrl: j.applyUrl,
      visibility: j.visibility, promoted: j.promoted, promotionTier: j.promotionTier,
      status: j.status, channels: j.channels,
      applications: j.applications, impressions: j.impressions,
      publishedAt: j.publishedAt, expiresAt: j.expiresAt,
      createdAt: j.createdAt, updatedAt: j.updatedAt, version: j.version,
    };
  }
}
