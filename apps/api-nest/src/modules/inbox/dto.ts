import { z } from 'zod';

/**
 * Domain 17 — Inbox, Messaging & Context-Aware Threads.
 *
 * DTOs follow the domain-16 conventions: tight caps, explicit enums, coerced
 * pagination. Shape mirrors what the existing /inbox/* pages already render so
 * we can swap mocks for live calls without redesigning UI.
 */
export const ThreadKindEnum    = z.enum(['direct', 'group', 'support', 'system']);
export const ThreadStateEnum   = z.enum(['active', 'archived', 'snoozed', 'blocked']);
export const PriorityEnum      = z.enum(['normal', 'priority', 'urgent']);
export const MessageKindEnum   = z.enum(['text', 'attachment', 'system', 'offer', 'booking', 'call_log', 'voice']);
export const MessageStatusEnum = z.enum(['sent', 'delivered', 'read', 'failed']);
export const ReadFilterEnum    = z.enum(['all', 'unread', 'mentions']);
export const ContextKindEnum   = z.enum(['project', 'gig', 'service', 'job', 'order', 'milestone', 'event', 'company', 'profile']);
export const ParticipantRoleEnum = z.enum(['owner', 'member', 'guest', 'observer']);

export const ListThreadsQuery = z.object({
  read: ReadFilterEnum.default('all'),
  state: ThreadStateEnum.optional(),
  kind: ThreadKindEnum.optional(),
  priority: PriorityEnum.optional(),
  participantId: z.string().min(1).max(120).optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(['recent', 'unread', 'priority']).default('recent'),
});
export type ListThreadsQueryT = z.infer<typeof ListThreadsQuery>;

export const ListMessagesQuery = z.object({
  cursor: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  direction: z.enum(['before', 'after']).default('before'),
});

export const CreateThreadDto = z.object({
  kind: ThreadKindEnum.default('direct'),
  title: z.string().max(160).optional(),
  participantIds: z.array(z.string().min(1).max(120)).min(1).max(50),
  contextKind: ContextKindEnum.optional(),
  contextId: z.string().max(120).optional(),
  initialMessage: z.string().max(8000).optional(),
});

export const SendMessageDto = z.object({
  body: z.string().min(1).max(8000).optional(),
  kind: MessageKindEnum.default('text'),
  attachments: z.array(z.object({
    name: z.string().min(1).max(200),
    size: z.number().int().nonnegative().max(500_000_000),
    mime: z.string().max(120),
    url: z.string().url().max(2000).optional(),
    storageKey: z.string().max(500).optional(),
  })).max(10).optional(),
  replyToId: z.string().max(120).optional(),
  payload: z.record(z.string(), z.unknown()).optional(), // for offer/booking/call_log
  // Idempotency from caller — replay-safe sends.
  clientNonce: z.string().min(8).max(120).optional(),
}).refine(d => (d.body && d.body.length > 0) || (d.attachments && d.attachments.length > 0) || d.kind !== 'text', {
  message: 'message_must_have_body_or_attachments',
});

export const EditMessageDto  = z.object({ body: z.string().min(1).max(8000) });
export const ReactToMessageDto = z.object({ emoji: z.string().min(1).max(8) });
export const TypingDto       = z.object({ isTyping: z.boolean() });
export const ThreadStateDto  = z.object({ state: ThreadStateEnum });
export const ThreadPriorityDto = z.object({ priority: PriorityEnum });
export const ParticipantsAddDto = z.object({
  participantIds: z.array(z.string().min(1).max(120)).min(1).max(50),
  role: ParticipantRoleEnum.default('member'),
});
export const LinkContextDto = z.object({
  kind: ContextKindEnum,
  id: z.string().min(1).max(120),
  label: z.string().min(1).max(200),
});
export const ReadReceiptDto = z.object({ uptoMessageId: z.string().min(1).max(120) });

export const SearchMessagesQuery = z.object({
  q: z.string().min(1).max(200),
  threadId: z.string().max(120).optional(),
  participantId: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const PresenceQuery = z.object({
  userIds: z.string().max(2000).transform(s => s.split(',').map(x => x.trim()).filter(Boolean).slice(0, 100)),
});
