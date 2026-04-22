import { z } from 'zod';

/** Domain 14 — Groups, Community Hubs & Member Conversations. */

export const GroupTypeEnum     = z.enum(['public', 'private', 'secret']);
export const GroupStatusEnum   = z.enum(['draft', 'active', 'paused', 'archived']);
export const MemberRoleEnum    = z.enum(['owner', 'admin', 'moderator', 'member']);
export const MembershipEnum    = z.enum(['active', 'pending', 'invited', 'banned', 'left']);
export const PostStatusEnum    = z.enum(['active', 'pending', 'hidden', 'deleted']);
export const ReportReasonEnum  = z.enum(['spam', 'harassment', 'hate', 'misinformation', 'illegal', 'other']);
export const EventStatusEnum   = z.enum(['scheduled', 'live', 'completed', 'cancelled']);

export const ListGroupsQuery = z.object({
  q: z.string().max(200).optional(),
  category: z.string().max(60).optional(),
  type: GroupTypeEnum.optional(),
  joined: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'recent', 'members', 'activity']).default('relevance'),
});
export type ListGroupsQueryT = z.infer<typeof ListGroupsQuery>;

export const CreateGroupDto = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  category: z.string().max(60).optional(),
  description: z.string().max(4000).optional(),
  rules: z.string().max(8000).optional(),
  type: GroupTypeEnum.default('public'),
  coverUrl: z.string().url().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  postingPolicy: z.enum(['anyone', 'members', 'mods_only']).default('members'),
  joinPolicy: z.enum(['open', 'request', 'invite_only']).default('open'),
});
export const UpdateGroupDto = CreateGroupDto.partial();

export const PostDto = z.object({
  body: z.string().min(1).max(10_000),
  attachments: z.array(z.object({
    url: z.string().url(),
    kind: z.enum(['image', 'video', 'file', 'link']).default('image'),
    name: z.string().max(160).optional(),
  })).max(10).optional(),
  channelId: z.string().uuid().optional().nullable(),
  pinned: z.boolean().optional(),
});
export const UpdatePostDto = PostDto.partial();

export const CommentDto = z.object({
  body: z.string().min(1).max(4000),
  parentId: z.string().uuid().optional().nullable(),
});

export const ChannelDto = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  type: z.enum(['discussion', 'announcement', 'voice', 'event']).default('discussion'),
  position: z.number().int().min(0).optional(),
  private: z.boolean().optional(),
});

export const EventDto = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional(),
  startsAt: z.string(),                // ISO
  endsAt:   z.string().optional(),
  location: z.string().max(200).optional(),
  link: z.string().url().optional(),
  capacity: z.number().int().min(0).max(100_000).optional(),
});

export const InviteDto = z.object({
  emails: z.array(z.string().email()).max(50).optional(),
  identityIds: z.array(z.string().uuid()).max(100).optional(),
  message: z.string().max(2000).optional(),
});

export const JoinRequestDecisionDto = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

export const ModerationActionDto = z.object({
  action: z.enum(['hide', 'unhide', 'delete', 'pin', 'unpin', 'lock', 'unlock']),
  reason: z.string().max(500).optional(),
});

export const ReportDto = z.object({
  reason: ReportReasonEnum,
  notes: z.string().max(2000).optional(),
});

export const SetRoleDto = z.object({
  role: MemberRoleEnum,
});
