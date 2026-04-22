import { z } from 'zod';

export const ROLE = z.enum(['operator','moderator','finance','trust_safety','super_admin']);
export const STATUS = z.enum(['active','paused','archived']);
export const RISK = z.enum(['low','medium','high','critical']);
export const HEALTH = z.enum(['healthy','caution','degraded','blocked']);
export const ITEM_STATE = z.enum(['pending','active','escalated','blocked','completed','failed','refunded','archived']);
export const PRIORITY = z.enum(['low','normal','high','urgent']);

export const WorkspaceSchema = z.object({
  slug: z.string().min(2).max(40).regex(/^[a-z][a-z0-9_-]{1,40}$/),
  label: z.string().min(1).max(80),
  description: z.string().max(500).default(''),
  icon: z.string().max(40).default('shield'),
  route: z.string().regex(/^\/internal\/[a-z0-9_/-]+$/),
  requiredRole: ROLE.default('operator'),
  riskBand: RISK.default('low'),
  status: STATUS.default('active'),
  position: z.number().int().min(0).max(999).default(0),
  meta: z.record(z.string(), z.any()).default({}),
});

export const QueueSchema = z.object({
  workspaceSlug: z.string().min(2).max(40).optional(),
  slug: z.string().min(2).max(40).regex(/^[a-z][a-z0-9_-]{1,40}$/),
  label: z.string().min(1).max(80),
  domain: z.enum(['disputes','moderation','verification','tickets','withdrawals','ads','trust_safety','finance','reports','overrides','other']),
  status: STATUS.default('active'),
  slaMinutes: z.number().int().min(1).max(10080).default(60),
});

export const QueueItemSchema = z.object({
  queueSlug: z.string().min(2).max(40),
  reference: z.string().min(1).max(120),
  subject: z.string().max(280).default(''),
  priority: PRIORITY.default('normal'),
  dueAt: z.string().datetime().optional(),
  payload: z.record(z.string(), z.any()).default({}),
});

export const QueueJumpSchema = z.object({
  workspaceSlug: z.string().min(2).max(40).optional(),
  domain: z.string().max(40).optional(),
  priority: PRIORITY.optional(),
});

export const QueueItemTransitionSchema = z.object({
  itemId: z.string().uuid(),
  to: ITEM_STATE,
  note: z.string().max(500).optional(),
});

export const ShortcutSchema = z.object({
  combo: z.string().min(1).max(20),
  label: z.string().min(1).max(80),
  action: z.enum(['navigate','open_drawer','toggle_command','queue_jump','custom']),
  payload: z.record(z.string(), z.any()).default({}),
  scope: z.enum(['global','workspace','queue']).default('global'),
  requiredRole: ROLE.default('operator'),
  enabled: z.boolean().default(true),
});

// Allowed item-state transitions for queue items.
export const ITEM_STATE_TRANSITIONS: Record<string, string[]> = {
  pending:    ['active','escalated','blocked','archived'],
  active:     ['completed','failed','escalated','blocked'],
  escalated:  ['active','completed','failed','refunded','blocked'],
  blocked:    ['active','escalated','archived'],
  failed:     ['active','refunded','archived'],
  completed:  ['refunded','archived'],
  refunded:   ['archived'],
  archived:   [],
};
