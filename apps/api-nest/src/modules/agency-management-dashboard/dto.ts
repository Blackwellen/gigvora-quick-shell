import { z } from 'zod';

export const EngagementStatusEnum = z.enum(['draft', 'active', 'at_risk', 'on_hold', 'completed', 'cancelled']);
export type EngagementStatus = z.infer<typeof EngagementStatusEnum>;

export const DeliverableStatusEnum = z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']);
export type DeliverableStatus = z.infer<typeof DeliverableStatusEnum>;

export const InvoiceStatusEnum = z.enum(['draft', 'sent', 'paid', 'overdue', 'written_off']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

// Engagement transitions: draft → active; active → at_risk|on_hold|completed|cancelled;
// at_risk ↔ active|on_hold; on_hold → active|cancelled; completed/cancelled terminal.
export const ENGAGEMENT_TRANSITIONS: Record<EngagementStatus, EngagementStatus[]> = {
  draft: ['active', 'cancelled'],
  active: ['at_risk', 'on_hold', 'completed', 'cancelled'],
  at_risk: ['active', 'on_hold', 'completed', 'cancelled'],
  on_hold: ['active', 'cancelled'],
  completed: [],
  cancelled: [],
};

// Deliverable transitions: todo ↔ in_progress; in_progress → review|blocked|done;
// review → in_progress|done|blocked; blocked → in_progress|todo; done terminal.
export const DELIVERABLE_TRANSITIONS: Record<DeliverableStatus, DeliverableStatus[]> = {
  todo: ['in_progress', 'blocked'],
  in_progress: ['review', 'blocked', 'done', 'todo'],
  review: ['in_progress', 'done', 'blocked'],
  blocked: ['in_progress', 'todo'],
  done: [],
};

// Invoice transitions: draft → sent; sent → paid|overdue|written_off;
// overdue → paid|written_off; paid/written_off terminal.
export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'written_off'],
  sent: ['paid', 'overdue', 'written_off'],
  overdue: ['paid', 'written_off'],
  paid: [],
  written_off: [],
};

export const OverviewQuerySchema = z.object({
  windowDays: z.coerce.number().int().min(1).max(365).default(30),
});

export const ListEngagementsQuerySchema = z.object({
  status: EngagementStatusEnum.optional(),
  clientIdentityId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const TransitionEngagementSchema = z.object({
  status: EngagementStatusEnum,
  reason: z.string().max(500).optional(),
});
export type TransitionEngagementDto = z.infer<typeof TransitionEngagementSchema>;

export const ListDeliverablesQuerySchema = z.object({
  status: DeliverableStatusEnum.optional(),
  engagementId: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

export const TransitionDeliverableSchema = z.object({
  status: DeliverableStatusEnum,
  blockedReason: z.string().max(500).optional(),
  note: z.string().max(500).optional(),
}).superRefine((val, ctx) => {
  if (val.status === 'blocked' && !val.blockedReason) {
    ctx.addIssue({ code: 'custom', path: ['blockedReason'], message: 'blockedReason required when status=blocked' });
  }
});
export type TransitionDeliverableDto = z.infer<typeof TransitionDeliverableSchema>;

export const UtilizationQuerySchema = z.object({
  windowDays: z.coerce.number().int().min(1).max(365).default(30),
  memberIdentityId: z.string().uuid().optional(),
});

export const ListInvoicesQuerySchema = z.object({
  status: InvoiceStatusEnum.optional(),
  clientIdentityId: z.string().uuid().optional(),
});

export const TransitionInvoiceSchema = z.object({
  status: InvoiceStatusEnum,
  paidOn: z.string().date().optional(),
  note: z.string().max(500).optional(),
}).superRefine((val, ctx) => {
  if (val.status === 'paid' && !val.paidOn) {
    ctx.addIssue({ code: 'custom', path: ['paidOn'], message: 'paidOn required when status=paid' });
  }
});
export type TransitionInvoiceDto = z.infer<typeof TransitionInvoiceSchema>;
