/**
 * Sales Navigator schema — leads, lists, outreach, signals, seats.
 * Reuses existing `companies` table for account/company intel.
 */
import { pgTable, uuid, text, integer, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';

export const snSalesSignals = pgTable('sn_sales_signals', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  kind: text('kind').notNull(),
  severity: integer('severity').notNull().default(50),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  sourceUrl: text('source_url'),
  sourceLabel: text('source_label'),
  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const snLeads = pgTable('sn_leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  workspaceId: uuid('workspace_id'),
  fullName: text('full_name').notNull(),
  headline: text('headline').notNull().default(''),
  email: text('email'),
  phone: text('phone'),
  companyId: uuid('company_id'),
  companyName: text('company_name'),
  title: text('title'),
  seniority: text('seniority'),
  functionArea: text('function_area'),
  industry: text('industry'),
  hqCountry: text('hq_country'),
  hqCity: text('hq_city'),
  region: text('region'),
  linkedinUrl: text('linkedin_url'),
  source: text('source').notNull().default('manual'),
  intentScore: integer('intent_score').notNull().default(0),
  fitScore: integer('fit_score').notNull().default(0),
  tags: text('tags').array().notNull().default([]),
  status: text('status').notNull().default('new'),
  saved: boolean('saved').notNull().default(false),
  notes: text('notes').notNull().default(''),
  enrichment: jsonb('enrichment').$type<Record<string, unknown>>().notNull().default({}),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const snLeadLists = pgTable('sn_lead_lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  workspaceId: uuid('workspace_id'),
  name: text('name').notNull(),
  kind: text('kind').notNull().default('static'),
  query: jsonb('query').$type<Record<string, unknown>>().notNull().default({}),
  memberCount: integer('member_count').notNull().default(0),
  pinned: boolean('pinned').notNull().default(false),
  sharedWith: uuid('shared_with').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const snOutreachSequences = pgTable('sn_outreach_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  workspaceId: uuid('workspace_id'),
  name: text('name').notNull(),
  channel: text('channel').notNull().default('mixed'),
  status: text('status').notNull().default('draft'),
  steps: jsonb('steps').$type<unknown[]>().notNull().default([]),
  goal: text('goal').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const snOutreachActivities = pgTable('sn_outreach_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  sequenceId: uuid('sequence_id'),
  leadId: uuid('lead_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  stepIndex: integer('step_index').notNull().default(0),
  channel: text('channel').notNull(),
  direction: text('direction').notNull().default('outbound'),
  status: text('status').notNull().default('queued'),
  subject: text('subject'),
  body: text('body'),
  provider: text('provider'),
  providerId: text('provider_id'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  replyAt: timestamp('reply_at', { withTimezone: true }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const snRelationshipGoals = pgTable('sn_relationship_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  leadId: uuid('lead_id'),
  accountCompanyId: uuid('account_company_id'),
  title: text('title').notNull(),
  cadenceDays: integer('cadence_days').notNull().default(30),
  nextTouchAt: timestamp('next_touch_at', { withTimezone: true }),
  lastTouchAt: timestamp('last_touch_at', { withTimezone: true }),
  status: text('status').notNull().default('active'),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const snSeats = pgTable('sn_seats', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('active'),
  invitedBy: uuid('invited_by'),
  invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  monthlyCreditQuota: integer('monthly_credit_quota').notNull().default(1000),
  monthlyCreditUsed: integer('monthly_credit_used').notNull().default(0),
});
