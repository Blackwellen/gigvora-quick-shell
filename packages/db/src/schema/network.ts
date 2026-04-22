import { pgTable, uuid, text, timestamp, integer, index, primaryKey, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/** Domain 10 — Network. Connections are stored once with canonical (lo, hi) ordering. */
export const connectionRequests = pgTable(
  'connection_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromId: uuid('from_id').notNull(),
    toId: uuid('to_id').notNull(),
    note: text('note'),
    /** 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired' */
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
  },
  (t) => ({
    byTo: index('cr_to_idx').on(t.toId, t.status, t.createdAt),
    byFrom: index('cr_from_idx').on(t.fromId, t.status, t.createdAt),
    notSelf: check('cr_not_self', sql`${t.fromId} <> ${t.toId}`),
  }),
);

export const connections = pgTable(
  'connections',
  {
    /** lo < hi enforced by trigger / app code. */
    loId: uuid('lo_id').notNull(),
    hiId: uuid('hi_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.loId, t.hiId] }),
    canonical: check('conn_canonical', sql`${t.loId} < ${t.hiId}`),
  }),
);

export const userBlocks = pgTable(
  'user_blocks',
  {
    actorId: uuid('actor_id').notNull(),
    targetId: uuid('target_id').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.actorId, t.targetId] }),
    notSelf: check('block_not_self', sql`${t.actorId} <> ${t.targetId}`),
  }),
);

export const networkEdges = pgTable(
  'network_edges',
  {
    identityId: uuid('identity_id').notNull(),
    peerId: uuid('peer_id').notNull(),
    degree: integer('degree').notNull(),
    mutualCount: integer('mutual_count').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identityId, t.peerId] }),
    byIdentity: index('edges_identity_idx').on(t.identityId, t.degree),
  }),
);

export type ConnectionRequestRow = typeof connectionRequests.$inferSelect;
export type ConnectionRow = typeof connections.$inferSelect;
