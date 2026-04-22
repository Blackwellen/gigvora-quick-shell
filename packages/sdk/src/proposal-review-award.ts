/**
 * Typed SDK for Domain 35 — Proposal Review, Compare, Shortlist & Award.
 */
export type ReviewStatus = 'submitted' | 'shortlisted' | 'revised' | 'accepted' | 'rejected' | 'awarded' | 'declined';
export type AwardStatus = 'draft' | 'awaiting-approval' | 'approved' | 'escrow-handoff' | 'closed' | 'rejected' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type PaymentMethod = 'card' | 'invoice' | 'wallet';
export type ScoringWeights = { price: number; timeline: number; fit: number; risk: number };

export interface ReviewRow {
  id: string; tenantId: string; projectId: string; proposalId: string;
  ownerId: string; ownerName: string;
  status: ReviewStatus; shortlistRank: number | null;
  bidAmountCents: number; currency: string; timelineWeeks: number;
  scoreFit: number; scoreRisk: number;
  awardedAt: string | null; rejectedAt: string | null;
  createdAt: string; updatedAt: string; version: number;
}

export interface AxisExplain { axis: 'price' | 'timeline' | 'fit' | 'risk'; score: number; weight: number; weighted: number; note: string }
export interface ScoredRow { reviewId: string; proposalId: string; ownerName: string; bidAmountCents: number; timelineWeeks: number; scoreFit: number; scoreRisk: number; status: string; total: number; axes: AxisExplain[]; isRecommended: boolean }
export interface CompareResult { projectId: string; weights: ScoringWeights; rows: ScoredRow[]; mode: 'ml' | 'fallback'; generatedAt: string }

export interface AwardDecision { id: string; tenantId: string; projectId: string; proposalId: string; decidedBy: string; amountCents: number; currency: string; paymentMethod: PaymentMethod; scopeAcknowledgement: string; triggerEscrow: boolean; triggerApprovalChain: boolean; status: AwardStatus; approvalId: string | null; escrowHandoffRef: string | null; createdAt: string; closedAt: string | null }
export interface Approval { id: string; tenantId: string; decisionId: string; approverIds: string[]; threshold: number; approvals: { approverId: string; decision: 'approved' | 'rejected'; note: string | null; at: string }[]; status: ApprovalStatus; note: string | null; createdAt: string; closedAt: string | null }
export interface ReviewNote { id: string; tenantId: string; proposalId: string; authorId: string; body: string; visibility: 'private' | 'team'; createdAt: string }
export interface PraaInsights { submitted: number; shortlisted: number; rejected: number; awarded: number; declined: number; total: number; medianBidCents: number; decisionVelocityHours: number; anomalyNote: string | null; generatedAt: string; mode: string }

export interface ProposalReviewAwardClient {
  list(filters?: { projectId?: string; status?: ReviewStatus[] }): Promise<ReviewRow[]>;
  detail(id: string): Promise<(ReviewRow & { notes: ReviewNote[]; audit: any[] }) | null>;
  decide(proposalId: string, decision: 'shortlist' | 'unshortlist' | 'reject' | 'request_revision', note?: string, shortlistRank?: number): Promise<ReviewRow>;
  bulkDecide(proposalIds: string[], decision: 'shortlist' | 'reject', note?: string): Promise<ReviewRow[]>;
  rank(reviewId: string, rank: number | null): Promise<ReviewRow>;
  addNote(proposalId: string, body: string, visibility?: 'private' | 'team'): Promise<ReviewNote>;
  compare(projectId: string, proposalIds: string[], weights?: ScoringWeights): Promise<CompareResult>;
  setWeights(projectId: string, weights: ScoringWeights): Promise<ScoringWeights>;
  scoring(projectId: string): Promise<CompareResult>;
  draftAward(b: { proposalId: string; amountCents: number; currency?: 'GBP' | 'USD' | 'EUR'; paymentMethod?: PaymentMethod; scopeAcknowledgement: string; triggerEscrow?: boolean; triggerApprovalChain?: boolean }): Promise<AwardDecision>;
  awards(): Promise<AwardDecision[]>;
  cancelAward(id: string): Promise<AwardDecision>;
  requestApproval(decisionId: string, approverIds: string[], threshold?: number, note?: string): Promise<Approval>;
  decideApproval(approvalId: string, approverId: string, decision: 'approved' | 'rejected', note?: string): Promise<Approval>;
  approvals(): Promise<Approval[]>;
  insights(projectId?: string): Promise<PraaInsights>;
}

export const createProposalReviewAwardClient = (
  fetcher: typeof fetch,
  base = '/api/v1/proposal-review-award',
): ProposalReviewAwardClient => {
  const j = async (path: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`praa ${path} ${r.status}`);
    return r.json();
  };
  const idem = (s: string) => `praa-${s}-${crypto.randomUUID?.() ?? Date.now()}`;
  return {
    list: (f) => {
      const qs = new URLSearchParams();
      if (f?.projectId) qs.set('projectId', f.projectId);
      f?.status?.forEach((s) => qs.append('status', s));
      return j(`/reviews${qs.toString() ? `?${qs}` : ''}`);
    },
    detail: (id) => j(`/reviews/${id}`),
    decide: (proposalId, decision, note, shortlistRank) => j('/reviews/decision', { method: 'POST', body: JSON.stringify({ proposalId, decision, note, shortlistRank }) }),
    bulkDecide: (proposalIds, decision, note) => j('/reviews/bulk-decision', { method: 'POST', body: JSON.stringify({ proposalIds, decision, note }) }),
    rank: (reviewId, rank) => j('/reviews/rank', { method: 'POST', body: JSON.stringify({ reviewId, rank }) }),
    addNote: (proposalId, body, visibility = 'team') => j('/reviews/note', { method: 'POST', body: JSON.stringify({ proposalId, body, visibility }) }),
    compare: (projectId, proposalIds, weights) => j('/compare', { method: 'POST', body: JSON.stringify({ projectId, proposalIds, weights }) }),
    setWeights: (projectId, weights) => j('/scoring/weights', { method: 'POST', body: JSON.stringify({ projectId, weights }) }),
    scoring: (projectId) => j(`/scoring/${projectId}`),
    draftAward: (b) => j('/awards', { method: 'POST', body: JSON.stringify({ ...b, currency: b.currency ?? 'GBP', paymentMethod: b.paymentMethod ?? 'card', triggerEscrow: b.triggerEscrow ?? true, triggerApprovalChain: b.triggerApprovalChain ?? true, acceptTos: true, idempotencyKey: idem('award') }) }),
    awards: () => j('/awards'),
    cancelAward: (id) => j(`/awards/${id}/cancel`, { method: 'POST' }),
    requestApproval: (decisionId, approverIds, threshold = 1, note) => j(`/awards/${decisionId}/approval`, { method: 'POST', body: JSON.stringify({ approverIds, threshold, note }) }),
    decideApproval: (approvalId, approverId, decision, note) => j(`/approvals/${approvalId}/decide`, { method: 'POST', body: JSON.stringify({ approverId, decision, note }) }),
    approvals: () => j('/approvals'),
    insights: (projectId) => j(`/insights${projectId ? `?projectId=${projectId}` : ''}`),
  };
};
