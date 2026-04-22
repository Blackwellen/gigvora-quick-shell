import { z } from 'zod';

export const DashboardRoleEnum = z.enum(['user', 'professional', 'enterprise']);
export type DashboardRole = z.infer<typeof DashboardRoleEnum>;

export const ActionStatusEnum = z.enum(['pending', 'snoozed', 'done', 'dismissed']);
export type ActionStatus = z.infer<typeof ActionStatusEnum>;

export const OverviewQuerySchema = z.object({
  role: DashboardRoleEnum.optional().default('user'),
  refresh: z.coerce.boolean().optional().default(false),
});
export type OverviewQuery = z.infer<typeof OverviewQuerySchema>;

export const UpsertWidgetSchema = z.object({
  role: DashboardRoleEnum.default('user'),
  widgetKey: z.string().min(1).max(64),
  position: z.number().int().min(0).max(999).default(0),
  size: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
  visible: z.boolean().default(true),
  config: z.record(z.string(), z.any()).default({}),
});
export type UpsertWidgetDto = z.infer<typeof UpsertWidgetSchema>;

export const ReorderWidgetsSchema = z.object({
  role: DashboardRoleEnum.default('user'),
  order: z.array(z.object({ id: z.string().uuid(), position: z.number().int().min(0).max(999) })).min(1).max(64),
});
export type ReorderWidgetsDto = z.infer<typeof ReorderWidgetsSchema>;

export const CreateActionSchema = z.object({
  role: DashboardRoleEnum.default('user'),
  kind: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  href: z.string().max(500).optional(),
  priority: z.number().int().min(0).max(100).default(50),
  dueAt: z.string().datetime().optional(),
  meta: z.record(z.string(), z.any()).default({}),
});
export type CreateActionDto = z.infer<typeof CreateActionSchema>;

export const UpdateActionSchema = z.object({
  status: ActionStatusEnum.optional(),
  snoozeUntil: z.string().datetime().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
});
export type UpdateActionDto = z.infer<typeof UpdateActionSchema>;
