/**
 * Domain 55 — Shared Workspaces, Internal Notes, Cross-Team Collaboration & Handoffs.
 * Owner: apps/api-nest/src/modules/shared-workspaces-collaboration/
 *
 * State machines:
 *   swc_workspaces.status:    active ↔ archived
 *   swc_notes.status:         draft → published ↔ archived
 *   swc_handoffs.status:      pending → accepted | rejected | cancelled; accepted → completed
 *   swc_members.status:       active ↔ removed
 */
import { pgTable, uuid, text, timestamp, jsonb, index, boolean, unique } from 'drizzle-orm/pg-core';

export const swcWorkspaces = pgTable('swc_workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdentityId: uuid('org_identity_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  visibility: text('visibility').notNull().default('team'), // team|private|org
  status: text('status').notNull().default('active'), // active|archived
  createdBy: uuid('created_by').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOrg: index('idx_swc_ws_org').on(t.orgIdentityId, t.status),
  uniqSlug: unique('uniq_swc_ws_org_slug').on(t.orgIdentityId, t.slug),
}));

export const swcMembers = pgTable('swc_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  memberIdentityId: uuid('member_identity_id').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('contributor'), // owner|editor|contributor|viewer
  status: text('status').notNull().default('active'), // active|removed
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  removedAt: timestamp('removed_at', { withTimezone: true }),
}, (t) => ({
  byWs: index('idx_swc_members_ws').on(t.workspaceId, t.status),
  uniqMember: unique('uniq_swc_members_ws_member').on(t.workspaceId, t.memberIdentityId),
}));

export const swcNotes = pgTable('swc_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  authorId: uuid('author_id').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  tags: jsonb('tags').notNull().default([]),
  status: text('status').notNull().default('draft'), // draft|published|archived
  pinned: boolean('pinned').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byWs: index('idx_swc_notes_ws').on(t.workspaceId, t.status, t.updatedAt),
}));

export const swcHandoffs = pgTable('swc_handoffs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  fromIdentityId: uuid('from_identity_id').notNull(),
  toIdentityId: uuid('to_identity_id').notNull(),
  fromTeam: text('from_team'),
  toTeam: text('to_team'),
  subject: text('subject').notNull(),
  context: text('context').notNull().default(''),
  checklist: jsonb('checklist').notNull().default([]), // [{label, done}]
  attachments: jsonb('attachments').notNull().default([]),
  priority: text('priority').notNull().default('normal'), // low|normal|high|urgent
  status: text('status').notNull().default('pending'), // pending|accepted|rejected|cancelled|completed
  dueAt: timestamp('due_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  rejectedReason: text('rejected_reason'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byWs: index('idx_swc_handoffs_ws').on(t.workspaceId, t.status),
  byTo: index('idx_swc_handoffs_to').on(t.toIdentityId, t.status),
}));

export const swcAuditEvents = pgTable('swc_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  actorIdentityId: uuid('actor_identity_id'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byWs: index('idx_swc_audit_ws').on(t.workspaceId, t.createdAt),
}));
