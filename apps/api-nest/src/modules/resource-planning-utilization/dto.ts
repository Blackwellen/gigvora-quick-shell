import { z } from 'zod';

export const ResourceStatusEnum = z.enum(['active', 'inactive']);
export const ProjectStatusEnum = z.enum(['active', 'paused', 'completed', 'archived']);
export const AssignmentStatusEnum = z.enum(['draft', 'proposed', 'confirmed', 'active', 'on_hold', 'completed', 'cancelled']);
export const TimeOffKindEnum = z.enum(['pto', 'sick', 'holiday', 'other']);

export type AssignmentStatus = z.infer<typeof AssignmentStatusEnum>;
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;

export const ASSIGNMENT_TRANSITIONS: Record<AssignmentStatus, AssignmentStatus[]> = {
  draft:     ['proposed', 'cancelled'],
  proposed:  ['confirmed', 'cancelled', 'draft'],
  confirmed: ['active', 'cancelled', 'on_hold'],
  active:    ['on_hold', 'completed', 'cancelled'],
  on_hold:   ['active', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  active:    ['paused', 'completed', 'archived'],
  paused:    ['active', 'archived'],
  completed: ['archived'],
  archived:  [],
};

// ─── Resources ─────────────────────────────────────────────
export const ListResourcesQuerySchema = z.object({
  status: ResourceStatusEnum.optional(),
  team: z.string().max(80).optional(),
  search: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export const CreateResourceSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(254),
  role: z.string().min(1).max(80),
  team: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  timezone: z.string().min(1).max(60).default('UTC'),
  costRate: z.number().min(0).max(10_000).optional(),
  billRate: z.number().min(0).max(10_000).optional(),
  weeklyCapacityHours: z.number().int().min(0).max(168).default(40),
  skills: z.array(z.string().min(1).max(60)).max(40).default([]),
  identityId: z.string().uuid().optional(),
});
export const UpdateResourceSchema = CreateResourceSchema.partial().extend({
  status: ResourceStatusEnum.optional(),
});

// ─── Projects ──────────────────────────────────────────────
export const ListProjectsQuerySchema = z.object({
  status: ProjectStatusEnum.optional(),
  search: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(2).max(40).regex(/^[A-Z0-9-]+$/),
  clientName: z.string().max(200).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  budgetHours: z.number().int().min(0).max(1_000_000).optional(),
});
export const UpdateProjectSchema = CreateProjectSchema.partial();
export const TransitionProjectSchema = z.object({ status: ProjectStatusEnum });

// ─── Assignments ───────────────────────────────────────────
export const ListAssignmentsQuerySchema = z.object({
  status: AssignmentStatusEnum.optional(),
  resourceId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export const CreateAssignmentSchema = z.object({
  resourceId: z.string().uuid(),
  projectId: z.string().uuid(),
  role: z.string().max(80).optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  hoursPerWeek: z.number().min(0).max(168),
  status: AssignmentStatusEnum.default('draft'),
  notes: z.string().max(2000).optional(),
}).superRefine((val, ctx) => {
  if (new Date(val.endDate) < new Date(val.startDate)) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'endDate must be on or after startDate' });
  }
});
export const UpdateAssignmentSchema = z.object({
  role: z.string().max(80).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  hoursPerWeek: z.number().min(0).max(168).optional(),
  notes: z.string().max(2000).optional(),
});
export const TransitionAssignmentSchema = z.object({
  status: AssignmentStatusEnum,
  reason: z.string().max(500).optional(),
}).superRefine((val, ctx) => {
  if (val.status === 'cancelled' && !val.reason) {
    ctx.addIssue({ code: 'custom', path: ['reason'], message: 'reason required when cancelling' });
  }
});

// ─── Time-off ──────────────────────────────────────────────
export const CreateTimeOffSchema = z.object({
  resourceId: z.string().uuid(),
  kind: TimeOffKindEnum.default('pto'),
  startDate: z.string().date(),
  endDate: z.string().date(),
  hoursPerDay: z.number().min(0).max(24).default(8),
  notes: z.string().max(500).optional(),
}).superRefine((val, ctx) => {
  if (new Date(val.endDate) < new Date(val.startDate)) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'endDate must be on or after startDate' });
  }
});

// ─── Utilization query ─────────────────────────────────────
export const UtilizationQuerySchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
  resourceId: z.string().uuid().optional(),
  team: z.string().max(80).optional(),
});
