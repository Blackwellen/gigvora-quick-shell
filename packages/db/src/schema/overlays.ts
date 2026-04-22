/**
 * Domain — Overlays (drawers, inspectors, wizards, undo tombstones).
 *
 * Persists drafts for multi-step overlays (creation wizards, inspectors with
 * unsaved changes), and the undo tombstones surfaced by toast actions.
 */
import { pgTable, uuid, text, integer, jsonb, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const workflowDefinitions = pgTable('workflow_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),                      // 'create.project'|'create.gig'|...
  displayName: text('display_name').notNull(),
  surfaceKind: text('surface_kind').notNull(),       // wizard|drawer|inspector|popout|hovercard
  steps: jsonb('steps').notNull().default([]),       // [{key,label,schema}]
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqSlug: uniqueIndex('wd_slug_idx').on(t.slug),
  surfaceCheck: sql`CHECK (surface_kind IN ('wizard','drawer','inspector','popout','hovercard'))`,
}));

export const overlayDrafts = pgTable('overlay_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  workflowSlug: text('workflow_slug').notNull(),
  scopeKind: text('scope_kind'),                     // project|gig|job|...
  scopeId: uuid('scope_id'),
  step: integer('step').notNull().default(0),
  payload: jsonb('payload').notNull().default({}),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byIdentity: index('od_identity_idx').on(t.identityId, t.workflowSlug),
  byScope: index('od_scope_idx').on(t.scopeKind, t.scopeId),
}));

export const overlaySnapshots = pgTable('overlay_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').notNull(),
  step: integer('step').notNull(),
  payload: jsonb('payload').notNull().default({}),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byDraft: index('os_draft_idx').on(t.draftId, t.capturedAt),
}));

export const undoTombstones = pgTable('undo_tombstones', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  domain: text('domain').notNull(),                  // feed|projects|inbox|...
  action: text('action').notNull(),                  // delete|archive|move|...
  targetKind: text('target_kind').notNull(),
  targetId: text('target_id').notNull(),
  reverseAction: jsonb('reverse_action').notNull().default({}),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byIdentity: index('ut_identity_idx').on(t.identityId, t.expiresAt),
  byTarget: index('ut_target_idx').on(t.targetKind, t.targetId),
}));

export const overlayEvents = pgTable('overlay_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id'),
  workflowSlug: text('workflow_slug').notNull(),
  draftId: uuid('draft_id'),
  kind: text('kind').notNull(),                      // opened|step_advanced|saved|cancelled|completed
  step: integer('step'),
  payload: jsonb('payload').notNull().default({}),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byWorkflow: index('oe_workflow_idx').on(t.workflowSlug, t.occurredAt),
  byDraft: index('oe_draft_idx').on(t.draftId),
  kindCheck: sql`CHECK (kind IN ('opened','step_advanced','saved','cancelled','completed'))`,
}));

export type WorkflowDefinitionRow = typeof workflowDefinitions.$inferSelect;
export type OverlayDraftRow = typeof overlayDrafts.$inferSelect;
export type UndoTombstoneRow = typeof undoTombstones.$inferSelect;
export type OverlayEventRow = typeof overlayEvents.$inferSelect;
