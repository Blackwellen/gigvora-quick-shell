import { z } from 'zod';

export const REFUND_STATUS = z.enum([
  'draft','pending','approved','processing','succeeded','failed','rejected','reversed',
]);
export const REFUND_CATEGORY = z.enum([
  'duplicate','fraud','dispute','goodwill','service_failure','cancelled','partial',
]);
export const PROVIDER = z.enum(['stripe','paddle','wallet','manual']);
export const HOLD_REASON = z.enum(['kyc','risk_review','dispute','fraud','manual','compliance']);
export const HOLD_STATUS = z.enum(['active','released','expired']);

export const CreateRefundSchema = z.object({
  customerId:   z.string().uuid(),
  invoiceId:    z.string().uuid().optional(),
  paymentRef:   z.string().max(120).optional(),
  amountMinor:  z.number().int().positive().max(10_000_000),
  currency:     z.string().length(3).default('GBP'),
  reason:       z.string().min(3).max(500),
  category:     REFUND_CATEGORY.default('goodwill'),
  provider:     PROVIDER.default('stripe'),
  meta:         z.record(z.string(), z.any()).default({}),
});

export const TransitionRefundSchema = z.object({
  refundId: z.string().uuid(),
  to:       REFUND_STATUS,
  note:     z.string().max(2000).optional(),
});

export const ListRefundsSchema = z.object({
  status:     REFUND_STATUS.optional(),
  category:   REFUND_CATEGORY.optional(),
  provider:   PROVIDER.optional(),
  customerId: z.string().uuid().optional(),
  q:          z.string().max(120).optional(),
  page:       z.number().int().min(1).default(1),
  pageSize:   z.number().int().min(1).max(100).default(25),
});

export const CreateHoldSchema = z.object({
  ownerId:     z.string().uuid(),
  amountMinor: z.number().int().positive().max(100_000_000),
  currency:    z.string().length(3).default('GBP'),
  reason:      HOLD_REASON,
  expiresAt:   z.string().datetime().optional(),
  notes:       z.string().max(2000).optional(),
});
export const ReleaseHoldSchema = z.object({
  holdId: z.string().uuid(),
  note:   z.string().max(2000).optional(),
});

export const SetControlSchema = z.object({
  scope:      z.enum(['global','customer','plan','region']),
  scopeKey:   z.string().min(1).max(120).default('*'),
  controlKey: z.string().min(1).max(80).regex(/^[a-z][a-z0-9_]*$/),
  value:      z.record(z.string(), z.any()),
  enabled:    z.boolean().default(true),
});

// Deterministic state machine.
export const REFUND_TRANSITIONS: Record<string, string[]> = {
  draft:      ['pending','rejected'],
  pending:    ['approved','rejected'],
  approved:   ['processing','rejected'],
  processing: ['succeeded','failed'],
  succeeded:  ['reversed'],
  failed:     ['pending','rejected'],
  rejected:   [],
  reversed:   [],
};
