/**
 * Domain — Identity (the canonical "who" record).
 *
 * `identities` is the platform-level subject. Auth credentials live in `auth.ts`.
 * Profiles, org memberships, role grants, and entitlements all FK to `identity_id`.
 *
 * Multi-tenant: every identity belongs to a tenant; org memberships are separate.
 */
import { pgTable, uuid, text, jsonb, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const identities = pgTable('identities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  primaryEmail: text('primary_email').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  primaryHandle: text('primary_handle').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  status: text('status').notNull().default('active'),  // active|suspended|deleted|pending
  locale: text('locale').notNull().default('en-US'),
  timezone: text('timezone').notNull().default('UTC'),
  metadata: jsonb('metadata').notNull().default({}),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqEmail: uniqueIndex('identities_email_idx').on(t.tenantId, t.primaryEmail),
  uniqHandle: uniqueIndex('identities_handle_idx').on(t.tenantId, t.primaryHandle),
  statusIdx: index('identities_status_idx').on(t.tenantId, t.status),
  statusCheck: sql`CHECK (status IN ('active','suspended','deleted','pending'))`,
}));

export const identityOrgMemberships = pgTable('identity_org_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  orgId: uuid('org_id').notNull(),
  role: text('role').notNull().default('member'),     // owner|admin|manager|member|guest
  status: text('status').notNull().default('active'), // active|invited|removed
  invitedById: uuid('invited_by_id'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  removedAt: timestamp('removed_at', { withTimezone: true }),
}, (t) => ({
  uniqMember: uniqueIndex('iom_unique_idx').on(t.identityId, t.orgId),
  byOrg: index('iom_org_idx').on(t.orgId, t.status),
  roleCheck: sql`CHECK (role IN ('owner','admin','manager','member','guest'))`,
  statusCheck: sql`CHECK (status IN ('active','invited','removed'))`,
}));

export const identityHandles = pgTable('identity_handles', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  handle: text('handle').notNull(),
  kind: text('kind').notNull().default('alias'),      // primary|alias|reserved
  releasedAt: timestamp('released_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqHandle: uniqueIndex('ih_handle_idx').on(t.handle),
  byIdentity: index('ih_identity_idx').on(t.identityId, t.kind),
  kindCheck: sql`CHECK (kind IN ('primary','alias','reserved'))`,
}));

export type IdentityRow = typeof identities.$inferSelect;
export type IdentityOrgMembershipRow = typeof identityOrgMemberships.$inferSelect;
export type IdentityHandleRow = typeof identityHandles.$inferSelect;
