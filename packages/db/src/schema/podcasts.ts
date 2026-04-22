/**
 * Domain 28 — Podcasts.
 * Shows, episodes, RSS distribution, transcripts, chapter markers and
 * monetization (sponsor reads + donations) tracked per episode.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const podcastShows = pgTable('podcast_shows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  ownerId: uuid('owner_id').notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  tagline: text('tagline'),
  description: text('description').notNull().default(''),
  language: text('language').notNull().default('en'),
  category: text('category'),
  artworkKey: text('artwork_key'),
  rssUrl: text('rss_url'),
  status: text('status').notNull().default('draft'), // draft | published | archived
  monetization: text('monetization').notNull().default('none'), // none | sponsor | donations | both
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqSlug: uniqueIndex('psh_tenant_slug_idx').on(t.tenantId, t.slug),
}));

export const podcastEpisodes = pgTable('podcast_episodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  showId: uuid('show_id').notNull(),
  number: integer('number').notNull(),
  season: integer('season').notNull().default(1),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description').notNull().default(''),
  audioKey: text('audio_key').notNull(),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  status: text('status').notNull().default('draft'), // draft | scheduled | published | unlisted | archived
  publishAt: timestamp('publish_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  explicit: boolean('explicit').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('pep_show_number_idx').on(t.showId, t.season, t.number),
  showStatusIdx: index('pep_show_status_idx').on(t.showId, t.status, t.publishedAt),
}));

export const podcastChapters = pgTable('podcast_chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  episodeId: uuid('episode_id').notNull(),
  startMs: integer('start_ms').notNull(),
  title: text('title').notNull(),
  url: text('url'),
}, (t) => ({
  episodeIdx: index('pch_episode_idx').on(t.episodeId, t.startMs),
}));

export const podcastTranscripts = pgTable('podcast_transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  episodeId: uuid('episode_id').notNull(),
  language: text('language').notNull().default('en'),
  status: text('status').notNull().default('processing'), // processing | ready | failed
  segments: jsonb('segments').notNull().default([]), // [{startMs,endMs,speaker,text}]
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('ptr_episode_idx').on(t.episodeId),
}));

export const podcastSubscriptions = pgTable('podcast_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  showId: uuid('show_id').notNull(),
  subscriberId: uuid('subscriber_id').notNull(),
  tier: text('tier').notNull().default('free'), // free | supporter | premium
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
}, (t) => ({
  uniq: uniqueIndex('psub_show_subscriber_idx').on(t.showId, t.subscriberId),
}));

export const podcastListens = pgTable('podcast_listens', {
  id: uuid('id').primaryKey().defaultRandom(),
  episodeId: uuid('episode_id').notNull(),
  listenerId: uuid('listener_id'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  listenedSeconds: integer('listened_seconds').notNull().default(0),
  completedPct: integer('completed_pct').notNull().default(0),
  surface: text('surface').notNull().default('web'), // web | ios | android | rss | embed
}, (t) => ({
  episodeIdx: index('plt_episode_idx').on(t.episodeId, t.startedAt),
}));

export const podcastSponsorships = pgTable('podcast_sponsorships', {
  id: uuid('id').primaryKey().defaultRandom(),
  episodeId: uuid('episode_id').notNull(),
  sponsorName: text('sponsor_name').notNull(),
  positionMs: integer('position_ms').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0),
  cpmCents: integer('cpm_cents').notNull().default(0),
  impressions: integer('impressions').notNull().default(0),
  revenueCents: integer('revenue_cents').notNull().default(0),
  metadata: jsonb('metadata').notNull().default({}),
}, (t) => ({
  episodeIdx: index('psp_episode_idx').on(t.episodeId),
}));
