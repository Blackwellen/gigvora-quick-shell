/**
 * D36 — Contracts, SoW, Terms Acceptance & Signature Follow-Through.
 * Zod DTOs for every controller surface.
 */
import { z } from 'zod';

export const PartyRole = z.enum(['client', 'provider', 'witness', 'approver']);
export type PartyRole = z.infer<typeof PartyRole>;

export const ContractStatus = z.enum([
  'draft', 'sent', 'partially-signed', 'signed', 'countersigned',
  'active', 'rejected', 'cancelled', 'expired', 'superseded',
]);
export type ContractStatus = z.infer<typeof ContractStatus>;

export const ListContractsSchema = z.object({
  projectId: z.string().uuid().optional(),
  proposalId: z.string().uuid().optional(),
  status: z.array(ContractStatus).max(8).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});

export const CreateFromAwardSchema = z.object({
  awardId: z.string().min(4).max(120),
  proposalId: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().trim().min(2).max(255),
  governingLaw: z.enum(['UK', 'US-DE', 'US-CA', 'EU', 'OTHER']).default('UK'),
  expiresInDays: z.number().int().min(1).max(120).default(30),
  parties: z.array(z.object({
    partyId: z.string().min(2).max(120),
    role: PartyRole,
    displayName: z.string().trim().min(1).max(255),
    email: z.string().email().optional(),
    signOrder: z.number().int().min(1).max(20),
  })).min(2).max(10),
  idempotencyKey: z.string().min(8).max(120),
});

export const SendForSignatureSchema = z.object({
  contractId: z.string().uuid(),
  message: z.string().trim().max(2000).optional(),
});

export const ClickToSignSchema = z.object({
  contractId: z.string().uuid(),
  partyId: z.string().min(2).max(120),
  acceptTos: z.literal(true),
  acceptScope: z.literal(true),
  typedName: z.string().trim().min(2).max(120),
  // Native click-to-sign ledger inputs (server also re-derives ip/ua):
  clientCapturedIp: z.string().max(64).optional(),
  clientCapturedUa: z.string().max(512).optional(),
  idempotencyKey: z.string().min(8).max(120),
});

export const RejectSchema = z.object({
  contractId: z.string().uuid(),
  partyId: z.string().min(2).max(120),
  reason: z.string().trim().min(2).max(2000),
});

export const VoidSchema = z.object({
  contractId: z.string().uuid(),
  reason: z.string().trim().min(2).max(2000),
});

export const AmendSchema = z.object({
  contractId: z.string().uuid(),
  changeSummary: z.string().trim().min(8).max(4000),
  newExpiresInDays: z.number().int().min(1).max(120).optional(),
  idempotencyKey: z.string().min(8).max(120),
});

export const VerifyHashSchema = z.object({
  contractId: z.string().uuid(),
});
