import { z } from 'zod';

export const TargetType = z.enum(['count','sum','avg','ratio','duration_ms','currency','percent']);
export const ValueMode  = z.enum(['absolute','delta','rolling_avg','target_progress','signed_change']);
export const UnsetState = z.enum(['placeholder','hide','zero','dash','last_known']);
export const Source     = z.enum(['analytics_rollups','analytics_events','sql','custom']);
export const Format     = z.enum(['number','currency','percent','duration']);
export const Status     = z.enum(['draft','live','paused','retired']);
export const Portal     = z.enum(['moderation','admin_ops','disputes','finance','verification','cs','marketing','super','user','professional','enterprise']);

export const KpiCreateZ = z.object({
  title:        z.string().min(1).max(120),
  target_type:  TargetType,
  value_mode:   ValueMode,
  unset_state:  UnsetState.default('placeholder'),
  description:  z.string().max(2000).optional(),
  metric_key:   z.string().min(1).max(128).regex(/^[a-z0-9_.]+$/i),
  source:       Source.default('analytics_rollups'),
  source_query: z.string().max(4000).optional(),
  unit:         z.string().max(8).optional(),
  format:       Format.default('number'),
  decimals:     z.number().int().min(0).max(6).default(0),
  target_value: z.number().optional(),
  filters:      z.record(z.string().max(64), z.any()).default({}),
  schedule_cron:z.string().min(9).max(64).optional(),
  status:       Status.default('live'),
});
export type KpiCreate = z.infer<typeof KpiCreateZ>;

export const KpiUpdateZ = KpiCreateZ.partial();
export type KpiUpdate = z.infer<typeof KpiUpdateZ>;

export const KpiAssignZ = z.object({
  portal:   Portal,
  position: z.number().int().min(0).max(99).default(0),
  visibility: z.enum(['all','admins','owners']).default('all'),
});
export type KpiAssign = z.infer<typeof KpiAssignZ>;
