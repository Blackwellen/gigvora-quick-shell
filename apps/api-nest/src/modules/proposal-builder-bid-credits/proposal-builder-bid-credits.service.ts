/**
 * D34 application service — orchestrates draft, scope/pricing edits, submit
 * (with credit consumption + boost charge + idempotency), client decisions,
 * the multi-step bid-credit checkout, and the escrow hold/release/refund
 * lifecycle. Every meaningful transition fans out via D34Emit (outbound
 * webhooks + cross-domain bus) and the optional Socket.IO gateway.
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  ProposalBuilderBidCreditsRepository, CREDIT_PACKS, PROPOSAL_COST, BOOST_COST,
  type ProposalRow, type EscrowRow,
} from './proposal-builder-bid-credits.repository';
import { ProposalBuilderBidCreditsMlService } from './proposal-builder-bid-credits.ml.service';
import { ProposalBuilderBidCreditsAnalyticsService } from './proposal-builder-bid-credits.analytics.service';
import { D34Emit } from './proposal-builder-bid-credits.emit';
import type { ProposalDraft, ProposalStatus } from './dto';

@Injectable()
export class ProposalBuilderBidCreditsService {
  private readonly log = new Logger('ProposalBuilderBidCredits');

  constructor(
    private readonly repo: ProposalBuilderBidCreditsRepository,
    private readonly ml: ProposalBuilderBidCreditsMlService,
    private readonly analytics: ProposalBuilderBidCreditsAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
    },
  ) {}

  // ─── Proposals ───────────────────────────────────────────────────────
  list(tenantId: string, filters?: { status?: ProposalStatus[]; projectId?: string }) {
    return this.repo.list(tenantId, filters).map((r) => this.toPublic(r));
  }
  detail(id: string) {
    const row = this.repo.byId(id); if (!row) return null;
    const escrows = this.repo.escrowsFor(row.tenantId).filter((e) => e.proposalId === id);
    return { ...this.toPublic(row), audit: this.repo.auditFor('proposal', id), escrows };
  }
  forProject(projectId: string) { return this.repo.byProject(projectId).map((r) => this.toPublic(r)); }

  draft(tenantId: string, ownerId: string, ownerName: string, draft: ProposalDraft) {
    const row = this.repo.draft(tenantId, ownerId, ownerName, draft);
    void D34Emit.proposalDrafted(tenantId, row.id, { projectId: row.projectId, ownerId });
    return this.toPublic(row);
  }

  update(id: string, expectedVersion: number, patch: Partial<ProposalDraft>, actor: string) {
    const row = this.repo.update(id, expectedVersion, patch, actor);
    void D34Emit.proposalUpdated(row.tenantId, id, { fields: Object.keys(patch), version: row.version });
    if (patch.bidAmountCents !== undefined || patch.hourlyRateCents !== undefined || patch.pricingMode !== undefined) {
      void D34Emit.pricingChanged(row.tenantId, id, { mode: row.pricingMode, bidAmountCents: row.bidAmountCents, hourlyRateCents: row.hourlyRateCents });
    }
    if (patch.milestones !== undefined) void D34Emit.milestoneReordered(row.tenantId, id, { count: row.milestones.length });
    return this.toPublic(row);
  }

  submit(id: string, idempotencyKey: string, actor: string) {
    const stored = this.repo.consumeIdempotency('pbb-submit', idempotencyKey, id);
    if (stored !== id) return this.toPublic(this.repo.byId(id)!);
    const row = this.repo.byId(id); if (!row) throw new Error('not_found');
    if (row.status !== 'draft' && row.status !== 'revised') return this.toPublic(row);
    // Charge credits + optional boost — wallet enforces "insufficient_credits".
    this.repo.consumeCredits(row.tenantId, 'credit', PROPOSAL_COST, `proposal:${id}`, id);
    void D34Emit.creditsConsumed(row.tenantId, id, { delta: -PROPOSAL_COST, ref: id });
    if (row.boostEnabled) {
      this.repo.consumeCredits(row.tenantId, 'boost', 1, `boost:${id}`, id);
      void D34Emit.boostApplied(row.tenantId, id, { proposalId: id });
    }
    this.repo.lockScope(id, actor);
    void D34Emit.scopeLocked(row.tenantId, id, {});
    const updated = this.repo.setStatus(id, 'submitted', actor, { expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString() });
    void D34Emit.proposalSubmitted(row.tenantId, id, { projectId: row.projectId, bidAmountCents: row.bidAmountCents, boost: row.boostEnabled });
    this.gateway?.emitToTopic(`project:${row.projectId}:proposals`, 'proposal.submitted', { id });
    return this.toPublic(updated);
  }

  withdraw(id: string, actor: string, reason?: string) {
    const row = this.repo.byId(id); if (!row) throw new Error('not_found');
    if (row.status === 'accepted' || row.status === 'rejected') return this.toPublic(row);
    // Refund credits if withdrawn within 24h of submission as a goodwill rule.
    if (row.submittedAt && Date.now() - Date.parse(row.submittedAt) < 86_400_000) {
      this.repo.refundCredits(row.tenantId, 'credit', PROPOSAL_COST, `withdraw-refund:${id}`, id, null);
      void D34Emit.creditsRefunded(row.tenantId, id, { delta: PROPOSAL_COST, ref: id, reason: 'withdrawn-within-24h' });
    }
    const updated = this.repo.setStatus(id, 'withdrawn', actor, {});
    void D34Emit.proposalWithdrawn(row.tenantId, id, { reason: reason ?? null });
    return this.toPublic(updated);
  }

  revise(id: string, patch: Partial<ProposalDraft>, idempotencyKey: string, actor: string) {
    const stored = this.repo.consumeIdempotency('pbb-revise', idempotencyKey, id);
    if (stored !== id) return this.toPublic(this.repo.byId(id)!);
    const row = this.repo.byId(id); if (!row) throw new Error('not_found');
    if (row.status !== 'shortlisted' && row.status !== 'submitted') throw new Error('cannot_revise');
    // Allow scope changes during revision — temporarily unlock, patch, relock.
    row.scopeLocked = false;
    this.repo.update(id, row.version, patch, actor);
    this.repo.lockScope(id, actor);
    const updated = this.repo.setStatus(id, 'revised', actor, {});
    void D34Emit.proposalRevised(row.tenantId, id, { fields: Object.keys(patch) });
    return this.toPublic(updated);
  }

  clientDecide(id: string, decision: 'shortlist' | 'accept' | 'reject' | 'request_revision', actor: string, note?: string) {
    const row = this.repo.byId(id); if (!row) throw new Error('not_found');
    let next: ProposalStatus = row.status;
    if (decision === 'shortlist') next = 'shortlisted';
    if (decision === 'accept') next = 'accepted';
    if (decision === 'reject') next = 'rejected';
    if (decision === 'request_revision') next = 'submitted';
    const updated = this.repo.setStatus(id, next, actor, { shortlistPosition: decision === 'shortlist' ? (row.shortlistPosition ?? 1) : row.shortlistPosition });
    if (decision === 'shortlist') void D34Emit.proposalShortlisted(row.tenantId, id, { note });
    if (decision === 'accept')    void D34Emit.proposalAccepted(row.tenantId, id, { note });
    if (decision === 'reject')    void D34Emit.proposalRejected(row.tenantId, id, { note });
    this.gateway?.emitToUser(row.ownerId, `proposal.${decision}`, { id });
    return this.toPublic(updated);
  }

  // ─── Bid-credit checkout (multi-step) ────────────────────────────────
  packs() { return CREDIT_PACKS; }
  walletBalance(tenantId: string) {
    return {
      creditBalance: this.repo.creditBalanceOf(tenantId),
      boostBalance: this.repo.boostBalanceOf(tenantId),
      proposalCost: PROPOSAL_COST,
      boostCost: BOOST_COST,
      ledger: this.repo.ledgerFor(tenantId),
      purchases: this.repo.purchasesFor(tenantId),
    };
  }
  createPurchase(tenantId: string, buyerId: string, packId: string) {
    const row = this.repo.createPurchase(tenantId, buyerId, packId);
    void D34Emit.creditPurchaseCreated(tenantId, row.id, { packId, amountCents: row.amountCents, credits: row.credits, bonus: row.bonusCredits });
    return row;
  }
  confirmPurchase(purchaseId: string, idempotencyKey: string, actor: string) {
    const row = this.repo.confirmPurchase(purchaseId, idempotencyKey, actor);
    void D34Emit.creditPurchaseConfirmed(row.tenantId, row.id, { amountCents: row.amountCents, credits: row.credits + row.bonusCredits });
    void D34Emit.creditsToppedUp(row.tenantId, row.id, { delta: row.isBoostPack ? row.bonusCredits : (row.credits + row.bonusCredits), kind: row.isBoostPack ? 'boost' : 'credit' });
    this.gateway?.emitToUser(actor, 'pbb.credit-purchase.confirmed', { id: row.id });
    return row;
  }
  refundPurchase(purchaseId: string, reason: string, actor: string) {
    const row = this.repo.refundPurchase(purchaseId, reason, actor);
    void D34Emit.creditPurchaseRefunded(row.tenantId, row.id, { reason });
    return row;
  }

  // ─── Escrow ──────────────────────────────────────────────────────────
  escrows(tenantId: string) { return this.repo.escrowsFor(tenantId); }
  holdEscrow(tenantId: string, payerId: string, proposalId: string, amountCents: number, currency: string, paymentMethod: 'card' | 'invoice' | 'wallet', idempotencyKey: string): EscrowRow {
    const proposal = this.repo.byId(proposalId); if (!proposal) throw new Error('not_found');
    if (proposal.status !== 'accepted' && proposal.status !== 'shortlisted') throw new Error('proposal_not_accepted');
    const row = this.repo.holdEscrow(tenantId, payerId, proposal.ownerId, proposalId, proposal.projectId, amountCents, currency, paymentMethod, idempotencyKey);
    void D34Emit.escrowHeld(tenantId, row.id, { proposalId, amountCents, paymentMethod });
    this.gateway?.emitToUser(proposal.ownerId, 'escrow.held', { escrowId: row.id, amountCents });
    return row;
  }
  releaseEscrow(escrowId: string, amountCents: number | undefined, milestoneId: string | undefined, idempotencyKey: string, actor: string) {
    const row = this.repo.releaseEscrow(escrowId, amountCents, milestoneId, idempotencyKey, actor);
    void D34Emit.escrowReleased(row.tenantId, row.id, { release: amountCents, milestoneId, status: row.status });
    return row;
  }
  refundEscrow(escrowId: string, amountCents: number | undefined, reason: string, idempotencyKey: string, actor: string) {
    const row = this.repo.refundEscrow(escrowId, amountCents, reason, idempotencyKey, actor);
    void D34Emit.escrowRefunded(row.tenantId, row.id, { refund: amountCents, reason, status: row.status });
    return row;
  }

  // ─── Insights & ML ───────────────────────────────────────────────────
  insights(tenantId: string) { return this.analytics.insights(tenantId); }
  pricingAdvice(projectId: string, proposed?: number) { return this.ml.pricingAdvice(projectId, proposed); }

  // ─── Helpers ─────────────────────────────────────────────────────────
  private toPublic(r: ProposalRow) {
    return {
      id: r.id, tenantId: r.tenantId, owner: { id: r.ownerId, name: r.ownerName },
      projectId: r.projectId,
      coverLetter: r.coverLetter,
      pricingMode: r.pricingMode, bidAmountCents: r.bidAmountCents,
      hourlyRateCents: r.hourlyRateCents, estimatedHours: r.estimatedHours, currency: r.currency,
      timelineWeeks: r.timelineWeeks,
      scope: r.scope, deliverables: r.deliverables, assumptions: r.assumptions, exclusions: r.exclusions,
      attachmentIds: r.attachmentIds,
      milestones: r.milestones,
      screeningAnswers: r.screeningAnswers,
      boostEnabled: r.boostEnabled,
      status: r.status, scopeLocked: r.scopeLocked,
      submittedAt: r.submittedAt, expiresAt: r.expiresAt,
      shortlistedAt: r.shortlistedAt, acceptedAt: r.acceptedAt, rejectedAt: r.rejectedAt, withdrawnAt: r.withdrawnAt,
      competitorRangeCents: r.competitorRangeCents, shortlistPosition: r.shortlistPosition,
      creditCost: r.creditCost, boostCost: r.boostCost,
      createdAt: r.createdAt, updatedAt: r.updatedAt, version: r.version,
    };
  }
}
