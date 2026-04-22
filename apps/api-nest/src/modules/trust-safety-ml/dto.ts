import { z } from 'zod';

export const CASE_STATUS = z.enum(['open','reviewing','holding','escalated','decided','closed']);
export const CASE_QUEUE  = z.enum(['triage','review','escalation','closed']);
export const CASE_KIND   = z.enum(['fraud','abuse','identity','payment_risk','content','compliance','other']);
export const SUBJECT     = z.enum(['user','company','agency','order','listing','transaction','device','ip','session']);
export const SEVERITY    = z.enum(['low','normal','high','critical']);
export const SIGNAL_SRC  = z.enum(['payment','login','signup','message','listing','review','device','velocity','geo','identity','external_webhook','manual']);
export const SIGNAL_STATUS = z.enum(['open','reviewing','actioned','dismissed','suppressed','expired']);
export const DECISION    = z.enum([
  'allow','allow_with_friction','step_up_kyc','hold_funds','release_funds','block_payment','restrict_account',
  'suspend','ban','refund','chargeback_accept','chargeback_dispute','escalate_legal','escalate_compliance',
  'whitelist','blacklist','dismiss','none',
]);
export const LIST_KIND   = z.enum(['blocklist','allowlist','watchlist']);

export const CreateSignalSchema = z.object({
  source: SIGNAL_SRC,
  subjectKind: SUBJECT,
  subjectId: z.string().min(1).max(120),
  signalCode: z.string().min(1).max(120),
  severity: SEVERITY.default('normal'),
  features: z.record(z.string(), z.any()).default({}),
  reasons: z.array(z.string()).default([]),
  meta: z.record(z.string(), z.any()).default({}),
});
export const ListSignalsSchema = z.object({
  status: SIGNAL_STATUS.optional(),
  source: SIGNAL_SRC.optional(),
  subjectKind: SUBJECT.optional(),
  q: z.string().max(120).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
export const CreateCaseSchema = z.object({
  subjectKind: SUBJECT,
  subjectId: z.string().min(1).max(120),
  caseKind: CASE_KIND,
  severity: SEVERITY.default('normal'),
  signalIds: z.array(z.string().uuid()).default([]),
  reasons: z.array(z.string()).default([]),
  features: z.record(z.string(), z.any()).default({}),
  meta: z.record(z.string(), z.any()).default({}),
});
export const ListCasesSchema = z.object({
  status: CASE_STATUS.optional(),
  queue:  CASE_QUEUE.optional(),
  caseKind: CASE_KIND.optional(),
  subjectKind: SUBJECT.optional(),
  assigneeId: z.string().uuid().optional(),
  q: z.string().max(120).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
export const TransitionSchema = z.object({
  caseId: z.string().uuid(),
  to:     CASE_STATUS,
  note:   z.string().max(2000).optional(),
});
export const AssignSchema = z.object({
  caseId:     z.string().uuid(),
  assigneeId: z.string().uuid().nullable(),
  queue:      CASE_QUEUE.optional(),
});
export const DecideSchema = z.object({
  caseId:     z.string().uuid(),
  decision:   DECISION,
  rationale:  z.string().min(3).max(8000),
  durationH:  z.number().int().min(1).max(24*365).optional(),
  appealable: z.enum(['yes','no']).default('yes'),
});
export const MlReviewSchema = z.object({
  caseId:  z.string().uuid(),
  agreed:  z.boolean(),
  note:    z.string().max(4000).optional(),
});
export const WatchlistSchema = z.object({
  listKind: LIST_KIND,
  subjectKind: SUBJECT,
  subjectId: z.string().min(1).max(120),
  reason: z.string().min(3).max(2000),
  expiresAt: z.string().datetime().optional(),
});

export const CASE_TRANSITIONS: Record<string, string[]> = {
  open:      ['reviewing','holding','decided','escalated'],
  reviewing: ['holding','decided','escalated'],
  holding:   ['reviewing','decided','escalated'],
  escalated: ['decided','closed'],
  decided:   ['closed'],
  closed:    [],
};
export const QUEUE_BY_STATUS: Record<string, string> = {
  open: 'triage', reviewing: 'review', holding: 'review',
  escalated: 'escalation', decided: 'closed', closed: 'closed',
};
