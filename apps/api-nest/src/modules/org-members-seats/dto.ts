import { z } from 'zod';

export const MemberStatusEnum = z.enum(['active', 'suspended', 'removed']);
export type MemberStatus = z.infer<typeof MemberStatusEnum>;

export const InvitationStatusEnum = z.enum(['pending', 'accepted', 'revoked', 'expired']);
export type InvitationStatus = z.infer<typeof InvitationStatusEnum>;

export const SeatStatusEnum = z.enum(['available', 'assigned', 'locked']);
export type SeatStatus = z.infer<typeof SeatStatusEnum>;

export const SeatTypeEnum = z.enum(['full', 'viewer', 'guest']);

export const MEMBER_TRANSITIONS: Record<MemberStatus, MemberStatus[]> = {
  active: ['suspended', 'removed'],
  suspended: ['active', 'removed'],
  removed: [],
};

export const INVITATION_TRANSITIONS: Record<InvitationStatus, InvitationStatus[]> = {
  pending: ['accepted', 'revoked', 'expired'],
  accepted: [],
  revoked: [],
  expired: [],
};

export const PERMISSION_KEYS = [
  'org:read', 'org:write',
  'members:read', 'members:invite', 'members:remove', 'members:suspend',
  'roles:read', 'roles:assign', 'roles:write',
  'seats:read', 'seats:assign', 'seats:purchase',
  'billing:read', 'billing:write',
  'audit:read',
] as const;

export const OverviewQuerySchema = z.object({});

export const ListMembersQuerySchema = z.object({
  status: MemberStatusEnum.optional(),
  roleKey: z.string().max(50).optional(),
  search: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const InviteMemberSchema = z.object({
  email: z.string().email().max(254),
  roleKey: z.string().min(1).max(50).default('member'),
  seatType: SeatTypeEnum.default('full'),
  message: z.string().max(500).optional(),
});
export type InviteMemberDto = z.infer<typeof InviteMemberSchema>;

export const TransitionMemberSchema = z.object({
  status: MemberStatusEnum,
  reason: z.string().max(500).optional(),
}).superRefine((val, ctx) => {
  if ((val.status === 'suspended' || val.status === 'removed') && !val.reason) {
    ctx.addIssue({ code: 'custom', path: ['reason'], message: 'reason required for suspend/remove' });
  }
});
export type TransitionMemberDto = z.infer<typeof TransitionMemberSchema>;

export const ChangeRoleSchema = z.object({
  roleKey: z.string().min(1).max(50),
});
export type ChangeRoleDto = z.infer<typeof ChangeRoleSchema>;

export const TransitionInvitationSchema = z.object({
  status: z.enum(['revoked']),
  reason: z.string().max(500).optional(),
});

export const ListSeatsQuerySchema = z.object({
  status: SeatStatusEnum.optional(),
  seatType: SeatTypeEnum.optional(),
});

export const AssignSeatSchema = z.object({
  memberId: z.string().uuid(),
});

export const PurchaseSeatsSchema = z.object({
  count: z.coerce.number().int().min(1).max(100),
  seatType: SeatTypeEnum.default('full'),
  plan: z.enum(['free', 'pro', 'team', 'enterprise']).default('team'),
});

export const UpsertRoleSchema = z.object({
  key: z.string().min(2).max(50).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().min(1).max(80)).min(0).max(64),
});
export type UpsertRoleDto = z.infer<typeof UpsertRoleSchema>;
