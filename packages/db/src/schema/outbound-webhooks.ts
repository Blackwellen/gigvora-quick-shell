/**
 * Domain — Outbound Webhooks.
 *
 * Lets tenants subscribe to platform events and receive HMAC-signed POSTs
 * to their own endpoints. Tracks deliveries, retries, signatures, and DLQ.
 *
 * Pairs with apps/webhook-gateway (signing + delivery) and apps/workers
 * (retry-with-backoff + DLQ replay).
 */
import { pgTable, uuid, text, integer, jsonb, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  url: text('url').notNull(),
  description: text('description').notNull().default(''),
  eventTypes: jsonb('event_types').notNull().default([]),  // ['feed.post.created', ...]
  signingSecretCiphertext: text('signing_secret_ciphertext').notNull(),
  signingKeyVersion: integer('signing_key_version').notNull().default(1),
  status: text('status').notNull().default('active'),   // active|paused|disabled
  rateLimitPerMin: integer('rate_limit_per_min').notNull().default(120),
  lastDeliveryAt: timestamp('last_delivery_at', { withTimezone: true }),
  lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
  lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tenantIdx: index('whe_tenant_idx').on(t.tenantId, t.status),
  ownerIdx: index('whe_owner_idx').on(t.ownerIdentityId),
  uniqUrl: uniqueIndex('whe_tenant_url_idx').on(t.tenantId, t.url),
  statusCheck: sql`CHECK (status IN ('active','paused','disabled'))`,
}));

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  endpointId: uuid('endpoint_id').notNull(),
  eventId: uuid('event_id').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull().default({}),
  signature: text('signature').notNull(),
  signatureKeyVersion: integer('signature_key_version').notNull(),
  attempt: integer('attempt').notNull().default(1),
  maxAttempts: integer('max_attempts').notNull().default(8),
  status: text('status').notNull().default('pending'),  // pending|in_flight|success|failed|dead_letter
  responseStatus: integer('response_status'),
  responseHeaders: jsonb('response_headers').notNull().default({}),
  responseBodyExcerpt: text('response_body_excerpt'),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull().defaultNow(),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMs: integer('duration_ms'),
  error: text('error'),
}, (t) => ({
  endpointTimeIdx: index('whd_endpoint_time_idx').on(t.endpointId, t.scheduledFor),
  statusIdx: index('whd_status_idx').on(t.status, t.scheduledFor),
  eventIdx: index('whd_event_idx').on(t.eventId),
  statusCheck: sql`CHECK (status IN ('pending','in_flight','success','failed','dead_letter'))`,
  attemptCheck: sql`CHECK (attempt >= 1 AND attempt <= max_attempts)`,
}));

export const webhookEventTypes = pgTable('webhook_event_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  domain: text('domain').notNull(),
  description: text('description').notNull().default(''),
  schema: jsonb('schema').notNull().default({}),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqSlug: uniqueIndex('whet_slug_idx').on(t.slug),
  domainIdx: index('whet_domain_idx').on(t.domain),
}));

export const webhookDeadLetters = pgTable('webhook_dead_letters', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliveryId: uuid('delivery_id').notNull(),
  endpointId: uuid('endpoint_id').notNull(),
  movedAt: timestamp('moved_at', { withTimezone: true }).notNull().defaultNow(),
  reason: text('reason').notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  replayedDeliveryId: uuid('replayed_delivery_id'),
}, (t) => ({
  endpointDeadIdx: index('whdl_endpoint_idx').on(t.endpointId, t.movedAt),
  uniqDelivery: uniqueIndex('whdl_delivery_idx').on(t.deliveryId),
}));

export type WebhookEndpointRow = typeof webhookEndpoints.$inferSelect;
export type WebhookDeliveryRow = typeof webhookDeliveries.$inferSelect;
export type WebhookEventTypeRow = typeof webhookEventTypes.$inferSelect;
export type WebhookDeadLetterRow = typeof webhookDeadLetters.$inferSelect;
