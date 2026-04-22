import { z } from 'zod';

export const VC_STATUS  = z.enum(['pending','reviewing','holding','approved','rejected','escalated','expired','archived']);
export const VC_QUEUE   = z.enum(['triage','review','escalation','closed']);
export const VC_PROGRAM = z.enum(['kyc','kyb','aml','sanctions','address','tax','accreditation','right_to_work','professional_licence']);
export const VC_SUBJECT = z.enum(['user','professional','enterprise','agency']);
export const VC_DOC     = z.enum(['passport','national_id','driving_licence','utility_bill','bank_statement','selfie','company_reg','tax_id','licence','other']);
export const VC_CHECK   = z.enum(['document','facial_similarity','watchlist','pep','sanctions','address','company_reg','aml','tax','adverse_media']);
export const VC_RESULT  = z.enum(['pending','clear','consider','rejected','error']);
export const VC_DECISION= z.enum(['approve','reject','request_more_info','step_up','hold','escalate','dismiss','expire','renew']);
export const SEVERITY   = z.enum(['low','normal','high','critical']);

export const ListCasesSchema = z.object({
  status: VC_STATUS.optional(), queue: VC_QUEUE.optional(),
  program: VC_PROGRAM.optional(), subjectKind: VC_SUBJECT.optional(),
  jurisdiction: z.string().min(2).max(8).optional(),
  assigneeId: z.string().uuid().optional(),
  q: z.string().max(120).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
export const CreateCaseSchema = z.object({
  subjectId: z.string().uuid(),
  subjectKind: VC_SUBJECT,
  program: VC_PROGRAM,
  jurisdiction: z.string().min(2).max(8).default('GB'),
  reasons: z.array(z.string().min(1).max(200)).default([]),
  meta: z.record(z.string(), z.any()).default({}),
});
export const TransitionSchema = z.object({
  caseId: z.string().uuid(),
  to: VC_STATUS,
  note: z.string().max(2000).optional(),
});
export const AssignSchema = z.object({
  caseId: z.string().uuid(),
  assigneeId: z.string().uuid().nullable(),
  queue: VC_QUEUE.optional(),
});
export const DecideSchema = z.object({
  caseId: z.string().uuid(),
  decision: VC_DECISION,
  rationale: z.string().min(3).max(8000),
  durationDays: z.number().int().min(1).max(3650).optional(),
  appealable: z.enum(['yes','no']).default('yes'),
});
export const AddDocumentSchema = z.object({
  caseId: z.string().uuid(),
  kind: VC_DOC,
  filename: z.string().min(1).max(300),
  storageUrl: z.string().min(1).max(2000),
  mimeType: z.string().max(120).optional(),
  bytes: z.number().int().min(0).optional(),
  hashSha256: z.string().length(64).optional(),
  ocrFields: z.record(z.string(), z.any()).optional(),
  livenessScore: z.number().min(0).max(100).optional(),
  matchScore: z.number().min(0).max(100).optional(),
});
export const ReviewDocumentSchema = z.object({
  documentId: z.string().uuid(),
  status: z.enum(['accepted','rejected','expired']),
});
export const RunCheckSchema = z.object({
  caseId: z.string().uuid(),
  provider: z.string().min(1).max(120),
  checkType: VC_CHECK,
});
export const WatchlistAddSchema = z.object({
  subjectId: z.string().uuid(),
  subjectKind: VC_SUBJECT,
  reason: z.string().min(3).max(2000),
  severity: SEVERITY.default('normal'),
  expiresAt: z.string().datetime().optional(),
});

// State machine transitions.
export const VC_TRANSITIONS: Record<string, string[]> = {
  pending:   ['reviewing','holding','approved','rejected','escalated'],
  reviewing: ['holding','approved','rejected','escalated'],
  holding:   ['reviewing','approved','rejected','escalated'],
  escalated: ['approved','rejected','archived'],
  approved:  ['expired','archived'],
  rejected:  ['archived'],
  expired:   ['reviewing','archived'],
  archived:  [],
};
export const QUEUE_BY_STATUS: Record<string, string> = {
  pending: 'triage', reviewing: 'review', holding: 'review',
  escalated: 'escalation', approved: 'closed', rejected: 'closed',
  expired: 'review', archived: 'closed',
};
