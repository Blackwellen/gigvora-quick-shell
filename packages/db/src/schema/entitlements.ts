/**
 * Domain — Entitlements (plans, role grants, subscriptions, denials).
 *
 * Drives every PlanUpgradeDrawer / EntitlementGate in the UI. The runtime
 * checks `entitlement_grants` (effective rows) before exposing gated UI.
 */
import { pgTable, uuid, text, integer, jsonb, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),                      // free|pro|team|enterprise
  displayName: text('display_name').notNull(),
  tier: integer('tier').notNull().default(0),
  priceCents: integer('price_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  interval: text('interval').notNull().default('month'), // month|year|once
  features: jsonb('features').notNull().default([]),     // [{key, limit}]
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqSlug: uniqueIndex('plans_slug_idx').on(t.slug),
  intervalCheck: sql`CHECK (interval IN ('month','year','once'))`,
  tierCheck: sql`CHECK (tier >= 0)`,
}));

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  identityId: uuid('identity_id'),
  orgId: uuid('org_id'),
  planId: uuid('plan_id').notNull(),
  status: text('status').notNull().default('active'),  // trialing|active|past_due|cancelled|expired
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull().defaultNow(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  externalProvider: text('external_provider'),         // stripe|paddle|manual
  externalSubscriptionId: text('external_subscription_id'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byHolder: index('subs_holder_idx').on(t.tenantId, t.identityId, t.orgId, t.status),
  byPlan: index('subs_plan_idx').on(t.planId, t.status),
  uniqExternal: uniqueIndex('subs_external_idx').on(t.externalProvider, t.externalSubscriptionId),
  statusCheck: sql`CHECK (status IN ('trialing','active','past_due','cancelled','expired'))`,
  scopeCheck: sql`CHECK (identity_id IS NOT NULL OR org_id IS NOT NULL)`,
}));

export const roleGrants = pgTable('role_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  orgId: uuid('org_id'),                              // null = tenant-wide
  role: text('role').notNull(),                       // user|professional|enterprise|recruiter|admin|moderator|trust_safety
  grantedById: uuid('granted_by_id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqGrant: uniqueIndex('rg_unique_idx').on(t.tenantId, t.identityId, t.orgId, t.role),
  byIdentity: index('rg_identity_idx').on(t.identityId, t.role),
  roleCheck: sql`CHECK (role IN ('user','professional','enterprise','recruiter','admin','moderator','trust_safety'))`,
}));

export const entitlementGrants = pgTable('entitlement_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  identityId: uuid('identity_id'),
  orgId: uuid('org_id'),
  featureKey: text('feature_key').notNull(),          // 'recruiter_pro.boolean_search'
  source: text('source').notNull().default('plan'),   // plan|trial|grant|admin_override
  sourceRefId: uuid('source_ref_id'),
  numericLimit: integer('numeric_limit'),             // e.g. seats, monthly quota
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byHolder: index('eg_holder_idx').on(t.tenantId, t.identityId, t.orgId, t.featureKey),
  byFeature: index('eg_feature_idx').on(t.featureKey),
  sourceCheck: sql`CHECK (source IN ('plan','trial','grant','admin_override'))`,
  scopeCheck: sql`CHECK (identity_id IS NOT NULL OR org_id IS NOT NULL)`,
}));

export const entitlementDenials = pgTable('entitlement_denials', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  featureKey: text('feature_key').notNull(),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
  surfacedDrawer: boolean('surfaced_drawer').notNull().default(true),
  context: jsonb('context').notNull().default({}),
}, (t) => ({
  byIdentity: index('ed_identity_idx').on(t.identityId, t.attemptedAt),
  byFeature: index('ed_feature_idx').on(t.featureKey, t.attemptedAt),
}));

export type PlanRow = typeof plans.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type RoleGrantRow = typeof roleGrants.$inferSelect;
export type EntitlementGrantRow = typeof entitlementGrants.$inferSelect;
export type EntitlementDenialRow = typeof entitlementDenials.$inferSelect;
