import { z } from 'zod';

export const ProposalStatusEnum = z.enum(['received', 'shortlisted', 'accepted', 'rejected', 'withdrawn', 'expired']);
export type ProposalStatus = z.infer<typeof ProposalStatusEnum>;

export const OversightStatusEnum = z.enum(['planning', 'active', 'at_risk', 'on_hold', 'completed', 'cancelled']);
export type OversightStatus = z.infer<typeof OversightStatusEnum>;

export const SpendStatusEnum = z.enum(['pending', 'cleared', 'refunded', 'disputed']);
export const ApprovalStatusEnum = z.enum(['pending', 'approved', 'rejected', 'escalated']);

export const SpendCategoryEnum = z.enum(['gig', 'service', 'project', 'subscription', 'fee', 'tax', 'refund']);

// Valid proposal transitions enforced server-side.
export const PROPOSAL_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  received: ['shortlisted', 'rejected', 'expired'],
  shortlisted: ['accepted', 'rejected', 'withdrawn', 'expired'],
  accepted: [],
  rejected: [],
  withdrawn: [],
  expired: [],
};

export const OVERSIGHT_TRANSITIONS: Record<OversightStatus, OversightStatus[]> = {
  planning: ['active', 'cancelled'],
  active: ['at_risk', 'on_hold', 'completed', 'cancelled'],
  at_risk: ['active', 'on_hold', 'completed', 'cancelled'],
  on_hold: ['active', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const OverviewQuerySchema = z.object({
  refresh: z.coerce.boolean().optional().default(false),
  windowDays: z.coerce.number().int().min(1).max(365).optional().default(30),
});
export type OverviewQuery = z.infer<typeof OverviewQuerySchema>;

export const ListProposalsQuerySchema = z.object({
  status: ProposalStatusEnum.optional(),
  projectId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListProposalsQuery = z.infer<typeof ListProposalsQuerySchema>;

export const TransitionProposalSchema = z.object({
  status: ProposalStatusEnum,
  reason: z.string().max(500).optional(),
});
export type TransitionProposalDto = z.infer<typeof TransitionProposalSchema>;

export const ListOversightQuerySchema = z.object({
  status: OversightStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const TransitionOversightSchema = z.object({
  status: OversightStatusEnum,
  note: z.string().max(500).optional(),
});
export type TransitionOversightDto = z.infer<typeof TransitionOversightSchema>;

export const SpendQuerySchema = z.object({
  category: SpendCategoryEnum.optional(),
  status: SpendStatusEnum.optional(),
  fromIso: z.string().datetime().optional(),
  toIso: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const ApproveSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'escalated']),
  note: z.string().max(500).optional(),
});
export type ApproveDto = z.infer<typeof ApproveSchema>;

export const SaveItemSchema = z.object({
  itemType: z.enum(['gig', 'service', 'professional', 'company', 'project']),
  itemId: z.string().uuid(),
  label: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});
export type SaveItemDto = z.infer<typeof SaveItemSchema>;
