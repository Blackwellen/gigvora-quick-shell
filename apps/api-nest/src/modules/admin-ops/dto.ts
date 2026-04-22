import { z } from 'zod';

export const COMPANY_VERIFICATION = z.enum(['pending','verified','rejected','suspended']);
export const PLAN     = z.enum(['free','pro','team','enterprise']);
export const COMPANY_STATUS = z.enum(['active','watch','suspended','archived']);
export const USER_STATUS    = z.enum(['active','watch','suspended','locked','archived']);
export const MENTOR_STATUS  = z.enum(['active','paused','suspended','archived']);

export const ListSchema = z.object({
  q:        z.string().max(120).optional(),
  status:   z.string().max(40).optional(),
  plan:     PLAN.optional(),
  page:     z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
});

export const UpsertCompanySchema = z.object({
  id:           z.string().uuid().optional(),
  reference:    z.string().min(1).max(120).optional(),
  name:         z.string().min(2).max(200),
  slug:         z.string().min(2).max(160).optional(),
  verification: COMPANY_VERIFICATION.default('pending'),
  plan:         PLAN.default('free'),
  headcount:    z.number().int().min(0).max(1_000_000).default(0),
  region:       z.string().max(80).optional(),
  status:       COMPANY_STATUS.default('active'),
  riskScore:    z.number().int().min(0).max(100).default(0),
  meta:         z.record(z.string(), z.any()).default({}),
});

export const UpsertUserSchema = z.object({
  id:        z.string().uuid().optional(),
  reference: z.string().min(1).max(120).optional(),
  handle:    z.string().min(2).max(80),
  email:     z.string().email().max(255).optional(),
  plan:      PLAN.default('free'),
  region:    z.string().max(80).optional(),
  status:    USER_STATUS.default('active'),
  riskScore: z.number().int().min(0).max(100).default(0),
  meta:      z.record(z.string(), z.any()).default({}),
});

export const UpsertMentorSchema = z.object({
  id:          z.string().uuid().optional(),
  reference:   z.string().min(1).max(120).optional(),
  displayName: z.string().min(2).max(200),
  speciality:  z.string().min(2).max(200),
  rating:      z.number().min(0).max(5).default(0),
  sessions:    z.number().int().min(0).max(1_000_000).default(0),
  status:      MENTOR_STATUS.default('active'),
  meta:        z.record(z.string(), z.any()).default({}),
});

export const BulkActionSchema = z.object({
  entity: z.enum(['company','user','mentor']),
  ids:    z.array(z.string().uuid()).min(1).max(500),
  action: z.enum(['suspend','reinstate','archive','watch','verify','reject']),
  note:   z.string().max(2000).optional(),
});
