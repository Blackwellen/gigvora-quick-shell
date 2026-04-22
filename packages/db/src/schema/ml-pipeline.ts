/**
 * Drizzle schema for the ML pipeline registry and the ID-Verifier connector
 * matrix. Mirrors `packages/db/migrations/0084_ml_pipeline_and_idverify.sql`.
 *
 * These tables live in the user's own Postgres (DATABASE_URL) and are
 * consumed by the NestJS `ml-pipeline` and `id-verify-connectors` modules.
 */
import {
  pgTable, uuid, text, boolean, integer, numeric, jsonb, timestamp, index,
} from 'drizzle-orm/pg-core';

export const mlModels = pgTable('ml_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  version: text('version').notNull(),
  kind: text('kind').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ kindIdx: index('idx_ml_models_kind').on(t.kind, t.active) }));

export const mlModelPerformance = pgTable('ml_model_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id').notNull().references(() => mlModels.id, { onDelete: 'cascade' }),
  precision: numeric('precision', { precision: 5, scale: 4 }).notNull(),
  recall: numeric('recall', { precision: 5, scale: 4 }).notNull(),
  latencyP95Ms: integer('latency_p95_ms').notNull(),
  uptimePct: numeric('uptime_pct', { precision: 5, scale: 4 }).notNull(),
  sampleSize: integer('sample_size').notNull().default(0),
  sampledAt: timestamp('sampled_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ modelIdx: index('idx_ml_perf_model').on(t.modelId, t.sampledAt) }));

export const mlScores = pgTable('ml_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id').notNull().references(() => mlModels.id, { onDelete: 'cascade' }),
  subjectKind: text('subject_kind').notNull(),
  subjectId: text('subject_id').notNull(),
  score: numeric('score', { precision: 5, scale: 4 }).notNull(),
  band: text('band').notNull(),
  flag: text('flag').notNull(),
  components: jsonb('components').notNull().default([]),
  reason: jsonb('reason').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  subjectIdx: index('idx_ml_scores_subject').on(t.subjectKind, t.subjectId, t.createdAt),
  modelIdx:   index('idx_ml_scores_model').on(t.modelId, t.createdAt),
}));

export const idVerifyConnectors = pgTable('id_verify_connectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull().unique(),
  enabled: boolean('enabled').notNull().default(false),
  priority: integer('priority').notNull().default(100),
  health: text('health').notNull().default('unknown'),
  lastHealthAt: timestamp('last_health_at', { withTimezone: true }),
  configPublic: jsonb('config_public').notNull().default({}),
  configSecretCiphertext: text('config_secret_ciphertext'),
  configSecretIv: text('config_secret_iv'),
  configSecretTag: text('config_secret_tag'),
  configSecretKeyVersion: integer('config_secret_key_version'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
});

export const idVerifyConnectorEvents = pgTable('id_verify_connector_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  connectorId: uuid('connector_id').notNull().references(() => idVerifyConnectors.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id'),
  action: text('action').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
