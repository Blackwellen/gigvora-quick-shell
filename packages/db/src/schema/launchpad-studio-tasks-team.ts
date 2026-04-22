/**
 * Pass 4 schema: Experience Launchpad + Creation Studio + Task List + Team Mgmt.
 * Mirrors migration 0073. Drizzle types only — runtime queries use raw SQL via
 * the NestJS repositories for performance and lock-step parity with the SQL file.
 */
import { bigserial, boolean, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const launchpadPathways = pgTable('launchpad_pathways', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  domain: text('domain').notNull().default('general'),
  level: text('level').notNull().default('starter'),
  durationWeeks: integer('duration_weeks').notNull().default(6),
  heroImageUrl: text('hero_image_url'),
  outcomes: jsonb('outcomes').$type<string[]>().notNull().default([]),
  modules: jsonb('modules').$type<unknown[]>().notNull().default([]),
  tags: text('tags').array().notNull().default([] as unknown as string[]),
  status: text('status').notNull().default('published'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const launchpadPathwayEnrollments = pgTable('launchpad_pathway_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  identityId: uuid('identity_id').notNull(),
  pathwayId: uuid('pathway_id').notNull(),
  progressPct: integer('progress_pct').notNull().default(0),
  status: text('status').notNull().default('active'),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const launchpadMentors = pgTable('launchpad_mentors', {
  id: uuid('id').defaultRandom().primaryKey(),
  identityId: uuid('identity_id').notNull().unique(),
  displayName: text('display_name').notNull(),
  headline: text('headline').notNull().default(''),
  bio: text('bio').notNull().default(''),
  expertise: text('expertise').array().notNull().default([] as unknown as string[]),
  industries: text('industries').array().notNull().default([] as unknown as string[]),
  rateAmount: integer('rate_amount').notNull().default(0),
  rateCurrency: text('rate_currency').notNull().default('USD'),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0.00'),
  sessions: integer('sessions').notNull().default(0),
  status: text('status').notNull().default('available'),
  availability: jsonb('availability').$type<unknown[]>().notNull().default([]),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const launchpadMentorBookings = pgTable('launchpad_mentor_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  mentorId: uuid('mentor_id').notNull(),
  menteeIdentityId: uuid('mentee_identity_id').notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  durationMin: integer('duration_min').notNull().default(30),
  status: text('status').notNull().default('pending'),
  topic: text('topic').notNull().default(''),
  meetingUrl: text('meeting_url'),
  amountPaid: integer('amount_paid').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const launchpadChallenges = pgTable('launchpad_challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  brief: text('brief').notNull().default(''),
  sponsor: text('sponsor'),
  sponsorLogo: text('sponsor_logo'),
  prizeAmount: integer('prize_amount').notNull().default(0),
  prizeCurrency: text('prize_currency').notNull().default('USD'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('open'),
  tags: text('tags').array().notNull().default([] as unknown as string[]),
  rubric: jsonb('rubric').$type<unknown[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const launchpadSubmissions = pgTable('launchpad_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  challengeId: uuid('challenge_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  assetUrls: jsonb('asset_urls').$type<string[]>().notNull().default([]),
  score: integer('score').notNull().default(0),
  rank: integer('rank'),
  status: text('status').notNull().default('submitted'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
});

export const launchpadOpportunities = pgTable('launchpad_opportunities', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  orgName: text('org_name').notNull(),
  location: text('location').notNull().default('Remote'),
  salaryBand: text('salary_band'),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  level: text('level').notNull().default('entry'),
  tags: text('tags').array().notNull().default([] as unknown as string[]),
  linkHref: text('link_href'),
  description: text('description').notNull().default(''),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const studioDrafts = pgTable('studio_drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  workspaceId: uuid('workspace_id'),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  blocks: jsonb('blocks').$type<unknown[]>().notNull().default([]),
  heroUrl: text('hero_url'),
  destination: text('destination').notNull().default('feed'),
  tags: text('tags').array().notNull().default([] as unknown as string[]),
  status: text('status').notNull().default('draft'),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  moderationStatus: text('moderation_status').notNull().default('pending'),
  version: integer('version').notNull().default(1),
  metrics: jsonb('metrics').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const studioAssets = pgTable('studio_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  kind: text('kind').notNull(),
  url: text('url').notNull(),
  posterUrl: text('poster_url'),
  bytes: integer('bytes').notNull().default(0),
  durationMs: integer('duration_ms'),
  width: integer('width'),
  height: integer('height'),
  tags: text('tags').array().notNull().default([] as unknown as string[]),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const taskLists = pgTable('task_lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  workspaceId: uuid('workspace_id'),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  color: text('color').notNull().default('#6366f1'),
  position: integer('position').notNull().default(0),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const taskItems = pgTable('task_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  listId: uuid('list_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  assigneeIdentityId: uuid('assignee_identity_id'),
  title: text('title').notNull(),
  notes: text('notes').notNull().default(''),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('medium'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  position: integer('position').notNull().default(0),
  labels: text('labels').array().notNull().default([] as unknown as string[]),
  linkedEntity: jsonb('linked_entity').$type<Record<string, unknown> | null>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const teamMembers = pgTable('team_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  displayName: text('display_name').notNull(),
  email: text('email'),
  role: text('role').notNull().default('member'),
  department: text('department'),
  title: text('title'),
  status: text('status').notNull().default('active'),
  permissions: jsonb('permissions').$type<Record<string, unknown>>().notNull().default({}),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const teamInvites = pgTable('team_invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  invitedByIdentityId: uuid('invited_by_identity_id').notNull(),
  status: text('status').notNull().default('pending'),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const lstAudit = pgTable('lst_audit', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  identityId: uuid('identity_id'),
  domain: text('domain').notNull(),
  action: text('action').notNull(),
  entityKind: text('entity_kind').notNull(),
  entityId: text('entity_id'),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
