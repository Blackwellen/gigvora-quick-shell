import { z } from 'zod';

export const PackageStatusEnum = z.enum(['draft', 'active', 'paused', 'archived']);
export const PackageKindEnum = z.enum(['credits', 'subscription', 'one_time', 'service_pack']);
export const PurchaseStatusEnum = z.enum(['pending', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded']);
export const PayoutStatusEnum = z.enum(['pending', 'processing', 'paid', 'failed']);
export const LedgerKindEnum = z.enum(['purchase', 'refund', 'credit_grant', 'credit_spend', 'payout', 'payout_reversal', 'hold', 'release', 'adjustment']);

export type PackageStatus = z.infer<typeof PackageStatusEnum>;
export type PurchaseStatus = z.infer<typeof PurchaseStatusEnum>;

export const PACKAGE_TRANSITIONS: Record<PackageStatus, PackageStatus[]> = {
  draft:    ['active', 'archived'],
  active:   ['paused', 'archived'],
  paused:   ['active', 'archived'],
  archived: [],
};

export const PURCHASE_TRANSITIONS: Record<PurchaseStatus, PurchaseStatus[]> = {
  pending:            ['succeeded', 'failed', 'cancelled'],
  succeeded:          ['refunded', 'partially_refunded'],
  partially_refunded: ['refunded'],
  failed:             [],
  cancelled:          [],
  refunded:           [],
};

export const ListPackagesQuerySchema = z.object({
  status: PackageStatusEnum.optional(),
  kind: PackageKindEnum.optional(),
  search: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export const CreatePackageSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  kind: PackageKindEnum.default('credits'),
  priceMinor: z.number().int().min(0).max(1_000_000_00),
  currency: z.string().length(3).default('GBP'),
  creditsGranted: z.number().int().min(0).max(1_000_000).default(0),
  billingInterval: z.enum(['month', 'year']).optional(),
  trialDays: z.number().int().min(0).max(365).default(0),
  vatRateBp: z.number().int().min(0).max(10000).default(2000),
  features: z.array(z.string().min(1).max(120)).max(40).default([]),
}).superRefine((val, ctx) => {
  if (val.kind === 'subscription' && !val.billingInterval) {
    ctx.addIssue({ code: 'custom', path: ['billingInterval'], message: 'subscription packages require a billingInterval' });
  }
});
export const UpdatePackageSchema = CreatePackageSchema.partial();
export const TransitionPackageSchema = z.object({ status: PackageStatusEnum });

export const ListPurchasesQuerySchema = z.object({
  status: PurchaseStatusEnum.optional(),
  buyerIdentityId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export const CreatePurchaseSchema = z.object({
  packageId: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(120),
  currency: z.string().length(3).optional(),
});
export const ConfirmPurchaseSchema = z.object({
  providerRef: z.string().min(4).max(200),
  receiptUrl: z.string().url().max(500).optional(),
});
export const FailPurchaseSchema = z.object({
  reason: z.string().min(1).max(500),
});
export const RefundPurchaseSchema = z.object({
  amountMinor: z.number().int().min(1).max(1_000_000_00),
  reason: z.string().min(1).max(500),
});

export const SpendCreditsSchema = z.object({
  amount: z.number().int().min(1).max(1_000_000),
  reference: z.string().min(1).max(200),
  meta: z.record(z.string(), z.any()).optional(),
});
export const GrantCreditsSchema = z.object({
  ownerIdentityId: z.string().uuid(),
  amount: z.number().int().min(1).max(1_000_000),
  reason: z.string().min(1).max(500),
});

export const CreatePayoutSchema = z.object({
  amountMinor: z.number().int().min(1).max(1_000_000_00),
  currency: z.string().length(3).default('GBP'),
  scheduledFor: z.string().datetime().optional(),
});

export const WebhookEventSchema = z.object({
  id: z.string().min(1).max(200),
  type: z.string().min(1).max(120),
  data: z.record(z.string(), z.any()),
});
