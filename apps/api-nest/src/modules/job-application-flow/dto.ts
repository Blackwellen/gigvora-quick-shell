import { z } from 'zod';

/**
 * Domain 25 — Job Application Flow, Candidate Forms, and Submission Review.
 *
 * State machines:
 *   Application: draft → submitted → under_review → (interview ↔ on_hold) → decision (offered | rejected | withdrawn) → archived
 *   Form template: draft → published → archived
 *   Field response: pending → completed | invalid
 *   Review: open → in_review → completed
 */

export const ApplicationStatus = z.enum([
  'draft', 'submitted', 'under_review', 'interview', 'on_hold',
  'offered', 'rejected', 'withdrawn', 'archived',
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

export const FormFieldType = z.enum([
  'short_text', 'long_text', 'email', 'phone', 'url',
  'select', 'multi_select', 'file', 'date', 'number', 'boolean', 'address',
]);

export const FormFieldSchema = z.object({
  key: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_]+$/),
  label: z.string().trim().min(1).max(200),
  type: FormFieldType,
  required: z.boolean().default(false),
  helpText: z.string().trim().max(500).optional(),
  options: z.array(z.string().trim().max(80)).max(50).optional(),
  maxLength: z.number().int().min(1).max(20_000).optional(),
  acceptMime: z.array(z.string().trim().max(100)).max(20).optional(),
  visibility: z.enum(['public', 'private', 'internal']).default('public'),
});
export type FormField = z.infer<typeof FormFieldSchema>;

export const FormTemplateCreateSchema = z.object({
  jobId: z.string().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(''),
  fields: z.array(FormFieldSchema).min(1).max(40),
  consents: z.array(z.object({
    key: z.string().trim().min(1).max(64),
    label: z.string().trim().min(1).max(500),
    required: z.boolean().default(true),
  })).max(10).default([]),
});

export const FormTemplateUpdateSchema = FormTemplateCreateSchema.partial();

export const ApplicationDraftSchema = z.object({
  jobId: z.string().min(1).max(120),
  templateId: z.string().min(1).max(120),
  responses: z.record(z.string().min(1).max(64), z.unknown()).default({}),
  attachments: z.array(z.object({
    key: z.string().min(1).max(64),
    fileName: z.string().min(1).max(240),
    storageUrl: z.string().min(1).max(500),  // local://… by default
    sizeBytes: z.number().int().min(0).max(50 * 1024 * 1024),
    mime: z.string().min(1).max(120),
  })).max(20).default([]),
  acceptedConsents: z.array(z.string().trim().min(1).max(64)).max(10).default([]),
  voluntary: z.object({
    diversity: z.record(z.string().min(1).max(64), z.string().max(120)).optional(),
  }).optional(),
});
export type ApplicationDraft = z.infer<typeof ApplicationDraftSchema>;

export const ApplicationUpdateSchema = ApplicationDraftSchema.partial();

export const ApplicationSubmitSchema = z.object({
  applicationId: z.string().min(1).max(120),
  idempotencyKey: z.string().min(8).max(120),
});

export const ListFiltersSchema = z.object({
  jobId: z.string().optional(),
  status: z.array(ApplicationStatus).max(9).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['updated', 'submitted', 'score', 'title']).default('updated'),
});

export const ReviewDecisionSchema = z.object({
  decision: z.enum(['advance', 'reject', 'hold', 'offer', 'withdraw_invite']),
  stage: z.enum(['screening', 'interview', 'final', 'offer']).default('screening'),
  note: z.string().trim().max(2000).optional(),
  scorecard: z.object({
    skill: z.number().min(0).max(10).optional(),
    culture: z.number().min(0).max(10).optional(),
    communication: z.number().min(0).max(10).optional(),
    overall: z.number().min(0).max(10).optional(),
  }).optional(),
});

export const BulkActionSchema = z.object({
  ids: z.array(z.string().min(1).max(120)).min(1).max(200),
  action: z.enum(['advance', 'reject', 'archive', 'hold']),
  note: z.string().trim().max(1000).optional(),
});

export const WithdrawSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
