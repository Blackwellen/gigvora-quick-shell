import { z } from 'zod';

export const Handle = z.string().min(2).max(64).regex(/^[a-z0-9-]+$/, 'lowercase, digits and hyphens only');

export const OrgProfileSchema = z.object({
  kind: z.enum(['enterprise', 'startup', 'scaleup', 'sme']).default('enterprise'),
  handle: Handle,
  legalName: z.string().min(2).max(255),
  displayName: z.string().min(2).max(255),
  tagline: z.string().max(280).default(''),
  about: z.string().max(8000).default(''),
  industry: z.string().max(120).optional(),
  hqCountry: z.string().length(2).optional(),
  hqCity: z.string().max(120).optional(),
  sizeBand: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
  fundingStage: z.enum(['bootstrap', 'pre-seed', 'seed', 'series-a', 'series-b+', 'public']).optional(),
  websiteUrl: z.string().url().max(500).optional(),
  logoUrl: z.string().url().max(500).optional(),
  bannerUrl: z.string().url().max(500).optional(),
  capabilities: z.array(z.string().min(1).max(80)).max(40).default([]),
  certifications: z.array(z.string().min(1).max(120)).max(40).default([]),
  contacts: z.array(z.object({
    role: z.string().max(80),
    name: z.string().max(120),
    email: z.string().email().optional(),
    phone: z.string().max(40).optional(),
  })).max(20).default([]),
  visibility: z.enum(['public', 'network', 'private']).default('public'),
});

export const StatusBody = z.object({ status: z.enum(['draft', 'active', 'paused', 'archived']) });

export const PartnerCreateSchema = z.object({
  orgIdB: z.string().uuid(),
  relationKind: z.enum(['partner', 'supplier', 'reseller', 'technology']).default('partner'),
});

export const ProcurementBriefSchema = z.object({
  buyerOrgId: z.string().uuid(),
  title: z.string().min(2).max(255),
  summary: z.string().max(8000).default(''),
  category: z.string().max(120).optional(),
  budgetMinor: z.number().int().min(0).max(100_000_000_00).optional(),
  currency: z.string().length(3).default('GBP'),
  dueAt: z.string().datetime().optional(),
  requirements: z.array(z.string().min(1).max(500)).max(40).default([]),
  visibility: z.enum(['public', 'network', 'invited']).default('network'),
  invitedOrgIds: z.array(z.string().uuid()).max(50).default([]),
});
export const ProcurementStatusBody = z.object({ status: z.enum(['draft', 'open', 'shortlisting', 'awarded', 'closed', 'archived']) });

export const IntroRequestSchema = z.object({
  brokerIdentityId: z.string().uuid(),
  targetIdentityId: z.string().uuid(),
  contextOrgId: z.string().uuid().optional(),
  reason: z.string().min(2).max(280),
  message: z.string().max(2000).default(''),
  expiresInDays: z.number().int().min(1).max(60).default(14),
});
export const IntroDecisionBody = z.object({
  decision: z.enum(['accepted', 'declined', 'completed', 'cancelled']),
  declineReason: z.string().max(500).optional(),
});

export const RoomSchema = z.object({
  ownerOrgId: z.string().uuid(),
  kind: z.enum(['boardroom', 'dealroom', 'private', 'event']).default('boardroom'),
  title: z.string().min(2).max(255),
  agenda: z.string().max(8000).default(''),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  videoProvider: z.enum(['jitsi', 'livekit', 'daily']).default('jitsi'),
  capacity: z.number().int().min(2).max(2000).default(50),
  invitedIdentityIds: z.array(z.string().uuid()).max(500).default([]),
});
export const RoomStatusBody = z.object({ status: z.enum(['draft', 'scheduled', 'live', 'ended', 'archived']) });

export const EventSchema = z.object({
  hostOrgId: z.string().uuid(),
  title: z.string().min(2).max(255),
  summary: z.string().max(8000).default(''),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  format: z.enum(['virtual', 'in_person', 'hybrid']).default('virtual'),
  visibility: z.enum(['public', 'network', 'private']).default('invited' as never).or(z.enum(['public','network','invited'])).default('invited'),
  capacity: z.number().int().min(1).max(50000).default(100),
});
export const EventStatusBody = z.object({ status: z.enum(['draft', 'published', 'cancelled', 'completed']) });

export const StartupSchema = z.object({
  orgId: z.string().uuid(),
  pitchOneLiner: z.string().max(280).default(''),
  pitchDeckUrl: z.string().url().max(500).optional(),
  productDemoUrl: z.string().url().max(500).optional(),
  fundraising: z.object({
    round: z.string().max(40).optional(),
    amountMinor: z.number().int().min(0).optional(),
    currency: z.string().length(3).default('GBP'),
    openAt: z.string().datetime().optional(),
    closeAt: z.string().datetime().optional(),
  }).default({}),
  traction: z.object({
    mrrMinor: z.number().int().min(0).optional(),
    arrMinor: z.number().int().min(0).optional(),
    growthMoM: z.number().min(-1).max(10).optional(),
    customers: z.number().int().min(0).optional(),
  }).default({}),
  team: z.array(z.object({
    name: z.string().max(120),
    role: z.string().max(120),
    linkedinUrl: z.string().url().optional(),
  })).max(50).default([]),
  featured: z.boolean().default(false),
});
