/**
 * Networking + Speed Networking + Events + Groups — schema TS.
 *
 * Tables:
 *   net_rooms            — networking + speed-networking rooms (Jitsi/LiveKit)
 *   net_room_attendees   — joined identities + paid status + card-shared flag
 *   net_speed_matches    — per-round speed-networking pairings (with reason)
 *   net_business_cards   — digital business cards (one per identity)
 *   net_card_shares      — card-share events (manual / room / speed / event / group)
 *   evt_events           — events (free or Stripe-priced, virtual/in-person/hybrid)
 *   evt_rsvps            — event RSVPs + paid status
 *   grp_groups           — groups/communities
 *   grp_members          — group membership (owner/admin/mod/member/pending)
 *   grp_posts            — group feed posts
 *   neg_audit            — append-only audit (Postgres trigger blocks mutations)
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, numeric, index, unique } from 'drizzle-orm/pg-core';

export const netRooms = pgTable('net_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  kind: text('kind').notNull().default('open'),
  status: text('status').notNull().default('draft'),
  title: text('title').notNull(),
  topic: text('topic').notNull().default(''),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  capacity: integer('capacity').notNull().default(25),
  videoProvider: text('video_provider').notNull().default('jitsi'),
  videoRoomId: text('video_room_id'),
  recordingUrl: text('recording_url'),
  isPaid: boolean('is_paid').notNull().default(false),
  priceMinor: integer('price_minor').notNull().default(0),
  currency: text('currency').notNull().default('GBP'),
  stripeProductId: text('stripe_product_id'),
  stripePriceId: text('stripe_price_id'),
  speedRoundSeconds: integer('speed_round_seconds').notNull().default(180),
  speedMatchStrategy: text('speed_match_strategy').notNull().default('interest_overlap'),
  tags: jsonb('tags').notNull().default([]),
  invitedIdentityIds: jsonb('invited_identity_ids').notNull().default([]),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_net_rooms_owner').on(t.ownerIdentityId, t.status),
  byTime: index('idx_net_rooms_time').on(t.startsAt),
  byKind: index('idx_net_rooms_kind').on(t.kind, t.status),
}));

export const netRoomAttendees = pgTable('net_room_attendees', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  role: text('role').notNull().default('attendee'),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  leftAt: timestamp('left_at', { withTimezone: true }),
  paidStatus: text('paid_status').notNull().default('free'),
  stripeSessionId: text('stripe_session_id'),
  cardShared: boolean('card_shared').notNull().default(false),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqMember: unique('uniq_net_room_member').on(t.roomId, t.identityId),
  byRoom: index('idx_net_attendees_room').on(t.roomId),
  byId: index('idx_net_attendees_id').on(t.identityId),
}));

export const netSpeedMatches = pgTable('net_speed_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull(),
  roundIndex: integer('round_index').notNull(),
  identityA: uuid('identity_a').notNull(),
  identityB: uuid('identity_b').notNull(),
  score: integer('score').notNull().default(0),
  reason: jsonb('reason').notNull().default({}),
  outcome: text('outcome'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqPair: unique('uniq_speed_pair').on(t.roomId, t.roundIndex, t.identityA, t.identityB),
  byRoom: index('idx_speed_matches_room').on(t.roomId, t.roundIndex),
}));

export const netBusinessCards = pgTable('net_business_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull().unique(),
  displayName: text('display_name').notNull(),
  headline: text('headline').notNull().default(''),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  links: jsonb('links').notNull().default([]),
  avatarUrl: text('avatar_url'),
  accentColor: text('accent_color').notNull().default('oklch(0.5 0.18 240)'),
  visibility: text('visibility').notNull().default('connections'),
  shareCount: integer('share_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const netCardShares = pgTable('net_card_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  cardId: uuid('card_id').notNull(),
  fromIdentityId: uuid('from_identity_id').notNull(),
  toIdentityId: uuid('to_identity_id').notNull(),
  context: text('context').notNull().default('manual'),
  contextId: uuid('context_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqShare: unique('uniq_card_share').on(t.cardId, t.toIdentityId, t.contextId),
  byTo: index('idx_card_shares_to').on(t.toIdentityId),
}));

export const evtEvents = pgTable('evt_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostIdentityId: uuid('host_identity_id').notNull(),
  hostOrgId: uuid('host_org_id'),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  status: text('status').notNull().default('draft'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  format: text('format').notNull().default('virtual'),
  visibility: text('visibility').notNull().default('public'),
  locationName: text('location_name'),
  locationLat: numeric('location_lat'),
  locationLng: numeric('location_lng'),
  capacity: integer('capacity').notNull().default(100),
  rsvpCount: integer('rsvp_count').notNull().default(0),
  isPaid: boolean('is_paid').notNull().default(false),
  priceMinor: integer('price_minor').notNull().default(0),
  currency: text('currency').notNull().default('GBP'),
  stripeProductId: text('stripe_product_id'),
  stripePriceId: text('stripe_price_id'),
  coverImageUrl: text('cover_image_url'),
  tags: jsonb('tags').notNull().default([]),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byHost: index('idx_evt_host').on(t.hostIdentityId, t.status),
  byTime: index('idx_evt_time').on(t.startsAt),
  byVis: index('idx_evt_visibility').on(t.visibility, t.status),
}));

export const evtRsvps = pgTable('evt_rsvps', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  status: text('status').notNull().default('going'),
  paidStatus: text('paid_status').notNull().default('free'),
  stripeSessionId: text('stripe_session_id'),
  rsvpAt: timestamp('rsvp_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqRsvp: unique('uniq_evt_rsvp').on(t.eventId, t.identityId),
  byEvent: index('idx_evt_rsvps_event').on(t.eventId),
}));

export const grpGroups = pgTable('grp_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  handle: text('handle').notNull().unique(),
  displayName: text('display_name').notNull(),
  about: text('about').notNull().default(''),
  visibility: text('visibility').notNull().default('public'),
  joinPolicy: text('join_policy').notNull().default('open'),
  coverImageUrl: text('cover_image_url'),
  category: text('category'),
  memberCount: integer('member_count').notNull().default(0),
  postCount: integer('post_count').notNull().default(0),
  status: text('status').notNull().default('active'),
  tags: jsonb('tags').notNull().default([]),
  rules: jsonb('rules').notNull().default([]),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byVis: index('idx_grp_visibility').on(t.visibility, t.status) }));

export const grpMembers = pgTable('grp_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull(),
  identityId: uuid('identity_id').notNull(),
  role: text('role').notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqMember: unique('uniq_grp_member').on(t.groupId, t.identityId),
  byGroup: index('idx_grp_members_group').on(t.groupId),
  byId: index('idx_grp_members_id').on(t.identityId),
}));

export const grpPosts = pgTable('grp_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull(),
  authorIdentityId: uuid('author_identity_id').notNull(),
  body: text('body').notNull().default(''),
  attachments: jsonb('attachments').notNull().default([]),
  reactionCount: integer('reaction_count').notNull().default(0),
  commentCount: integer('comment_count').notNull().default(0),
  pinned: boolean('pinned').notNull().default(false),
  status: text('status').notNull().default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byGroup: index('idx_grp_posts_group').on(t.groupId, t.createdAt) }));

export const negAudit = pgTable('neg_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorIdentityId: uuid('actor_identity_id').notNull(),
  actorRole: text('actor_role').notNull().default('user'),
  domain: text('domain').notNull(),
  entity: text('entity').notNull(),
  entityId: uuid('entity_id').notNull(),
  action: text('action').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byEntity: index('idx_neg_audit_entity').on(t.domain, t.entity, t.entityId),
  byActor: index('idx_neg_audit_actor').on(t.actorIdentityId),
}));
