import { z } from 'zod';

/**
 * Domain 30-hiring — Enterprise Hiring Workspace, Hiring Manager Collaboration,
 * and Approval Chains.
 *
 * Note: this domain occupies the "D30-hiring" suffixed slot. The unsuffixed
 * `D30` slot remains the Cross-Cutting Integrations pack (outbound webhooks +
 * adapter map + cross-domain bus). See docs/architecture/domain-30-hiring-*.md.
 *
 * State machines:
 *   Workspace:           draft → active → archived
 *   ApprovalChainTpl:    draft → published → archived
 *   ApprovalRequest:     pending → in_review → approved | rejected | cancelled | expired
 *   ApprovalStep:        pending → in_review → approved | rejected | skipped | escalated
 *   CollaborationThread: open → resolved | closed
 *   Membership role:     hiring_manager | recruiter | approver | observer | admin
 */

export const WorkspaceStatus = z.enum(['draft', 'active', 'archived']);
export type WorkspaceStatus = z.infer<typeof WorkspaceStatus>;

export const ChainTemplateStatus = z.enum(['draft', 'published', 'archived']);
export type ChainTemplateStatus = z.infer<typeof ChainTemplateStatus>;

export const ApprovalRequestStatus = z.enum([
  'pending', 'in_review', 'approved', 'rejected', 'cancelled', 'expired',
]);
export type ApprovalRequestStatus = z.infer<typeof ApprovalRequestStatus>;

export const ApprovalStepStatus = z.enum([
  'pending', 'in_review', 'approved', 'rejected', 'skipped', 'escalated',
]);
export type ApprovalStepStatus = z.infer<typeof ApprovalStepStatus>;

export const ThreadStatus = z.enum(['open', 'resolved', 'closed']);
export type ThreadStatus = z.infer<typeof ThreadStatus>;

export const MemberRole = z.enum([
  'hiring_manager', 'recruiter', 'approver', 'observer', 'admin',
]);
export type MemberRole = z.infer<typeof MemberRole>;

/* ── Workspace ─────────────────────────────────────────────────────────── */
export const WorkspaceCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  department: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000).default(''),
  hiringManagerId: z.string().min(1).max(120),
  recruiterIds: z.array(z.string().min(1).max(120)).max(20).default([]),
  approverIds: z.array(z.string().min(1).max(120)).max(20).default([]),
  observerIds: z.array(z.string().min(1).max(120)).max(20).default([]),
  defaultChainTemplateId: z.string().min(1).max(120).optional(),
  budgetAnnualGbp: z.number().int().min(0).max(20_000_000).optional(),
  targetHires: z.number().int().min(1).max(500).default(1),
});
export const WorkspaceUpdateSchema = WorkspaceCreateSchema.partial();

export const WorkspaceListFiltersSchema = z.object({
  status: z.array(WorkspaceStatus).max(3).optional(),
  department: z.string().optional(),
  hiringManagerId: z.string().optional(),
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['updated', 'created', 'name', 'urgency']).default('updated'),
});

/* ── Memberships ───────────────────────────────────────────────────────── */
export const MembershipUpsertSchema = z.object({
  userId: z.string().min(1).max(120),
  role: MemberRole,
  displayName: z.string().min(1).max(120).optional(),
});

export const MembershipBulkSchema = z.object({
  members: z.array(MembershipUpsertSchema).min(1).max(50),
});

/* ── Approval chain templates ─────────────────────────────────────────── */
export const ApprovalStepDefSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(160),
  approverIds: z.array(z.string().min(1).max(120)).min(1).max(10),
  // any = first approver decides; all = every approver must approve
  rule: z.enum(['any', 'all']).default('any'),
  slaHours: z.number().int().min(1).max(720).default(48),
  escalateToId: z.string().min(1).max(120).optional(),
  required: z.boolean().default(true),
});

export const ChainTemplateCreateSchema = z.object({
  workspaceId: z.string().min(1).max(120),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).default(''),
  steps: z.array(ApprovalStepDefSchema).min(1).max(15),
});
export const ChainTemplateUpdateSchema = ChainTemplateCreateSchema.partial();

export const ChainTemplateListFiltersSchema = z.object({
  workspaceId: z.string().optional(),
  status: z.array(ChainTemplateStatus).max(3).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});

/* ── Approval requests ────────────────────────────────────────────────── */
export const ApprovalSubjectKindSchema = z.enum([
  'requisition', 'offer', 'budget_increase', 'role_close', 'agency_engagement', 'other',
]);
export type ApprovalSubjectKind = z.infer<typeof ApprovalSubjectKindSchema>;

export const ApprovalRequestCreateSchema = z.object({
  workspaceId: z.string().min(1).max(120),
  templateId: z.string().min(1).max(120),
  subjectKind: ApprovalSubjectKindSchema,
  subjectId: z.string().min(1).max(120),
  subjectLabel: z.string().min(1).max(200),
  context: z.record(z.unknown()).default({}),
  rationale: z.string().trim().max(4000).default(''),
  urgency: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  dueAt: z.string().datetime().optional(),
});

export const ApprovalRequestListFiltersSchema = z.object({
  workspaceId: z.string().optional(),
  status: z.array(ApprovalRequestStatus).max(6).optional(),
  subjectKind: z.array(ApprovalSubjectKindSchema).max(6).optional(),
  approverId: z.string().optional(),
  urgency: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['updated', 'created', 'due', 'urgency']).default('updated'),
});

export const ApprovalDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'escalate', 'request_changes']),
  note: z.string().trim().max(4000).optional(),
});

export const ApprovalRequestCancelSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
});

/* ── Collaboration threads ────────────────────────────────────────────── */
export const ThreadCreateSchema = z.object({
  workspaceId: z.string().min(1).max(120),
  subjectKind: z.enum([
    'requisition', 'candidate', 'interview', 'scorecard', 'offer', 'approval', 'general',
  ]),
  subjectId: z.string().min(1).max(120).optional(),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(8000),
  participantIds: z.array(z.string().min(1).max(120)).max(20).default([]),
  privacy: z.enum(['workspace', 'restricted']).default('workspace'),
});

export const ThreadMessageSchema = z.object({
  body: z.string().trim().min(1).max(8000),
  mentions: z.array(z.string().min(1).max(120)).max(15).default([]),
});

export const ThreadStatusSchema = z.object({
  next: ThreadStatus,
  reason: z.string().trim().max(1000).optional(),
});

export const ThreadListFiltersSchema = z.object({
  workspaceId: z.string().optional(),
  subjectKind: z.string().optional(),
  subjectId: z.string().optional(),
  status: z.array(ThreadStatus).max(3).optional(),
  participantId: z.string().optional(),
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});

/* ── Bulk + utility ───────────────────────────────────────────────────── */
export const WorkspaceBulkSchema = z.object({
  ids: z.array(z.string().min(1).max(120)).min(1).max(50),
  action: z.enum(['archive', 'activate']),
  reason: z.string().trim().max(500).optional(),
});

export const TransitionWorkspaceSchema = z.object({
  next: WorkspaceStatus,
  reason: z.string().trim().max(500).optional(),
});
