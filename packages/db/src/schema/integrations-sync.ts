/**
 * Domain — Integrations Sync v2 (BYOK API keys, OAuth refresh, sync jobs).
 * Complements `integrations.ts` (provider registry + connection records).
 * Owner: apps/api-nest/src/modules/integrations-sync/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const integrationOauthTokens = pgTable('integration_oauth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  connectionId: uuid('connection_id').notNull(),
  accessTokenEncrypted: text('access_token_encrypted').notNull(),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  tokenType: text('token_type').notNull().default('Bearer'),
  scope: text('scope'),
  rotatedAt: timestamp('rotated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const integrationApiKeys = pgTable('integration_api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  connectionId: uuid('connection_id').notNull(),
  keyEncrypted: text('key_encrypted').notNull(),
  hint: text('hint'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const integrationSyncRuns = pgTable('integration_sync_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  connectionId: uuid('connection_id').notNull(),
  status: text('status').notNull().default('queued'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  recordsRead: integer('records_read').notNull().default(0),
  recordsWritten: integer('records_written').notNull().default(0),
  errorMessage: text('error_message'),
  meta: jsonb('meta').notNull().default({}),
});
