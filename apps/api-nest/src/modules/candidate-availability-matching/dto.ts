import { z } from 'zod';

/**
 * Domain 31 — Open-to-Work Status, Candidate Availability, and Talent
 * Matching Signals. Routed workbench at /app/candidate-availability-matching.
 *
 * State machines:
 *   AvailabilityProfile.status: draft → active → paused → archived
 *   AvailabilityWindow.status:  scheduled → active → ended | cancelled
 *   MatchSignal.status:         new → viewed → saved | dismissed | converted
 *   MatchInvitation.status:     pending → accepted | declined | expired
 */

export const OpenToWorkVisibility = z.enum(['private', 'recruiters', 'network', 'public']);
export type OpenToWorkVisibility = z.infer<typeof OpenToWorkVisibility>;

export const ProfileStatus = z.enum(['draft', 'active', 'paused', 'archived']);
export type ProfileStatus = z.infer<typeof ProfileStatus>;

export const WindowStatus = z.enum(['scheduled', 'active', 'ended', 'cancelled']);
export const SignalStatus = z.enum(['new', 'viewed', 'saved', 'dismissed', 'converted']);
export const InvitationStatus = z.enum(['pending', 'accepted', 'declined', 'expired']);

export const WorkType = z.enum(['full_time', 'contract', 'part_time', 'freelance', 'internship']);
export const RemotePosture = z.enum(['onsite', 'hybrid', 'remote', 'remote_global']);

const isoDate = z.string().datetime();
const tag = z.string().trim().min(1).max(60);
const url = z.string().trim().url().max(500);

/* ── Availability profile ───────────────────────────────────────────── */
export const ProfileUpsertSchema = z.object({
  visibility: OpenToWorkVisibility.default('recruiters'),
  headline: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(4000).default(''),
  preferredTitles: z.array(tag).max(10).default([]),
  preferredSkills: z.array(tag).max(50).default([]),
  excludedCompanyIds: z.array(z.string().min(1).max(120)).max(50).default([]),
  workTypes: z.array(WorkType).min(1).max(5),
  remote: RemotePosture.default('hybrid'),
  locations: z.array(z.string().trim().min(1).max(120)).max(15).default([]),
  desiredSalaryGbpMin: z.number().int().min(0).max(2_000_000).optional(),
  desiredSalaryGbpMax: z.number().int().min(0).max(2_000_000).optional(),
  noticePeriodDays: z.number().int().min(0).max(365).default(0),
  startBy: isoDate.optional(),
  portfolioUrl: url.optional(),
  resumeUrl: url.optional(),
  languages: z.array(z.string().trim().min(2).max(40)).max(10).default([]),
  consentMarketing: z.boolean().default(false),
}).superRefine((v, ctx) => {
  if (v.desiredSalaryGbpMin != null && v.desiredSalaryGbpMax != null && v.desiredSalaryGbpMin > v.desiredSalaryGbpMax) {
    ctx.addIssue({ code: 'custom', message: 'desiredSalaryGbpMin must be <= desiredSalaryGbpMax', path: ['desiredSalaryGbpMin'] });
  }
});

export const ProfileTransitionSchema = z.object({
  next: ProfileStatus,
  reason: z.string().trim().max(500).optional(),
});

export const ProfileListFiltersSchema = z.object({
  status: z.array(ProfileStatus).max(4).optional(),
  visibility: z.array(OpenToWorkVisibility).max(4).optional(),
  workType: z.array(WorkType).max(5).optional(),
  remote: z.array(RemotePosture).max(4).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['updated', 'created', 'matchScore']).default('updated'),
});

/* ── Availability windows ───────────────────────────────────────────── */
export const WindowUpsertSchema = z.object({
  startsAt: isoDate,
  endsAt: isoDate,
  weeklyHours: z.number().int().min(1).max(80).default(40),
  note: z.string().trim().max(500).default(''),
}).superRefine((v, ctx) => {
  if (Date.parse(v.endsAt) <= Date.parse(v.startsAt)) {
    ctx.addIssue({ code: 'custom', message: 'endsAt must be after startsAt', path: ['endsAt'] });
  }
});

export const WindowCancelSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

/* ── Match signals + invitations ───────────────────────────────────── */
export const SignalListFiltersSchema = z.object({
  profileId: z.string().min(1).max(120).optional(),
  status: z.array(SignalStatus).max(5).optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['score', 'created']).default('score'),
});

export const SignalActionSchema = z.object({
  action: z.enum(['view', 'save', 'dismiss', 'convert']),
  note: z.string().trim().max(2000).optional(),
});

export const InvitationCreateSchema = z.object({
  profileId: z.string().min(1).max(120),
  jobId: z.string().min(1).max(120),
  recruiterId: z.string().min(1).max(120),
  message: z.string().trim().min(1).max(4000),
  expiresAt: isoDate.optional(),
});

export const InvitationDecisionSchema = z.object({
  decision: z.enum(['accept', 'decline']),
  note: z.string().trim().max(2000).optional(),
});

export const InvitationListFiltersSchema = z.object({
  profileId: z.string().optional(),
  status: z.array(InvitationStatus).max(4).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});

/* ── Recruiter-side talent search (consumes the signal index) ─────── */
export const TalentSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  skills: z.array(tag).max(20).optional(),
  workType: z.array(WorkType).max(5).optional(),
  remote: z.array(RemotePosture).max(4).optional(),
  locations: z.array(z.string().trim().min(1).max(120)).max(10).optional(),
  maxNoticeDays: z.number().int().min(0).max(365).optional(),
  salaryGbpMax: z.number().int().min(0).max(2_000_000).optional(),
  visibilityMin: OpenToWorkVisibility.default('recruiters'),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});
