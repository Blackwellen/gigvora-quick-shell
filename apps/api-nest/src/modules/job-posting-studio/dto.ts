import { z } from 'zod';

export const JobStatus = z.enum(['draft', 'pending_review', 'active', 'paused', 'expired', 'archived', 'rejected']);
export const Employment = z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship']);
export const Workplace = z.enum(['remote', 'hybrid', 'onsite']);
export const Visibility = z.enum(['public', 'private', 'invite_only', 'partner_network']);

export const JobDraftSchema = z.object({
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().max(2000).default(''),
  description: z.string().trim().max(20_000).default(''),
  employment: Employment.default('full_time'),
  workplace: Workplace.default('remote'),
  location: z.string().trim().max(160).default(''),
  salaryMinCents: z.number().int().min(0).max(10_000_000_00).optional(),
  salaryMaxCents: z.number().int().min(0).max(10_000_000_00).optional(),
  currency: z.enum(['GBP', 'USD', 'EUR']).default('GBP'),
  skills: z.array(z.string().trim().max(40)).max(30).default([]),
  benefits: z.array(z.string().trim().max(120)).max(20).default([]),
  applyUrl: z.string().url().optional(),
  visibility: Visibility.default('public'),
  promoted: z.boolean().default(false),
  promotionTier: z.enum(['none', 'standard', 'featured', 'spotlight']).default('none'),
});
export type JobDraft = z.infer<typeof JobDraftSchema>;

export const JobUpdateSchema = JobDraftSchema.partial();

export const ListFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.array(JobStatus).max(7).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['updated', 'created', 'title', 'applications']).default('updated'),
});

export const PublishSchema = z.object({
  promotionTier: z.enum(['none', 'standard', 'featured', 'spotlight']).default('none'),
  durationDays: z.number().int().min(1).max(90).default(30),
  channels: z.array(z.string().max(40)).max(20).default(['gigvora']),
  idempotencyKey: z.string().min(8).max(120),
});

export const CreditPurchaseCreateSchema = z.object({
  packId: z.enum(['starter_5', 'growth_25', 'scale_100', 'enterprise_500']),
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
});

export const ApprovalDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'request_changes']),
  note: z.string().trim().max(2000).optional(),
});
