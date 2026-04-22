/**
 * Domain 08 — Settings, Preferences, Connections & GDPR Requests.
 *
 * Mirrors apps/api-nest/src/modules/settings/* shape one-for-one so
 * SettingsRepository can swap from TypeORM raw queries to Drizzle without
 * touching the service layer.
 */
import { pgTable, text, jsonb, timestamp, uuid, index, uniqueIndex, boolean } from 'drizzle-orm/pg-core';

/** Per-identity key/value preferences, scoped by namespace. */
export const settings = pgTable('settings', {
  id:          uuid('id').defaultRandom().primaryKey(),
  identityId:  uuid('identity_id').notNull(),
  namespace:   text('namespace').notNull(),                 // appearance | privacy | notifications | locale | timezone | accessibility | security | integrations
  key:         text('key').notNull(),
  value:       jsonb('value').notNull().default({} as any),
  scope:       text('scope').notNull().default('user'),     // user | tenant
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  identNsIdx:  index('settings_ident_ns_idx').on(t.identityId, t.namespace),
  uniqKey:     uniqueIndex('settings_ident_ns_key_uq').on(t.identityId, t.namespace, t.key),
}));

/** OAuth / SSO / external service connections. */
export const settingsConnectedAccounts = pgTable('settings_connected_accounts', {
  id:           uuid('id').defaultRandom().primaryKey(),
  identityId:   uuid('identity_id').notNull(),
  provider:     text('provider').notNull(),                 // google | linkedin | github | slack | hubspot | greenhouse | stripe | …
  externalId:   text('external_id').notNull(),
  displayName:  text('display_name'),
  scopes:       jsonb('scopes').$type<string[]>().default([]).notNull(),
  status:       text('status').notNull().default('active'), // active | revoked | expired
  metadata:     jsonb('metadata').default({} as any).notNull(),
  connectedAt:  timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  revokedAt:    timestamp('revoked_at', { withTimezone: true }),
}, (t) => ({
  identIdx:    index('sca_ident_idx').on(t.identityId),
  uniqProv:    uniqueIndex('sca_ident_provider_external_uq').on(t.identityId, t.provider, t.externalId),
}));

/** GDPR / DPIA: export, delete, restrict, rectify requests. */
export const settingsDataRequests = pgTable('settings_data_requests', {
  id:          uuid('id').defaultRandom().primaryKey(),
  identityId:  uuid('identity_id').notNull(),
  kind:        text('kind').notNull(),                      // export | delete | rectify | restrict | portability
  status:      text('status').notNull().default('pending'), // pending | processing | completed | rejected | failed
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
  reason:      text('reason'),
  resultUri:   text('result_uri'),
  meta:        jsonb('meta').default({} as any).notNull(),
}, (t) => ({
  identIdx:    index('sdr_ident_idx').on(t.identityId),
  statusIdx:   index('sdr_status_idx').on(t.status),
}));

/** Optional locale/tz catalogue cache (sourced from CLDR/IANA). */
export const settingsCatalogue = pgTable('settings_catalogue', {
  kind:    text('kind').notNull(),                          // locale | timezone | currency
  code:    text('code').notNull(),
  label:   text('label').notNull(),
  active:  boolean('active').notNull().default(true),
  meta:    jsonb('meta').default({} as any).notNull(),
}, (t) => ({
  pk:      uniqueIndex('settings_catalogue_kind_code_uq').on(t.kind, t.code),
}));
