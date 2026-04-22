/**
 * Domain — Contracts & SOW Acceptance.
 *
 * Owns the legal boundary between proposal-award and project-execution:
 *   - Master Service Agreements (MSA) per (client_org, vendor_org) pair
 *   - Statements of Work (SOW) tied to projects/jobs/gigs/services
 *   - Versioned redlines with diff-tracked clauses
 *   - Counterparty signatures (typed, drawn, e-sign provider IDs)
 *   - Acceptance milestones + signed PDF artifacts (object-store keys)
 *   - Lifecycle audit (sent → viewed → countersigned → executed → terminated)
 */
import { pgTable, uuid, text, integer, jsonb, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const masterAgreements = pgTable('master_agreements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  clientOrgId: uuid('client_org_id').notNull(),
  vendorOrgId: uuid('vendor_org_id').notNull(),
  title: text('title').notNull(),
  jurisdiction: text('jurisdiction').notNull().default('US-DE'),
  status: text('status').notNull().default('draft'),   // draft|sent|countersigned|executed|terminated
  effectiveAt: timestamp('effective_at', { withTimezone: true }),
  terminatedAt: timestamp('terminated_at', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pairIdx: uniqueIndex('msa_pair_idx').on(t.tenantId, t.clientOrgId, t.vendorOrgId, t.title),
  statusIdx: index('msa_status_idx').on(t.tenantId, t.status),
  statusCheck: sql`CHECK (status IN ('draft','sent','countersigned','executed','terminated'))`,
}));

export const sowDocuments = pgTable('sow_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  msaId: uuid('msa_id'),
  scopeKind: text('scope_kind').notNull(),             // project|job|gig|service|retainer
  scopeId: uuid('scope_id').notNull(),
  title: text('title').notNull(),
  totalCents: integer('total_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  paymentTerms: text('payment_terms').notNull().default('net30'),
  status: text('status').notNull().default('draft'),   // draft|sent|viewed|countersigned|executed|cancelled|expired
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  pdfStorageKey: text('pdf_storage_key'),              // object-store path of frozen PDF
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  scopeIdx: index('sow_scope_idx').on(t.tenantId, t.scopeKind, t.scopeId),
  msaIdx: index('sow_msa_idx').on(t.msaId),
  statusIdx: index('sow_status_idx').on(t.tenantId, t.status),
  scopeKindCheck: sql`CHECK (scope_kind IN ('project','job','gig','service','retainer'))`,
  statusCheck: sql`CHECK (status IN ('draft','sent','viewed','countersigned','executed','cancelled','expired'))`,
}));

export const sowVersions = pgTable('sow_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sowId: uuid('sow_id').notNull(),
  versionNumber: integer('version_number').notNull(),
  authorId: uuid('author_id').notNull(),
  body: jsonb('body').notNull().default({}),           // structured clauses
  diff: jsonb('diff').notNull().default({}),           // diff vs previous version
  isCurrent: boolean('is_current').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sowVersionIdx: uniqueIndex('sow_version_unique_idx').on(t.sowId, t.versionNumber),
  currentIdx: index('sow_version_current_idx').on(t.sowId, t.isCurrent),
}));

export const sowSignatures = pgTable('sow_signatures', {
  id: uuid('id').primaryKey().defaultRandom(),
  sowId: uuid('sow_id').notNull(),
  versionId: uuid('version_id').notNull(),
  signerId: uuid('signer_id').notNull(),
  signerRole: text('signer_role').notNull(),           // client|vendor|witness
  method: text('method').notNull().default('typed'),   // typed|drawn|esign
  externalProvider: text('external_provider'),         // docusign|hellosign|adobesign|null
  externalEnvelopeId: text('external_envelope_id'),
  signedAt: timestamp('signed_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  signatureData: text('signature_data'),               // base64 PNG for drawn, or typed name
}, (t) => ({
  sigSowIdx: index('sow_sig_sow_idx').on(t.sowId, t.signerRole),
  sigUnique: uniqueIndex('sow_sig_unique_idx').on(t.versionId, t.signerId),
  roleCheck: sql`CHECK (signer_role IN ('client','vendor','witness'))`,
  methodCheck: sql`CHECK (method IN ('typed','drawn','esign'))`,
}));

export const sowEvents = pgTable('sow_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  sowId: uuid('sow_id').notNull(),
  actorId: uuid('actor_id'),
  kind: text('kind').notNull(),                        // sent|viewed|countersigned|executed|cancelled|expired
  payload: jsonb('payload').notNull().default({}),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byEvent: index('sow_event_idx').on(t.sowId, t.occurredAt),
}));

export type MasterAgreementRow = typeof masterAgreements.$inferSelect;
export type SowDocumentRow = typeof sowDocuments.$inferSelect;
export type SowVersionRow = typeof sowVersions.$inferSelect;
export type SowSignatureRow = typeof sowSignatures.$inferSelect;
export type SowEventRow = typeof sowEvents.$inferSelect;
