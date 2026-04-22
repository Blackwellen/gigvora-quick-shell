import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Append-only audit log for every state-changing action across every domain.
 * Required by the Enterprise Build Standard.
 */
export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id'),
    domain: text('domain').notNull(), // 'feed' | 'network' | 'profiles' | 'companies' | …
    action: text('action').notNull(), // 'company.update', 'connection.accept', …
    targetType: text('target_type'),
    targetId: text('target_id'),
    diff: jsonb('diff').$type<Record<string, unknown> | null>(),
    requestId: text('request_id'),
    ip: text('ip'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byTarget: index('audit_target_idx').on(t.targetType, t.targetId, t.occurredAt),
    byActor: index('audit_actor_idx').on(t.actorId, t.occurredAt),
    byDomain: index('audit_domain_idx').on(t.domain, t.occurredAt),
  }),
);

export type AuditEventRow = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
