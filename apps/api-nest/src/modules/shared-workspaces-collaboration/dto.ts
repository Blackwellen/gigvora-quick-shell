import { z } from 'zod';

export const WorkspaceStatusEnum = z.enum(['active', 'archived']);
export const NoteStatusEnum = z.enum(['draft', 'published', 'archived']);
export const HandoffStatusEnum = z.enum(['pending', 'accepted', 'rejected', 'cancelled', 'completed']);
export const HandoffPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);
export const MemberRoleEnum = z.enum(['owner', 'editor', 'contributor', 'viewer']);

export type WorkspaceStatus = z.infer<typeof WorkspaceStatusEnum>;
export type NoteStatus = z.infer<typeof NoteStatusEnum>;
export type HandoffStatus = z.infer<typeof HandoffStatusEnum>;

export const WORKSPACE_TRANSITIONS: Record<WorkspaceStatus, WorkspaceStatus[]> = {
  active: ['archived'],
  archived: ['active'],
};
export const NOTE_TRANSITIONS: Record<NoteStatus, NoteStatus[]> = {
  draft: ['published', 'archived'],
  published: ['archived', 'draft'],
  archived: ['draft', 'published'],
};
export const HANDOFF_TRANSITIONS: Record<HandoffStatus, HandoffStatus[]> = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  rejected: [],
  cancelled: [],
  completed: [],
};

export const ListWorkspacesQuerySchema = z.object({
  status: WorkspaceStatusEnum.optional(),
  search: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['team', 'private', 'org']).default('team'),
});
export type CreateWorkspaceDto = z.infer<typeof CreateWorkspaceSchema>;

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['team', 'private', 'org']).optional(),
});

export const TransitionWorkspaceSchema = z.object({
  status: WorkspaceStatusEnum,
});

export const AddMemberSchema = z.object({
  memberIdentityId: z.string().uuid(),
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(254),
  role: MemberRoleEnum.default('contributor'),
});
export const ChangeMemberRoleSchema = z.object({ role: MemberRoleEnum });

export const ListNotesQuerySchema = z.object({
  status: NoteStatusEnum.optional(),
  search: z.string().max(120).optional(),
  pinned: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(50_000).default(''),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
  status: NoteStatusEnum.default('draft'),
  pinned: z.boolean().default(false),
});
export type CreateNoteDto = z.infer<typeof CreateNoteSchema>;

export const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().max(50_000).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  pinned: z.boolean().optional(),
});

export const TransitionNoteSchema = z.object({ status: NoteStatusEnum });

export const ListHandoffsQuerySchema = z.object({
  status: HandoffStatusEnum.optional(),
  priority: HandoffPriorityEnum.optional(),
  toMe: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const CreateHandoffSchema = z.object({
  toIdentityId: z.string().uuid(),
  fromTeam: z.string().max(80).optional(),
  toTeam: z.string().max(80).optional(),
  subject: z.string().min(1).max(200),
  context: z.string().max(20_000).default(''),
  checklist: z.array(z.object({ label: z.string().min(1).max(200), done: z.boolean().default(false) })).max(50).default([]),
  attachments: z.array(z.object({ name: z.string().max(200), url: z.string().url().max(2000) })).max(20).default([]),
  priority: HandoffPriorityEnum.default('normal'),
  dueAt: z.string().datetime().optional(),
});
export type CreateHandoffDto = z.infer<typeof CreateHandoffSchema>;

export const TransitionHandoffSchema = z.object({
  status: HandoffStatusEnum,
  reason: z.string().max(500).optional(),
}).superRefine((val, ctx) => {
  if (val.status === 'rejected' && !val.reason) {
    ctx.addIssue({ code: 'custom', path: ['reason'], message: 'reason required when rejecting a handoff' });
  }
});
export type TransitionHandoffDto = z.infer<typeof TransitionHandoffSchema>;

export const UpdateChecklistSchema = z.object({
  checklist: z.array(z.object({ label: z.string().min(1).max(200), done: z.boolean() })).max(50),
});
