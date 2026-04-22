/**
 * Domain — Integrations (BYOK + OAuth + first-party providers).
 *
 * Owns the per-identity / per-org connection records to external systems
 * (Stripe, GitHub, Google, Slack, OpenAI, Anthropic, Salesforce, …).
 * Stores ENCRYPTED credentials at the application layer — the DB never
 * holds plaintext keys; `secret_ciphertext` is sealed with the platform KMS.
 */
import { pgTable, uuid, text, jsonb, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const integrationProviders = pgTable('integration_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),                       // 'stripe'|'github'|'openai'|...
  displayName: text('display_name').notNull(),
  category: text('category').notNull(),               // ai|payments|crm|comms|storage|analytics|hr|other
  authKind: text('auth_kind').notNull(),              // oauth2|apikey|webhook|hmac
  scopes: jsonb('scopes').notNull().default([]),
  iconUrl: text('icon_url'),
  docsUrl: text('docs_url'),
  enabled: boolean('enabled').notNull().default(true),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqSlug: uniqueIndex('intp_slug_idx').on(t.slug),
  categoryCheck: sql`CHECK (category IN ('ai','payments','crm','comms','storage','analytics','hr','other'))`,
  authCheck: sql`CHECK (auth_kind IN ('oauth2','apikey','webhook','hmac'))`,
}));

export const integrationConnections = pgTable('integration_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  ownerOrgId: uuid('owner_org_id'),                   // null = personal
  providerId: uuid('provider_id').notNull(),
  label: text('label').notNull(),
  status: text('status').notNull().default('connected'), // connected|expired|revoked|error
  externalAccountId: text('external_account_id'),
  scopesGranted: jsonb('scopes_granted').notNull().default([]),
  secretCiphertext: text('secret_ciphertext'),        // KMS-sealed
  secretKmsKeyId: text('secret_kms_key_id'),
  refreshTokenCiphertext: text('refresh_token_ciphertext'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  lastErrorAt: timestamp('last_error_at', { withTimezone: true }),
  lastErrorMessage: text('last_error_message'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ownerIdx: index('intc_owner_idx').on(t.tenantId, t.ownerIdentityId, t.status),
  orgIdx: index('intc_org_idx').on(t.ownerOrgId, t.providerId),
  uniqAccount: uniqueIndex('intc_unique_account_idx').on(t.providerId, t.ownerIdentityId, t.externalAccountId),
  statusCheck: sql`CHECK (status IN ('connected','expired','revoked','error'))`,
}));

export const integrationEvents = pgTable('integration_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  connectionId: uuid('connection_id').notNull(),
  kind: text('kind').notNull(),                       // connected|refreshed|revoked|error|invoked
  payload: jsonb('payload').notNull().default({}),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  connEventIdx: index('inte_conn_idx').on(t.connectionId, t.occurredAt),
}));

export const integrationUsageDaily = pgTable('integration_usage_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  connectionId: uuid('connection_id').notNull(),
  day: timestamp('day', { withTimezone: true }).notNull(),
  callCount: jsonb('call_count').notNull().default({}),  // {endpoint: count}
  errorCount: jsonb('error_count').notNull().default({}),
  bytesIn: jsonb('bytes_in').notNull().default(0 as any),
  bytesOut: jsonb('bytes_out').notNull().default(0 as any),
}, (t) => ({
  uniqDay: uniqueIndex('intu_day_idx').on(t.connectionId, t.day),
}));

export type IntegrationProviderRow = typeof integrationProviders.$inferSelect;
export type IntegrationConnectionRow = typeof integrationConnections.$inferSelect;
export type IntegrationEventRow = typeof integrationEvents.$inferSelect;
