import { z } from 'zod';

/**
 * Domain 29 — Interview Planning, Scheduling, Scorecards & Internal Panels.
 *
 * State machines:
 *   Interview: draft → scheduled → confirmed → in_progress → completed
 *                              ↘ rescheduled → scheduled
 *                              ↘ cancelled | no_show
 *   Scorecard: pending → in_progress → submitted → calibrated
 *                                                ↘ withdrawn
 *   Calibration: open → decided (hire | no_hire | hold | escalate)
 *   Panel template: draft → published → archived
 */

export const InterviewStatus = z.enum([
  'draft', 'scheduled', 'confirmed', 'in_progress',
  'completed', 'rescheduled', 'cancelled', 'no_show',
]);
export type InterviewStatus = z.infer<typeof InterviewStatus>;

export const ScorecardStatus = z.enum(['pending', 'in_progress', 'submitted', 'calibrated', 'withdrawn']);
export type ScorecardStatus = z.infer<typeof ScorecardStatus>;

export const PanelStatus = z.enum(['draft', 'published', 'archived']);
export type PanelStatus = z.infer<typeof PanelStatus>;

export const CalibrationStatus = z.enum(['open', 'decided']);
export const CalibrationDecision = z.enum(['hire', 'no_hire', 'hold', 'escalate']);
export type CalibrationDecision = z.infer<typeof CalibrationDecision>;

export const InterviewKind = z.enum([
  'phone_screen', 'recruiter_screen', 'technical', 'system_design',
  'behavioural', 'culture', 'panel', 'final_round',
]);
export type InterviewKind = z.infer<typeof InterviewKind>;

export const Recommendation = z.enum(['strong_hire', 'hire', 'no_hire', 'strong_no_hire']);

export const PanelTemplateCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).default(''),
  jobFamily: z.string().trim().min(1).max(120),
  rounds: z.array(z.object({
    name: z.string().min(1).max(120),
    kind: InterviewKind,
    durationMin: z.number().int().min(15).max(240),
    competencies: z.array(z.string().min(1).max(80)).max(12).default([]),
    interviewerRoles: z.array(z.string().min(1).max(80)).max(6).default([]),
  })).min(1).max(10),
  rubric: z.array(z.object({
    competency: z.string().min(1).max(80),
    description: z.string().max(500).default(''),
    weight: z.number().min(0).max(1).default(0.2),
  })).max(20).default([]),
});
export const PanelTemplateUpdateSchema = PanelTemplateCreateSchema.partial();

export const InterviewerSchema = z.object({
  userId: z.string().min(1).max(120),
  name: z.string().min(1).max(160),
  role: z.string().min(1).max(80),
  isLead: z.boolean().default(false),
});

export const InterviewCreateSchema = z.object({
  candidateId: z.string().min(1).max(120),
  candidateName: z.string().min(1).max(160),
  jobId: z.string().min(1).max(120),
  jobTitle: z.string().min(1).max(160),
  panelTemplateId: z.string().min(1).max(120).optional(),
  kind: InterviewKind,
  roundName: z.string().trim().min(1).max(120),
  startAt: z.string().datetime(),
  durationMin: z.number().int().min(15).max(240).default(45),
  timezone: z.string().min(1).max(60).default('Europe/London'),
  location: z.enum(['video', 'onsite', 'phone']).default('video'),
  meetingUrl: z.string().url().max(500).optional(),
  interviewers: z.array(InterviewerSchema).min(1).max(8),
  notes: z.string().trim().max(4000).default(''),
  competencies: z.array(z.string().min(1).max(80)).max(12).default([]),
});
export const InterviewUpdateSchema = InterviewCreateSchema.partial();

export const InterviewListFiltersSchema = z.object({
  status: z.array(InterviewStatus).max(8).optional(),
  jobId: z.string().optional(),
  candidateId: z.string().optional(),
  interviewerId: z.string().optional(),
  kind: z.array(InterviewKind).max(8).optional(),
  q: z.string().trim().max(200).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['startAt', 'updated', 'created']).default('startAt'),
});

export const RescheduleSchema = z.object({
  startAt: z.string().datetime(),
  reason: z.string().trim().max(500).optional(),
  notifyAttendees: z.boolean().default(true),
  idempotencyKey: z.string().min(8).max(120),
});

export const InterviewTransitionSchema = z.object({
  next: InterviewStatus,
  reason: z.string().trim().max(500).optional(),
});

export const ScorecardSubmitSchema = z.object({
  ratings: z.array(z.object({
    competency: z.string().min(1).max(80),
    score: z.number().int().min(1).max(5),
    note: z.string().trim().max(1500).default(''),
  })).min(1).max(20),
  recommendation: Recommendation,
  strengths: z.string().trim().max(3000).default(''),
  concerns: z.string().trim().max(3000).default(''),
  followUps: z.array(z.string().trim().max(300)).max(10).default([]),
  privateNotes: z.string().trim().max(3000).default(''),
  idempotencyKey: z.string().min(8).max(120),
});

export const ScorecardDraftSchema = ScorecardSubmitSchema.partial().extend({
  expectedVersion: z.number().int().min(1).default(1),
});

export const CalibrationOpenSchema = z.object({
  candidateId: z.string().min(1).max(120),
  jobId: z.string().min(1).max(120),
  interviewIds: z.array(z.string().min(1).max(120)).min(1).max(10),
  facilitatorId: z.string().min(1).max(120),
  scheduledAt: z.string().datetime().optional(),
});

export const CalibrationDecideSchema = z.object({
  decision: CalibrationDecision,
  rationale: z.string().trim().min(2).max(4000),
  voteSummary: z.array(z.object({
    userId: z.string().min(1).max(120),
    vote: Recommendation,
  })).max(10).default([]),
  nextSteps: z.array(z.string().trim().max(300)).max(8).default([]),
});

export const PanelListFiltersSchema = z.object({
  status: z.array(PanelStatus).max(3).optional(),
  jobFamily: z.string().optional(),
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});
