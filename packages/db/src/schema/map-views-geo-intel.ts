/**
 * Domain 62 — Map Views, Location Targeting, Geo Intelligence & Place-Based Media.
 *
 * Tables (all `mvg_*`):
 *   mvg_places              — canonical places (lat/lng + address bits)
 *   mvg_geofences           — polygon/radius targeting zones
 *   mvg_audiences           — saved geo audiences (composite of geofences + filters)
 *   mvg_place_media         — media attached to a place (image/video/audio/doc)
 *   mvg_location_signals    — append-only event signals (visit/click/impression/conversion)
 *   mvg_heatmap_cells       — denormalised H3-style cell aggregates
 *   mvg_audit_events        — domain audit
 *
 * Privacy: lat/lng truncated to ≤5 dp on signals; raw IP never stored.
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, real, index, unique, doublePrecision } from 'drizzle-orm/pg-core';

export const mvgPlaces = pgTable('mvg_places', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'), // draft|active|archived
  category: text('category'), // venue|office|retail|event|coworking|other
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  country: text('country'),
  region: text('region'),
  city: text('city'),
  postcode: text('postcode'),
  address: text('address'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('idx_mvg_places_owner').on(t.ownerIdentityId, t.status),
  byCity: index('idx_mvg_places_city').on(t.country, t.city),
}));

export const mvgGeofences = pgTable('mvg_geofences', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'), // draft|active|paused|archived
  shape: text('shape').notNull(), // 'circle' | 'polygon'
  centerLat: doublePrecision('center_lat'),
  centerLng: doublePrecision('center_lng'),
  radiusMeters: integer('radius_meters'),
  polygon: jsonb('polygon'), // GeoJSON ring [[lng,lat], ...]
  bbox: jsonb('bbox'), // [minLng,minLat,maxLng,maxLat]
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOwner: index('idx_mvg_geofences_owner').on(t.ownerIdentityId, t.status) }));

export const mvgAudiences = pgTable('mvg_audiences', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'), // draft|active|archived
  geofenceIds: jsonb('geofence_ids').notNull().default([]),
  includeCountries: jsonb('include_countries').notNull().default([]),
  excludeCountries: jsonb('exclude_countries').notNull().default([]),
  estimatedReach: integer('estimated_reach').notNull().default(0),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOwner: index('idx_mvg_audiences_owner').on(t.ownerIdentityId, t.status) }));

export const mvgPlaceMedia = pgTable('mvg_place_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  placeId: uuid('place_id').notNull(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  kind: text('kind').notNull(), // image|video|audio|document
  status: text('status').notNull().default('pending'), // pending|scanned|approved|rejected
  url: text('url').notNull(),
  thumbUrl: text('thumb_url'),
  bytes: integer('bytes'),
  durationMs: integer('duration_ms'),
  moderationScore: real('moderation_score'),
  moderationReason: text('moderation_reason'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byPlace: index('idx_mvg_place_media_place').on(t.placeId, t.status) }));

export const mvgLocationSignals = pgTable('mvg_location_signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  placeId: uuid('place_id'),
  geofenceId: uuid('geofence_id'),
  eventType: text('event_type').notNull(), // visit|click|impression|conversion
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  countryCode: text('country_code'),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  byOwner: index('idx_mvg_signals_owner').on(t.ownerIdentityId, t.occurredAt),
  byPlace: index('idx_mvg_signals_place').on(t.placeId, t.occurredAt),
}));

export const mvgHeatmapCells = pgTable('mvg_heatmap_cells', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  cellId: text('cell_id').notNull(), // grid id at resolution
  resolution: integer('resolution').notNull(), // 5..9
  centerLat: doublePrecision('center_lat').notNull(),
  centerLng: doublePrecision('center_lng').notNull(),
  signals: integer('signals').notNull().default(0),
  conversions: integer('conversions').notNull().default(0),
  intensity: real('intensity').notNull().default(0),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: unique('uniq_mvg_cell').on(t.ownerIdentityId, t.cellId, t.resolution),
  byOwner: index('idx_mvg_cells_owner').on(t.ownerIdentityId, t.resolution),
}));

export const mvgAuditEvents = pgTable('mvg_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id'),
  actorIdentityId: uuid('actor_identity_id'),
  actorRole: text('actor_role'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOwner: index('idx_mvg_audit_owner').on(t.ownerIdentityId, t.createdAt) }));
