import { z } from 'zod';

export const JobBrowseFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'newest', 'salary_desc', 'salary_asc', 'match']).default('relevance'),
  remote: z.enum(['any', 'remote', 'hybrid', 'onsite']).default('any'),
  type: z.array(z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary'])).max(5).optional(),
  seniority: z.array(z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'principal'])).max(6).optional(),
  salaryMin: z.number().int().min(0).max(10_000_000).optional(),
  salaryMax: z.number().int().min(0).max(10_000_000).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('GBP'),
  location: z.string().trim().max(120).optional(),
  radiusKm: z.number().int().min(1).max(500).optional(),
  companyIds: z.array(z.string().uuid()).max(20).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  industries: z.array(z.string().trim().max(60)).max(10).optional(),
  postedWithinDays: z.number().int().min(1).max(180).optional(),
  visaSponsorship: z.boolean().optional(),
  diversityFlag: z.boolean().optional(),
  facetMode: z.enum(['none', 'compact', 'full']).default('compact'),
});
export type JobBrowseFilters = z.infer<typeof JobBrowseFiltersSchema>;

export const SavedSearchSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(120),
  filters: JobBrowseFiltersSchema,
  alertsEnabled: z.boolean().default(false),
  alertCadence: z.enum(['off', 'realtime', 'daily', 'weekly']).default('off'),
  pinned: z.boolean().default(false),
  channel: z.enum(['inapp', 'email', 'inapp+email']).default('inapp'),
});
export type SavedSearch = z.infer<typeof SavedSearchSchema>;

export const JobBrowseResultSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  company: z.object({ id: z.string().uuid(), name: z.string(), logoUrl: z.string().nullable() }),
  location: z.string(),
  remote: z.enum(['remote', 'hybrid', 'onsite']),
  salary: z.object({ min: z.number().int().nullable(), max: z.number().int().nullable(), currency: z.string() }),
  type: z.string(),
  postedAt: z.string().datetime(),
  applicants: z.number().int().min(0),
  matchScore: z.number().min(0).max(100).nullable(),
  skills: z.array(z.string()),
  status: z.enum(['draft', 'active', 'paused', 'archived', 'closed']),
  saved: z.boolean().default(false),
  source: z.enum(['internal', 'imported', 'syndicated']).default('internal'),
});

export const FacetSchema = z.object({
  type: z.array(z.object({ value: z.string(), count: z.number().int() })),
  remote: z.array(z.object({ value: z.string(), count: z.number().int() })),
  seniority: z.array(z.object({ value: z.string(), count: z.number().int() })),
  industries: z.array(z.object({ value: z.string(), count: z.number().int() })),
  topSkills: z.array(z.object({ value: z.string(), count: z.number().int() })),
});

export const SearchEnvelopeSchema = z.object({
  results: z.array(JobBrowseResultSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  facets: FacetSchema.nullable(),
  rankingMode: z.enum(['ml', 'fallback', 'recency']).default('fallback'),
  generatedAt: z.string().datetime(),
});
