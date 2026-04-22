import { z } from 'zod';

/**
 * Domain 26 — Recruiter Job Management Dashboard and Role Requisition Controls.
 *
 * State machines:
 *   Requisition: draft → pending_approval → approved → opened → (paused ↔ opened) → filled | cancelled → archived
 *   Job (managed): draft → active → (paused ↔ active) → closed → archived
 *   Approval step: pending → approved | rejected | escalated
 */

export const RequisitionStatus = z.enum([
  'draft', 'pending_approval', 'approved', 'opened', 'paused',
  'filled', 'cancelled', 'archived',
]);
export type RequisitionStatus = z.infer<typeof RequisitionStatus>;

export const JobStatus = z.enum(['draft', 'active', 'paused', 'closed', 'archived']);
export type JobStatus = z.infer<typeof JobStatus>;

export const RequisitionCreateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  department: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(160),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship']).default('full_time'),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead', 'principal', 'executive']).default('mid'),
  headcount: z.number().int().min(1).max(50).default(1),
  budgetAnnualGbp: z.number().int().min(0).max(2_000_000).optional(),
  hiringManagerId: z.string().min(1).max(120),
  recruiterIds: z.array(z.string().min(1).max(120)).max(10).default([]),
  description: z.string().trim().max(8000).default(''),
  mustHaves: z.array(z.string().trim().max(120)).max(20).default([]),
  niceToHaves: z.array(z.string().trim().max(120)).max(20).default([]),
  approvers: z.array(z.object({
    userId: z.string().min(1).max(120),
    name: z.string().min(1).max(120),
    role: z.string().min(1).max(80),
    order: z.number().int().min(0).max(20),
  })).max(10).default([]),
  targetStartDate: z.string().datetime().optional(),
});

export const RequisitionUpdateSchema = RequisitionCreateSchema.partial();

export const ListFiltersSchema = z.object({
  status: z.array(RequisitionStatus).max(8).optional(),
  department: z.string().optional(),
  hiringManagerId: z.string().optional(),
  recruiterId: z.string().optional(),
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['updated', 'created', 'title', 'priority']).default('updated'),
});

export const JobListFiltersSchema = z.object({
  status: z.array(JobStatus).max(5).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['updated', 'created', 'title', 'applicants']).default('updated'),
});

export const ApprovalDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'escalate']),
  note: z.string().trim().max(2000).optional(),
});

export const TransitionSchema = z.object({
  next: RequisitionStatus,
  reason: z.string().trim().max(500).optional(),
});

export const JobTransitionSchema = z.object({
  next: JobStatus,
  reason: z.string().trim().max(500).optional(),
});

export const BulkRequisitionSchema = z.object({
  ids: z.array(z.string().min(1).max(120)).min(1).max(100),
  action: z.enum(['archive', 'pause', 'resume', 'cancel']),
  reason: z.string().trim().max(500).optional(),
});

export const AssignSchema = z.object({
  recruiterIds: z.array(z.string().min(1).max(120)).min(1).max(10),
});

export const PublishToJobSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  postingChannels: z.array(z.enum(['internal', 'careers_site', 'job_board', 'linkedin'])).max(6).default(['internal', 'careers_site']),
});
