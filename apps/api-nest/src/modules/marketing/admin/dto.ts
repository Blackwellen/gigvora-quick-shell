import { z } from 'zod';

export const ListSchema = z.object({
  q:        z.string().max(120).optional(),
  status:   z.string().max(40).optional(),
  risk:     z.string().max(20).optional(),
  page:     z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
});

export const AdsDecisionSchema = z.object({
  ids:    z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(['approve','reject','flag','needs_changes']),
  reason: z.string().min(4).max(2000),
});

export const ScoreCreativeSchema = z.object({
  id:          z.string().uuid().optional(),
  advertiser:  z.string().min(1).max(200),
  title:       z.string().min(1).max(300),
  description: z.string().max(4000).optional(),
  landingUrl:  z.string().url().optional(),
  format:      z.enum(['image','video','text']).default('image'),
  audience:    z.string().max(300).optional(),
  placement:   z.string().max(120).optional(),
  budgetCents: z.number().int().min(0).default(0),
  currency:    z.string().length(3).default('GBP'),
  meta:        z.record(z.string(), z.any()).default({}),
});

export const TrafficWindowSchema = z.object({
  windowHours: z.number().int().min(1).max(168).default(24),
  source:      z.string().max(40).optional(),
  country:     z.string().max(80).optional(),
});

export const IpActionSchema = z.object({
  ips:    z.array(z.string().min(7).max(45)).min(1).max(200),
  action: z.enum(['watch','block','clear']),
  note:   z.string().max(2000).optional(),
});

export const TaskCreateSchema = z.object({
  title:      z.string().min(2).max(240),
  detail:     z.string().max(4000).optional(),
  assigneeId: z.string().uuid().optional(),
  campaignRef: z.string().max(120).optional(),
  priority:   z.enum(['low','normal','high','urgent']).default('normal'),
  dueAt:      z.string().datetime().optional(),
});
export const TaskUpdateSchema = z.object({
  taskId: z.string().uuid(),
  patch:  z.object({
    title:      z.string().min(2).max(240).optional(),
    detail:     z.string().max(4000).optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    priority:   z.enum(['low','normal','high','urgent']).optional(),
    status:     z.enum(['open','in_progress','blocked','done','cancelled']).optional(),
    dueAt:      z.string().datetime().nullable().optional(),
  }),
});

export const NoticeUpsertSchema = z.object({
  id:        z.string().uuid().optional(),
  title:     z.string().min(2).max(240),
  body:      z.string().min(2).max(8000),
  audience:  z.enum(['public','operators','advertisers','partners']).default('public'),
  severity:  z.enum(['info','warning','critical']).default('info'),
  status:    z.enum(['draft','published','expired','retracted']).default('draft'),
  expiresAt: z.string().datetime().optional(),
});

export const ThreadPostSchema = z.object({
  threadId: z.string().uuid().optional(),
  title:    z.string().max(240).optional(),
  body:     z.string().min(1).max(8000),
});
