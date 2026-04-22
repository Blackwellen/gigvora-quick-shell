/**
 * Domain 26 — Media Viewer.
 * Per-asset playback sessions, heatmap segments, and quality-of-experience
 * (QoE) samples. Source-of-truth for the asset itself stays in Media domain.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const mediaPlaybackSessions = pgTable('media_playback_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').notNull(),
  viewerId: uuid('viewer_id'),
  tenantId: text('tenant_id').notNull(),
  surface: text('surface').notNull().default('web'), // web | ios | android | embed | reels
  client: text('client'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  watchedSeconds: integer('watched_seconds').notNull().default(0),
  completedPct: integer('completed_pct').notNull().default(0),
  exitReason: text('exit_reason'), // ended | swipe | nav | error | tab_hidden
}, (t) => ({
  assetIdx: index('mps_asset_idx').on(t.assetId, t.startedAt),
  viewerIdx: index('mps_viewer_idx').on(t.viewerId, t.startedAt),
}));

export const mediaPlaybackSegments = pgTable('media_playback_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull(),
  startMs: integer('start_ms').notNull(),
  endMs: integer('end_ms').notNull(),
  speed: integer('speed').notNull().default(100), // percent (100 = 1x)
  bufferingMs: integer('buffering_ms').notNull().default(0),
}, (t) => ({
  sessionIdx: index('mpsg_session_idx').on(t.sessionId, t.startMs),
}));

export const mediaQoeSamples = pgTable('media_qoe_samples', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull(),
  bitrateKbps: integer('bitrate_kbps').notNull().default(0),
  resolution: text('resolution'),
  droppedFrames: integer('dropped_frames').notNull().default(0),
  rebufferMs: integer('rebuffer_ms').notNull().default(0),
  startupMs: integer('startup_ms').notNull().default(0),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sessionIdx: index('mqoe_session_idx').on(t.sessionId, t.at),
}));

export const mediaAssetStats = pgTable('media_asset_stats', {
  assetId: uuid('asset_id').primaryKey(),
  views: integer('views').notNull().default(0),
  uniqueViewers: integer('unique_viewers').notNull().default(0),
  avgWatchSeconds: integer('avg_watch_seconds').notNull().default(0),
  completionRateBp: integer('completion_rate_bp').notNull().default(0),
  recomputedAt: timestamp('recomputed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mediaViewerReactions = pgTable('media_viewer_reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull(),
  assetId: uuid('asset_id').notNull(),
  viewerId: uuid('viewer_id'),
  kind: text('kind').notNull(), // like | save | share | report | timestamp_comment
  atMs: integer('at_ms').notNull().default(0),
  detail: jsonb('detail').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  assetIdx: index('mvr_asset_idx').on(t.assetId, t.kind),
}));
