import { z } from 'zod';

export const PipelineStatusEnum = z.enum(['draft', 'active', 'paused', 'archived']);
export type PipelineStatus = z.infer<typeof PipelineStatusEnum>;

export const OutreachStatusEnum = z.enum(['queued', 'sent', 'opened', 'replied', 'bounced', 'unsubscribed']);
export type OutreachStatus = z.infer<typeof OutreachStatusEnum>;

export const TaskStatusEnum = z.enum(['open', 'in_progress', 'done', 'snoozed', 'dismissed']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TaskKindEnum = z.enum(['followup', 'review', 'interview', 'offer', 'reference', 'admin']);

// Pipeline transitions: draft → active ↔ paused → archived; archived is terminal.
export const PIPELINE_TRANSITIONS: Record<PipelineStatus, PipelineStatus[]> = {
  draft: ['active', 'archived'],
  active: ['paused', 'archived'],
  paused: ['active', 'archived'],
  archived: [],
};

// Task transitions: open ↔ in_progress; either → done|snoozed|dismissed; terminal states are leaves.
export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  open: ['in_progress', 'done', 'snoozed', 'dismissed'],
  in_progress: ['open', 'done', 'snoozed', 'dismissed'],
  snoozed: ['open', 'in_progress', 'dismissed'],
  done: [],
  dismissed: [],
};

export const OverviewQuerySchema = z.object({
  windowDays: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export const ListPipelinesQuerySchema = z.object({
  status: PipelineStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const TransitionPipelineSchema = z.object({
  status: PipelineStatusEnum,
  reason: z.string().max(500).optional(),
});
export type TransitionPipelineDto = z.infer<typeof TransitionPipelineSchema>;

export const OutreachQuerySchema = z.object({
  status: OutreachStatusEnum.optional(),
  pipelineId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const VelocityQuerySchema = z.object({
  pipelineId: z.string().uuid().optional(),
  windowDays: z.coerce.number().int().min(1).max(365).default(30),
});

export const ListTasksQuerySchema = z.object({
  status: TaskStatusEnum.optional(),
  pipelineId: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

export const TransitionTaskSchema = z.object({
  status: TaskStatusEnum,
  snoozedUntil: z.string().datetime().optional(),
  note: z.string().max(500).optional(),
}).superRefine((val, ctx) => {
  if (val.status === 'snoozed' && !val.snoozedUntil) {
    ctx.addIssue({ code: 'custom', path: ['snoozedUntil'], message: 'snoozedUntil required when status=snoozed' });
  }
});
export type TransitionTaskDto = z.infer<typeof TransitionTaskSchema>;
