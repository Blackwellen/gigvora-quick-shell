/**
 * Domain 18 — Calls (1:1 + group voice/video calls, recordings, transcripts).
 *
 * Distinct from D17 (Calendar): Calendar owns scheduled time blocks. Calls
 * owns the live session lifecycle: room provisioning, participant join/leave
 * timeline, recording artefacts, and post-call transcripts/summaries.
 *
 * Distinct from D16 (Booking): Booking owns transactional inventory.
 */
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const callRooms = pgTable('call_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  ownerId: uuid('owner_id').notNull(),
  kind: text('kind').notNull().default('adhoc'),       // adhoc | scheduled | broadcast | webinar
  topic: text('topic'),
  provider: text('provider').notNull().default('internal'), // internal | livekit | twilio | daily | zoom
  externalRoomId: text('external_room_id'),
  capacity: integer('capacity').notNull().default(8),
  recordingEnabled: boolean('recording_enabled').notNull().default(false),
  transcriptEnabled: boolean('transcript_enabled').notNull().default(false),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tenantIdx: index('call_rooms_tenant_idx').on(t.tenantId, t.kind),
  ownerIdx:  index('call_rooms_owner_idx').on(t.ownerId),
}));

export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  initiatorId: uuid('initiator_id').notNull(),
  status: text('status').notNull().default('ringing'),  // ringing | live | ended | missed | failed
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  endedReason: text('ended_reason'),                    // hangup | timeout | provider-error | kicked
  qualityScore: integer('quality_score'),               // 0-100 MOS proxy
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  roomIdx:    index('calls_room_idx').on(t.roomId, t.startedAt),
  tenantIdx:  index('calls_tenant_idx').on(t.tenantId, t.status),
}));

export const callParticipants = pgTable('call_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id').notNull(),
  participantId: uuid('participant_id').notNull(),
  role: text('role').notNull().default('participant'),  // host | participant | observer
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  leftAt: timestamp('left_at', { withTimezone: true }),
  audioMuted: boolean('audio_muted').notNull().default(false),
  videoOff: boolean('video_off').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  callIdx:        index('call_participants_call_idx').on(t.callId),
  participantIdx: index('call_participants_participant_idx').on(t.participantId),
  uniquePart:     uniqueIndex('call_participants_unique_idx').on(t.callId, t.participantId),
}));

export const callRecordings = pgTable('call_recordings', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id').notNull(),
  storageKey: text('storage_key').notNull(),
  mimeType: text('mime_type').notNull().default('video/mp4'),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  sizeBytes: integer('size_bytes').notNull().default(0),
  status: text('status').notNull().default('processing'), // processing | ready | failed | expired
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  callIdx: index('call_recordings_call_idx').on(t.callId),
}));

export const callTranscripts = pgTable('call_transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id').notNull(),
  language: text('language').notNull().default('en'),
  status: text('status').notNull().default('processing'), // processing | ready | failed
  segments: jsonb('segments').notNull().default([]),      // [{startMs, endMs, speakerId, text}]
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  callIdx: uniqueIndex('call_transcripts_call_idx').on(t.callId),
}));

export const callEvents = pgTable('call_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id').notNull(),
  kind: text('kind').notNull(),
  actor: text('actor').notNull(),
  detail: jsonb('detail').notNull().default({}),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  callIdx: index('call_events_call_idx').on(t.callId, t.at),
}));
