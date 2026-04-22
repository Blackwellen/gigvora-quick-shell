/**
 * Domain 35 React hooks. Wraps the SDK with TanStack Query and provides
 * deterministic safe-fetch fallbacks so the workbench never empties when
 * the API is offline.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProposalReviewAwardClient,
  type ReviewRow, type ReviewStatus, type ScoringWeights, type CompareResult, type PaymentMethod,
} from '@gigvora/sdk/proposal-review-award';

const client = createProposalReviewAwardClient(fetch);

const FALLBACK_REVIEWS: ReviewRow[] = [
  { id: 'fb-r1', tenantId: 'fb', projectId: 'project-fb', proposalId: 'fb-p1', ownerId: 'u1', ownerName: 'Sarah Chen',     status: 'shortlisted', shortlistRank: 1,    bidAmountCents: 28_000_00, currency: 'GBP', timelineWeeks: 10, scoreFit: 92, scoreRisk: 18, awardedAt: null, rejectedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 },
  { id: 'fb-r2', tenantId: 'fb', projectId: 'project-fb', proposalId: 'fb-p2', ownerId: 'u2', ownerName: 'Alex Rivera',    status: 'shortlisted', shortlistRank: 2,    bidAmountCents: 22_000_00, currency: 'GBP', timelineWeeks: 12, scoreFit: 85, scoreRisk: 24, awardedAt: null, rejectedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 },
  { id: 'fb-r3', tenantId: 'fb', projectId: 'project-fb', proposalId: 'fb-p3', ownerId: 'u3', ownerName: 'James Okoro',    status: 'submitted',   shortlistRank: null, bidAmountCents: 35_000_00, currency: 'GBP', timelineWeeks:  8, scoreFit: 88, scoreRisk: 22, awardedAt: null, rejectedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 },
  { id: 'fb-r4', tenantId: 'fb', projectId: 'project-fb', proposalId: 'fb-p4', ownerId: 'u4', ownerName: 'Priya Sharma',   status: 'submitted',   shortlistRank: null, bidAmountCents: 29_500_00, currency: 'GBP', timelineWeeks: 11, scoreFit: 79, scoreRisk: 30, awardedAt: null, rejectedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 },
  { id: 'fb-r5', tenantId: 'fb', projectId: 'project-fb', proposalId: 'fb-p5', ownerId: 'u5', ownerName: 'Marcus Thompson',status: 'rejected',    shortlistRank: null, bidAmountCents: 15_000_00, currency: 'GBP', timelineWeeks: 16, scoreFit: 62, scoreRisk: 55, awardedAt: null, rejectedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 },
];

export function useReviews(filters?: { projectId?: string; status?: ReviewStatus[] }) {
  return useQuery({
    queryKey: ['praa', 'reviews', filters],
    queryFn: () => client.list(filters).catch(() => FALLBACK_REVIEWS),
    staleTime: 30_000,
  });
}

export function useReviewDetail(id: string | null) {
  return useQuery({ queryKey: ['praa', 'review', id], enabled: !!id, queryFn: () => client.detail(id!).catch(() => null) });
}

export function useDecideReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { proposalId: string; decision: 'shortlist' | 'unshortlist' | 'reject' | 'request_revision'; note?: string; shortlistRank?: number }) =>
      client.decide(vars.proposalId, vars.decision, vars.note, vars.shortlistRank),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['praa'] }),
  });
}
export function useBulkDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { proposalIds: string[]; decision: 'shortlist' | 'reject'; note?: string }) => client.bulkDecide(vars.proposalIds, vars.decision, vars.note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['praa'] }),
  });
}
export function useRankReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { reviewId: string; rank: number | null }) => client.rank(vars.reviewId, vars.rank),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['praa', 'reviews'] }),
  });
}
export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { proposalId: string; body: string; visibility?: 'private' | 'team' }) => client.addNote(vars.proposalId, vars.body, vars.visibility ?? 'team'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['praa'] }),
  });
}

const FALLBACK_COMPARE = (projectId: string, weights?: ScoringWeights): CompareResult => {
  const w = weights ?? { price: 0.35, timeline: 0.20, fit: 0.30, risk: 0.15 };
  const rows = FALLBACK_REVIEWS.slice(0, 4).map((r, i) => ({
    reviewId: r.id, proposalId: r.proposalId, ownerName: r.ownerName,
    bidAmountCents: r.bidAmountCents, timelineWeeks: r.timelineWeeks,
    scoreFit: r.scoreFit, scoreRisk: r.scoreRisk, status: r.status,
    total: 90 - i * 4,
    axes: [
      { axis: 'price' as const,    score: 80 - i * 5, weight: w.price,    weighted: (80 - i * 5) * w.price,    note: 'Cohort price band' },
      { axis: 'timeline' as const, score: 75 - i * 4, weight: w.timeline, weighted: (75 - i * 4) * w.timeline, note: `${r.timelineWeeks}w` },
      { axis: 'fit' as const,      score: r.scoreFit, weight: w.fit,      weighted: r.scoreFit * w.fit,        note: 'Skill overlap' },
      { axis: 'risk' as const,     score: 100 - r.scoreRisk, weight: w.risk, weighted: (100 - r.scoreRisk) * w.risk, note: 'Inverted risk' },
    ],
    isRecommended: i === 0,
  }));
  return { projectId, weights: w, rows, mode: 'fallback', generatedAt: new Date().toISOString() };
};

export function useCompare(projectId: string | null, proposalIds: string[], weights?: ScoringWeights) {
  return useQuery({
    queryKey: ['praa', 'compare', projectId, proposalIds, weights],
    enabled: !!projectId && proposalIds.length >= 2,
    queryFn: () => client.compare(projectId!, proposalIds, weights).catch(() => FALLBACK_COMPARE(projectId!, weights)),
  });
}
export function useScoring(projectId: string | null) {
  return useQuery({
    queryKey: ['praa', 'scoring', projectId],
    enabled: !!projectId,
    queryFn: () => client.scoring(projectId!).catch(() => FALLBACK_COMPARE(projectId!)),
  });
}
export function useSetWeights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { projectId: string; weights: ScoringWeights }) => client.setWeights(vars.projectId, vars.weights),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['praa'] }),
  });
}

export function useAwards() { return useQuery({ queryKey: ['praa', 'awards'], queryFn: () => client.awards().catch(() => []) }); }
export function useDraftAward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { proposalId: string; amountCents: number; scopeAcknowledgement: string; paymentMethod?: PaymentMethod; triggerEscrow?: boolean; triggerApprovalChain?: boolean }) => client.draftAward(vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['praa'] }),
  });
}
export function useCancelAward() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => client.cancelAward(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['praa'] }) });
}
export function useRequestApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { decisionId: string; approverIds: string[]; threshold?: number; note?: string }) => client.requestApproval(vars.decisionId, vars.approverIds, vars.threshold, vars.note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['praa'] }),
  });
}
export function useDecideApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { approvalId: string; approverId: string; decision: 'approved' | 'rejected'; note?: string }) => client.decideApproval(vars.approvalId, vars.approverId, vars.decision, vars.note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['praa'] }),
  });
}
export function useApprovals() { return useQuery({ queryKey: ['praa', 'approvals'], queryFn: () => client.approvals().catch(() => []) }); }

export function useReviewInsights(projectId?: string) {
  return useQuery({
    queryKey: ['praa', 'insights', projectId],
    queryFn: () => client.insights(projectId).catch(() => ({
      submitted: 3, shortlisted: 2, rejected: 1, awarded: 0, declined: 0, total: 6,
      medianBidCents: 28_750_00, decisionVelocityHours: 18, anomalyNote: null,
      generatedAt: new Date().toISOString(), mode: 'fallback',
    })),
  });
}
