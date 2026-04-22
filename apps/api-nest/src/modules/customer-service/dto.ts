import { z } from 'zod';

export const TICKET_STATUS = z.enum([
  'draft','pending','active','waiting_customer','escalated','resolved','closed','reopened','refunded','archived',
]);
export const PRIORITY = z.enum(['low','normal','high','urgent']);
export const CATEGORY = z.enum([
  'general','billing','dispute','account','technical','trust_safety','enterprise','refund','escalation',
]);
export const CHANNEL = z.enum(['web','email','chat','phone','api','mobile']);

export const CreateTicketSchema = z.object({
  requesterEmail: z.string().email().max(255),
  subject: z.string().min(2).max(200),
  body: z.string().max(8000).default(''),
  category: CATEGORY.default('general'),
  priority: PRIORITY.default('normal'),
  channel: CHANNEL.default('web'),
  meta: z.record(z.string(), z.any()).default({}),
});

export const UpdateTicketSchema = z.object({
  ticketId: z.string().uuid(),
  patch: z.object({
    subject: z.string().min(2).max(200).optional(),
    priority: PRIORITY.optional(),
    category: CATEGORY.optional(),
    queueSlug: z.string().min(1).max(40).optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    slaDueAt: z.string().datetime().nullable().optional(),
    csatScore: z.number().int().min(1).max(5).optional(),
    meta: z.record(z.string(), z.any()).optional(),
  }),
});

export const TransitionTicketSchema = z.object({
  ticketId: z.string().uuid(),
  to: TICKET_STATUS,
  note: z.string().max(2000).optional(),
});

export const PostMessageSchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().min(1).max(8000),
  visibility: z.enum(['public','internal']).default('public'),
  attachments: z.array(z.object({
    url: z.string().url(), name: z.string().max(200), size: z.number().int().nonnegative().optional(),
  })).max(10).default([]),
});

export const ListTicketsSchema = z.object({
  status: TICKET_STATUS.optional(),
  priority: PRIORITY.optional(),
  category: CATEGORY.optional(),
  queueSlug: z.string().max(40).optional(),
  assigneeId: z.string().uuid().optional(),
  requesterId: z.string().uuid().optional(),
  q: z.string().max(120).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

// ── Delegated tasks ──────────────────────────────────────
export const TASK_STATUS   = z.enum(['open','in_progress','blocked','done','cancelled']);
export const TASK_PRIORITY = z.enum(['low','normal','high','urgent']);

export const CreateTaskSchema = z.object({
  title:      z.string().min(2).max(240),
  detail:     z.string().max(4000).optional(),
  assigneeId: z.string().uuid().optional(),
  ticketId:   z.string().uuid().optional(),
  priority:   TASK_PRIORITY.default('normal'),
  dueAt:      z.string().datetime().optional(),
  meta:       z.record(z.string(), z.any()).default({}),
});
export const UpdateTaskSchema = z.object({
  taskId: z.string().uuid(),
  patch:  z.object({
    title:      z.string().min(2).max(240).optional(),
    detail:     z.string().max(4000).optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    priority:   TASK_PRIORITY.optional(),
    status:     TASK_STATUS.optional(),
    dueAt:      z.string().datetime().nullable().optional(),
    meta:       z.record(z.string(), z.any()).optional(),
  }),
});
export const ListTasksSchema = z.object({
  status:     TASK_STATUS.optional(),
  priority:   TASK_PRIORITY.optional(),
  assigneeId: z.string().uuid().optional(),
  q:          z.string().max(120).optional(),
  page:       z.number().int().min(1).default(1),
  pageSize:   z.number().int().min(1).max(200).default(50),
});

// Allowed transitions for the ticket state machine.
export const TICKET_TRANSITIONS: Record<string, string[]> = {
  draft:             ['pending','archived'],
  pending:           ['active','waiting_customer','escalated','resolved','archived'],
  active:            ['waiting_customer','escalated','resolved','closed','refunded'],
  waiting_customer:  ['active','escalated','resolved','closed'],
  escalated:         ['active','resolved','refunded','closed'],
  resolved:          ['reopened','closed','refunded'],
  closed:            ['reopened','archived'],
  reopened:          ['active','escalated','resolved'],
  refunded:          ['closed','archived'],
  archived:          [],
};
