import { z } from 'zod';

export const PRICEBOOK_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'archived'], active: ['archived'], archived: ['active'],
};
export const PACKAGE_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'archived'], active: ['paused', 'archived'],
  paused: ['active', 'archived'], archived: ['active'],
};
export const PROMO_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'archived'], active: ['paused', 'expired', 'archived'],
  paused: ['active', 'expired', 'archived'],
  expired: ['archived'], archived: [],
};
export const QUOTE_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['accepted', 'expired', 'cancelled'],
  accepted: [], expired: [], cancelled: [],
};

const currency = z.string().length(3).regex(/^[A-Z]{3}$/);
const slug = z.string().min(2).max(60).regex(/^[a-z0-9][a-z0-9_-]*$/);
const promoCode = z.string().min(3).max(40).regex(/^[A-Z0-9][A-Z0-9_-]*$/);

export const PriceBookSchema = z.object({
  name: z.string().min(1).max(120),
  currency: currency.default('GBP'),
  isDefault: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const PriceEntrySchema = z.object({
  priceBookId: z.string().uuid(),
  sku: z.string().min(1).max(80),
  tier: z.enum(['standard','starter','pro','enterprise','custom']).default('standard'),
  unitMinor: z.number().int().min(0).max(100_000_000),
  currency: currency.default('GBP'),
  minQuantity: z.number().int().min(1).max(10_000).default(1),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const PackageSchema = z.object({
  slug, name: z.string().min(1).max(120),
  tier: z.enum(['standard','starter','pro','enterprise','custom']).default('standard'),
  priceMinor: z.number().int().min(0).max(100_000_000),
  currency: currency.default('GBP'),
  billingInterval: z.enum(['one_time','month','year']).default('one_time'),
  features: z.array(z.string().min(1).max(200)).max(30).default([]),
  highlight: z.boolean().default(false),
  position: z.number().int().min(0).max(100).default(0),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const PromotionSchema = z.object({
  code: promoCode,
  kind: z.enum(['percent','fixed','free_trial']),
  valueBps: z.number().int().min(0).max(10000).default(0),
  valueMinor: z.number().int().min(0).max(100_000_000).default(0),
  currency: currency.default('GBP'),
  appliesTo: z.enum(['any','package','sku','first_purchase']).default('any'),
  appliesToRefs: z.array(z.string().min(1).max(120)).max(50).default([]),
  maxRedemptions: z.number().int().min(1).max(1_000_000).optional(),
  perUserLimit: z.number().int().min(1).max(100).default(1),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  minSubtotalMinor: z.number().int().min(0).max(100_000_000).default(0),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict().refine((v) =>
  (v.kind === 'percent'  && v.valueBps   > 0 && v.valueMinor === 0) ||
  (v.kind === 'fixed'    && v.valueMinor > 0 && v.valueBps   === 0) ||
  (v.kind === 'free_trial'),
{ message: 'kind/value mismatch' });

export const QuoteLineSchema = z.object({
  packageId: z.string().uuid().optional(),
  sku: z.string().min(1).max(80).optional(),
  description: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(10_000),
  unitMinor: z.number().int().min(0).max(100_000_000),
}).strict();

export const QuoteCreateSchema = z.object({
  customerIdentityId: z.string().uuid().optional(),
  items: z.array(QuoteLineSchema).min(1).max(50),
  promoCode: promoCode.optional(),
  taxRateBps: z.number().int().min(0).max(5000).default(0),
  validForDays: z.number().int().min(1).max(180).default(30),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const StatusBody = z.object({ status: z.string() });

export const PreviewSchema = z.object({
  ownerIdentityId: z.string().uuid(),
  redeemedByIdentityId: z.string().uuid().optional(),
  subtotalMinor: z.number().int().min(0),
  currency: currency.default('GBP'),
  promoCode: promoCode.optional(),
  packageId: z.string().uuid().optional(),
  sku: z.string().min(1).max(80).optional(),
  taxRateBps: z.number().int().min(0).max(5000).default(0),
}).strict();

/** Compute promotion discount given a subtotal + promo row. */
export function applyPromoMath(subtotalMinor: number, promo: any): number {
  if (subtotalMinor < (promo.minSubtotalMinor ?? 0)) return 0;
  if (promo.kind === 'percent') {
    return Math.min(subtotalMinor, Math.round((subtotalMinor * (promo.valueBps ?? 0)) / 10_000));
  }
  if (promo.kind === 'fixed') {
    return Math.min(subtotalMinor, promo.valueMinor ?? 0);
  }
  return 0; // free_trial → no immediate cash discount
}
