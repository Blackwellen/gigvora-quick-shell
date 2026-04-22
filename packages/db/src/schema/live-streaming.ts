/**
 * Domain — Live Streaming (RTMP/SRT ingest, HLS/LL-HLS playback).
 * Owner: apps/api-nest/src/modules/live-streaming/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const liveStreams = pgTable('live_streams', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('scheduled'), // scheduled|live|ended|cancelled
  ingestProtocol: text('ingest_protocol').notNull().default('rtmp'), // rtmp|srt|whip
  ingestUrl: text('ingest_url').notNull(),
  streamKey: text('stream_key').notNull(),
  playbackUrl: text('playback_url'),
  hlsUrl: text('hls_url'),
  llhlsUrl: text('ll_hls_url'),
  dashUrl: text('dash_url'),
  thumbnailUrl: text('thumbnail_url'),
  maxResolution: text('max_resolution').notNull().default('1080p'), // 720p|1080p|4k|8k
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  peakViewers: integer('peak_viewers').notNull().default(0),
  totalViewers: integer('total_viewers').notNull().default(0),
  recordingEnabled: boolean('recording_enabled').notNull().default(true),
  recordingUrl: text('recording_url'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const liveStreamViewers = pgTable('live_stream_viewers', {
  id: uuid('id').primaryKey().defaultRandom(),
  streamId: uuid('stream_id').notNull(),
  viewerId: uuid('viewer_id'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  leftAt: timestamp('left_at', { withTimezone: true }),
  watchSeconds: integer('watch_seconds').notNull().default(0),
  device: text('device'),
  resolutionWatched: text('resolution_watched'),
});

export const liveStreamChat = pgTable('live_stream_chat', {
  id: uuid('id').primaryKey().defaultRandom(),
  streamId: uuid('stream_id').notNull(),
  authorId: uuid('author_id').notNull(),
  body: text('body').notNull(),
  pinned: boolean('pinned').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
