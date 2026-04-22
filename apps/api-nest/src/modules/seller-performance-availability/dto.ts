import { z } from 'zod';

export const WorkingHoursSchema = z.record(
  z.string(),
  z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    end: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  }),
);

export const UpdateAvailabilityDto = z.object({
  status: z.enum(['online', 'away', 'vacation', 'paused']).optional(),
  workingHours: WorkingHoursSchema.optional(),
  timezone: z.string().min(1).max(64).optional(),
  maxConcurrentOrders: z.number().int().min(0).max(1000).optional(),
  autoPauseThreshold: z.number().int().min(0).max(1000).optional(),
  responseTargetHours: z.number().int().min(0).max(168).optional(),
});

export const ScheduleVacationDto = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  message: z.string().max(500).optional(),
});

export const GigCapacityUpdateDto = z.object({
  status: z.enum(['active', 'paused', 'archived']).optional(),
  maxQueue: z.number().int().min(0).max(1000).optional(),
  pausedReason: z.string().max(500).optional(),
});

export const OptimizationActionDto = z.object({
  action: z.enum(['dismiss', 'apply']),
});

export type UpdateAvailabilityInput = z.infer<typeof UpdateAvailabilityDto>;
export type ScheduleVacationInput = z.infer<typeof ScheduleVacationDto>;
export type GigCapacityUpdateInput = z.infer<typeof GigCapacityUpdateDto>;
export type OptimizationActionInput = z.infer<typeof OptimizationActionDto>;
