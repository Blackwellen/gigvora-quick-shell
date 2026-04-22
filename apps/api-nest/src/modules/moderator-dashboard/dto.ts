import { z } from 'zod';

export const ITEM_STATUS = z.enum(['open','triaging','holding','escalated','actioned','dismissed','closed']);
export const ITEM_QUEUE  = z.enum(['triage','review','escalation','messaging_incident','closed']);
export const SURFACE     = z.enum(['post','profile','message','media','comment','review','project','gig','service','job','dm_thread']);
export const REASON      = z.enum(['spam','harassment','hate','csam','illegal','impersonation','intellectual_property','self_harm','nsfw','scam','other']);
export const SEVERITY    = z.enum(['low','normal','high','critical']);
export const ACTION      = z.enum(['warn','hide','remove','quarantine','suspend','ban','escalate_legal','escalate_trust_safety','dismiss','restore','none']);
export const MSG_SIGNAL  = z.enum(['keyword','rate_limit','phishing','solicitation','grooming','self_harm','threat','spam','user_report','automation','other']);
export const MSG_STATUS  = z.enum(['pending','reviewed','actioned','dismissed','escalated']);

export const CreateItemSchema = z.object({
  surface: SURFACE,
  targetId: z.string().min(1).max(120),
  reasonCode: REASON,
  reasonDetail: z.string().max(2000).optional(),
  severity: SEVERITY.default('normal'),
  reporterId: z.string().uuid().optional(),
  evidence: z.array(z.object({ url: z.string().url(), label: z.string().max(240) })).default([]),
  meta: z.record(z.string(), z.any()).default({}),
});
export const ListItemsSchema = z.object({
  status: ITEM_STATUS.optional(),
  queue:  ITEM_QUEUE.optional(),
  surface: SURFACE.optional(),
  reasonCode: REASON.optional(),
  severity: SEVERITY.optional(),
  assigneeId: z.string().uuid().optional(),
  q:        z.string().max(120).optional(),
  page:     z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
export const TransitionSchema = z.object({
  itemId: z.string().uuid(),
  to:     ITEM_STATUS,
  note:   z.string().max(2000).optional(),
});
export const AssignSchema = z.object({
  itemId:     z.string().uuid(),
  assigneeId: z.string().uuid().nullable(),
  queue:      ITEM_QUEUE.optional(),
});
export const ActSchema = z.object({
  itemId:     z.string().uuid(),
  action:     ACTION,
  rationale:  z.string().min(3).max(8000),
  durationH:  z.number().int().min(1).max(24*365).optional(),
  appealable: z.enum(['yes','no']).default('yes'),
});
export const BulkActSchema = z.object({
  itemIds:    z.array(z.string().uuid()).min(1).max(100),
  action:     ACTION,
  rationale:  z.string().min(3).max(8000),
});
export const IncidentReviewSchema = z.object({
  incidentId: z.string().uuid(),
  to:         MSG_STATUS,
  rationale:  z.string().max(8000).optional(),
});

export const ITEM_TRANSITIONS: Record<string, string[]> = {
  open:      ['triaging','holding','actioned','dismissed','escalated'],
  triaging:  ['holding','actioned','dismissed','escalated'],
  holding:   ['triaging','actioned','dismissed','escalated'],
  escalated: ['actioned','dismissed','closed'],
  actioned:  ['closed'],
  dismissed: ['closed'],
  closed:    [],
};
export const QUEUE_BY_STATUS: Record<string, string> = {
  open: 'triage', triaging: 'review', holding: 'review',
  escalated: 'escalation', actioned: 'closed', dismissed: 'closed', closed: 'closed',
};
