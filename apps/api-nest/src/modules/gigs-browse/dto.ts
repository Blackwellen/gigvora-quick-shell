import { z } from 'zod';

export const GigBrowseFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(1).max(60).default(24),
  sort: z.enum(['relevance', 'newest', 'price_asc', 'price_desc', 'rating', 'orders', 'fastest']).default('relevance'),
  category: z.string().trim().max(60).optional(),
  subcategory: z.string().trim().max(60).optional(),
  priceMin: z.number().int().min(0).max(10_000_000).optional(),
  priceMax: z.number().int().min(0).max(10_000_000).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('GBP'),
  deliveryDaysMax: z.number().int().min(1).max(180).optional(),
  ratingMin: z.number().min(0).max(5).optional(),
  proSellerOnly: z.boolean().optional(),
  fastDeliveryOnly: z.boolean().optional(),
  acceptsRevisionsOnly: z.boolean().optional(),
  languages: z.array(z.string().trim().min(2).max(40)).max(10).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  industries: z.array(z.string().trim().max(60)).max(10).optional(),
  facetMode: z.enum(['none', 'compact', 'full']).default('compact'),
});
export type GigBrowseFilters = z.infer<typeof GigBrowseFiltersSchema>;

export const GigSavedSearchSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(120),
  filters: GigBrowseFiltersSchema,
  alertsEnabled: z.boolean().default(false),
  alertCadence: z.enum(['off', 'realtime', 'daily', 'weekly']).default('off'),
  pinned: z.boolean().default(false),
  channel: z.enum(['inapp', 'email', 'inapp+email']).default('inapp'),
});
export type GigSavedSearch = z.infer<typeof GigSavedSearchSchema>;

export const GigPackageSchema = z.object({
  tier: z.enum(['basic', 'standard', 'premium', 'custom']),
  name: z.string().min(1).max(80),
  priceCents: z.number().int().min(0),
  deliveryDays: z.number().int().min(1).max(180),
  revisions: z.number().int().min(0).max(50),
  features: z.array(z.string().max(120)).max(15),
  isPopular: z.boolean().optional(),
});

export const GigBrowseResultSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  subcategory: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  seller: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
    isProSeller: z.boolean(),
    level: z.string(),
  }),
  pricing: z.object({
    fromCents: z.number().int().min(0),
    currency: z.string(),
  }),
  delivery: z.object({ minDays: z.number().int(), maxDays: z.number().int() }),
  rating: z.object({ avg: z.number().min(0).max(5), count: z.number().int().min(0) }),
  orders: z.number().int().min(0),
  status: z.enum(['draft', 'pending_review', 'active', 'paused', 'archived', 'escalated']),
  visibility: z.enum(['public', 'unlisted', 'private']),
  isFeatured: z.boolean(),
  hasFastDelivery: z.boolean(),
  acceptsRevisions: z.boolean(),
  skills: z.array(z.string()),
  languages: z.array(z.string()),
  industries: z.array(z.string()),
  matchScore: z.number().min(0).max(100).nullable(),
  bookmarked: z.boolean().default(false),
  publishedAt: z.string().datetime().nullable(),
});

export const GigFacetSchema = z.object({
  category: z.array(z.object({ value: z.string(), count: z.number().int() })),
  delivery: z.array(z.object({ value: z.string(), count: z.number().int() })),
  topSkills: z.array(z.object({ value: z.string(), count: z.number().int() })),
  topLanguages: z.array(z.object({ value: z.string(), count: z.number().int() })),
  priceBuckets: z.array(z.object({ value: z.string(), count: z.number().int() })),
});

export const GigSearchEnvelopeSchema = z.object({
  results: z.array(GigBrowseResultSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  facets: GigFacetSchema.nullable(),
  rankingMode: z.enum(['ml', 'fallback', 'recency', 'popularity']).default('fallback'),
  generatedAt: z.string().datetime(),
});
