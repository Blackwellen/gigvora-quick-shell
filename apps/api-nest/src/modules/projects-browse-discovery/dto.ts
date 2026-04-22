/**
 * Domain 32 — Projects Browse, Search, and Discovery Marketplace
 * DTOs / Zod schemas. Used by the controller for validation, by the SDK for
 * inferred client types, and by the Flutter mobile codegen step.
 */
import { z } from 'zod';

export const ProjectBrowseFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'newest', 'budget_desc', 'budget_asc', 'proposals_asc', 'match', 'ending_soon']).default('relevance'),
  budgetMin: z.number().int().min(0).max(100_000_000).optional(),
  budgetMax: z.number().int().min(0).max(100_000_000).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('GBP'),
  durationBuckets: z.array(z.enum(['lt_1w', '1_4w', '1_3m', '3_6m', '6m_plus'])).max(5).optional(),
  engagement: z.array(z.enum(['fixed', 'hourly', 'milestone', 'retainer'])).max(4).optional(),
  remote: z.enum(['any', 'remote', 'hybrid', 'onsite']).default('any'),
  location: z.string().trim().max(120).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  categories: z.array(z.string().trim().max(60)).max(10).optional(),
  experienceLevel: z.array(z.enum(['entry', 'intermediate', 'expert'])).max(3).optional(),
  postedWithinDays: z.number().int().min(1).max(180).optional(),
  proposalsBelow: z.number().int().min(1).max(500).optional(),
  clientVerified: z.boolean().optional(),
  hasNda: z.boolean().optional(),
  status: z.array(z.enum(['draft', 'open', 'in_review', 'awarded', 'paused', 'completed', 'cancelled'])).max(7).optional(),
  facetMode: z.enum(['none', 'compact', 'full']).default('compact'),
});
export type ProjectBrowseFilters = z.infer<typeof ProjectBrowseFiltersSchema>;

export const SavedProjectSearchSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(120),
  filters: ProjectBrowseFiltersSchema,
  alertsEnabled: z.boolean().default(false),
  alertCadence: z.enum(['off', 'realtime', 'daily', 'weekly']).default('off'),
  pinned: z.boolean().default(false),
  channel: z.enum(['inapp', 'email', 'inapp+email']).default('inapp'),
});
export type SavedProjectSearch = z.infer<typeof SavedProjectSearchSchema>;

export const ProposalDraftSchema = z.object({
  projectId: z.string().uuid(),
  coverLetter: z.string().trim().min(20).max(8000),
  proposedAmount: z.number().int().min(0).max(100_000_000),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('GBP'),
  engagement: z.enum(['fixed', 'hourly', 'milestone', 'retainer']).default('fixed'),
  durationDays: z.number().int().min(1).max(720).optional(),
  milestones: z.array(z.object({
    title: z.string().trim().min(1).max(120),
    amount: z.number().int().min(0),
    dueAt: z.string().datetime().optional(),
  })).max(20).optional(),
  attachmentIds: z.array(z.string().uuid()).max(10).optional(),
});
export type ProposalDraft = z.infer<typeof ProposalDraftSchema>;

export const ProposalDecisionSchema = z.object({
  proposalId: z.string().uuid(),
  decision: z.enum(['shortlist', 'reject', 'accept', 'request_changes']),
  note: z.string().trim().max(2000).optional(),
});
export type ProposalDecision = z.infer<typeof ProposalDecisionSchema>;

export const ProjectFlagSchema = z.object({
  projectId: z.string().uuid(),
  reason: z.enum(['spam', 'misleading', 'duplicate', 'unsafe', 'low_quality', 'other']),
  detail: z.string().trim().max(2000).optional(),
});
export type ProjectFlag = z.infer<typeof ProjectFlagSchema>;

export const ProjectInviteSchema = z.object({
  projectId: z.string().uuid(),
  toIdentityId: z.string().uuid(),
  message: z.string().trim().max(2000).optional(),
});
export type ProjectInvite = z.infer<typeof ProjectInviteSchema>;

export const AttachmentUploadCompleteSchema = z.object({
  projectId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().min(1).max(500_000_000),
  storageKey: z.string().trim().min(1).max(512),
});
export type AttachmentUploadComplete = z.infer<typeof AttachmentUploadCompleteSchema>;

export type ProjectStatus = 'draft' | 'open' | 'in_review' | 'awarded' | 'paused' | 'completed' | 'cancelled';
export type ProposalStatus = 'draft' | 'submitted' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn' | 'changes_requested';
