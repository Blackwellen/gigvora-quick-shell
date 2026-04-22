/**
 * D34 — Proposal Builder, Bid Credits, Scope Entry & Pricing Submission.
 *
 * Zod DTOs for every controller surface. Mirrors envelopes 1:1 with the
 * SDK + Flutter client so wire formats stay aligned.
 */
import { z } from 'zod';

export const ProposalStatus = z.enum([
  'draft', 'submitted', 'shortlisted', 'revised', 'accepted', 'rejected', 'withdrawn', 'expired',
]);
export type ProposalStatus = z.infer<typeof ProposalStatus>;

export const PricingMode = z.enum(['fixed', 'hourly', 'milestone', 'retainer']);
export type PricingMode = z.infer<typeof PricingMode>;

export const MilestoneSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(''),
  amountCents: z.number().int().min(0).max(100_000_000),
  durationDays: z.number().int().min(1).max(365).optional(),
  position: z.number().int().min(0).max(50).default(0),
});

export const ProposalDraftSchema = z.object({
  projectId: z.string().uuid(),
  coverLetter: z.string().trim().max(20_000).default(''),
  pricingMode: PricingMode.default('fixed'),
  bidAmountCents: z.number().int().min(0).max(100_000_000).optional(),
  hourlyRateCents: z.number().int().min(0).max(1_000_000).optional(),
  estimatedHours: z.number().int().min(1).max(10_000).optional(),
  currency: z.enum(['GBP', 'USD', 'EUR']).default('GBP'),
  timelineWeeks: z.number().int().min(1).max(104).optional(),
  scope: z.string().trim().max(20_000).default(''),
  deliverables: z.array(z.string().trim().min(1).max(280)).max(50).default([]),
  assumptions: z.array(z.string().trim().min(1).max(280)).max(50).default([]),
  exclusions: z.array(z.string().trim().min(1).max(280)).max(50).default([]),
  attachmentIds: z.array(z.string().uuid()).max(20).default([]),
  milestones: z.array(MilestoneSchema).max(20).default([]),
  screeningAnswers: z.array(z.string().trim().max(2000)).max(15).default([]),
  boostEnabled: z.boolean().default(false),
});
export type ProposalDraft = z.infer<typeof ProposalDraftSchema>;

export const ProposalUpdateSchema = ProposalDraftSchema.partial().omit({ projectId: true });

export const SubmitProposalSchema = z.object({
  proposalId: z.string().uuid(),
  acceptTos: z.literal(true),
  idempotencyKey: z.string().min(8).max(120),
});

export const WithdrawSchema = z.object({
  proposalId: z.string().uuid(),
  reason: z.string().trim().max(1000).optional(),
});

export const ReviseSchema = z.object({
  proposalId: z.string().uuid(),
  patch: ProposalDraftSchema.partial().omit({ projectId: true }),
  idempotencyKey: z.string().min(8).max(120),
});

export const ClientDecisionSchema = z.object({
  proposalId: z.string().uuid(),
  decision: z.enum(['shortlist', 'accept', 'reject', 'request_revision']),
  note: z.string().trim().max(2000).optional(),
});

export const ListFiltersSchema = z.object({
  status: z.array(ProposalStatus).max(8).optional(),
  projectId: z.string().uuid().optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['updated', 'created', 'amount']).default('updated'),
});

// ─── Bid-credit packs (multi-step checkout per platform rule) ──────────────
export const CreditPackId = z.enum([
  'credits_starter_15', 'credits_pro_50', 'credits_enterprise_200', 'boost_pack_10',
]);
export type CreditPackId = z.infer<typeof CreditPackId>;

export const CreditPurchaseCreateSchema = z.object({
  packId: CreditPackId,
});

export const CreditPurchaseConfirmSchema = z.object({
  purchaseId: z.string().uuid(),
  paymentMethod: z.enum(['card', 'invoice', 'wallet']),
  billing: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().email(),
    country: z.string().length(2),
    vatId: z.string().trim().max(40).optional(),
  }),
  acceptTos: z.literal(true),
  idempotencyKey: z.string().min(8).max(120),
});

export const CreditRefundSchema = z.object({
  purchaseId: z.string().uuid(),
  reason: z.string().trim().max(2000),
});

// ─── Escrow (full multi-step checkout + holds + refunds) ───────────────────
export const EscrowHoldSchema = z.object({
  proposalId: z.string().uuid(),
  amountCents: z.number().int().min(100).max(100_000_000),
  currency: z.enum(['GBP', 'USD', 'EUR']).default('GBP'),
  paymentMethod: z.enum(['card', 'invoice', 'wallet']),
  acceptTos: z.literal(true),
  idempotencyKey: z.string().min(8).max(120),
});

export const EscrowReleaseSchema = z.object({
  escrowId: z.string().uuid(),
  milestoneId: z.string().uuid().optional(),
  amountCents: z.number().int().min(100).max(100_000_000).optional(),
  reason: z.string().trim().max(2000).optional(),
  idempotencyKey: z.string().min(8).max(120),
});

export const EscrowRefundSchema = z.object({
  escrowId: z.string().uuid(),
  amountCents: z.number().int().min(100).max(100_000_000).optional(),
  reason: z.string().trim().max(2000),
  idempotencyKey: z.string().min(8).max(120),
});

export const PricingAdviceSchema = z.object({
  projectId: z.string().uuid(),
  proposedAmountCents: z.number().int().min(0).max(100_000_000).optional(),
});
