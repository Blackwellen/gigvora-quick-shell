/**
 * Domain — Auth (credentials, sessions, OAuth, MFA, password resets).
 *
 * Strict separation from `identity.ts`: an identity is the canonical "who",
 * auth holds the "how do they prove it". Passwords are stored as Argon2id
 * hashes; OAuth tokens are KMS-sealed.
 */
import { pgTable, uuid, text, integer, jsonb, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const authCredentials = pgTable('auth_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  passwordHash: text('password_hash'),               // Argon2id; null when only OAuth
  passwordUpdatedAt: timestamp('password_updated_at', { withTimezone: true }),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqIdentity: uniqueIndex('ac_identity_idx').on(t.identityId),
  attemptsCheck: sql`CHECK (failed_attempts >= 0)`,
}));

export const authSessions = pgTable('auth_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  refreshTokenHash: text('refresh_token_hash'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  device: jsonb('device').notNull().default({}),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedReason: text('revoked_reason'),
}, (t) => ({
  uniqToken: uniqueIndex('as_token_idx').on(t.tokenHash),
  byIdentity: index('as_identity_idx').on(t.identityId, t.expiresAt),
}));

export const authOauthConnections = pgTable('auth_oauth_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  provider: text('provider').notNull(),              // google|github|microsoft|linkedin|apple
  providerSubject: text('provider_subject').notNull(),
  email: text('email'),
  accessTokenCiphertext: text('access_token_ciphertext'),
  refreshTokenCiphertext: text('refresh_token_ciphertext'),
  scopesGranted: jsonb('scopes_granted').notNull().default([]),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
  unlinkedAt: timestamp('unlinked_at', { withTimezone: true }),
}, (t) => ({
  uniqProviderSubject: uniqueIndex('aoc_provider_subject_idx').on(t.provider, t.providerSubject),
  byIdentity: index('aoc_identity_idx').on(t.identityId, t.provider),
  providerCheck: sql`CHECK (provider IN ('google','github','microsoft','linkedin','apple'))`,
}));

export const authMfaFactors = pgTable('auth_mfa_factors', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  kind: text('kind').notNull(),                      // totp|webauthn|sms|backup_code
  label: text('label').notNull().default(''),
  secretCiphertext: text('secret_ciphertext'),
  publicKey: text('public_key'),
  counter: integer('counter').notNull().default(0),
  status: text('status').notNull().default('active'), // pending|active|disabled
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byIdentity: index('amf_identity_idx').on(t.identityId, t.status),
  kindCheck: sql`CHECK (kind IN ('totp','webauthn','sms','backup_code'))`,
  statusCheck: sql`CHECK (status IN ('pending','active','disabled'))`,
}));

export const authPasswordResets = pgTable('auth_password_resets', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  ipAddress: text('ip_address'),
}, (t) => ({
  uniqToken: uniqueIndex('apr_token_idx').on(t.tokenHash),
  byIdentity: index('apr_identity_idx').on(t.identityId, t.requestedAt),
}));

export const authIssuedTokens = pgTable('auth_issued_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  kind: text('kind').notNull(),                      // api_key|personal_access_token|service_token
  label: text('label').notNull(),
  tokenHash: text('token_hash').notNull(),
  scopes: jsonb('scopes').notNull().default([]),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqToken: uniqueIndex('ait_token_idx').on(t.tokenHash),
  byIdentity: index('ait_identity_idx').on(t.identityId, t.kind),
  kindCheck: sql`CHECK (kind IN ('api_key','personal_access_token','service_token'))`,
}));

export type AuthCredentialRow = typeof authCredentials.$inferSelect;
export type AuthSessionRow = typeof authSessions.$inferSelect;
export type AuthOauthConnectionRow = typeof authOauthConnections.$inferSelect;
export type AuthMfaFactorRow = typeof authMfaFactors.$inferSelect;
export type AuthIssuedTokenRow = typeof authIssuedTokens.$inferSelect;
