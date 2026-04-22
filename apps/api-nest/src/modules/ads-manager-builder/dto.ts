import { z } from 'zod';

export const CampaignStatusEnum = z.enum(['draft','in_review','approved','active','paused','completed','archived','rejected']);
export const CreativeStatusEnum = z.enum(['draft','in_review','approved','rejected','archived']);
export const AdGroupStatusEnum  = z.enum(['draft','active','paused','archived']);
export type CampaignStatus = z.infer<typeof CampaignStatusEnum>;
export type CreativeStatus = z.infer<typeof CreativeStatusEnum>;
export type AdGroupStatus  = z.infer<typeof AdGroupStatusEnum>;

export const CAMPAIGN_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft:     ['in_review','archived'],
  in_review: ['approved','rejected'],
  rejected:  ['draft','archived'],
  approved:  ['active','archived'],
  active:    ['paused','completed','archived'],
  paused:    ['active','completed','archived'],
  completed: ['archived'],
  archived:  [],
};
export const CREATIVE_TRANSITIONS: Record<CreativeStatus, CreativeStatus[]> = {
  draft:     ['in_review','archived'],
  in_review: ['approved','rejected'],
  rejected:  ['draft','archived'],
  approved:  ['archived'],
  archived:  [],
};
export const ADGROUP_TRANSITIONS: Record<AdGroupStatus, AdGroupStatus[]> = {
  draft:    ['active','archived'],
  active:   ['paused','archived'],
  paused:   ['active','archived'],
  archived: [],
};

const RoutingRulesSchema = z.object({
  geos: z.array(z.string().length(2)).max(50).optional(),
  languages: z.array(z.string().min(2).max(10)).max(20).optional(),
  deviceTypes: z.array(z.enum(['desktop','mobile','tablet','tv'])).max(10).optional(),
  audiences: z.array(z.string().min(1).max(80)).max(50).optional(),
  schedule: z.object({
    dow: z.array(z.number().int().min(0).max(6)).max(7),
    hours: z.array(z.number().int().min(0).max(23)).max(24),
  }).partial().optional(),
  frequencyCap: z.object({
    impressions: z.number().int().min(1).max(1000),
    period: z.enum(['day','week']),
  }).optional(),
}).strict().default({});

export const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  objective: z.enum(['awareness','traffic','leads','conversions','app_installs','engagement']),
  budgetMinor: z.number().int().min(0).max(10_000_000_00),
  dailyBudgetMinor: z.number().int().min(0).max(1_000_000_00).optional().default(0),
  currency: z.string().length(3).default('GBP'),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  routingRules: RoutingRulesSchema.optional(),
}).superRefine((v, ctx) => {
  if (v.startAt && v.endAt && new Date(v.endAt) < new Date(v.startAt)) {
    ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'endAt must be on/after startAt' });
  }
  if (v.dailyBudgetMinor && v.budgetMinor && v.dailyBudgetMinor > v.budgetMinor) {
    ctx.addIssue({ code: 'custom', path: ['dailyBudgetMinor'], message: 'daily budget exceeds total budget' });
  }
});

export const UpdateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  budgetMinor: z.number().int().min(0).max(10_000_000_00).optional(),
  dailyBudgetMinor: z.number().int().min(0).max(1_000_000_00).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  routingRules: RoutingRulesSchema.optional(),
});

export const TransitionCampaignSchema = z.object({
  status: CampaignStatusEnum,
  reason: z.string().max(500).optional(),
}).superRefine((v, ctx) => {
  if (v.status === 'rejected' && !v.reason) ctx.addIssue({ code: 'custom', path: ['reason'], message: 'rejected requires a reason' });
  if (v.status === 'archived' && !v.reason) ctx.addIssue({ code: 'custom', path: ['reason'], message: 'archived requires a reason' });
});

export const CreateCreativeSchema = z.object({
  name: z.string().min(1).max(200),
  format: z.enum(['image','video','carousel','html5','text']),
  assetUrl: z.string().url().max(2000).optional(),
  thumbnailUrl: z.string().url().max(2000).optional(),
  headline: z.string().max(200).optional(),
  body: z.string().max(1000).optional(),
  cta: z.string().max(60).optional(),
  destinationUrl: z.string().url().max(2000).optional(),
  width: z.number().int().min(1).max(10000).optional(),
  height: z.number().int().min(1).max(10000).optional(),
  durationSec: z.number().int().min(0).max(600).optional(),
  fileSizeBytes: z.number().int().min(0).max(500_000_000).optional(),
}).superRefine((v, ctx) => {
  if (v.format === 'video' && !v.durationSec) {
    ctx.addIssue({ code: 'custom', path: ['durationSec'], message: 'video requires durationSec' });
  }
  if ((v.format === 'image' || v.format === 'video') && !v.assetUrl) {
    ctx.addIssue({ code: 'custom', path: ['assetUrl'], message: `${v.format} requires assetUrl` });
  }
  if (v.format === 'text' && !v.body) {
    ctx.addIssue({ code: 'custom', path: ['body'], message: 'text creative requires body' });
  }
});

export const UpdateCreativeSchema = CreateCreativeSchema.innerType().partial();

export const TransitionCreativeSchema = z.object({
  status: CreativeStatusEnum,
  reason: z.string().max(500).optional(),
}).superRefine((v, ctx) => {
  if (v.status === 'rejected' && !v.reason) ctx.addIssue({ code: 'custom', path: ['reason'], message: 'rejected requires a reason' });
});

export const CreateAdGroupSchema = z.object({
  name: z.string().min(1).max(200),
  bidStrategy: z.enum(['cpc','cpm','cpa','target_cpa']).default('cpc'),
  bidAmountMinor: z.number().int().min(0).max(1_000_00),
  targeting: z.record(z.string(), z.any()).optional(),
});

export const TransitionAdGroupSchema = z.object({
  status: AdGroupStatusEnum,
  reason: z.string().max(500).optional(),
});

export const AttachCreativeSchema = z.object({
  creativeId: z.string().uuid(),
  weight: z.number().int().min(0).max(10000).default(100),
});

export const RoutingRuleSchema = z.object({
  priority: z.number().int().min(0).max(10000).default(100),
  conditionType: z.enum(['geo','device','language','audience','time','placement']),
  conditionValue: z.record(z.string(), z.any()),
  action: z.enum(['include','exclude','boost','cap']),
  actionValue: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});

export const SearchQuerySchema = z.object({
  q: z.string().max(200).optional(),
  subjectType: z.enum(['campaign','creative']).optional(),
  status: z.string().max(40).optional(),
  format: z.string().max(40).optional(),
  objective: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const ListCampaignsQuerySchema = z.object({
  status: CampaignStatusEnum.optional(),
  objective: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.enum(['createdAt','spentMinor','budgetMinor','name']).default('createdAt'),
  dir: z.enum(['asc','desc']).default('desc'),
});

export const WebhookEventSchema = z.object({
  id: z.string().min(1).max(200),
  type: z.string().min(1).max(120),
  data: z.record(z.string(), z.any()),
});

export const ModerationDecisionSchema = z.object({
  subjectType: z.enum(['campaign','creative']),
  subjectId: z.string().uuid(),
  decision: z.enum(['approved','rejected','needs_changes']),
  rationale: z.string().min(1).max(1000),
  flags: z.array(z.string().max(80)).max(20).optional(),
});
