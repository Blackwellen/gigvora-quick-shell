import { z } from 'zod';

export const CASE_STATUS = z.enum([
  'draft','pending','triaged','mediation','arbitration',
  'awaiting_response','resolved','dismissed','escalated','closed',
]);
export const CASE_QUEUE  = z.enum(['triage','mediation','arbitration','escalation','closed']);
export const CASE_CATEGORY = z.enum([
  'service_quality','non_delivery','scope','payment','refund','ip','fraud','chargeback','other',
]);
export const CASE_SEVERITY = z.enum(['low','normal','high','critical']);
export const CASE_OUTCOME  = z.enum([
  'refund_full','refund_partial','rework','dismissed','split','goodwill','reversed','none',
]);

export const CreateCaseSchema = z.object({
  subject:      z.string().min(3).max(240),
  description:  z.string().max(8000).default(''),
  category:     CASE_CATEGORY.default('service_quality'),
  severity:     CASE_SEVERITY.default('normal'),
  amountMinor:  z.number().int().min(0).max(1_000_000_000).default(0),
  currency:     z.string().length(3).default('GBP'),
  claimantId:   z.string().uuid(),
  respondentId: z.string().uuid().optional(),
  sourceKind:   z.string().max(40).optional(),
  sourceId:     z.string().uuid().optional(),
  meta:         z.record(z.string(), z.any()).default({}),
});

export const ListCasesSchema = z.object({
  status:   CASE_STATUS.optional(),
  queue:    CASE_QUEUE.optional(),
  category: CASE_CATEGORY.optional(),
  severity: CASE_SEVERITY.optional(),
  assigneeId: z.string().uuid().optional(),
  q:        z.string().max(120).optional(),
  page:     z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const TransitionCaseSchema = z.object({
  caseId: z.string().uuid(),
  to:     CASE_STATUS,
  note:   z.string().max(2000).optional(),
});

export const AssignCaseSchema = z.object({
  caseId:     z.string().uuid(),
  assigneeId: z.string().uuid().nullable(),
  queue:      CASE_QUEUE.optional(),
});

export const PostMessageSchema = z.object({
  caseId:     z.string().uuid(),
  body:       z.string().min(1).max(8000),
  visibility: z.enum(['parties','internal','arbitration']).default('parties'),
  attachments: z.array(z.object({ url: z.string().url(), label: z.string().max(240) })).default([]),
});

export const AddEvidenceSchema = z.object({
  caseId: z.string().uuid(),
  party:  z.enum(['claimant','respondent','operator','arbitrator']),
  kind:   z.enum(['file','link','message','transaction','screenshot','contract','other']),
  label:  z.string().min(1).max(240),
  url:    z.string().url().optional(),
  bytes:  z.number().int().min(0).optional(),
  meta:   z.record(z.string(), z.any()).default({}),
});

export const OpenArbitrationSchema = z.object({
  caseId: z.string().uuid(),
  panel:  z.array(z.object({ userId: z.string().uuid(), role: z.string().max(40) })).min(1).max(7),
});
export const DecideArbitrationSchema = z.object({
  caseId:        z.string().uuid(),
  decision:      z.enum(['refund_full','refund_partial','rework','dismissed','split','goodwill']),
  amountMinor:   z.number().int().min(0).optional(),
  rationale:     z.string().min(3).max(8000),
});

// Deterministic state machine.
export const CASE_TRANSITIONS: Record<string, string[]> = {
  draft:             ['pending'],
  pending:           ['triaged','dismissed'],
  triaged:           ['mediation','arbitration','awaiting_response','escalated','dismissed'],
  mediation:         ['awaiting_response','arbitration','resolved','escalated'],
  awaiting_response: ['mediation','arbitration','resolved','dismissed','escalated'],
  arbitration:       ['resolved','escalated','dismissed'],
  escalated:         ['arbitration','resolved','closed'],
  resolved:          ['closed'],
  dismissed:         ['closed'],
  closed:            [],
};

export const QUEUE_BY_STATUS: Record<string, string> = {
  pending: 'triage', triaged: 'triage',
  mediation: 'mediation', awaiting_response: 'mediation',
  arbitration: 'arbitration',
  escalated: 'escalation',
  resolved: 'closed', dismissed: 'closed', closed: 'closed',
};
