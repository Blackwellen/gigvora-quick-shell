/**
 * Domain 54 — Organization Members, Seats, Roles, and Permission Controls.
 * Owner: apps/api-nest/src/modules/org-members-seats/
 *
 * State machines:
 *   oms_invitations.status: pending → accepted | revoked | expired
 *   oms_members.status:     active ↔ suspended → removed
 *   oms_seats.status:       available → assigned ↔ available; locked terminal-ish
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, index, boolean, unique } from 'drizzle-orm/pg-core';

export const omsRoles = pgTable('oms_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdentityId: uuid('org_identity_id').notNull(),
  key: text('key').notNull(), // owner|admin|manager|member|viewer|custom
  name: text('name').notNull(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  permissions: jsonb('permissions').notNull().default([]), // string[] of permission keys
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOrg: index('idx_oms_roles_org').on(t.orgIdentityId),
  uniqKey: unique('uniq_oms_roles_org_key').on(t.orgIdentityId, t.key),
}));

export const omsMembers = pgTable('oms_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdentityId: uuid('org_identity_id').notNull(),
  memberIdentityId: uuid('member_identity_id').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  roleKey: text('role_key').notNull().default('member'),
  status: text('status').notNull().default('active'), // active|suspended|removed
  seatId: uuid('seat_id'),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  invitedBy: uuid('invited_by'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  removedAt: timestamp('removed_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  byOrg: index('idx_oms_members_org').on(t.orgIdentityId, t.status),
  uniqMember: unique('uniq_oms_members_org_member').on(t.orgIdentityId, t.memberIdentityId),
}));

export const omsSeats = pgTable('oms_seats', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdentityId: uuid('org_identity_id').notNull(),
  plan: text('plan').notNull().default('pro'), // free|pro|team|enterprise
  seatType: text('seat_type').notNull().default('full'), // full|viewer|guest
  status: text('status').notNull().default('available'), // available|assigned|locked
  assignedMemberId: uuid('assigned_member_id'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  costCents: integer('cost_cents').notNull().default(0),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOrg: index('idx_oms_seats_org').on(t.orgIdentityId, t.status),
}));

export const omsInvitations = pgTable('oms_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdentityId: uuid('org_identity_id').notNull(),
  email: text('email').notNull(),
  roleKey: text('role_key').notNull().default('member'),
  seatType: text('seat_type').notNull().default('full'),
  status: text('status').notNull().default('pending'), // pending|accepted|revoked|expired
  invitedBy: uuid('invited_by').notNull(),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  acceptedMemberId: uuid('accepted_member_id'),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOrg: index('idx_oms_inv_org').on(t.orgIdentityId, t.status),
  uniqToken: unique('uniq_oms_inv_token').on(t.token),
}));

export const omsAuditEvents = pgTable('oms_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdentityId: uuid('org_identity_id').notNull(),
  actorIdentityId: uuid('actor_identity_id'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOrg: index('idx_oms_audit_org').on(t.orgIdentityId, t.createdAt),
}));
