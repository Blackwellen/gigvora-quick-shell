import { z } from 'zod';

export const ReportKind = z.enum(['table','chart','dashboard']);
export const ReportFormat = z.enum(['pdf','csv','xlsx','json']);
export const ReportVisibility = z.enum(['private','team','public']);

export const ReportCreateZ = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  kind: ReportKind.default('table'),
  query: z.object({
    metric_keys: z.array(z.string().min(1).max(128)).min(1).max(20),
    bucket:      z.enum(['hour','day','week','month']).default('day'),
    range_days:  z.number().int().min(1).max(365).default(30),
    filters:     z.record(z.string().max(64), z.any()).default({}),
  }),
  visualization: z.record(z.string().max(64), z.any()).default({}),
  visibility: ReportVisibility.default('private'),
});
export type ReportCreate = z.infer<typeof ReportCreateZ>;

export const ReportUpdateZ = ReportCreateZ.partial();

export const ScheduleCreateZ = z.object({
  cron_expr:  z.string().min(9).max(128),
  timezone:   z.string().min(2).max(64).default('UTC'),
  enabled:    z.boolean().default(true),
  recipients: z.array(z.string().email()).max(50).default([]),
  format:     ReportFormat.default('pdf'),
});
export type ScheduleCreate = z.infer<typeof ScheduleCreateZ>;

export const SubscriptionCreateZ = z.object({
  channel: z.enum(['email','in_app','slack']).default('email'),
});
