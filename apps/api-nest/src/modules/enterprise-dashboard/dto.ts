import { z } from 'zod';

export const RequisitionStatusEnum = z.enum(['draft', 'open', 'on_hold', 'filled', 'cancelled']);
export type RequisitionStatus = z.infer<typeof RequisitionStatusEnum>;

export const PurchaseOrderStatusEnum = z.enum(['draft', 'submitted', 'approved', 'rejected', 'received', 'cancelled']);
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusEnum>;

export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'blocked', 'done']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

// Requisition transitions
export const REQUISITION_TRANSITIONS: Record<RequisitionStatus, RequisitionStatus[]> = {
  draft: ['open', 'cancelled'],
  open: ['on_hold', 'filled', 'cancelled'],
  on_hold: ['open', 'cancelled'],
  filled: [],
  cancelled: [],
};

// PO transitions: draft → submitted → approved|rejected; approved → received|cancelled.
export const PO_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['approved', 'rejected', 'cancelled'],
  approved: ['received', 'cancelled'],
  rejected: ['draft', 'cancelled'],
  received: [],
  cancelled: [],
};

// Task transitions
export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress', 'blocked'],
  in_progress: ['blocked', 'done', 'todo'],
  blocked: ['in_progress', 'todo'],
  done: [],
};

export const OverviewQuerySchema = z.object({
  windowDays: z.coerce.number().int().min(1).max(365).default(30),
});

export const ListRequisitionsQuerySchema = z.object({
  status: RequisitionStatusEnum.optional(),
  department: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const TransitionRequisitionSchema = z.object({
  status: RequisitionStatusEnum,
  reason: z.string().max(500).optional(),
});
export type TransitionRequisitionDto = z.infer<typeof TransitionRequisitionSchema>;

export const ListPurchaseOrdersQuerySchema = z.object({
  status: PurchaseOrderStatusEnum.optional(),
  category: z.string().max(50).optional(),
});

export const TransitionPurchaseOrderSchema = z.object({
  status: PurchaseOrderStatusEnum,
  reason: z.string().max(500).optional(),
  receivedOn: z.string().date().optional(),
}).superRefine((val, ctx) => {
  if (val.status === 'rejected' && !val.reason) {
    ctx.addIssue({ code: 'custom', path: ['reason'], message: 'reason required when rejecting' });
  }
  if (val.status === 'received' && !val.receivedOn) {
    ctx.addIssue({ code: 'custom', path: ['receivedOn'], message: 'receivedOn required when status=received' });
  }
});
export type TransitionPurchaseOrderDto = z.infer<typeof TransitionPurchaseOrderSchema>;

export const ListTeamMembersQuerySchema = z.object({
  status: z.enum(['active', 'onboarding', 'offboarding', 'inactive']).optional(),
  department: z.string().max(100).optional(),
});

export const ListTasksQuerySchema = z.object({
  status: TaskStatusEnum.optional(),
  category: z.string().max(50).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

export const TransitionTaskSchema = z.object({
  status: TaskStatusEnum,
  blockedReason: z.string().max(500).optional(),
  note: z.string().max(500).optional(),
}).superRefine((val, ctx) => {
  if (val.status === 'blocked' && !val.blockedReason) {
    ctx.addIssue({ code: 'custom', path: ['blockedReason'], message: 'blockedReason required when status=blocked' });
  }
});
export type TransitionTaskDto = z.infer<typeof TransitionTaskSchema>;

export const SpendQuerySchema = z.object({
  windowDays: z.coerce.number().int().min(1).max(365).default(90),
  category: z.string().max(50).optional(),
});
