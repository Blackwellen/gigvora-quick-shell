import { z } from 'zod';

export const InvoiceStatusEnum = z.enum(['draft','open','partially_paid','paid','void','uncollectible','refunded','partially_refunded']);
export const SubStatusEnum    = z.enum(['trialing','active','past_due','paused','cancelled','incomplete']);
export const DisputeStatusEnum = z.enum(['opened','under_review','won','lost','accepted']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;
export type SubStatus     = z.infer<typeof SubStatusEnum>;
export type DisputeStatus = z.infer<typeof DisputeStatusEnum>;

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft:              ['open', 'void'],
  open:               ['partially_paid', 'paid', 'void', 'uncollectible'],
  partially_paid:     ['paid', 'void', 'uncollectible'],
  paid:               ['refunded', 'partially_refunded'],
  partially_refunded: ['refunded'],
  void:               [],
  uncollectible:      [],
  refunded:           [],
};
export const SUB_TRANSITIONS: Record<SubStatus, SubStatus[]> = {
  trialing:   ['active','cancelled','incomplete'],
  active:     ['past_due','paused','cancelled'],
  past_due:   ['active','cancelled'],
  paused:     ['active','cancelled'],
  cancelled:  [],
  incomplete: ['active','cancelled'],
};
export const DISPUTE_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  opened:       ['under_review','accepted'],
  under_review: ['won','lost','accepted'],
  won:          [],
  lost:         [],
  accepted:     [],
};

export const CommercialProfileSchema = z.object({
  legalName: z.string().min(1).max(200),
  tradingName: z.string().max(200).optional(),
  taxId: z.string().max(64).optional(),
  taxScheme: z.string().min(2).max(40).default('GB-VAT'),
  defaultCurrency: z.string().length(3).default('GBP'),
  billingEmail: z.string().email().max(200),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  region: z.string().max(120).optional(),
  postalCode: z.string().min(2).max(20),
  country: z.string().length(2).default('GB'),
  invoicePrefix: z.string().min(1).max(12).default('INV'),
  paymentTermsDays: z.number().int().min(0).max(365).default(14),
});

export const TaxRateSchema = z.object({
  jurisdiction: z.string().min(2).max(16),
  category: z.enum(['standard','reduced','zero','exempt','reverse_charge']).default('standard'),
  rateBp: z.number().int().min(0).max(10_000),
  appliesFrom: z.string().datetime().optional(),
  appliesTo: z.string().datetime().optional(),
});

export const InvoiceLineSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0.0001).max(1_000_000),
  unitPriceMinor: z.number().int().min(0).max(1_000_000_00),
  taxRateBp: z.number().int().min(0).max(10_000).default(0),
  meta: z.record(z.string(), z.any()).optional(),
});

export const ListInvoicesQuerySchema = z.object({
  status: InvoiceStatusEnum.optional(),
  customerIdentityId: z.string().uuid().optional(),
  search: z.string().max(120).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const CreateInvoiceSchema = z.object({
  customerIdentityId: z.string().uuid().optional(),
  customerEmail: z.string().email().max(200),
  customerName: z.string().min(1).max(200),
  currency: z.string().length(3).default('GBP'),
  taxJurisdiction: z.string().min(2).max(16).optional(),
  reverseCharge: z.boolean().default(false),
  poNumber: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  lines: z.array(InvoiceLineSchema).min(1).max(200),
  subscriptionId: z.string().uuid().optional(),
});
export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();
export const TransitionInvoiceSchema = z.object({ status: InvoiceStatusEnum, reason: z.string().max(500).optional() }).superRefine((v, ctx) => {
  if ((v.status === 'void' || v.status === 'uncollectible') && !v.reason) {
    ctx.addIssue({ code: 'custom', path: ['reason'], message: `${v.status} requires a reason` });
  }
});
export const RecordPaymentSchema = z.object({
  amountMinor: z.number().int().min(1).max(1_000_000_00),
  provider: z.string().min(2).max(40).default('stripe'),
  providerRef: z.string().max(200).optional(),
  paidAt: z.string().datetime().optional(),
});
export const RefundInvoiceSchema = z.object({
  amountMinor: z.number().int().min(1).max(1_000_000_00),
  reason: z.string().min(1).max(500),
});

export const CreateSubscriptionSchema = z.object({
  customerIdentityId: z.string().uuid(),
  productKey: z.string().min(2).max(80),
  planName: z.string().min(1).max(200),
  amountMinor: z.number().int().min(0).max(1_000_000_00),
  currency: z.string().length(3).default('GBP'),
  interval: z.enum(['day','week','month','year']).default('month'),
  intervalCount: z.number().int().min(1).max(12).default(1),
  trialDays: z.number().int().min(0).max(365).default(0),
});
export const TransitionSubSchema = z.object({ status: SubStatusEnum, reason: z.string().max(500).optional() });

export const OpenDisputeSchema = z.object({
  invoiceId: z.string().uuid(),
  amountMinor: z.number().int().min(1).max(1_000_000_00),
  reason: z.string().min(1).max(500),
  evidenceUrl: z.string().url().max(500).optional(),
});
export const TransitionDisputeSchema = z.object({ status: DisputeStatusEnum, reason: z.string().max(500).optional() });

export const ComputeTaxSchema = z.object({
  jurisdiction: z.string().min(2).max(16),
  category: z.enum(['standard','reduced','zero','exempt','reverse_charge']).default('standard'),
  subtotalMinor: z.number().int().min(0).max(1_000_000_00),
  reverseCharge: z.boolean().default(false),
});

export const WebhookEventSchema = z.object({
  id: z.string().min(1).max(200),
  type: z.string().min(1).max(120),
  data: z.record(z.string(), z.any()),
});
