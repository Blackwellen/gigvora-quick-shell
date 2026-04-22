/**
 * D35 application service — review/shortlist/compare/award decisions plus the
 * procurement approval chain and the D34 escrow handoff. Award is modelled as
 * a draft → awaiting-approval → approved → escrow-handoff → closed flow with
 * idempotent multi-step submission.
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ProposalReviewAwardRepository, type ReviewStatus } from './proposal-review-award.repository';
import { ProposalReviewAwardMlService } from './proposal-review-award.ml.service';
import { ProposalReviewAwardAnalyticsService } from './proposal-review-award.analytics.service';
import { D35Emit } from './proposal-review-award.emit';
import { ProposalBuilderBidCreditsService } from '../proposal-builder-bid-credits/proposal-builder-bid-credits.service';

@Injectable()
export class ProposalReviewAwardService {
  private readonly log = new Logger('ProposalReviewAward');

  constructor(
    private readonly repo: ProposalReviewAwardRepository,
    private readonly ml: ProposalReviewAwardMlService,
    private readonly analytics: ProposalReviewAwardAnalyticsService,
    @Optional() private readonly pbb?: ProposalBuilderBidCreditsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
    },
  ) {}

  // ─── Reviews / shortlist ─────────────────────────────────────────────
  list(tenantId: string, filters?: { projectId?: string; status?: ReviewStatus[] }) {
    return this.repo.list(tenantId, filters);
  }
  detail(id: string, viewerId: string) {
    const review = this.repo.byId(id); if (!review) return null;
    const notes = this.repo.notesFor(review.proposalId, viewerId);
    return { ...review, notes, audit: this.repo.auditFor('review', id) };
  }

  decide(id: string, decision: 'shortlist' | 'unshortlist' | 'reject' | 'request_revision', actor: string, note?: string, shortlistRank?: number) {
    const r = this.repo.byId(id); if (!r) throw new Error('not_found');
    if (decision === 'shortlist') {
      const updated = this.repo.setStatus(id, 'shortlisted', actor, { shortlistRank: shortlistRank ?? (r.shortlistRank ?? 99) });
      void D35Emit.reviewShortlisted(r.tenantId, id, { proposalId: r.proposalId, rank: updated.shortlistRank });
      this.gateway?.emitToUser(r.ownerId, 'praa.review.shortlisted', { id });
      return updated;
    }
    if (decision === 'unshortlist') {
      const updated = this.repo.setStatus(id, 'submitted', actor, { shortlistRank: null });
      void D35Emit.reviewUnshortlisted(r.tenantId, id, { proposalId: r.proposalId });
      return updated;
    }
    if (decision === 'reject') {
      const updated = this.repo.setStatus(id, 'rejected', actor, {});
      void D35Emit.reviewRejected(r.tenantId, id, { note });
      this.gateway?.emitToUser(r.ownerId, 'praa.review.rejected', { id });
      return updated;
    }
    if (decision === 'request_revision') {
      const updated = this.repo.setStatus(id, 'revised', actor, {});
      void D35Emit.reviewRevisionAsked(r.tenantId, id, { note });
      return updated;
    }
    throw new Error('unknown_decision');
  }

  bulkDecide(ids: string[], decision: 'shortlist' | 'reject', actor: string, note?: string) {
    const out = ids.map((id) => this.decide(id, decision, actor, note));
    void D35Emit.reviewBulkDecided('tenant-demo', `bulk-${Date.now()}`, { decision, count: ids.length });
    return out;
  }

  rank(id: string, rank: number | null, actor: string) {
    const updated = this.repo.setShortlistRank(id, rank, actor);
    void D35Emit.reviewRanked(updated.tenantId, id, { rank });
    return updated;
  }

  // ─── Compare + scoring ───────────────────────────────────────────────
  compare(projectId: string, proposalIds: string[], weights?: { price: number; timeline: number; fit: number; risk: number }) {
    const result = this.ml.scoreProject(projectId, weights, proposalIds);
    void D35Emit.scoreComputed('tenant-demo', projectId, { count: result.rows.length, weights: result.weights });
    return result;
  }
  setWeights(projectId: string, weights: { price: number; timeline: number; fit: number; risk: number }, actor: string) {
    const w = this.repo.setWeights(projectId, weights, actor);
    void D35Emit.weightsUpdated('tenant-demo', projectId, w);
    return w;
  }

  // ─── Notes ───────────────────────────────────────────────────────────
  addNote(tenantId: string, proposalId: string, body: string, visibility: 'private' | 'team', actor: string) {
    const n = this.repo.addNote(tenantId, proposalId, actor, body, visibility);
    void D35Emit.noteAdded(tenantId, n.id, { proposalId, visibility });
    return n;
  }

  // ─── Award decisions ─────────────────────────────────────────────────
  draftAward(args: { tenantId: string; reviewId: string; decidedBy: string; amountCents: number; currency: string; paymentMethod: 'card' | 'invoice' | 'wallet'; scopeAcknowledgement: string; triggerEscrow: boolean; triggerApprovalChain: boolean; idempotencyKey: string }) {
    const review = this.repo.byId(args.reviewId); if (!review) throw new Error('not_found');
    const decision = this.repo.createAwardDecision({
      tenantId: args.tenantId, projectId: review.projectId, proposalId: review.proposalId,
      decidedBy: args.decidedBy, amountCents: args.amountCents, currency: args.currency,
      paymentMethod: args.paymentMethod, scopeAcknowledgement: args.scopeAcknowledgement,
      triggerEscrow: args.triggerEscrow, triggerApprovalChain: args.triggerApprovalChain,
    }, args.idempotencyKey);
    void D35Emit.awardDrafted(args.tenantId, decision.id, { reviewId: args.reviewId, amountCents: args.amountCents });
    if (args.triggerApprovalChain) {
      void D35Emit.awardSubmitted(args.tenantId, decision.id, {});
    } else {
      // Skip approval chain → straight to handoff
      this.maybeRunHandoff(decision.id, args.decidedBy);
    }
    return decision;
  }

  requestApproval(decisionId: string, approverIds: string[], threshold: number, note: string | undefined, actor: string) {
    const decision = this.repo.decisionById(decisionId); if (!decision) throw new Error('not_found');
    const approval = this.repo.createApproval(decision.tenantId, decisionId, approverIds, threshold, note, actor);
    void D35Emit.approvalRequested(decision.tenantId, approval.id, { decisionId, approverIds, threshold });
    approverIds.forEach((aid) => this.gateway?.emitToUser(aid, 'praa.approval.requested', { approvalId: approval.id }));
    return approval;
  }
  decideApproval(approvalId: string, approverId: string, decision: 'approved' | 'rejected', note: string | undefined) {
    const a = this.repo.decideApproval(approvalId, approverId, decision, note);
    if (a.status === 'approved') {
      void D35Emit.approvalApproved(a.tenantId, approvalId, { decisionId: a.decisionId });
      this.repo.setDecisionStatus(a.decisionId, 'approved', approverId, {});
      void D35Emit.awardApproved(a.tenantId, a.decisionId, {});
      this.maybeRunHandoff(a.decisionId, approverId);
    } else if (a.status === 'rejected') {
      void D35Emit.approvalRejected(a.tenantId, approvalId, { decisionId: a.decisionId });
      this.repo.setDecisionStatus(a.decisionId, 'rejected', approverId, {});
      void D35Emit.awardRejected(a.tenantId, a.decisionId, {});
    }
    return a;
  }

  cancelAward(decisionId: string, actor: string) {
    const updated = this.repo.setDecisionStatus(decisionId, 'cancelled', actor, {});
    void D35Emit.awardCancelled(updated.tenantId, decisionId, {});
    return updated;
  }

  /** When a decision is approved (or didn't need approval), optionally place
   *  the D34 escrow hold and flip the underlying review to "awarded". */
  private maybeRunHandoff(decisionId: string, actor: string) {
    const d = this.repo.decisionById(decisionId); if (!d) return;
    if (d.status !== 'approved') return;
    if (d.triggerEscrow && this.pbb) {
      try {
        const review = this.repo.byProposal(d.proposalId);
        const escrow = this.pbb.holdEscrow(d.tenantId, d.decidedBy, d.proposalId, d.amountCents, d.currency, d.paymentMethod, `praa-handoff-${decisionId}`);
        this.repo.setDecisionStatus(decisionId, 'escrow-handoff', actor, { escrowHandoffRef: escrow.id });
        void D35Emit.awardEscrowHandoff(d.tenantId, decisionId, { escrowId: escrow.id, amountCents: d.amountCents });
        if (review) this.repo.setStatus(review.id, 'awarded', actor, {});
      } catch (e: any) {
        this.log.warn(`Escrow handoff failed for ${decisionId}: ${e?.message}`);
        // Stay in 'approved' so operators can retry.
        return;
      }
    } else {
      const review = this.repo.byProposal(d.proposalId);
      if (review) this.repo.setStatus(review.id, 'awarded', actor, {});
    }
    this.repo.setDecisionStatus(decisionId, 'closed', actor, {});
    void D35Emit.awardClosed(d.tenantId, decisionId, {});
  }

  decisionsFor(tenantId: string) { return this.repo.decisionsFor(tenantId); }
  approvalsFor(tenantId: string) { return this.repo.approvalsFor(tenantId); }

  insights(tenantId: string, projectId?: string) { return this.analytics.insights(tenantId, projectId); }
  scoreProject(projectId: string, weights?: { price: number; timeline: number; fit: number; risk: number }) {
    return this.ml.scoreProject(projectId, weights);
  }
}
