import { z } from 'zod';

export const WebinarStatus = z.enum(['draft', 'scheduled', 'live', 'ended', 'archived', 'cancelled']);
export const TicketKind = z.enum(['free', 'paid', 'donation', 'enterprise']);

export const DiscoveryFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  status: z.array(WebinarStatus).max(6).optional(),
  topic: z.array(z.string().max(40)).max(10).optional(),
  price: z.enum(['any', 'free', 'paid', 'donation']).default('any'),
  sort: z.enum(['relevance', 'soonest', 'popular', 'newest']).default('relevance'),
  facetMode: z.enum(['none', 'compact', 'full']).default('compact'),
});
export type DiscoveryFilters = z.infer<typeof DiscoveryFiltersSchema>;

export const WebinarCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(4000).default(''),
  startsAt: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(480).default(60),
  topics: z.array(z.string().trim().max(40)).max(10).default([]),
  ticket: z.object({
    kind: TicketKind, priceCents: z.number().int().min(0).max(1_000_000).default(0),
    currency: z.enum(['GBP', 'USD', 'EUR']).default('GBP'),
    capacity: z.number().int().min(1).max(50_000).default(500),
  }),
  donationsEnabled: z.boolean().default(true),
  thumbnailUrl: z.string().url().optional(),
  jitsiRoomHint: z.string().trim().max(80).optional(),
});
export type WebinarCreate = z.infer<typeof WebinarCreateSchema>;

export const RegisterSchema = z.object({ webinarId: z.string().uuid(), email: z.string().email().optional() });
export const DonateSchema = z.object({
  webinarId: z.string().uuid(),
  amountCents: z.number().int().min(100).max(1_000_000),
  currency: z.enum(['GBP', 'USD', 'EUR']).default('GBP'),
  message: z.string().trim().max(280).optional(),
  anonymous: z.boolean().default(false),
});

// Multi-step purchase per payment-checkout-pattern rule
export const PurchaseCreateSchema = z.object({ webinarId: z.string().uuid(), quantity: z.number().int().min(1).max(20).default(1) });
export const PurchaseConfirmSchema = z.object({
  purchaseId: z.string().uuid(),
  paymentMethod: z.enum(['card', 'paypal', 'wallet', 'invoice']),
  billing: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().email(),
    country: z.string().length(2),
    vatId: z.string().trim().max(40).optional(),
  }),
  acceptTos: z.literal(true),
});
