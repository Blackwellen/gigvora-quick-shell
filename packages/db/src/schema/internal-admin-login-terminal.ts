/**
 * Domain 65 — Internal Admin Login Terminal, Secure Entry & Environment Selection.
 *
 * Tables (`ialt_*`):
 *   ialt_environments    — selectable environments (prod/staging/sandbox/dev) with risk band
 *   ialt_operators       — internal staff registry (linked to identity_id) + role
 *   ialt_sessions        — issued admin sessions (env + step-up state + expiry)
 *   ialt_login_attempts  — append-only attempt log (success/failure + reason)
 *   ialt_lockouts        — active lockouts (per identity / per IP)
 *   ialt_audit_events    — audit trail (entry, env switch, step-up, override)
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, index, unique } from 'drizzle-orm/pg-core';

export const ialtEnvironments = pgTable('ialt_environments', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),                 // prod|staging|sandbox|dev
  label: text('label').notNull(),
  riskBand: text('risk_band').notNull().default('low'), // low|medium|high|critical
  status: text('status').notNull().default('active'),   // active|paused|archived
  requiresStepUp: boolean('requires_step_up').notNull().default(false),
  ipAllowlist: jsonb('ip_allowlist').notNull().default([]),
  bannerText: text('banner_text'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqSlug: unique('uniq_ialt_env_slug').on(t.slug) }));

export const ialtOperators = pgTable('ialt_operators', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('operator'), // operator|moderator|finance|trust_safety|super_admin
  status: text('status').notNull().default('active'), // active|paused|revoked
  mfaEnrolled: boolean('mfa_enrolled').notNull().default(false),
  allowedEnvs: jsonb('allowed_envs').notNull().default(['sandbox']),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqIdentity: unique('uniq_ialt_op_identity').on(t.identityId),
  uniqEmail: unique('uniq_ialt_op_email').on(t.email),
  byRole: index('idx_ialt_op_role').on(t.role, t.status),
}));

export const ialtSessions = pgTable('ialt_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  operatorId: uuid('operator_id').notNull(),
  environmentSlug: text('environment_slug').notNull(),
  status: text('status').notNull().default('active'), // active|stepup_pending|expired|revoked
  stepUpVerifiedAt: timestamp('step_up_verified_at', { withTimezone: true }),
  ip: text('ip'),
  userAgent: text('user_agent'),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  byOperator: index('idx_ialt_sess_op').on(t.operatorId, t.status, t.expiresAt),
}));

export const ialtLoginAttempts = pgTable('ialt_login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id'),
  email: text('email'),
  environmentSlug: text('environment_slug'),
  outcome: text('outcome').notNull(), // success|invalid_credentials|mfa_failed|locked|env_forbidden|ip_forbidden|inactive|unknown
  ip: text('ip'),
  userAgent: text('user_agent'),
  reason: text('reason'),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb('meta').notNull().default({}),
}, (t) => ({
  byIdentity: index('idx_ialt_att_identity').on(t.identityId, t.attemptedAt),
  byIp: index('idx_ialt_att_ip').on(t.ip, t.attemptedAt),
}));

export const ialtLockouts = pgTable('ialt_lockouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  scope: text('scope').notNull(), // identity|ip
  scopeKey: text('scope_key').notNull(),
  reason: text('reason').notNull(),
  failedCount: integer('failed_count').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqScope: unique('uniq_ialt_lock_scope').on(t.scope, t.scopeKey),
  byUntil: index('idx_ialt_lock_until').on(t.lockedUntil),
}));

export const ialtAuditEvents = pgTable('ialt_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  operatorId: uuid('operator_id'),
  identityId: uuid('identity_id'),
  action: text('action').notNull(),
  environmentSlug: text('environment_slug'),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  diff: jsonb('diff').notNull().default({}),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOp: index('idx_ialt_audit_op').on(t.operatorId, t.createdAt) }));
