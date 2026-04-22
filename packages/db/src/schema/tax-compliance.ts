/**
 * Domain — Tax & Compliance (VAT, sales tax, 1099/W-9 collection, exemption certs).
 * Owner: apps/api-nest/src/modules/tax-compliance/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const taxRegistrations = pgTable('tax_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  jurisdiction: text('jurisdiction').notNull(), // US-CA, EU-DE, GB, …
  taxId: text('tax_id').notNull(),               // EIN, VAT #, GST #
  registrationName: text('registration_name'),
  active: boolean('active').notNull().default(true),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validTo: timestamp('valid_to', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const taxRates = pgTable('tax_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  jurisdiction: text('jurisdiction').notNull(),
  category: text('category').notNull().default('standard'), // standard|reduced|zero|exempt
  rateBps: integer('rate_bps').notNull(), // 2000 = 20.00%
  appliesFrom: timestamp('applies_from', { withTimezone: true }).notNull(),
  appliesTo: timestamp('applies_to', { withTimezone: true }),
  meta: jsonb('meta').notNull().default({}),
});

export const taxExemptionCertificates = pgTable('tax_exemption_certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerIdentityId: uuid('customer_identity_id').notNull(),
  jurisdiction: text('jurisdiction').notNull(),
  certificateNumber: text('certificate_number').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  documentUrl: text('document_url'),
  status: text('status').notNull().default('active'), // pending|active|expired|revoked
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const taxFormsW9 = pgTable('tax_forms_w9', {
  id: uuid('id').primaryKey().defaultRandom(),
  identityId: uuid('identity_id').notNull(),
  legalName: text('legal_name').notNull(),
  businessName: text('business_name'),
  classification: text('classification').notNull(), // individual|c-corp|s-corp|partnership|llc|other
  tinType: text('tin_type').notNull(), // ssn|ein
  tinEncrypted: text('tin_encrypted').notNull(),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull().default('US'),
  signedAt: timestamp('signed_at', { withTimezone: true }).notNull().defaultNow(),
  signatureName: text('signature_name').notNull(),
  status: text('status').notNull().default('submitted'), // submitted|approved|rejected
  meta: jsonb('meta').notNull().default({}),
});

export const tax1099Forms = pgTable('tax_1099_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  payerIdentityId: uuid('payer_identity_id').notNull(),
  payeeIdentityId: uuid('payee_identity_id').notNull(),
  taxYear: integer('tax_year').notNull(),
  formType: text('form_type').notNull().default('1099-NEC'), // 1099-NEC|1099-MISC|1099-K
  totalPaidCents: integer('total_paid_cents').notNull(),
  status: text('status').notNull().default('draft'), // draft|filed|delivered|corrected|voided
  filedAt: timestamp('filed_at', { withTimezone: true }),
  pdfUrl: text('pdf_url'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const taxCalculations = pgTable('tax_calculations', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id'),
  jurisdiction: text('jurisdiction').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  taxCents: integer('tax_cents').notNull(),
  rateBps: integer('rate_bps').notNull(),
  reverseCharge: boolean('reverse_charge').notNull().default(false),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb('meta').notNull().default({}),
});
