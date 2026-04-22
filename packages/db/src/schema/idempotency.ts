import { pgTable, text, jsonb, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core';

/**
 * Idempotency key store. POST handlers that may be retried look up by
 * (actor_id, scope, key). If a row exists with the same request_hash we
 * return the cached response; otherwise we insert and run the handler.
 */
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    actorId: text('actor_id').notNull(),
    scope: text('scope').notNull(),         // e.g. 'companies.create'
    key: text('key').notNull(),
    requestHash: text('request_hash').notNull(),
    responseStatus: integer('response_status').notNull(),
    responseBody: jsonb('response_body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // TTL is enforced by a daily job; the column is informational here.
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.actorId, t.scope, t.key] }) }),
);

export type IdempotencyRow = typeof idempotencyKeys.$inferSelect;
