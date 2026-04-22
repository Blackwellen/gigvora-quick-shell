/**
 * Typed SDK for Domain 34 — Proposal Builder, Bid Credits, Scope Entry &
 * Pricing Submission. Mirrors controller envelopes 1:1.
 */
export type ProposalStatus = 'draft' | 'submitted' | 'shortlisted' | 'revised' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
export type PricingMode = 'fixed' | 'hourly' | 'milestone' | 'retainer';
export type CreditPackId = 'credits_starter_15' | 'credits_pro_50' | 'credits_enterprise_200' | 'boost_pack_10';
export type EscrowStatus = 'pending' | 'held' | 'released' | 'refunded' | 'partial-released';
export type PaymentMethod = 'card' | 'invoice' | 'wallet';

export interface Milestone {
  id?: string; title: string; description?: string;
  amountCents: number; durationDays?: number; position?: number;
}

export interface ProposalDraft {
  projectId: string;
  coverLetter?: string;
  pricingMode?: PricingMode;
  bidAmountCents?: number; hourlyRateCents?: number; estimatedHours?: number;
  currency?: 'GBP' | 'USD' | 'EUR';
  timelineWeeks?: number;
  scope?: string;
  deliverables?: string[]; assumptions?: string[]; exclusions?: string[];
  attachmentIds?: string[]; milestones?: Milestone[];
  screeningAnswers?: string[];
  boostEnabled?: boolean;
}

export interface ProposalRowPublic {
  id: string; tenantId: string; owner: { id: string; name: string };
  projectId: string;
  coverLetter: string;
  pricingMode: PricingMode;
  bidAmountCents: number | null; hourlyRateCents: number | null;
  estimatedHours: number | null; currency: string;
  timelineWeeks: number | null;
  scope: string;
  deliverables: string[]; assumptions: string[]; exclusions: string[];
  attachmentIds: string[];
  milestones: Required<Milestone>[];
  screeningAnswers: string[];
  boostEnabled: boolean;
  status: ProposalStatus; scopeLocked: boolean;
  submittedAt: string | null; expiresAt: string | null;
  shortlistedAt: string | null; acceptedAt: string | null; rejectedAt: string | null; withdrawnAt: string | null;
  competitorRangeCents: { min: number; max: number; mid: number } | null;
  shortlistPosition: number | null;
  creditCost: number; boostCost: number;
  createdAt: string; updatedAt: string; version: number;
}

export interface CreditPack { id: CreditPackId; label: string; credits: number; bonusCredits: number; priceCents: number; currency: 'GBP' }
export interface CreditPurchase { id: string; tenantId: string; buyerId: string; packId: string; credits: number; bonusCredits: number; isBoostPack: boolean; amountCents: number; currency: string; status: 'pending' | 'paid' | 'failed' | 'refunded'; createdAt: string; confirmedAt: string | null; refundedAt: string | null; receiptUrl: string | null; reason: string | null }

export interface LedgerEntry { id: string; tenantId: string; kind: 'credit' | 'boost' | 'escrow'; delta: number; balanceAfter: number; reason: string; ref: string | null; reversalOf: string | null; at: string }
export interface Wallet { creditBalance: number; boostBalance: number; proposalCost: number; boostCost: number; ledger: LedgerEntry[]; purchases: CreditPurchase[] }

export interface EscrowRow { id: string; tenantId: string; payerId: string; payeeId: string; proposalId: string; projectId: string; amountHeldCents: number; amountReleasedCents: number; amountRefundedCents: number; currency: string; status: EscrowStatus; paymentMethod: PaymentMethod; createdAt: string; heldAt: string | null; closedAt: string | null }

export interface PricingAdvice { projectId: string; bandCents: { min: number; mid: number; max: number }; currency: string; positionLabel: 'below' | 'mid' | 'above'; competitiveScore: number; peerCount: number; reasons: string[]; mode: 'ml' | 'fallback'; generatedAt: string }
export interface PbbInsights { drafts: number; submitted: number; shortlisted: number; accepted: number; rejected: number; winRate: number; creditBalance: number; boostBalance: number; proposalCost: number; burnDown14d: number; runwayDays: number | null; anomalyNote: string | null; generatedAt: string; mode: string }

export interface ProposalBuilderBidCreditsClient {
  list(filters?: { status?: ProposalStatus[]; projectId?: string }): Promise<ProposalRowPublic[]>;
  detail(id: string): Promise<(ProposalRowPublic & { audit: any[]; escrows: EscrowRow[] }) | null>;
  byProject(projectId: string): Promise<ProposalRowPublic[]>;

  draft(d: ProposalDraft): Promise<ProposalRowPublic>;
  update(id: string, expectedVersion: number, patch: Partial<ProposalDraft>): Promise<ProposalRowPublic>;
  submit(proposalId: string): Promise<ProposalRowPublic>;
  withdraw(proposalId: string, reason?: string): Promise<ProposalRowPublic>;
  revise(proposalId: string, patch: Partial<ProposalDraft>): Promise<ProposalRowPublic>;
  decide(proposalId: string, decision: 'shortlist' | 'accept' | 'reject' | 'request_revision', note?: string): Promise<ProposalRowPublic>;

  packs(): Promise<CreditPack[]>;
  wallet(): Promise<Wallet>;
  createPurchase(packId: CreditPackId): Promise<CreditPurchase>;
  confirmPurchase(purchaseId: string, body: { paymentMethod: PaymentMethod; billing: { name: string; email: string; country: string; vatId?: string } }): Promise<CreditPurchase>;
  refundPurchase(purchaseId: string, reason: string): Promise<CreditPurchase>;

  escrows(): Promise<EscrowRow[]>;
  holdEscrow(b: { proposalId: string; amountCents: number; currency?: 'GBP' | 'USD' | 'EUR'; paymentMethod: PaymentMethod }): Promise<EscrowRow>;
  releaseEscrow(b: { escrowId: string; amountCents?: number; milestoneId?: string; reason?: string }): Promise<EscrowRow>;
  refundEscrow(b: { escrowId: string; amountCents?: number; reason: string }): Promise<EscrowRow>;

  insights(): Promise<PbbInsights>;
  pricingAdvice(b: { projectId: string; proposedAmountCents?: number }): Promise<PricingAdvice>;
}

export const createProposalBuilderBidCreditsClient = (
  fetcher: typeof fetch,
  base = '/api/v1/proposal-builder-bid-credits',
): ProposalBuilderBidCreditsClient => {
  const j = async (path: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`pbb ${path} ${r.status}`);
    return r.json();
  };
  const idem = (scope: string) => `pbb-${scope}-${crypto.randomUUID?.() ?? Date.now()}`;
  return {
    list: (filters) => {
      const qs = new URLSearchParams();
      filters?.status?.forEach((s) => qs.append('status', s));
      if (filters?.projectId) qs.set('projectId', filters.projectId);
      return j(`/proposals${qs.toString() ? `?${qs}` : ''}`);
    },
    detail: (id) => j(`/proposals/${id}`),
    byProject: (projectId) => j(`/projects/${projectId}/proposals`),

    draft: (d) => j('/proposals', { method: 'POST', body: JSON.stringify(d) }),
    update: (id, expectedVersion, patch) => j(`/proposals/${id}`, { method: 'PUT', body: JSON.stringify({ expectedVersion, patch }) }),
    submit: (proposalId) => j('/proposals/submit', { method: 'POST', body: JSON.stringify({ proposalId, acceptTos: true, idempotencyKey: idem('submit') }) }),
    withdraw: (proposalId, reason) => j('/proposals/withdraw', { method: 'POST', body: JSON.stringify({ proposalId, reason }) }),
    revise: (proposalId, patch) => j('/proposals/revise', { method: 'POST', body: JSON.stringify({ proposalId, patch, idempotencyKey: idem('revise') }) }),
    decide: (proposalId, decision, note) => j('/proposals/decision', { method: 'POST', body: JSON.stringify({ proposalId, decision, note }) }),

    packs: () => j('/credits/packs'),
    wallet: () => j('/credits/wallet'),
    createPurchase: (packId) => j('/credits/purchases', { method: 'POST', body: JSON.stringify({ packId }) }),
    confirmPurchase: (purchaseId, body) => j(`/credits/purchases/${purchaseId}/confirm`, { method: 'POST', body: JSON.stringify({ ...body, acceptTos: true, idempotencyKey: idem('confirm') }) }),
    refundPurchase: (purchaseId, reason) => j(`/credits/purchases/${purchaseId}/refund`, { method: 'POST', body: JSON.stringify({ reason }) }),

    escrows: () => j('/escrows'),
    holdEscrow: (b) => j('/escrows/hold', { method: 'POST', body: JSON.stringify({ ...b, currency: b.currency ?? 'GBP', acceptTos: true, idempotencyKey: idem('hold') }) }),
    releaseEscrow: (b) => j('/escrows/release', { method: 'POST', body: JSON.stringify({ ...b, idempotencyKey: idem('release') }) }),
    refundEscrow: (b) => j('/escrows/refund', { method: 'POST', body: JSON.stringify({ ...b, idempotencyKey: idem('refund') }) }),

    insights: () => j('/insights'),
    pricingAdvice: (b) => j('/pricing-advice', { method: 'POST', body: JSON.stringify(b) }),
  };
};
