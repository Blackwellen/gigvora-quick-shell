/**
 * Domain 34 React hooks. Wraps the SDK with TanStack Query and provides
 * deterministic safe-fetch fallbacks so the proposal builder, wallet, and
 * compare tabs never empty when the API is offline (mandatory degraded
 * states per mem://tech/frontend-integration-completeness).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProposalBuilderBidCreditsClient,
  type ProposalDraft,
  type CreditPackId,
  type ProposalStatus,
  type Wallet,
  type CreditPack,
  type PaymentMethod,
} from '@gigvora/sdk/proposal-builder-bid-credits';

const client = createProposalBuilderBidCreditsClient(fetch);

const FALLBACK_WALLET: Wallet = {
  creditBalance: 18, boostBalance: 4, proposalCost: 2, boostCost: 3,
  ledger: [
    { id: 'fb-l1', tenantId: 'fb', kind: 'credit', delta: 25, balanceAfter: 25, reason: 'seed', ref: null, reversalOf: null, at: new Date(Date.now() - 7 * 86_400_000).toISOString() },
    { id: 'fb-l2', tenantId: 'fb', kind: 'credit', delta: -2, balanceAfter: 23, reason: 'proposal:fallback-1', ref: null, reversalOf: null, at: new Date(Date.now() - 5 * 86_400_000).toISOString() },
    { id: 'fb-l3', tenantId: 'fb', kind: 'credit', delta: -2, balanceAfter: 21, reason: 'proposal:fallback-2', ref: null, reversalOf: null, at: new Date(Date.now() - 3 * 86_400_000).toISOString() },
    { id: 'fb-l4', tenantId: 'fb', kind: 'credit', delta: -2, balanceAfter: 19, reason: 'proposal:fallback-3', ref: null, reversalOf: null, at: new Date(Date.now() - 86_400_000).toISOString() },
    { id: 'fb-l5', tenantId: 'fb', kind: 'credit', delta: -1, balanceAfter: 18, reason: 'boost:fallback', ref: null, reversalOf: null, at: new Date().toISOString() },
  ],
  purchases: [],
};

const FALLBACK_PACKS: CreditPack[] = [
  { id: 'credits_starter_15',     label: 'Starter · 15 credits',          credits: 15,  bonusCredits: 0,  priceCents:  4_900, currency: 'GBP' },
  { id: 'credits_pro_50',         label: 'Pro · 50 credits',              credits: 50,  bonusCredits: 5,  priceCents: 14_900, currency: 'GBP' },
  { id: 'credits_enterprise_200', label: 'Enterprise · 200 credits',      credits: 200, bonusCredits: 30, priceCents: 49_900, currency: 'GBP' },
  { id: 'boost_pack_10',          label: 'Boost pack · 10 boost charges', credits: 0,   bonusCredits: 10, priceCents:  9_900, currency: 'GBP' },
];

export function useMyProposals(filters?: { status?: ProposalStatus[]; projectId?: string }) {
  return useQuery({
    queryKey: ['pbb', 'proposals', filters],
    queryFn: () => client.list(filters).catch(() => [] as Awaited<ReturnType<typeof client.list>>),
    staleTime: 30_000,
  });
}

export function useProposalDetail(id: string | null) {
  return useQuery({
    queryKey: ['pbb', 'proposal', id],
    enabled: !!id,
    queryFn: () => client.detail(id!).catch(() => null),
  });
}

export function useDraftProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: ProposalDraft) => client.draft(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pbb', 'proposals'] }),
  });
}

export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; expectedVersion: number; patch: Partial<ProposalDraft> }) =>
      client.update(vars.id, vars.expectedVersion, vars.patch),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['pbb', 'proposal', vars.id] });
      qc.invalidateQueries({ queryKey: ['pbb', 'proposals'] });
    },
  });
}

export function useSubmitProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => client.submit(proposalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pbb'] });
    },
  });
}

export function useWithdrawProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { proposalId: string; reason?: string }) => client.withdraw(vars.proposalId, vars.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pbb'] }),
  });
}

export function useReviseProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { proposalId: string; patch: Partial<ProposalDraft> }) => client.revise(vars.proposalId, vars.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pbb'] }),
  });
}

export function useDecideProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { proposalId: string; decision: 'shortlist' | 'accept' | 'reject' | 'request_revision'; note?: string }) =>
      client.decide(vars.proposalId, vars.decision, vars.note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pbb'] }),
  });
}

export function useCreditPacks() {
  return useQuery({
    queryKey: ['pbb', 'packs'],
    queryFn: () => client.packs().catch(() => FALLBACK_PACKS),
    staleTime: 5 * 60_000,
  });
}

export function useWallet() {
  return useQuery({
    queryKey: ['pbb', 'wallet'],
    queryFn: () => client.wallet().catch(() => FALLBACK_WALLET),
    staleTime: 30_000,
  });
}

export function useCreatePurchase() {
  return useMutation({ mutationFn: (packId: CreditPackId) => client.createPurchase(packId) });
}

export function useConfirmPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { purchaseId: string; paymentMethod: PaymentMethod; billing: { name: string; email: string; country: string; vatId?: string } }) =>
      client.confirmPurchase(vars.purchaseId, { paymentMethod: vars.paymentMethod, billing: vars.billing }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pbb', 'wallet'] }),
  });
}

export function useEscrows() {
  return useQuery({
    queryKey: ['pbb', 'escrows'],
    queryFn: () => client.escrows().catch(() => []),
  });
}

export function useHoldEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { proposalId: string; amountCents: number; currency?: 'GBP' | 'USD' | 'EUR'; paymentMethod: PaymentMethod }) => client.holdEscrow(vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pbb', 'escrows'] }),
  });
}

export function useReleaseEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { escrowId: string; amountCents?: number; milestoneId?: string; reason?: string }) => client.releaseEscrow(vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pbb', 'escrows'] }),
  });
}

export function useRefundEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { escrowId: string; amountCents?: number; reason: string }) => client.refundEscrow(vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pbb', 'escrows'] }),
  });
}

export function useProposalInsights() {
  return useQuery({
    queryKey: ['pbb', 'insights'],
    queryFn: () => client.insights().catch(() => ({
      drafts: 1, submitted: 1, shortlisted: 1, accepted: 1, rejected: 1, winRate: 50,
      creditBalance: 18, boostBalance: 4, proposalCost: 2,
      burnDown14d: 8, runwayDays: 31, anomalyNote: null,
      generatedAt: new Date().toISOString(), mode: 'fallback',
    })),
  });
}

export function usePricingAdvice(projectId: string | null, proposedAmountCents?: number) {
  return useQuery({
    queryKey: ['pbb', 'pricing-advice', projectId, proposedAmountCents],
    enabled: !!projectId,
    queryFn: () => client.pricingAdvice({ projectId: projectId!, proposedAmountCents }).catch(() => ({
      projectId: projectId!,
      bandCents: { min: 22_000_00, mid: 29_500_00, max: 38_000_00 },
      currency: 'GBP', positionLabel: 'mid' as const, competitiveScore: 78, peerCount: 0,
      reasons: ['Synthetic band — backend unreachable'],
      mode: 'fallback' as const, generatedAt: new Date().toISOString(),
    })),
  });
}
