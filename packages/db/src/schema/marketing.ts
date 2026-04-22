/**
 * Domain 25 — Marketing.
 * Campaign authoring, audience segments, send batches, and per-recipient
 * delivery + engagement events feeding marketing analytics.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const marketingCampaigns = pgTable('marketing_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  ownerId: uuid('owner_id').notNull(),
  name: text('name').notNull(),
  channel: text('channel').notNull(), // email | inapp | sms | push | webhook
  status: text('status').notNull().default('draft'), // draft | scheduled | sending | sent | paused | archived
  subject: text('subject'),
  body: text('body').notNull().default(''),
  templateId: uuid('template_id'),
  segmentId: uuid('segment_id'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tenantIdx: index('mc_tenant_status_idx').on(t.tenantId, t.status),
}));

export const marketingSegments = pgTable('marketing_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  filterExpr: jsonb('filter_expr').notNull().default({}),
  estimatedSize: integer('estimated_size').notNull().default(0),
  refreshedAt: timestamp('refreshed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tenantIdx: index('ms_tenant_idx').on(t.tenantId),
}));

export const marketingTemplates = pgTable('marketing_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  channel: text('channel').notNull(),
  subject: text('subject'),
  body: text('body').notNull().default(''),
  variables: jsonb('variables').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const marketingSendBatches = pgTable('marketing_send_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  status: text('status').notNull().default('queued'), // queued | sending | completed | failed
  recipientCount: integer('recipient_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  failureCount: integer('failure_count').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (t) => ({
  campaignIdx: index('msb_campaign_idx').on(t.campaignId, t.status),
}));

export const marketingRecipientEvents = pgTable('marketing_recipient_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  batchId: uuid('batch_id'),
  recipientId: uuid('recipient_id').notNull(),
  recipientAddress: text('recipient_address'),
  event: text('event').notNull(), // queued | sent | delivered | opened | clicked | bounced | complained | unsubscribed | failed
  detail: jsonb('detail').notNull().default({}),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  campaignIdx: index('mre_campaign_idx').on(t.campaignId, t.event, t.at),
  recipientIdx: index('mre_recipient_idx').on(t.recipientId, t.at),
}));
