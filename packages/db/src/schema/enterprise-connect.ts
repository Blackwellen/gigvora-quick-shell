/**
 * Enterprise Connect & Startup Showcase — full schema.
 *
 * Tables (all `ec_*`):
 *   ec_org_profiles        — enterprise + startup org profiles (unified)
 *   ec_directory_entries   — searchable directory rows (denormalised projection)
 *   ec_partners            — partner-discovery edges (org ↔ org with tags + score)
 *   ec_procurement_briefs  — RFx-style briefs surfaced in procurement discover
 *   ec_intros              — warm-intro requests (requester → target via broker)
 *   ec_rooms               — enterprise rooms (boardroom / dealroom / private)
 *   ec_events              — enterprise events (private invite-only sessions)
 *   ec_startups            — startup showcase entries (separate IA, same org_profile)
 *   ec_audit               — append-only audit trail for the whole domain
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, index, unique } from 'drizzle-orm/pg-core';

export const ecOrgProfiles = pgTable('ec_org_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  kind: text('kind').notNull().default('enterprise'), // enterprise | startup | scaleup | sme
  status: text('status').notNull().default('draft'),  // draft | active | paused | archived
  handle: text('handle').notNull().unique(),
  legalName: text('legal_name').notNull(),
  displayName: text('display_name').notNull(),
  tagline: text('tagline').notNull().default(''),
  about: text('about').notNull().default(''),
  industry: text('industry'),
  hqCountry: text('hq_country'),
  hqCity: text('hq_city'),
  sizeBand: text('size_band'),         // 1-10 | 11-50 | 51-200 | 201-1000 | 1000+
  fundingStage: text('funding_stage'), // bootstrap | pre-seed | seed | series-a | series-b+ | public
  websiteUrl: text('website_url'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  capabilities: jsonb('capabilities').notNull().default([]),  // string[]
  certifications: jsonb('certifications').notNull().default([]),
  contacts: jsonb('contacts').notNull().default([]),          // [{role,name,email,phone}]
  visibility: text('visibility').notNull().default('public'), // public | network | private
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_ec_orgs_owner').on(t.ownerIdentityId),
  byKindStatus: index('idx_ec_orgs_kind_status').on(t.kind, t.status),
  byIndustry: index('idx_ec_orgs_industry').on(t.industry),
}));

export const ecDirectoryEntries = pgTable('ec_directory_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().unique(),
  searchVector: text('search_vector').notNull().default(''), // composed text for tsv/opensearch
  tags: jsonb('tags').notNull().default([]),
  region: text('region'),
  highlights: jsonb('highlights').notNull().default([]),
  lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byRegion: index('idx_ec_dir_region').on(t.region),
}));

export const ecPartners = pgTable('ec_partners', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgIdA: uuid('org_id_a').notNull(),
  orgIdB: uuid('org_id_b').notNull(),
  relationKind: text('relation_kind').notNull().default('partner'), // partner | supplier | reseller | technology
  status: text('status').notNull().default('active'),               // proposed | active | paused | ended
  matchScore: integer('match_score').notNull().default(0),          // 0..100, deterministic ranker
  matchReason: jsonb('match_reason').notNull().default({}),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byA: index('idx_ec_partners_a').on(t.orgIdA, t.status),
  byB: index('idx_ec_partners_b').on(t.orgIdB, t.status),
  uniquePair: unique('uniq_ec_partners_pair').on(t.orgIdA, t.orgIdB, t.relationKind),
}));

export const ecProcurementBriefs = pgTable('ec_procurement_briefs', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerOrgId: uuid('buyer_org_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  category: text('category'),
  budgetMinor: integer('budget_minor'),
  currency: text('currency').notNull().default('GBP'),
  status: text('status').notNull().default('draft'), // draft | open | shortlisting | awarded | closed | archived
  dueAt: timestamp('due_at', { withTimezone: true }),
  requirements: jsonb('requirements').notNull().default([]),
  visibility: text('visibility').notNull().default('network'), // public | network | invited
  invitedOrgIds: jsonb('invited_org_ids').notNull().default([]),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byBuyer: index('idx_ec_proc_buyer').on(t.buyerOrgId, t.status),
  byCategory: index('idx_ec_proc_cat').on(t.category, t.status),
}));

export const ecIntros = pgTable('ec_intros', {
  id: uuid('id').primaryKey().defaultRandom(),
  requesterIdentityId: uuid('requester_identity_id').notNull(),
  brokerIdentityId: uuid('broker_identity_id').notNull(),
  targetIdentityId: uuid('target_identity_id').notNull(),
  contextOrgId: uuid('context_org_id'),
  status: text('status').notNull().default('pending'), // pending | accepted | declined | expired | completed | cancelled
  reason: text('reason').notNull().default(''),
  message: text('message').notNull().default(''),
  declineReason: text('decline_reason'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byBroker: index('idx_ec_intros_broker').on(t.brokerIdentityId, t.status),
  byTarget: index('idx_ec_intros_target').on(t.targetIdentityId, t.status),
  byRequester: index('idx_ec_intros_req').on(t.requesterIdentityId, t.status),
}));

export const ecRooms = pgTable('ec_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerOrgId: uuid('owner_org_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  kind: text('kind').notNull().default('boardroom'), // boardroom | dealroom | private | event
  status: text('status').notNull().default('draft'), // draft | scheduled | live | ended | archived
  title: text('title').notNull(),
  agenda: text('agenda').notNull().default(''),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  videoProvider: text('video_provider').notNull().default('jitsi'), // jitsi | livekit | daily
  videoRoomId: text('video_room_id'),
  capacity: integer('capacity').notNull().default(50),
  invitedIdentityIds: jsonb('invited_identity_ids').notNull().default([]),
  recordingUrl: text('recording_url'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_ec_rooms_owner').on(t.ownerOrgId, t.status),
  byTime: index('idx_ec_rooms_time').on(t.startsAt),
}));

export const ecEvents = pgTable('ec_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostOrgId: uuid('host_org_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  status: text('status').notNull().default('draft'), // draft | published | cancelled | completed
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  format: text('format').notNull().default('virtual'), // virtual | in_person | hybrid
  visibility: text('visibility').notNull().default('invited'),
  capacity: integer('capacity').notNull().default(100),
  rsvpCount: integer('rsvp_count').notNull().default(0),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byHost: index('idx_ec_events_host').on(t.hostOrgId, t.status),
  byTime: index('idx_ec_events_time').on(t.startsAt),
}));

export const ecStartups = pgTable('ec_startups', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().unique(),
  pitchOneLiner: text('pitch_one_liner').notNull().default(''),
  pitchDeckUrl: text('pitch_deck_url'),
  productDemoUrl: text('product_demo_url'),
  fundraising: jsonb('fundraising').notNull().default({}), // {round, amountMinor, currency, openAt, closeAt}
  traction: jsonb('traction').notNull().default({}),       // {mrr, arr, growthMoM, customers}
  team: jsonb('team').notNull().default([]),
  showcaseRank: integer('showcase_rank').notNull().default(0), // ML-set, 0..100
  featured: boolean('featured').notNull().default(false),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byRank: index('idx_ec_startups_rank').on(t.showcaseRank),
  byFeatured: index('idx_ec_startups_featured').on(t.featured),
}));

export const ecAudit = pgTable('ec_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorIdentityId: uuid('actor_identity_id').notNull(),
  actorRole: text('actor_role').notNull().default('user'),
  entity: text('entity').notNull(),     // org | partner | brief | intro | room | event | startup
  entityId: uuid('entity_id').notNull(),
  action: text('action').notNull(),     // create | update | transition | invite | accept | decline | archive
  before: jsonb('before'),
  after: jsonb('after'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byEntity: index('idx_ec_audit_entity').on(t.entity, t.entityId),
  byActor: index('idx_ec_audit_actor').on(t.actorIdentityId),
}));
