import { z } from 'zod';

export const PayoutStatusEnum  = z.enum(['pending','processing','paid','failed','cancelled']);
export const EscrowStatusEnum  = z.enum(['held','released','refunded','disputed','partially_released']);
export const HoldStatusEnum    = z.enum(['open','released','escalated','converted_to_dispute']);
export const DisputeStatusEnum = z.enum(['opened','under_review','resolved','rejected']);
export type PayoutStatus  = z.infer<typeof PayoutStatusEnum>;
export type EscrowStatus  = z.infer<typeof EscrowStatusEnum>;
export type HoldStatus    = z.infer<typeof HoldStatusEnum>;
export type DisputeStatus = z.infer<typeof DisputeStatusEnum>;

export const PAYOUT_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  pending:    ['processing','cancelled'],
  processing: ['paid','failed'],
  failed:     ['processing','cancelled'],
  paid:       [],
  cancelled:  [],
};
export const ESCROW_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  held:               ['released','refunded','disputed','partially_released'],
  partially_released: ['released','refunded','disputed'],
  disputed:           ['released','refunded'],
  released:           [],
  refunded:           [],
};
export const HOLD_TRANSITIONS: Record<HoldStatus, HoldStatus[]> = {
  open:                  ['released','escalated','converted_to_dispute'],
  escalated:             ['released','converted_to_dispute'],
  released:              [],
  converted_to_dispute:  [],
};
export const DISPUTE_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  opened:        ['under_review','rejected'],
  under_review:  ['resolved','rejected'],
  resolved:      [],
  rejected:      [],
};

export const PayoutAccountSchema = z.object({
  rail: z.enum(['bank','stripe_connect','paypal','wise','crypto']),
  currency: z.string().length(3).default('GBP'),
  countryCode: z.string().length(2).default('GB'),
  externalAccountId: z.string().min(2).max(120),
  displayName: z.string().min(1).max(200),
  isDefault: z.boolean().optional(),
});

export const InitiatePayoutSchema = z.object({
  accountId: z.string().uuid(),
  amountMinor: z.number().int().min(50).max(1_000_000_00),
  feeMinor: z.number().int().min(0).max(1_000_000_00).default(0),
  currency: z.string().length(3).default('GBP'),
  externalProvider: z.string().min(2).max(40).optional(),
  meta: z.record(z.string(), z.any()).optional(),
}).superRefine((v, ctx) => {
  if (v.feeMinor > v.amountMinor) ctx.addIssue({ code: 'custom', path: ['feeMinor'], message: 'fee exceeds amount' });
});

export const TransitionPayoutSchema = z.object({
  status: PayoutStatusEnum,
  reason: z.string().max(500).optional(),
  externalRef: z.string().max(200).optional(),
}).superRefine((v, ctx) => {
  if (v.status === 'failed' && !v.reason) ctx.addIssue({ code: 'custom', path: ['reason'], message: 'failed requires a reason' });
  if (v.status === 'cancelled' && !v.reason) ctx.addIssue({ code: 'custom', path: ['reason'], message: 'cancelled requires a reason' });
});

export const PayoutScheduleSchema = z.object({
  cadence: z.enum(['manual','daily','weekly','monthly']),
  minAmountMinor: z.number().int().min(0).max(1_000_000_00),
  defaultAccountId: z.string().uuid().optional(),
});

export const HoldEscrowSchema = z.object({
  payeeIdentityId: z.string().uuid(),
  contextType: z.enum(['project','gig','service','booking','award']),
  contextId: z.string().uuid(),
  amountMinor: z.number().int().min(50).max(1_000_000_00),
  currency: z.string().length(3).default('GBP'),
  externalProvider: z.string().min(2).max(40).optional(),
});
export const ReleaseEscrowSchema = z.object({
  amountMinor: z.number().int().min(1).max(1_000_000_00),
  reason: z.string().max(500).optional(),
});
export const RefundEscrowSchema = z.object({
  amountMinor: z.number().int().min(1).max(1_000_000_00),
  reason: z.string().min(1).max(500),
});

export const OpenHoldSchema = z.object({
  subjectType: z.enum(['payout','escrow','invoice','account']),
  subjectId: z.string().uuid(),
  ownerIdentityId: z.string().uuid(),
  reasonCode: z.enum(['risk_review','kyc_pending','provider_block','dispute','manual','chargeback_risk','sanctions']),
  reasonDetail: z.string().max(500).optional(),
  amountMinor: z.number().int().min(0).max(1_000_000_00).default(0),
  currency: z.string().length(3).default('GBP'),
});
export const TransitionHoldSchema = z.object({
  status: HoldStatusEnum,
  reason: z.string().max(500).optional(),
}).superRefine((v, ctx) => {
  if (v.status !== 'released' && !v.reason) ctx.addIssue({ code: 'custom', path: ['reason'], message: `${v.status} requires a reason` });
});

export const OpenDisputeSchema = z.object({
  escrowId: z.string().uuid().optional(),
  payoutId: z.string().uuid().optional(),
  amountMinor: z.number().int().min(1).max(1_000_000_00),
  reason: z.string().min(1).max(500),
  evidenceUrl: z.string().url().max(500).optional(),
}).superRefine((v, ctx) => {
  if (!v.escrowId && !v.payoutId) ctx.addIssue({ code: 'custom', path: ['escrowId'], message: 'escrowId or payoutId required' });
});
export const TransitionDisputeSchema = z.object({
  status: DisputeStatusEnum,
  resolution: z.string().max(1000).optional(),
}).superRefine((v, ctx) => {
  if ((v.status === 'resolved' || v.status === 'rejected') && !v.resolution) {
    ctx.addIssue({ code: 'custom', path: ['resolution'], message: `${v.status} requires a resolution` });
  }
});

export const ListPayoutsQuerySchema = z.object({
  status: PayoutStatusEnum.optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const ReconcileSchema = z.object({
  provider: z.string().min(2).max(40),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export const WebhookEventSchema = z.object({
  id: z.string().min(1).max(200),
  type: z.string().min(1).max(120),
  data: z.record(z.string(), z.any()),
});
