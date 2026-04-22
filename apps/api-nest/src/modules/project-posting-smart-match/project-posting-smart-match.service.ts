/**
 * D33 application service — orchestrates studio CRUD, smart match, invites,
 * approvals and the multi-step boost-credit checkout. Every meaningful
 * transition fans out via D33Emit (outbound webhooks + cross-domain bus)
 * and Socket.IO (NotificationsGateway, optional).
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ProjectPostingSmartMatchRepository, BOOST_PACKS, type ProjectStudioRow } from './project-posting-smart-match.repository';
import { ProjectPostingSmartMatchMlService } from './project-posting-smart-match.ml.service';
import { ProjectPostingSmartMatchAnalyticsService } from './project-posting-smart-match.analytics.service';
import { D33Emit } from './project-posting-smart-match.emit';
import type { ProjectStudioDraft, ProjectStudioStatus } from './dto';

@Injectable()
export class ProjectPostingSmartMatchService {
  private readonly log = new Logger('ProjectPostingSmartMatch');

  constructor(
    private readonly repo: ProjectPostingSmartMatchRepository,
    private readonly ml: ProjectPostingSmartMatchMlService,
    private readonly analytics: ProjectPostingSmartMatchAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
    },
  ) {}

  // ─── Projects ────────────────────────────────────────────────────────
  list(tenantId: string) { return this.repo.list(tenantId).map((r) => this.toPublic(r)); }
  detail(id: string) {
    const row = this.repo.byId(id); if (!row) return null;
    return { ...this.toPublic(row), invites: this.repo.invitesForProject(id), audit: this.repo.auditFor(id), approval: this.repo.approvalForProject(id)[0] ?? null };
  }
  create(tenantId: string, ownerId: string, ownerName: string, draft: ProjectStudioDraft) {
    const row = this.repo.createDraft(tenantId, ownerId, ownerName, draft);
    void D33Emit.projectCreated(tenantId, row.id, { title: row.title, ownerId });
    this.gateway?.emitToTopic(`tenant:${tenantId}:projects`, 'project.created', { id: row.id });
    return this.toPublic(row);
  }
  update(id: string, expectedVersion: number, patch: Partial<ProjectStudioDraft>, actor: string) {
    const row = this.repo.update(id, expectedVersion, patch, actor);
    void D33Emit.projectUpdated(row.tenantId, id, { fields: Object.keys(patch), version: row.version });
    return this.toPublic(row);
  }

  submitForReview(id: string, actor: string) {
    const ap = this.repo.submitForReview(id, actor);
    void D33Emit.approvalSubmitted(ap.tenantId, id, { approvalId: ap.id });
    this.gateway?.emitToTopic(`tenant:${ap.tenantId}:approvals`, 'approval.submitted', { projectId: id });
    return ap;
  }
  decideApproval(id: string, decision: 'approve' | 'reject' | 'request_changes', reviewerId: string, note?: string) {
    const ap = this.repo.decideApproval(id, decision, reviewerId, note);
    void D33Emit.approvalDecided(ap.tenantId, id, { decision, reviewerId, status: ap.status });
    return ap;
  }
  approvalQueue(tenantId: string) { return this.repo.approvalQueue(tenantId); }

  publish(id: string, actor: string, opts: { promotionTier: 'none'|'standard'|'featured'|'spotlight'; durationDays: number; channels: string[]; inviteCap: number; idempotencyKey: string }) {
    const row = this.repo.byId(id); if (!row) throw new Error('not_found');
    const stored = this.repo.consumeIdempotency(`publish:${opts.idempotencyKey}`, id);
    if (stored !== id) return this.toPublic(row);
    row.channels = opts.channels; row.promotionTier = opts.promotionTier;
    row.expiresAt = new Date(Date.now() + opts.durationDays * 86_400_000).toISOString();
    row.inviteCap = opts.inviteCap;
    row.publishedAt = new Date().toISOString();
    this.repo.transition(id, 'active', actor);
    void D33Emit.projectPublished(row.tenantId, id, { tier: row.promotionTier, channels: row.channels, expiresAt: row.expiresAt, inviteCap: row.inviteCap });
    this.gateway?.emitToTopic(`tenant:${row.tenantId}:projects`, 'project.published', { id });
    return this.toPublic(row);
  }
  pause(id: string, actor: string) { const row = this.repo.transition(id, 'paused', actor); void D33Emit.projectPaused(row.tenantId, id, {}); return this.toPublic(row); }
  resume(id: string, actor: string) { const row = this.repo.transition(id, 'active', actor); void D33Emit.projectResumed(row.tenantId, id, {}); return this.toPublic(row); }
  archive(id: string, actor: string) { const row = this.repo.transition(id, 'archived', actor); void D33Emit.projectArchived(row.tenantId, id, {}); return this.toPublic(row); }
  transition(id: string, next: ProjectStudioStatus, actor: string) {
    const row = this.repo.transition(id, next, actor);
    void D33Emit.projectTransitioned(row.tenantId, id, { status: next });
    return this.toPublic(row);
  }

  // ─── Smart Match ─────────────────────────────────────────────────────
  async smartMatch(projectId: string, opts: { topK: number; diversify: boolean; minScore: number; excludeInvited: boolean }) {
    const project = this.repo.byId(projectId); if (!project) throw new Error('not_found');
    const out = await this.ml.match(project, opts);
    project.matchesGenerated = out.items.length;
    void D33Emit.matchGenerated(project.tenantId, projectId, { count: out.items.length, mode: out.mode, topK: opts.topK });
    return {
      projectId, mode: out.mode, generatedAt: new Date().toISOString(),
      items: out.items.map((s) => ({
        candidateId: s.candidate.id,
        displayName: s.candidate.displayName,
        avatar: s.candidate.avatar,
        headline: s.candidate.headline,
        location: s.candidate.location,
        hourlyRateCents: s.candidate.hourlyRateCents,
        rating: s.candidate.rating,
        jobsCompleted: s.candidate.jobsCompleted,
        skills: s.candidate.skills,
        availability: s.candidate.availability,
        matchScore: s.matchScore,
        reasons: s.reasons,
      })),
    };
  }

  // ─── Invites ─────────────────────────────────────────────────────────
  invite(projectId: string, candidateId: string, actor: string, channel: 'inapp'|'email'|'sms'|'inapp+email', message: string | undefined, expiresInDays: number) {
    const inv = this.repo.createInvite(projectId, candidateId, actor, channel, message, expiresInDays);
    if (this.repo.inviteBalanceOf(inv.tenantId) > 0) {
      // Consume one invite credit when wallet has them; soft-fail otherwise so invites still go out from the cap.
      void D33Emit.inviteCreditsConsumed(inv.tenantId, inv.id, { delta: -1, ref: inv.id });
    }
    void D33Emit.inviteSent(inv.tenantId, inv.id, { projectId, candidateId, channel });
    this.gateway?.emitToUser(candidateId, 'invite.received', { projectId, inviteId: inv.id });
    return inv;
  }
  inviteBulk(projectId: string, candidateIds: string[], actor: string, channel: 'inapp'|'email'|'sms'|'inapp+email', message: string | undefined, expiresInDays: number) {
    const created = candidateIds.map((c) => this.repo.createInvite(projectId, c, actor, channel, message, expiresInDays));
    if (created.length) {
      void D33Emit.inviteBulkSent(created[0].tenantId, projectId, { count: created.length, projectId, channel });
      created.forEach((inv) => this.gateway?.emitToUser(inv.candidateId, 'invite.received', { projectId, inviteId: inv.id }));
    }
    return created;
  }
  decideInvite(inviteId: string, decision: 'accept'|'decline'|'maybe', note?: string) {
    const inv = this.repo.decideInvite(inviteId, decision, note);
    if (inv.status === 'accepted') void D33Emit.inviteAccepted(inv.tenantId, inv.id, { projectId: inv.projectId, candidateId: inv.candidateId });
    if (inv.status === 'declined') void D33Emit.inviteDeclined(inv.tenantId, inv.id, { projectId: inv.projectId, candidateId: inv.candidateId, note: note ?? null });
    if (inv.status === 'maybe')    void D33Emit.inviteMaybe(inv.tenantId, inv.id, { projectId: inv.projectId, candidateId: inv.candidateId });
    this.gateway?.emitToTopic(`project:${inv.projectId}`, 'invite.decided', { id: inv.id, status: inv.status });
    return inv;
  }
  revokeInvite(inviteId: string, actor: string) {
    const inv = this.repo.revokeInvite(inviteId, actor);
    if (inv.status === 'revoked') void D33Emit.inviteRevoked(inv.tenantId, inv.id, { projectId: inv.projectId });
    return inv;
  }
  invitesForProject(projectId: string) { return this.repo.invitesForProject(projectId); }

  // ─── Boost-credit + invite-credit checkout ───────────────────────────
  boostPacks() { return BOOST_PACKS; }
  boostBalance(tenantId: string) {
    return {
      boostBalance: this.repo.boostBalanceOf(tenantId),
      inviteBalance: this.repo.inviteBalanceOf(tenantId),
      ledger: this.repo.ledgerFor(tenantId),
      purchases: this.repo.purchasesFor(tenantId),
    };
  }
  createBoostPurchase(tenantId: string, buyerId: string, packId: string) {
    const row = this.repo.createPurchase(tenantId, buyerId, packId);
    void D33Emit.boostPurchaseCreated(tenantId, row.id, { packId, kind: row.kind, amountCents: row.amountCents });
    return row;
  }
  confirmBoostPurchase(purchaseId: string, idempotencyKey: string, actor: string) {
    const row = this.repo.confirmPurchase(purchaseId, idempotencyKey);
    void D33Emit.boostPurchaseConfirmed(row.tenantId, row.id, { kind: row.kind, postings: row.postings, invites: row.invites, amountCents: row.amountCents, actor });
    if (row.kind === 'invite_credits') void D33Emit.inviteCreditsTopped(row.tenantId, row.id, { delta: row.invites });
    this.gateway?.emitToUser(actor, 'pps.boost-purchase.confirmed', { id: row.id, kind: row.kind });
    return row;
  }
  applyBoost(projectId: string, tier: 'none'|'standard'|'featured'|'spotlight', durationDays: number, idempotencyKey: string, actor: string) {
    const row = this.repo.applyBoost(projectId, tier, durationDays, idempotencyKey, actor);
    void D33Emit.boostApplied(row.tenantId, projectId, { tier, durationDays });
    return this.toPublic(row);
  }

  // ─── Insights ────────────────────────────────────────────────────────
  insights(tenantId: string) { return this.analytics.insights(tenantId); }

  // ─── Helpers ─────────────────────────────────────────────────────────
  private toPublic(r: ProjectStudioRow) {
    return {
      id: r.id, tenantId: r.tenantId, owner: { id: r.ownerId, name: r.ownerName },
      title: r.title, summary: r.summary, description: r.description,
      engagement: r.engagement, workplace: r.workplace, location: r.location,
      budget: r.budgetMinCents != null && r.budgetMaxCents != null ? { minCents: r.budgetMinCents, maxCents: r.budgetMaxCents, currency: r.currency } : null,
      durationDays: r.durationDays, startWindow: r.startWindow,
      skills: r.skills, categories: r.categories,
      experienceLevel: r.experienceLevel, scopeSize: r.scopeSize,
      launchpadFlags: r.launchpadFlags,
      visibility: r.visibility, promotionTier: r.promotionTier, ndaRequired: r.ndaRequired,
      attachmentIds: r.attachmentIds, milestones: r.milestones, screeners: r.screeners,
      status: r.status, channels: r.channels, inviteCap: r.inviteCap,
      invitesSent: r.invitesSent, matchesGenerated: r.matchesGenerated,
      publishedAt: r.publishedAt, expiresAt: r.expiresAt,
      createdAt: r.createdAt, updatedAt: r.updatedAt, version: r.version,
    };
  }
}
