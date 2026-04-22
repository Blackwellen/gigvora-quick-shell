/**
 * D35 repository — Review state, shortlist, award decisions, procurement
 * approval chains, and review notes. In-memory store with seeded fixtures
 * + immutable audit per state change. Idempotency keys are tracked per
 * award action to keep the D34-escrow handoff replay-safe.
 *
 * State machines:
 *   review-status: submitted → shortlisted | rejected → awarded | declined
 *   approval-chain: pending → approved | rejected | expired
 *   award-decision: draft → awaiting-approval → approved → escrow-handoff → closed
 *                                   ↘ rejected | cancelled
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type ReviewStatus = 'submitted' | 'shortlisted' | 'revised' | 'accepted' | 'rejected' | 'awarded' | 'declined';

export type ReviewRow = {
  id: string; tenantId: string; projectId: string; proposalId: string;
  ownerId: string; ownerName: string;
  status: ReviewStatus;
  shortlistRank: number | null;
  bidAmountCents: number; currency: string;
  timelineWeeks: number;
  scoreFit: number; scoreRisk: number; // 0–100 deterministic seeds
  awardedAt: string | null; rejectedAt: string | null;
  createdAt: string; updatedAt: string; version: number;
};

export type ReviewNoteRow = {
  id: string; tenantId: string; proposalId: string;
  authorId: string; body: string; visibility: 'private' | 'team';
  createdAt: string;
};

export type AwardDecisionRow = {
  id: string; tenantId: string; projectId: string; proposalId: string;
  decidedBy: string; amountCents: number; currency: string;
  paymentMethod: 'card' | 'invoice' | 'wallet';
  scopeAcknowledgement: string;
  triggerEscrow: boolean; triggerApprovalChain: boolean;
  status: 'draft' | 'awaiting-approval' | 'approved' | 'escrow-handoff' | 'closed' | 'rejected' | 'cancelled';
  approvalId: string | null;
  escrowHandoffRef: string | null;
  createdAt: string; closedAt: string | null;
};

export type ApprovalRow = {
  id: string; tenantId: string; decisionId: string;
  approverIds: string[]; threshold: number;
  approvals: { approverId: string; decision: 'approved' | 'rejected'; note: string | null; at: string }[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  note: string | null;
  createdAt: string; closedAt: string | null;
};

export type AuditRow = {
  id: string; tenantId: string;
  entityType: 'review' | 'award-decision' | 'approval' | 'note';
  entityId: string; actor: string; action: string; diff: any; at: string;
};

@Injectable()
export class ProposalReviewAwardRepository {
  private readonly log = new Logger('ProposalReviewAwardRepo');
  private reviews: ReviewRow[] = [];
  private notes: ReviewNoteRow[] = [];
  private decisions: AwardDecisionRow[] = [];
  private approvals: ApprovalRow[] = [];
  private audit: AuditRow[] = [];
  private weights = new Map<string, { price: number; timeline: number; fit: number; risk: number }>();
  private idempotency = new Map<string, string>();

  constructor() { this.seed(); }

  private seed() {
    const tenantId = 'tenant-demo';
    const projectId = 'project-d35-seed';
    const now = new Date().toISOString();
    const seed: Array<[string, string, ReviewStatus, number, number, number, number, number | null]> = [
      ['p1', 'Sarah Chen',     'shortlisted', 2_800_000, 10, 92, 18, 1],
      ['p2', 'Alex Rivera',    'shortlisted', 2_200_000, 12, 85, 24, 2],
      ['p3', 'James Okoro',    'submitted',   3_500_000,  8, 88, 22, null],
      ['p4', 'Priya Sharma',   'submitted',   2_950_000, 11, 79, 30, null],
      ['p5', 'Marcus Thompson','rejected',    1_500_000, 16, 62, 55, null],
      ['p6', 'Elena Kowalski', 'submitted',   3_100_000,  9, 81, 28, null],
    ];
    seed.forEach(([id, name, status, bid, weeks, fit, risk, rank]) => {
      this.reviews.push({
        id: randomUUID(), tenantId, projectId, proposalId: `seed-${id}`,
        ownerId: `user-${id}`, ownerName: name,
        status, shortlistRank: rank, bidAmountCents: bid, currency: 'GBP',
        timelineWeeks: weeks, scoreFit: fit, scoreRisk: risk,
        awardedAt: null, rejectedAt: status === 'rejected' ? now : null,
        createdAt: now, updatedAt: now, version: 1,
      });
    });
    this.weights.set(projectId, { price: 0.35, timeline: 0.20, fit: 0.30, risk: 0.15 });
    this.log.log(`seeded ${this.reviews.length} review rows`);
  }

  list(tenantId: string, f?: { projectId?: string; status?: ReviewStatus[] }) {
    let r = this.reviews.filter((x) => x.tenantId === tenantId);
    if (f?.projectId) r = r.filter((x) => x.projectId === f.projectId);
    if (f?.status?.length) r = r.filter((x) => f.status!.includes(x.status));
    return r;
  }
  byId(id: string) { return this.reviews.find((r) => r.id === id) ?? null; }
  byProposal(proposalId: string) { return this.reviews.find((r) => r.proposalId === proposalId) ?? null; }
  byProject(projectId: string) { return this.reviews.filter((r) => r.projectId === projectId); }

  setStatus(id: string, next: ReviewStatus, actor: string, extras?: Partial<ReviewRow>): ReviewRow {
    const r = this.byId(id); if (!r) throw new Error('not_found');
    r.status = next; r.updatedAt = new Date().toISOString(); r.version += 1;
    if (extras) Object.assign(r, extras);
    if (next === 'rejected') r.rejectedAt = r.updatedAt;
    if (next === 'awarded') r.awardedAt = r.updatedAt;
    this.audit.push({ id: randomUUID(), tenantId: r.tenantId, entityType: 'review', entityId: id, actor, action: `review.${next}`, diff: extras ?? {}, at: r.updatedAt });
    return r;
  }

  setShortlistRank(id: string, rank: number | null, actor: string) {
    const r = this.byId(id); if (!r) throw new Error('not_found');
    r.shortlistRank = rank; r.updatedAt = new Date().toISOString();
    this.audit.push({ id: randomUUID(), tenantId: r.tenantId, entityType: 'review', entityId: id, actor, action: 'review.rank', diff: { rank }, at: r.updatedAt });
    return r;
  }

  // Notes
  addNote(tenantId: string, proposalId: string, authorId: string, body: string, visibility: 'private' | 'team') {
    const row: ReviewNoteRow = { id: randomUUID(), tenantId, proposalId, authorId, body, visibility, createdAt: new Date().toISOString() };
    this.notes.push(row);
    this.audit.push({ id: randomUUID(), tenantId, entityType: 'note', entityId: row.id, actor: authorId, action: 'note.added', diff: { proposalId, visibility }, at: row.createdAt });
    return row;
  }
  notesFor(proposalId: string, viewerId: string) {
    return this.notes.filter((n) => n.proposalId === proposalId && (n.visibility === 'team' || n.authorId === viewerId));
  }

  // Award decisions
  createAwardDecision(d: Omit<AwardDecisionRow, 'id' | 'status' | 'approvalId' | 'escrowHandoffRef' | 'createdAt' | 'closedAt'>, idempotencyKey: string): AwardDecisionRow {
    const hit = this.idempotency.get(`award:${idempotencyKey}`);
    if (hit) { const ex = this.decisions.find((x) => x.id === hit); if (ex) return ex; }
    const row: AwardDecisionRow = {
      ...d, id: randomUUID(),
      status: d.triggerApprovalChain ? 'awaiting-approval' : 'approved',
      approvalId: null, escrowHandoffRef: null,
      createdAt: new Date().toISOString(), closedAt: null,
    };
    this.decisions.push(row);
    this.audit.push({ id: randomUUID(), tenantId: row.tenantId, entityType: 'award-decision', entityId: row.id, actor: row.decidedBy, action: 'award-decision.created', diff: { proposalId: row.proposalId, amountCents: row.amountCents }, at: row.createdAt });
    this.idempotency.set(`award:${idempotencyKey}`, row.id);
    return row;
  }
  decisionById(id: string) { return this.decisions.find((d) => d.id === id) ?? null; }
  decisionsFor(tenantId: string) { return this.decisions.filter((d) => d.tenantId === tenantId); }
  setDecisionStatus(id: string, status: AwardDecisionRow['status'], actor: string, extras?: Partial<AwardDecisionRow>) {
    const d = this.decisionById(id); if (!d) throw new Error('not_found');
    d.status = status;
    if (extras) Object.assign(d, extras);
    if (status === 'closed' || status === 'rejected' || status === 'cancelled') d.closedAt = new Date().toISOString();
    this.audit.push({ id: randomUUID(), tenantId: d.tenantId, entityType: 'award-decision', entityId: id, actor, action: `award-decision.${status}`, diff: extras ?? {}, at: new Date().toISOString() });
    return d;
  }

  // Approvals
  createApproval(tenantId: string, decisionId: string, approverIds: string[], threshold: number, note: string | undefined, actor: string): ApprovalRow {
    const row: ApprovalRow = {
      id: randomUUID(), tenantId, decisionId, approverIds, threshold,
      approvals: [], status: 'pending', note: note ?? null,
      createdAt: new Date().toISOString(), closedAt: null,
    };
    this.approvals.push(row);
    const d = this.decisionById(decisionId); if (d) d.approvalId = row.id;
    this.audit.push({ id: randomUUID(), tenantId, entityType: 'approval', entityId: row.id, actor, action: 'approval.created', diff: { decisionId, approverIds, threshold }, at: row.createdAt });
    return row;
  }
  approvalById(id: string) { return this.approvals.find((a) => a.id === id) ?? null; }
  decideApproval(id: string, approverId: string, decision: 'approved' | 'rejected', note: string | undefined): ApprovalRow {
    const a = this.approvalById(id); if (!a) throw new Error('not_found');
    if (a.status !== 'pending') return a;
    if (!a.approverIds.includes(approverId)) throw new Error('not_authorised');
    if (a.approvals.some((x) => x.approverId === approverId)) throw new Error('duplicate_decision');
    a.approvals.push({ approverId, decision, note: note ?? null, at: new Date().toISOString() });
    if (decision === 'rejected') { a.status = 'rejected'; a.closedAt = new Date().toISOString(); }
    else if (a.approvals.filter((x) => x.decision === 'approved').length >= a.threshold) { a.status = 'approved'; a.closedAt = new Date().toISOString(); }
    this.audit.push({ id: randomUUID(), tenantId: a.tenantId, entityType: 'approval', entityId: id, actor: approverId, action: `approval.${decision}`, diff: { note }, at: new Date().toISOString() });
    return a;
  }
  approvalsFor(tenantId: string) { return this.approvals.filter((a) => a.tenantId === tenantId); }

  // Weights
  weightsFor(projectId: string) { return this.weights.get(projectId) ?? { price: 0.35, timeline: 0.20, fit: 0.30, risk: 0.15 }; }
  setWeights(projectId: string, w: { price: number; timeline: number; fit: number; risk: number }, actor: string) {
    this.weights.set(projectId, w);
    this.audit.push({ id: randomUUID(), tenantId: 'tenant-demo', entityType: 'review', entityId: projectId, actor, action: 'weights.updated', diff: w, at: new Date().toISOString() });
    return w;
  }

  auditFor(entityType: AuditRow['entityType'], entityId: string) {
    return this.audit.filter((a) => a.entityType === entityType && a.entityId === entityId);
  }
}
