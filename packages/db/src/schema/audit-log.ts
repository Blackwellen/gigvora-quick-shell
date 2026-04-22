/**
 * Domain — Audit Log (immutable record of every privileged action).
 * Owner: apps/api-nest/src/modules/audit-log/
 */
import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

export const auditLogEntries = pgTable('audit_log_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  actorIdentityId: uuid('actor_identity_id'),
  actorKind: text('actor_kind').notNull().default('user'), // user|system|api_key|webhook
  action: text('action').notNull(),                         // dotted: invoice.void, user.role.grant
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  reason: text('reason'),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  severity: text('severity').notNull().default('info'),     // info|notice|warning|critical
  prevHash: text('prev_hash'),                              // hash chain for tamper-evidence
  hash: text('hash').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogStreams = pgTable('audit_log_streams', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  destinationKind: text('destination_kind').notNull(),      // s3|gcs|http|datadog|splunk
  destinationConfig: jsonb('destination_config').notNull().default({}),
  active: integer('active').notNull().default(1),
  lastDeliveredAt: timestamp('last_delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
