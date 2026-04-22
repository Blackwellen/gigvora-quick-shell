import { z } from 'zod';

export const FLAG_STATUS    = z.enum(['draft','active','paused','archived']);
export const OVERRIDE_SCOPE = z.enum(['platform','tenant','user','feature','route','domain']);
export const OVERRIDE_KIND  = z.enum(['rate_limit','maintenance','config','entitlement','kill_switch','dark_launch','cost_cap','rollout']);
export const OVERRIDE_STATUS= z.enum(['active','paused','expired','archived']);
export const INCIDENT_SEV   = z.enum(['sev1','sev2','sev3','sev4']);
export const INCIDENT_STATUS= z.enum(['open','mitigated','resolved','postmortem','archived']);

export const ListFlagsSchema = z.object({
  status: FLAG_STATUS.optional(), q: z.string().max(120).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
export const CreateFlagSchema = z.object({
  key: z.string().min(3).max(160).regex(/^[a-zA-Z0-9_.-]+$/),
  name: z.string().min(1).max(160),
  description: z.string().max(2000).default(''),
  enabled: z.boolean().default(false),
  rolloutPct: z.number().min(0).max(100).default(0),
  environments: z.array(z.string().min(1).max(40)).default(['production']),
  segments: z.array(z.object({ kind: z.string().min(1).max(40), value: z.string().min(1).max(160) })).default([]),
  variants: z.array(z.object({ key: z.string().min(1).max(80), weight: z.number().min(0).max(100), payload: z.record(z.string(), z.any()).default({}) })).default([]),
  ownerId: z.string().uuid().optional(),
});
export const UpdateFlagSchema = CreateFlagSchema.partial().extend({ id: z.string().uuid() });
export const ToggleFlagSchema = z.object({ id: z.string().uuid(), enabled: z.boolean() });
export const RolloutFlagSchema= z.object({ id: z.string().uuid(), rolloutPct: z.number().min(0).max(100) });
export const FlagStatusSchema = z.object({ id: z.string().uuid(), status: FLAG_STATUS });

export const ListOverridesSchema = z.object({
  scope: OVERRIDE_SCOPE.optional(), kind: OVERRIDE_KIND.optional(),
  status: OVERRIDE_STATUS.optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
export const CreateOverrideSchema = z.object({
  scope: OVERRIDE_SCOPE, scopeId: z.string().max(200).optional(),
  kind: OVERRIDE_KIND,
  value: z.record(z.string(), z.any()).default({}),
  reason: z.string().min(3).max(2000),
  expiresAt: z.string().datetime().optional(),
});
export const UpdateOverrideSchema = z.object({
  id: z.string().uuid(),
  value: z.record(z.string(), z.any()).optional(),
  status: OVERRIDE_STATUS.optional(),
  reason: z.string().min(3).max(2000).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const CreateIncidentSchema = z.object({
  title: z.string().min(3).max(300),
  severity: INCIDENT_SEV,
  scope: z.string().min(1).max(80).default('platform'),
  notes: z.string().max(8000).default(''),
});
export const TransitionIncidentSchema = z.object({
  id: z.string().uuid(),
  to: INCIDENT_STATUS,
  notes: z.string().max(8000).optional(),
});

export const ListAuditSchema = z.object({
  domain: z.string().max(60).optional(),
  actorId: z.string().uuid().optional(),
  targetId: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
});

// State machine transitions.
export const FLAG_TRANSITIONS: Record<string, string[]> = {
  draft:    ['active','archived'],
  active:   ['paused','archived'],
  paused:   ['active','archived'],
  archived: [],
};
export const INCIDENT_TRANSITIONS: Record<string, string[]> = {
  open:       ['mitigated','resolved','archived'],
  mitigated:  ['resolved','open','postmortem'],
  resolved:   ['postmortem','archived'],
  postmortem: ['archived'],
  archived:   [],
};
