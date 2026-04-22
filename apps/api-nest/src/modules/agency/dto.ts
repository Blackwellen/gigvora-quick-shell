import { z } from 'zod';

/** Domain 13 — Agency Pages, Service Presence & Public Proof Surfaces. */

export const AgencyStatusEnum   = z.enum(['draft', 'active', 'paused', 'archived']);
export const VisibilityEnum     = z.enum(['public', 'network', 'private']);
export const ServiceStatusEnum  = z.enum(['draft', 'active', 'paused', 'archived']);
export const CaseStudyStatusEnum = z.enum(['draft', 'pending', 'published', 'archived']);
export const ProofKindEnum      = z.enum(['certification', 'award', 'press', 'security', 'compliance', 'partnership']);

export const ListQuery = z.object({
  q: z.string().max(200).optional(),
  industry: z.string().max(80).optional(),
  acceptingProjects: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'rating', 'recent', 'projects']).default('relevance'),
});
export type ListQueryT = z.infer<typeof ListQuery>;

export const CreateAgencyDto = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  tagline: z.string().max(280).optional(),
  industry: z.string().max(80).optional(),
  size: z.string().max(40).optional(),
  founded: z.string().max(10).optional(),
  headquarters: z.string().max(160).optional(),
  website: z.string().url().max(300).optional(),
  about: z.string().max(8000).optional(),
  logoUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  specialties: z.array(z.string().max(60)).max(20).optional(),
  languages: z.array(z.string().max(40)).max(20).optional(),
  engagementModels: z.array(z.string().max(40)).max(10).optional(),
  values: z.array(z.string().max(60)).max(10).optional(),
  visibility: VisibilityEnum.optional(),
  acceptingProjects: z.boolean().optional(),
});
export const UpdateAgencyDto = CreateAgencyDto.partial();

export const ServiceDto = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  priceFromCents: z.number().int().min(0).max(10_000_000).optional(),
  priceToCents:   z.number().int().min(0).max(10_000_000).optional(),
  currency: z.string().length(3).default('USD'),
  duration: z.string().max(40).optional(),
  popular: z.boolean().optional(),
  status: ServiceStatusEnum.default('active'),
  position: z.number().int().min(0).optional(),
});
export const UpdateServiceDto = ServiceDto.partial();

export const TeamMemberDto = z.object({
  name: z.string().min(1).max(160),
  role: z.string().max(160),
  identityId: z.string().uuid().optional().nullable(),
  skills: z.array(z.string().max(60)).max(20).optional(),
  available: z.boolean().optional(),
  badge: z.string().max(40).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  position: z.number().int().min(0).optional(),
});

export const CaseStudyDto = z.object({
  title: z.string().min(2).max(240),
  client: z.string().max(160).optional(),
  outcome: z.string().max(2000).optional(),
  body: z.string().max(20000).optional(),
  coverUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string().max(40)).max(10).optional(),
  status: CaseStudyStatusEnum.default('draft'),
  publishedAt: z.string().optional().nullable(),
});
export const UpdateCaseStudyDto = CaseStudyDto.partial();

export const ReviewDto = z.object({
  authorId: z.string().uuid().optional().nullable(),
  authorName: z.string().max(160).optional(),
  authorCompany: z.string().max(160).optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(4000).optional(),
  pros: z.string().max(1000).optional(),
  cons: z.string().max(1000).optional(),
});

export const ProofDto = z.object({
  kind: ProofKindEnum,
  label: z.string().min(2).max(160),
  issuer: z.string().max(160).optional(),
  evidenceUrl: z.string().url().optional().nullable(),
  issuedAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export const InquiryDto = z.object({
  contactName: z.string().min(2).max(160),
  contactEmail: z.string().email().max(200),
  company: z.string().max(160).optional(),
  budget: z.string().max(60).optional(),
  message: z.string().min(10).max(4000),
  serviceId: z.string().uuid().optional(),
  consent: z.object({ marketing: z.boolean().optional() }).optional(),
});

export const ModerationDecisionDto = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});
