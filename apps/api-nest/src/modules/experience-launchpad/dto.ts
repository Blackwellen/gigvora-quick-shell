import { z } from 'zod';

export const PathwayCreateSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(200),
  summary: z.string().max(2000).default(''),
  domain: z.string().min(1).max(64).default('general'),
  level: z.enum(['starter', 'intermediate', 'advanced']).default('starter'),
  duration_weeks: z.number().int().min(1).max(52).default(6),
  hero_image_url: z.string().url().optional(),
  outcomes: z.array(z.string().max(280)).max(20).default([]),
  modules: z.array(z.any()).max(40).default([]),
  tags: z.array(z.string().max(48)).max(20).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
});

export const EnrollSchema = z.object({ pathway_id: z.string().uuid() });
export const ProgressSchema = z.object({
  pathway_id: z.string().uuid(),
  progress_pct: z.number().int().min(0).max(100),
});

export const MentorUpsertSchema = z.object({
  display_name: z.string().min(1).max(200),
  headline: z.string().max(280).default(''),
  bio: z.string().max(4000).default(''),
  expertise: z.array(z.string().max(48)).max(20).default([]),
  industries: z.array(z.string().max(48)).max(20).default([]),
  rate_amount: z.number().int().min(0).max(1_000_000).default(0),
  rate_currency: z.string().length(3).default('USD'),
  status: z.enum(['available', 'booked', 'waitlist', 'paused']).default('available'),
  availability: z.array(z.any()).max(60).default([]),
});

export const MentorBookingSchema = z.object({
  mentor_id: z.string().uuid(),
  scheduled_for: z.string().datetime(),
  duration_min: z.number().int().min(15).max(240).default(30),
  topic: z.string().max(280).default(''),
});

export const ChallengeCreateSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(200),
  brief: z.string().max(8000).default(''),
  sponsor: z.string().max(160).optional(),
  sponsor_logo: z.string().url().optional(),
  prize_amount: z.number().int().min(0).max(1_000_000_00).default(0),
  prize_currency: z.string().length(3).default('USD'),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime(),
  status: z.enum(['draft', 'open', 'judging', 'closed']).default('open'),
  tags: z.array(z.string().max(48)).max(20).default([]),
  rubric: z.array(z.any()).max(20).default([]),
});

export const SubmissionCreateSchema = z.object({
  challenge_id: z.string().uuid(),
  title: z.string().min(2).max(200),
  summary: z.string().max(4000).default(''),
  asset_urls: z.array(z.string().url()).max(20).default([]),
});

export const OpportunityCreateSchema = z.object({
  kind: z.enum(['internship', 'graduate', 'fellowship', 'apprenticeship', 'project', 'event', 'job']),
  title: z.string().min(2).max(200),
  org_name: z.string().min(1).max(200),
  location: z.string().max(200).default('Remote'),
  salary_band: z.string().max(80).optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  level: z.string().max(48).default('entry'),
  tags: z.array(z.string().max(48)).max(20).default([]),
  link_href: z.string().url().optional(),
  description: z.string().max(8000).default(''),
});
