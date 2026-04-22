import { z } from 'zod';

export const CompanyVisibility = z.enum(['public','unlisted','private']);
export const CompanyStatus = z.enum(['draft','active','paused','archived']);
export const MemberRole = z.enum(['owner','admin','recruiter','editor','employee']);

export const CreateCompanyDto = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  tagline: z.string().max(280).optional(),
  about: z.string().max(8000).optional(),
  industry: z.string().max(80).optional(),
  sizeBand: z.enum(['1-10','11-50','51-200','201-1000','1001-5000','5000+']).optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),
  headquarters: z.string().max(200).optional(),
  website: z.string().url().max(300).optional(),
  logoUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  brandColor: z.string().max(20).optional(),
  visibility: CompanyVisibility.optional(),
});
export const UpdateCompanyDto = CreateCompanyDto.partial().extend({
  status: CompanyStatus.optional(),
});

export const InviteMemberDto = z.object({
  identityId: z.string().uuid(),
  role: MemberRole.default('employee'),
  title: z.string().max(200).optional(),
  isPublic: z.boolean().optional(),
});

export const LocationDto = z.object({
  label: z.string().min(1).max(120),
  city: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  isHq: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export const LinkDto = z.object({
  kind: z.enum(['linkedin','twitter','github','careers','press']),
  url: z.string().url().max(500),
  position: z.number().int().min(0).optional(),
});

export const BrandDto = z.object({
  primaryColor: z.string().max(20).optional(),
  secondaryColor: z.string().max(20).optional(),
  textColor: z.string().max(20).optional(),
  fontFamily: z.string().max(80).optional(),
  heroUrl: z.string().url().optional().nullable(),
  values: z.array(z.string().max(80)).max(20).optional(),
  perks: z.array(z.string().max(120)).max(30).optional(),
});

export const PostDto = z.object({
  body: z.string().min(1).max(8000),
  media: z.array(z.record(z.unknown())).max(10).optional(),
  status: z.enum(['draft','published','archived']).optional(),
});

export const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(120).optional(),
  industry: z.string().max(80).optional(),
});
