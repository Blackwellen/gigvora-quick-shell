import { z } from 'zod';

export const LeadSearchSchema = z.object({
  q: z.string().max(200).optional(),
  industry: z.string().max(80).optional(),
  seniority: z.array(z.enum(['intern','ic','senior','lead','manager','director','vp','c_level','founder'])).max(9).optional(),
  region: z.string().max(80).optional(),
  hq_country: z.string().max(80).optional(),
  function_area: z.string().max(80).optional(),
  saved: z.boolean().optional(),
  status: z.string().max(40).optional(),
  intent_min: z.number().int().min(0).max(100).optional(),
  page: z.number().int().min(1).max(500).default(1),
  page_size: z.number().int().min(1).max(100).default(25),
});

export const LeadCreateSchema = z.object({
  full_name: z.string().min(1).max(200),
  headline: z.string().max(280).default(''),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(40).optional(),
  company_id: z.string().uuid().optional(),
  company_name: z.string().max(200).optional(),
  title: z.string().max(140).optional(),
  seniority: z.enum(['intern','ic','senior','lead','manager','director','vp','c_level','founder']).optional(),
  function_area: z.string().max(80).optional(),
  industry: z.string().max(80).optional(),
  hq_country: z.string().max(80).optional(),
  hq_city: z.string().max(120).optional(),
  region: z.string().max(80).optional(),
  linkedin_url: z.string().url().max(500).optional(),
  source: z.enum(['manual','search','import','enrichment','signal','referral']).default('manual'),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  notes: z.string().max(4000).default(''),
});

export const LeadUpdateSchema = LeadCreateSchema.partial().extend({
  status: z.enum(['new','researching','contacted','engaged','qualified','opportunity','won','lost','unresponsive','disqualified']).optional(),
  saved: z.boolean().optional(),
  intent_score: z.number().int().min(0).max(100).optional(),
  fit_score: z.number().int().min(0).max(100).optional(),
});

export const ListCreateSchema = z.object({
  name: z.string().min(1).max(140),
  kind: z.enum(['static','smart','saved_search']).default('static'),
  query: z.record(z.string().max(80), z.unknown()).default({}),
  pinned: z.boolean().default(false),
});

export const SequenceCreateSchema = z.object({
  name: z.string().min(1).max(140),
  channel: z.enum(['email','linkedin','call','sms','mixed']).default('mixed'),
  goal: z.string().max(400).default(''),
  steps: z.array(z.object({
    day: z.number().int().min(0).max(180),
    channel: z.enum(['email','linkedin','call','sms']),
    subject: z.string().max(200).optional(),
    body: z.string().max(8000),
  })).max(20).default([]),
});

export const ActivityCreateSchema = z.object({
  lead_id: z.string().uuid(),
  sequence_id: z.string().uuid().optional(),
  step_index: z.number().int().min(0).max(50).default(0),
  channel: z.enum(['email','linkedin','call','sms','note','meeting']),
  subject: z.string().max(200).optional(),
  body: z.string().max(20000).optional(),
  scheduled_at: z.string().datetime().optional(),
  status: z.enum(['queued','sent','delivered','opened','replied','bounced','failed','completed','skipped']).default('queued'),
});

export const GoalCreateSchema = z.object({
  title: z.string().min(1).max(200),
  lead_id: z.string().uuid().optional(),
  account_company_id: z.string().uuid().optional(),
  cadence_days: z.number().int().min(1).max(365).default(30),
  next_touch_at: z.string().datetime().optional(),
  notes: z.string().max(2000).default(''),
});

export const SeatInviteSchema = z.object({
  workspace_id: z.string().uuid(),
  identity_id: z.string().uuid(),
  role: z.enum(['owner','admin','manager','member','viewer']).default('member'),
  monthly_credit_quota: z.number().int().min(0).max(100000).default(1000),
});

export const SignalCreateSchema = z.object({
  company_id: z.string().uuid(),
  kind: z.enum(['funding','hiring_surge','exec_change','tech_adoption','office_expansion',
                'layoffs','acquisition','partnership','product_launch','press_mention',
                'intent_score','geo_expansion']),
  severity: z.number().int().min(0).max(100).default(50),
  title: z.string().min(1).max(200),
  body: z.string().max(4000).default(''),
  source_url: z.string().url().max(500).optional(),
  source_label: z.string().max(140).optional(),
  expires_at: z.string().datetime().optional(),
  metadata: z.record(z.string().max(80), z.unknown()).default({}),
});
