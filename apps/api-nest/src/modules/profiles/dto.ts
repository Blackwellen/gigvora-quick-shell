import { z } from 'zod';

export const VisibilityEnum = z.enum(['public','network','private']);
export const ProfileStatusEnum = z.enum(['active','paused','archived']);

export const UpsertProfileDto = z.object({
  handle: z.string().min(2).max(64).regex(/^[a-z0-9_.-]+$/i),
  displayName: z.string().min(1).max(120),
  headline: z.string().max(200).optional(),
  summary: z.string().max(4000).optional(),
  location: z.string().max(120).optional(),
  website: z.string().url().max(300).optional(),
  coverUrl: z.string().url().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  pronouns: z.string().max(40).optional(),
  openToWork: z.boolean().optional(),
  openToFreelance: z.boolean().optional(),
  openToMentoring: z.boolean().optional(),
  hourlyRateCents: z.number().int().min(0).max(10_000_00).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().max(64).optional(),
  visibility: VisibilityEnum.optional(),
  status: ProfileStatusEnum.optional(),
});
export type UpsertProfileDtoT = z.infer<typeof UpsertProfileDto>;

export const ExperienceDto = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  location: z.string().max(120).optional(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().optional(),
  description: z.string().max(4000).optional(),
  position: z.number().int().min(0).optional(),
});

export const EducationDto = z.object({
  institution: z.string().min(1).max(200),
  degree: z.string().max(200).optional(),
  field: z.string().max(200).optional(),
  startYear: z.number().int().min(1900).max(2100).optional(),
  endYear: z.number().int().min(1900).max(2100).optional(),
  position: z.number().int().min(0).optional(),
});

export const SkillDto = z.object({
  skill: z.string().min(1).max(80),
  level: z.enum(['beginner','intermediate','expert']).optional(),
  position: z.number().int().min(0).optional(),
});

export const PortfolioDto = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  coverUrl: z.string().url().optional().nullable(),
  externalUrl: z.string().url().optional().nullable(),
  media: z.array(z.record(z.unknown())).max(20).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  status: z.enum(['draft','published','archived']).optional(),
  position: z.number().int().min(0).optional(),
});

export const ReviewDto = z.object({
  subjectId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(4000).optional(),
  context: z.enum(['project','gig','service','job']).optional(),
  contextId: z.string().uuid().optional(),
});

export const VerificationRequestDto = z.object({
  kind: z.enum(['email','phone','id_document','company','linkedin','github']),
  evidenceUrl: z.string().url().optional(),
});

export const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
