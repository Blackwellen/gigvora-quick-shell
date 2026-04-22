import { z } from 'zod';

export const PR_STATUS = z.enum(['pending','reviewing','approved','rejected','holding','escalated','archived']);
export const PR_QUEUE  = z.enum(['triage','review','escalation','closed']);
export const CREATIVE  = z.enum(['image','video','carousel','text','native','audio']);
export const SEVERITY  = z.enum(['low','normal','high','critical']);
export const SCOPE     = z.enum(['global','advertiser','campaign']);
export const GEO_RULE  = z.enum(['block','allow','restrict_age','restrict_category']);
export const KW_RULE   = z.enum(['block','review','allow']);
export const KW_MATCH  = z.enum(['exact','phrase','regex','substring']);
export const DECISION  = z.enum([
  'approve','approve_with_edits','reject','request_changes','hold','escalate','dismiss',
  'pause_campaign','resume_campaign','disable_creative','geo_restrict','keyword_restrict',
]);
export const CAMP_STATUS = z.enum(['active','paused','disabled','restricted']);

export const ListReviewsSchema = z.object({
  status: PR_STATUS.optional(), queue: PR_QUEUE.optional(),
  creativeKind: CREATIVE.optional(), advertiserId: z.string().max(120).optional(),
  campaignId: z.string().max(120).optional(), assigneeId: z.string().uuid().optional(),
  q: z.string().max(120).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
export const CreateReviewSchema = z.object({
  campaignId: z.string().min(1).max(120),
  advertiserId: z.string().min(1).max(120),
  creativeKind: CREATIVE,
  headline: z.string().max(500).optional(),
  body: z.string().max(5000).optional(),
  landingUrl: z.string().url().max(2000).optional(),
  geos: z.array(z.string().min(2).max(8)).default([]),
  keywords: z.array(z.string().min(1).max(120)).default([]),
  meta: z.record(z.string(), z.any()).default({}),
});
export const TransitionSchema = z.object({
  reviewId: z.string().uuid(),
  to: PR_STATUS,
  note: z.string().max(2000).optional(),
});
export const AssignSchema = z.object({
  reviewId: z.string().uuid(),
  assigneeId: z.string().uuid().nullable(),
  queue: PR_QUEUE.optional(),
});
export const DecideSchema = z.object({
  reviewId: z.string().uuid(),
  decision: DECISION,
  rationale: z.string().min(3).max(8000),
  edits: z.object({
    removeGeos: z.array(z.string()).optional(),
    removeKeywords: z.array(z.string()).optional(),
    headline: z.string().max(500).optional(),
    body: z.string().max(5000).optional(),
  }).default({}),
  appealable: z.enum(['yes','no']).default('yes'),
});
export const GeoRuleSchema = z.object({
  scope: SCOPE, scopeId: z.string().max(120).optional().nullable(),
  geoCode: z.string().min(2).max(8),
  rule: GEO_RULE,
  category: z.string().max(60).optional(),
  reason: z.string().min(3).max(2000),
  expiresAt: z.string().datetime().optional(),
});
export const KeywordRuleSchema = z.object({
  scope: SCOPE, scopeId: z.string().max(120).optional().nullable(),
  keyword: z.string().min(1).max(200),
  match: KW_MATCH.default('phrase'),
  rule: KW_RULE,
  severity: SEVERITY.default('normal'),
  reason: z.string().min(3).max(2000),
  expiresAt: z.string().datetime().optional(),
});
export const CampaignControlSchema = z.object({
  campaignId: z.string().min(1).max(120),
  status: CAMP_STATUS,
  reason: z.string().min(3).max(2000),
});

export const PR_TRANSITIONS: Record<string, string[]> = {
  pending:   ['reviewing','holding','approved','rejected','escalated'],
  reviewing: ['holding','approved','rejected','escalated'],
  holding:   ['reviewing','approved','rejected','escalated'],
  escalated: ['approved','rejected','archived'],
  approved:  ['archived'],
  rejected:  ['archived'],
  archived:  [],
};
export const QUEUE_BY_STATUS: Record<string, string> = {
  pending: 'triage', reviewing: 'review', holding: 'review',
  escalated: 'escalation', approved: 'closed', rejected: 'closed', archived: 'closed',
};
