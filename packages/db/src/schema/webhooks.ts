/**
 * Domain — Outbound Webhooks (subscriptions, deliveries, signing secrets).
 * Owner: apps/api-nest/src/modules/webhooks/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  events: jsonb('events').$type<string[]>().notNull().default([]),
  secret: text('secret').notNull(),                          // HMAC signing key
  active: boolean('active').notNull().default(true),
  apiVersion: text('api_version').notNull().default('2025-01-01'),
  failureCount: integer('failure_count').notNull().default(0),
  lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
  lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  endpointId: uuid('endpoint_id').notNull(),
  eventId: uuid('event_id').notNull(),
  eventName: text('event_name').notNull(),
  status: text('status').notNull().default('pending'),       // pending|succeeded|failed|abandoned
  attemptCount: integer('attempt_count').notNull().default(0),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  requestBody: jsonb('request_body').notNull(),
  signatureHeader: text('signature_header'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull().defaultNow(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
});

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  eventName: text('event_name').notNull(),
  payload: jsonb('payload').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});
