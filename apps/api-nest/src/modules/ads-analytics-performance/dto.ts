import { z } from 'zod';

export const MetricEnum = z.enum(['impressions','clicks','installs','conversions','spend','revenue','ctr','cvr','cpc','cpm','cpi','cpa','roas']);
export type Metric = z.infer<typeof MetricEnum>;

export const GroupByEnum = z.enum(['date','campaign','ad_group','creative','country','device','placement']);
export type GroupBy = z.infer<typeof GroupByEnum>;

export const SAVED_REPORT_TRANSITIONS: Record<string, string[]> = {
  draft: ['active','archived'], active: ['archived','draft'], archived: [],
};
export const ALERT_TRANSITIONS: Record<string, string[]> = {
  active: ['paused','archived','triggered'], paused: ['active','archived'],
  triggered: ['acknowledged','active'], acknowledged: ['active','archived'], archived: [],
};
export const EXPORT_TRANSITIONS: Record<string, string[]> = {
  queued: ['running','cancelled'], running: ['succeeded','failed','cancelled'],
  succeeded: [], failed: [], cancelled: [],
};

export const FiltersSchema = z.object({
  campaignIds: z.array(z.string().uuid()).max(200).optional(),
  creativeIds: z.array(z.string().uuid()).max(200).optional(),
  country: z.array(z.string().length(2)).max(50).optional(),
  device: z.array(z.enum(['desktop','mobile','tablet','tv','other'])).max(5).optional(),
  placement: z.array(z.string().min(1).max(80)).max(50).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  granularity: z.enum(['day','week','month']).default('day'),
}).strict().superRefine((v, ctx) => {
  if (new Date(v.dateTo) < new Date(v.dateFrom)) {
    ctx.addIssue({ code: 'custom', path: ['dateTo'], message: 'dateTo must be on/after dateFrom' });
  }
  const span = (new Date(v.dateTo).getTime() - new Date(v.dateFrom).getTime()) / (1000*60*60*24);
  if (span > 366) ctx.addIssue({ code: 'custom', path: ['dateTo'], message: 'date range cannot exceed 366 days' });
});

export const QuerySchema = z.object({
  filters: FiltersSchema,
  groupBy: z.array(GroupByEnum).max(6).default(['date']),
  metrics: z.array(MetricEnum).min(1).max(13).default(['impressions','clicks','spend','ctr','cpc']),
  sort: z.object({ metric: MetricEnum, dir: z.enum(['asc','desc']).default('desc') }).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(500).default(100),
});

export const SavedReportSchema = z.object({
  name: z.string().min(1).max(200),
  filters: FiltersSchema,
  groupBy: z.array(GroupByEnum).max(6),
  metrics: z.array(MetricEnum).min(1).max(13),
  sort: z.object({ metric: MetricEnum, dir: z.enum(['asc','desc']) }).optional(),
});
export const SavedReportTransitionSchema = z.object({ status: z.enum(['draft','active','archived']) });

export const AlertSchema = z.object({
  name: z.string().min(1).max(200),
  metric: z.enum(['ctr','cvr','cpc','cpm','cpi','cpa','spend','roas']),
  comparator: z.enum(['gt','lt','gte','lte','change_pct']),
  threshold: z.number(),
  windowHours: z.number().int().min(1).max(720).default(24),
  scope: z.object({ campaignId: z.string().uuid().optional(), creativeId: z.string().uuid().optional() }).strict().default({}),
  channel: z.enum(['email','webhook','in_app']).default('email'),
  channelTarget: z.string().max(500).optional(),
  cooldownMinutes: z.number().int().min(0).max(10080).default(60),
}).superRefine((v, ctx) => {
  if (v.channel === 'webhook' && !v.channelTarget?.startsWith('https://')) {
    ctx.addIssue({ code: 'custom', path: ['channelTarget'], message: 'webhook channel requires https URL' });
  }
});
export const AlertTransitionSchema = z.object({
  status: z.enum(['active','paused','triggered','acknowledged','archived']),
  reason: z.string().max(500).optional(),
});

export const ExportSchema = z.object({
  format: z.enum(['csv','json','xlsx']),
  filters: FiltersSchema,
  groupBy: z.array(GroupByEnum).max(6).default(['date']),
  metrics: z.array(MetricEnum).min(1).max(13).default(['impressions','clicks','spend','ctr','cpc','cpm','cpi','cpa']),
});

export const AnomalyTransitionSchema = z.object({ status: z.enum(['acknowledged','resolved']) });

export const CreativeScoreQuerySchema = z.object({
  windowDays: z.coerce.number().int().refine((n) => [7,14,30].includes(n), 'windowDays must be 7|14|30').default(7),
  band: z.enum(['top','strong','average','weak','poor']).optional(),
});

/** Compute derived metrics from raw counters. Money in minor units. */
export function computeDerived(row: { impressions: number; clicks: number; installs: number; conversions: number; spend_minor: number; revenue_minor: number }) {
  const ctr = row.impressions > 0 ? row.clicks / row.impressions : 0;
  const cvr = row.clicks > 0 ? row.conversions / row.clicks : 0;
  const cpc_minor = row.clicks > 0 ? Math.round(row.spend_minor / row.clicks) : 0;
  const cpm_minor = row.impressions > 0 ? Math.round((row.spend_minor / row.impressions) * 1000) : 0;
  const cpi_minor = row.installs > 0 ? Math.round(row.spend_minor / row.installs) : 0;
  const cpa_minor = row.conversions > 0 ? Math.round(row.spend_minor / row.conversions) : 0;
  const roas = row.spend_minor > 0 ? row.revenue_minor / row.spend_minor : 0;
  return { ctr, cvr, cpc_minor, cpm_minor, cpi_minor, cpa_minor, roas };
}
