import { z } from 'zod';

export const STOREFRONT_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'archived'], active: ['paused', 'archived'],
  paused: ['active', 'archived'], archived: ['active'],
};
export const PRODUCT_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'archived'], active: ['paused', 'archived'],
  paused: ['active', 'archived'], archived: ['active'],
};
export const TIER_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'archived'], active: ['archived'], archived: ['active'],
};
export const PLEDGE_TRANSITIONS: Record<string, string[]> = {
  active: ['paused', 'cancelled', 'past_due'],
  paused: ['active', 'cancelled'],
  past_due: ['active', 'cancelled'],
  cancelled: [],
};
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'failed', 'cancelled'],
  paid: ['fulfilled', 'refunded'],
  fulfilled: ['refunded'],
  refunded: [], failed: [], cancelled: [],
};
export const DONATION_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'failed'], paid: ['refunded'], refunded: [], failed: [],
};

const currency = z.string().length(3).regex(/^[A-Z]{3}$/);
const handle = z.string().min(3).max(40).regex(/^[a-z0-9][a-z0-9_-]*$/);

export const StorefrontSchema = z.object({
  handle, displayName: z.string().min(1).max(120),
  acceptDonations: z.boolean().optional(),
  acceptPatronage: z.boolean().optional(),
  currency: currency.default('GBP'),
  payoutAccountId: z.string().uuid().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const ProductSchema = z.object({
  kind: z.enum(['digital','physical','service','tip']),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).default(''),
  priceMinor: z.number().int().min(0).max(100_000_000),
  currency: currency.default('GBP'),
  taxCategory: z.enum(['standard','reduced','zero','exempt']).default('standard'),
  inventoryRemaining: z.number().int().min(0).max(1_000_000).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const TierSchema = z.object({
  name: z.string().min(1).max(80),
  monthlyPriceMinor: z.number().int().min(100).max(100_000_000),
  currency: currency.default('GBP'),
  perks: z.array(z.string().min(1).max(120)).max(20).default([]),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const PledgeCreateSchema = z.object({
  tierId: z.string().uuid(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const OrderLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
}).strict();

export const OrderCreateSchema = z.object({
  storefrontId: z.string().uuid(),
  items: z.array(OrderLineSchema).min(1).max(50),
  taxRegion: z.string().length(2).optional(),
  idempotencyKey: z.string().min(8).max(120),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const DonationCreateSchema = z.object({
  storefrontId: z.string().uuid(),
  amountMinor: z.number().int().min(100).max(100_000_000),
  currency: currency.default('GBP'),
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(false),
  donorDisplayName: z.string().max(80).optional(),
  idempotencyKey: z.string().min(8).max(120),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const StatusBody = z.object({ status: z.string() });
export const RefundBody = z.object({
  amountMinor: z.number().int().min(1),
  reason: z.string().min(3).max(500),
}).strict();

/**
 * Compute platform fee + VAT split.
 * Platform fee: 5% + 20p (per Domain 60/61 baseline).
 * VAT: applied per region (UK standard 20% = 2000 bps).
 */
export function computeOrderTotals(subtotalMinor: number, opts: { vatBps?: number } = {}) {
  const vatBps = opts.vatBps ?? 0;
  const taxMinor = Math.round((subtotalMinor * vatBps) / 10_000);
  const totalMinor = subtotalMinor + taxMinor;
  const feeMinor = Math.round(subtotalMinor * 0.05) + 20;
  const netToCreatorMinor = Math.max(0, subtotalMinor - feeMinor);
  return { taxMinor, totalMinor, feeMinor, netToCreatorMinor };
}
export function computeDonationFee(amountMinor: number) {
  const feeMinor = Math.round(amountMinor * 0.029) + 20;
  return { feeMinor, netMinor: Math.max(0, amountMinor - feeMinor) };
}
