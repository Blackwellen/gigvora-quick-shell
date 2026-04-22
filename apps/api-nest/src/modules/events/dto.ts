import { z } from 'zod';

/** Domain 15 — Events, Networking Sessions, RSVPs & Social Meetups. */

export const EventTypeEnum     = z.enum(['webinar', 'meetup', 'conference', 'workshop', 'networking', 'roundtable', 'briefing', 'summit', 'live_room', 'speed_networking']);
export const EventFormatEnum   = z.enum(['virtual', 'in_person', 'hybrid']);
export const EventStatusEnum   = z.enum(['draft', 'scheduled', 'live', 'completed', 'cancelled', 'archived']);
export const EventVisibilityEnum = z.enum(['public', 'unlisted', 'private', 'enterprise_only']);
export const RsvpStatusEnum    = z.enum(['going', 'interested', 'waitlist', 'declined', 'attended', 'no_show']);
export const RoleEnum          = z.enum(['host', 'cohost', 'speaker', 'moderator', 'attendee']);

export const ListEventsQuery = z.object({
  q: z.string().max(200).optional(),
  type: EventTypeEnum.optional(),
  format: EventFormatEnum.optional(),
  status: EventStatusEnum.optional(),
  visibility: EventVisibilityEnum.optional(),
  hostId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  rsvpedByMe: z.coerce.boolean().optional(),
  hostedByMe: z.coerce.boolean().optional(),
  upcoming: z.coerce.boolean().optional(),
  past: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'starts_at', 'recent', 'popularity']).default('starts_at'),
});

export const CreateEventDto = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  type: EventTypeEnum,
  format: EventFormatEnum.default('virtual'),
  visibility: EventVisibilityEnum.default('public'),
  description: z.string().max(8000).optional(),
  agenda: z.array(z.object({
    title: z.string().max(200),
    startsAt: z.string(),
    durationMin: z.number().int().min(1).max(1440),
    speaker: z.string().max(200).optional(),
  })).max(50).optional(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  timezone: z.string().max(60).default('UTC'),
  location: z.string().max(300).optional(),
  meetingUrl: z.string().url().optional().nullable(),
  capacity: z.number().int().min(0).max(1_000_000).optional(),
  coverUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  groupId: z.string().uuid().optional().nullable(),
  priceCents: z.number().int().min(0).max(10_000_000).optional(),
  currency: z.string().length(3).default('USD').optional(),
  recordingPolicy: z.enum(['none', 'auto', 'opt_in']).default('opt_in'),
  waitlistEnabled: z.boolean().default(true),
});
export const UpdateEventDto = CreateEventDto.partial();

export const RsvpDto = z.object({
  status: RsvpStatusEnum.default('going'),
  guests: z.number().int().min(0).max(10).optional(),
  note: z.string().max(500).optional(),
});

export const SpeakerDto = z.object({
  identityId: z.string().uuid().optional().nullable(),
  name: z.string().max(200),
  role: RoleEnum.default('speaker'),
  title: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const SessionDto = z.object({
  title: z.string().min(2).max(200),
  type: z.enum(['talk', 'panel', 'breakout', 'speed_round', 'q_and_a']).default('talk'),
  startsAt: z.string(),
  durationMin: z.number().int().min(1).max(1440),
  capacity: z.number().int().min(0).max(100_000).optional(),
  speakerIds: z.array(z.string().uuid()).max(20).optional(),
});

export const MessageDto = z.object({
  body: z.string().min(1).max(2000),
  channel: z.enum(['lobby', 'live', 'qa']).default('lobby'),
});

export const ModerationDto = z.object({
  action: z.enum(['mute', 'unmute', 'kick', 'ban', 'promote_speaker', 'demote_speaker', 'pin_message', 'remove_message']),
  targetId: z.string(),
  reason: z.string().max(500).optional(),
});

export const CheckInDto = z.object({
  identityId: z.string().uuid(),
  method: z.enum(['qr', 'manual', 'auto']).default('manual'),
});

export const FeedbackDto = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  npsLikely: z.number().int().min(0).max(10).optional(),
});

export const TransitionDto = z.object({
  to: z.enum(['scheduled', 'live', 'completed', 'cancelled']),
  reason: z.string().max(500).optional(),
});
