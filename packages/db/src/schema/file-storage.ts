/**
 * Domain — File Storage (S3/R2 abstraction with multipart, thumbnails, virus scan).
 * Owner: apps/api-nest/src/modules/file-storage/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, bigint } from 'drizzle-orm/pg-core';

export const storageBuckets = pgTable('storage_buckets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  provider: text('provider').notNull().default('s3'), // s3|r2|gcs|azure|local
  region: text('region'),
  publicRead: boolean('public_read').notNull().default(false),
  cdnUrl: text('cdn_url'),
  retentionDays: integer('retention_days'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const storageObjects = pgTable('storage_objects', {
  id: uuid('id').primaryKey().defaultRandom(),
  bucketId: uuid('bucket_id').notNull(),
  key: text('key').notNull(), // full object path
  ownerIdentityId: uuid('owner_identity_id').notNull(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  checksumSha256: text('checksum_sha256'),
  visibility: text('visibility').notNull().default('private'), // private|public|signed
  uploadStatus: text('upload_status').notNull().default('pending'), // pending|uploading|complete|failed
  scanStatus: text('scan_status').notNull().default('pending'), // pending|clean|infected|skipped
  scanResult: jsonb('scan_result').notNull().default({}),
  variants: jsonb('variants').notNull().default([]), // thumbnails, transcodes
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const storageMultipartUploads = pgTable('storage_multipart_uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  objectId: uuid('object_id').notNull(),
  uploadId: text('upload_id').notNull(), // S3 multipart upload id
  totalParts: integer('total_parts').notNull(),
  completedParts: integer('completed_parts').notNull().default(0),
  status: text('status').notNull().default('in_progress'), // in_progress|completed|aborted
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const storageSignedUrls = pgTable('storage_signed_urls', {
  id: uuid('id').primaryKey().defaultRandom(),
  objectId: uuid('object_id').notNull(),
  url: text('url').notNull(),
  mode: text('mode').notNull(), // read|write
  issuedTo: uuid('issued_to'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumed: boolean('consumed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const storageQuotas = pgTable('storage_quotas', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerIdentityId: uuid('owner_identity_id').notNull().unique(),
  maxBytes: bigint('max_bytes', { mode: 'number' }).notNull(),
  usedBytes: bigint('used_bytes', { mode: 'number' }).notNull().default(0),
  maxObjects: integer('max_objects').notNull().default(100000),
  usedObjects: integer('used_objects').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
