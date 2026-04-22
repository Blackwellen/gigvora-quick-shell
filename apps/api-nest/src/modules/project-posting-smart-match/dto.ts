/**
 * Domain 33 — Project Posting Studio, Smart Match & Invite Flows.
 *
 * Zod DTOs for every controller surface. The SDK + Flutter clients infer
 * types directly from these so wire formats stay aligned.
 */
import { z } from 'zod';

export const ProjectStudioStatus = z.enum([
  'draft', 'pending_review', 'active', 'paused', 'expired', 'archived', 'rejected', 'awarded', 'cancelled',
]);
export type ProjectStudioStatus = z.infer<typeof ProjectStudioStatus>;

export const Engagement = z.enum(['fixed', 'hourly', 'milestone', 'retainer']);
export const Workplace = z.enum(['remote', 'hybrid', 'onsite']);
export const Visibility = z.enum(['public', 'private', 'invite_only', 'partner_network']);
export const PromotionTier = z.enum(['none', 'standard', 'featured', 'spotlight']);

export const MilestoneSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(120),
  amountCents: z.number().int().min(0).max(100_000_000),
  dueAt: z.string().datetime().optional(),
});

export const ScreenerSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(3).max(500),
  required: z.boolean().default(false),
  knockout: z.boolean().default(false),
});

export const ProjectStudioDraftSchema = z.object({
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().max(2000).default(''),
  description: z.string().trim().max(20_000).default(''),
  engagement: Engagement.default('fixed'),
  workplace: Workplace.default('remote'),
  location: z.string().trim().max(160).default(''),
  budgetMinCents: z.number().int().min(0).max(100_000_000).optional(),
  budgetMaxCents: z.number().int().min(0).max(100_000_000).optional(),
  currency: z.enum(['GBP', 'USD', 'EUR']).default('GBP'),
  durationDays: z.number().int().min(1).max(720).optional(),
  startWindow: z.enum(['immediate', 'this_week', 'this_month', 'flexible']).default('flexible'),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  categories: z.array(z.string().trim().max(60)).max(10).default([]),
  experienceLevel: z.enum(['entry', 'intermediate', 'expert']).default('intermediate'),
  scopeSize: z.enum(['small', 'medium', 'large', 'enterprise']).default('medium'),
  launchpadFlags: z.array(z.string().trim().max(60)).max(10).default([]),
  visibility: Visibility.default('public'),
  promotionTier: PromotionTier.default('none'),
  ndaRequired: z.boolean().default(false),
  attachmentIds: z.array(z.string().uuid()).max(20).default([]),
  milestones: z.array(MilestoneSchema).max(20).default([]),
  screeners: z.array(ScreenerSchema).max(15).default([]),
});
export type ProjectStudioDraft = z.infer<typeof ProjectStudioDraftSchema>;

export const ProjectStudioUpdateSchema = ProjectStudioDraftSchema.partial();

export const ListFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.array(ProjectStudioStatus).max(9).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['updated', 'created', 'title', 'invites', 'matches']).default('updated'),
});

export const PublishSchema = z.object({
  promotionTier: PromotionTier.default('none'),
  durationDays: z.number().int().min(1).max(180).default(30),
  channels: z.array(z.string().max(40)).max(20).default(['gigvora']),
  inviteCap: z.number().int().min(0).max(500).default(0),
  idempotencyKey: z.string().min(8).max(120),
});

// ─── Smart Match ────────────────────────────────────────────────────────────
export const MatchRequestSchema = z.object({
  projectId: z.string().uuid(),
  topK: z.number().int().min(1).max(50).default(12),
  diversify: z.boolean().default(true),
  minScore: z.number().int().min(0).max(100).default(60),
  excludeInvited: z.boolean().default(false),
});

export const InviteCreateSchema = z.object({
  projectId: z.string().uuid(),
  candidateId: z.string().uuid(),
  channel: z.enum(['inapp', 'email', 'sms', 'inapp+email']).default('inapp+email'),
  message: z.string().trim().max(2000).optional(),
  expiresInDays: z.number().int().min(1).max(30).default(14),
});

export const InviteBulkSchema = z.object({
  projectId: z.string().uuid(),
  candidateIds: z.array(z.string().uuid()).min(1).max(100),
  channel: z.enum(['inapp', 'email', 'sms', 'inapp+email']).default('inapp+email'),
  message: z.string().trim().max(2000).optional(),
  expiresInDays: z.number().int().min(1).max(30).default(14),
});

export const InviteDecisionSchema = z.object({
  inviteId: z.string().uuid(),
  decision: z.enum(['accept', 'decline', 'maybe']),
  note: z.string().trim().max(2000).optional(),
});

// ─── Boost-credit checkout (multi-step per checkout rule) ───────────────────
export const BoostPackId = z.enum(['boost_starter_5', 'boost_growth_25', 'invite_pack_25', 'invite_pack_100']);

export const BoostPurchaseCreateSchema = z.object({
  packId: BoostPackId,
});

export const BoostPurchaseConfirmSchema = z.object({
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

export const ApplyBoostSchema = z.object({
  projectId: z.string().uuid(),
  promotionTier: PromotionTier,
  durationDays: z.number().int().min(1).max(60).default(7),
  idempotencyKey: z.string().min(8).max(120),
});

export const ApprovalDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'request_changes']),
  note: z.string().trim().max(2000).optional(),
});
