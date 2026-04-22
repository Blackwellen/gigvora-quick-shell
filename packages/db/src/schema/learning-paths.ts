/**
 * Domain — Learning Paths (courses → modules → lessons → enrollments → certificates).
 * Owner: apps/api-nest/src/modules/learning-paths/
 */
import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const learningCourses = pgTable('learning_courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorIdentityId: uuid('author_identity_id').notNull(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  level: text('level').notNull().default('beginner'), // beginner|intermediate|advanced
  language: text('language').notNull().default('en'),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  priceCents: integer('price_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('draft'), // draft|published|archived
  coverUrl: text('cover_url'),
  tags: jsonb('tags').notNull().default([]),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const learningModules = pgTable('learning_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull(),
  title: text('title').notNull(),
  position: integer('position').notNull().default(0),
});

export const learningLessons = pgTable('learning_lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull(),
  title: text('title').notNull(),
  position: integer('position').notNull().default(0),
  contentType: text('content_type').notNull().default('video'), // video|text|quiz|assignment
  contentUrl: text('content_url'),
  contentBody: text('content_body'),
  durationSeconds: integer('duration_seconds').notNull().default(0),
});

export const learningEnrollments = pgTable('learning_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull(),
  studentIdentityId: uuid('student_identity_id').notNull(),
  status: text('status').notNull().default('active'), // active|completed|cancelled|refunded
  progressPct: integer('progress_pct').notNull().default(0),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const learningProgress = pgTable('learning_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  enrollmentId: uuid('enrollment_id').notNull(),
  lessonId: uuid('lesson_id').notNull(),
  status: text('status').notNull().default('in_progress'), // in_progress|completed
  watchedSeconds: integer('watched_seconds').notNull().default(0),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const learningCertificates = pgTable('learning_certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  enrollmentId: uuid('enrollment_id').notNull().unique(),
  studentIdentityId: uuid('student_identity_id').notNull(),
  courseId: uuid('course_id').notNull(),
  certificateNumber: text('certificate_number').notNull().unique(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  pdfUrl: text('pdf_url'),
});
