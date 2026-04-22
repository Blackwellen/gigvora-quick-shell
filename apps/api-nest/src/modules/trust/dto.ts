import { z } from 'zod';

/**
 * Domain 16 — Ratings, Reviews, Trust Badges & Social Proof Systems.
 *
 * Wire DTOs are deliberately conservative: tight string caps, bounded
 * arrays, and explicit enums. These mirror the agency.dto.ts conventions
 * so the SDK and Flutter clients can rely on the same envelope shape.
 */

export const SubjectKindEnum    = z.enum(['user', 'agency', 'company', 'gig', 'service', 'project', 'job']);
export const ReviewDirectionEnum = z.enum(['received', 'given']);
export const ReviewStatusEnum   = z.enum(['draft', 'pending', 'published', 'disputed', 'rejected', 'archived']);
export const ReferenceStatusEnum = z.enum(['pending', 'verified', 'expired', 'declined']);
export const VerificationStatusEnum = z.enum(['not_started', 'pending', 'verified', 'failed']);
export const VerificationKindEnum = z.enum(['identity', 'email', 'phone', 'skills', 'background', 'portfolio', 'payment', 'address']);
export const BadgeKeyEnum = z.enum([
  'top_rated', 'verified_pro', 'fast_responder', 'trusted_seller',
  'community_leader', 'rising_star', 'enterprise_ready', 'long_tenured',
]);
export const ModerationActionEnum = z.enum(['hold', 'approve', 'reject', 'flag', 'restore']);

export const ListReviewsQuery = z.object({
  subjectKind: SubjectKindEnum.optional(),
  subjectId: z.string().min(1).max(120).optional(),
  authorId: z.string().min(1).max(120).optional(),
  direction: ReviewDirectionEnum.optional(),
  status: ReviewStatusEnum.optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['recent', 'rating', 'helpful']).default('recent'),
});
export type ListReviewsQueryT = z.infer<typeof ListReviewsQuery>;

export const CreateReviewDto = z.object({
  subjectKind: SubjectKindEnum,
  subjectId: z.string().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(2).max(160),
  body: z.string().min(10).max(4000),
  pros: z.array(z.string().min(1).max(160)).max(10).optional(),
  cons: z.array(z.string().min(1).max(160)).max(10).optional(),
  projectRef: z.string().max(160).optional(),
  // Optional contact email when the reviewer is unauthenticated.
  contactEmail: z.string().email().max(255).optional(),
});
export const UpdateReviewDto = CreateReviewDto.partial().omit({ subjectKind: true, subjectId: true });

export const ReviewResponseDto = z.object({
  body: z.string().min(2).max(2000),
});

export const DisputeReviewDto = z.object({
  reason: z.string().min(10).max(1000),
});

export const ModerationDecisionDto = z.object({
  action: ModerationActionEnum,
  notes: z.string().max(1000).optional(),
});

export const HelpfulVoteDto = z.object({
  helpful: z.boolean(),
});

export const ReferenceRequestDto = z.object({
  refereeName: z.string().min(2).max(160),
  refereeEmail: z.string().email().max(255),
  refereeRole: z.string().max(160).optional(),
  relationship: z.string().max(80).optional(),
  message: z.string().max(2000).optional(),
});
export const ReferenceSubmitDto = z.object({
  token: z.string().min(8).max(120),
  body: z.string().min(20).max(4000),
  rating: z.number().int().min(1).max(5).optional(),
});

export const VerificationStartDto = z.object({
  kind: VerificationKindEnum,
  evidence: z.record(z.string(), z.unknown()).optional(),
});

export const BadgeAwardDto = z.object({
  subjectKind: SubjectKindEnum,
  subjectId: z.string().min(1).max(120),
  badge: BadgeKeyEnum,
  reason: z.string().max(400).optional(),
});

export const TrustScoreQuery = z.object({
  subjectKind: SubjectKindEnum,
  subjectId: z.string().min(1).max(120),
});
