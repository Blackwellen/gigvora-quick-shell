import { z } from 'zod';

export const RISK_BANDS = ['low', 'medium', 'high', 'critical'] as const;
export const ROLES = ['operator', 'moderator', 'finance', 'trust_safety', 'super_admin'] as const;

export const SESSION_TRANSITIONS: Record<string, string[]> = {
  active: ['stepup_pending', 'expired', 'revoked'],
  stepup_pending: ['active', 'expired', 'revoked'],
  expired: [], revoked: [],
};

const slug = z.string().regex(/^[a-z][a-z0-9_-]{1,30}$/);
const email = z.string().email().max(255);

export const EnvironmentSchema = z.object({
  slug, label: z.string().min(1).max(80),
  riskBand: z.enum(RISK_BANDS).default('low'),
  requiresStepUp: z.boolean().default(false),
  ipAllowlist: z.array(z.string().min(1).max(64)).max(200).default([]),
  bannerText: z.string().max(280).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const OperatorSchema = z.object({
  identityId: z.string().uuid(),
  email,
  role: z.enum(ROLES).default('operator'),
  mfaEnrolled: z.boolean().default(false),
  allowedEnvs: z.array(slug).max(10).default(['sandbox']),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const LoginSchema = z.object({
  email,
  environmentSlug: slug,
  // Password / SSO assertion is verified upstream — this terminal validates
  // the operator/env policy, lockouts, and step-up requirement.
  credentialVerified: z.boolean(),
  mfaCode: z.string().min(6).max(10).optional(),
}).strict();

export const StepUpSchema = z.object({
  sessionId: z.string().uuid(),
  mfaCode: z.string().min(6).max(10),
}).strict();

export const SwitchEnvSchema = z.object({
  sessionId: z.string().uuid(),
  environmentSlug: slug,
}).strict();

export const StatusBody = z.object({ status: z.string() });
