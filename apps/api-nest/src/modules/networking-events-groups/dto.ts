import { z } from 'zod';

export const RoomCreateSchema = z.object({
  kind: z.enum(['open', 'private', 'speed', 'event']).default('open'),
  title: z.string().min(2).max(255),
  topic: z.string().max(2000).default(''),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  capacity: z.number().int().min(2).max(2000).default(25),
  videoProvider: z.enum(['jitsi', 'livekit', 'daily']).default('jitsi'),
  isPaid: z.boolean().default(false),
  priceMinor: z.number().int().min(0).max(100_000_00).default(0),
  currency: z.string().length(3).default('GBP'),
  speedRoundSeconds: z.number().int().min(30).max(900).default(180),
  speedMatchStrategy: z.enum(['interest_overlap', 'random', 'industry']).default('interest_overlap'),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  invitedIdentityIds: z.array(z.string().uuid()).max(500).default([]),
});
export const RoomStatusBody = z.object({ status: z.enum(['draft', 'scheduled', 'live', 'ended', 'archived']) });
export const RoomJoinBody = z.object({ asRole: z.enum(['attendee', 'observer']).default('attendee') });
export const SpeedRoundBody = z.object({ roundIndex: z.number().int().min(0).max(50) });
export const ShareCardBody = z.object({
  toIdentityIds: z.array(z.string().uuid()).min(1).max(50),
  context: z.enum(['manual', 'room', 'speed', 'event', 'group']).default('manual'),
  contextId: z.string().uuid().optional(),
});

export const BusinessCardSchema = z.object({
  displayName: z.string().min(2).max(120),
  headline: z.string().max(200).default(''),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  website: z.string().url().max(500).optional(),
  links: z.array(z.object({ label: z.string().max(40), url: z.string().url() })).max(20).default([]),
  avatarUrl: z.string().url().max(500).optional(),
  accentColor: z.string().max(80).default('oklch(0.5 0.18 240)'),
  visibility: z.enum(['public', 'connections', 'private']).default('connections'),
});

export const EventSchema = z.object({
  title: z.string().min(2).max(255),
  summary: z.string().max(8000).default(''),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  format: z.enum(['virtual', 'in_person', 'hybrid']).default('virtual'),
  visibility: z.enum(['public', 'network', 'invited']).default('public'),
  locationName: z.string().max(255).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  capacity: z.number().int().min(1).max(50000).default(100),
  isPaid: z.boolean().default(false),
  priceMinor: z.number().int().min(0).max(100_000_00).default(0),
  currency: z.string().length(3).default('GBP'),
  coverImageUrl: z.string().url().max(500).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  hostOrgId: z.string().uuid().optional(),
});
export const EventStatusBody = z.object({ status: z.enum(['draft', 'published', 'live', 'completed', 'cancelled']) });
export const RsvpBody = z.object({ status: z.enum(['going', 'maybe', 'declined']).default('going') });

export const GroupSchema = z.object({
  handle: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(2).max(120),
  about: z.string().max(8000).default(''),
  visibility: z.enum(['public', 'private', 'secret']).default('public'),
  joinPolicy: z.enum(['open', 'request', 'invite_only']).default('open'),
  category: z.string().max(80).optional(),
  coverImageUrl: z.string().url().max(500).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  rules: z.array(z.string().min(1).max(280)).max(20).default([]),
});
export const GroupPostSchema = z.object({
  body: z.string().min(1).max(8000),
  attachments: z.array(z.object({ kind: z.string().max(40), url: z.string().url() })).max(10).default([]),
});
