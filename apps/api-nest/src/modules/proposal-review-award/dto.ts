/**
 * D35 — Proposal Review, Compare, Shortlist & Award Decisions.
 * Zod DTOs for every controller surface.
 */
import { z } from 'zod';

export const DecisionKind = z.enum(['shortlist', 'unshortlist', 'reject', 'request_revision', 'award', 'unaward']);
export type DecisionKind = z.infer<typeof DecisionKind>;

export const ApprovalDecision = z.enum(['approved', 'rejected']);

export const ListReviewSchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.array(z.enum(['submitted', 'shortlisted', 'revised', 'accepted', 'rejected', 'awarded', 'declined'])).max(8).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['score', 'price', 'timeline', 'updated']).default('score'),
});

export const CompareSchema = z.object({
  projectId: z.string().uuid(),
  proposalIds: z.array(z.string().uuid()).min(2).max(8),
  weights: z.object({
    price: z.number().min(0).max(1).default(0.35),
    timeline: z.number().min(0).max(1).default(0.20),
    fit: z.number().min(0).max(1).default(0.30),
    risk: z.number().min(0).max(1).default(0.15),
  }).optional(),
});

export const DecisionSchema = z.object({
  proposalId: z.string().uuid(),
  decision: DecisionKind,
  note: z.string().trim().max(2000).optional(),
  shortlistRank: z.number().int().min(1).max(50).optional(),
});

export const BulkDecisionSchema = z.object({
  proposalIds: z.array(z.string().uuid()).min(1).max(50),
  decision: z.enum(['shortlist', 'reject']),
  note: z.string().trim().max(2000).optional(),
});

export const AwardSchema = z.object({
  proposalId: z.string().uuid(),
  amountCents: z.number().int().min(100).max(100_000_000),
  currency: z.enum(['GBP', 'USD', 'EUR']).default('GBP'),
  paymentMethod: z.enum(['card', 'invoice', 'wallet']).default('card'),
  scopeAcknowledgement: z.string().trim().min(8).max(2000),
  acceptTos: z.literal(true),
  triggerEscrow: z.boolean().default(true),
  triggerApprovalChain: z.boolean().default(true),
  idempotencyKey: z.string().min(8).max(120),
});

export const ApprovalRequestSchema = z.object({
  decisionId: z.string().uuid(),
  approverIds: z.array(z.string().uuid()).min(1).max(10),
  threshold: z.number().int().min(1).max(10).default(1),
  note: z.string().trim().max(2000).optional(),
});

export const ApprovalDecideSchema = z.object({
  approvalId: z.string().uuid(),
  approverId: z.string().uuid(),
  decision: ApprovalDecision,
  note: z.string().trim().max(2000).optional(),
});

export const ScoringWeightsSchema = z.object({
  projectId: z.string().uuid(),
  weights: z.object({
    price: z.number().min(0).max(1),
    timeline: z.number().min(0).max(1),
    fit: z.number().min(0).max(1),
    risk: z.number().min(0).max(1),
  }),
});

export const NoteSchema = z.object({
  proposalId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
  visibility: z.enum(['private', 'team']).default('team'),
});
