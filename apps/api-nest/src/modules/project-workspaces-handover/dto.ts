/**
 * D37 — Project Workspaces & Handover. Zod DTOs.
 *
 * A "workspace" is the post-signing execution surface that gets minted as soon
 * as D36 activates a contract. It owns milestones, deliverables, the handover
 * checklist, and the close-out artefact. Escrow / payment release stays in D34.
 */
import { z } from 'zod';

export const WorkspaceStatus = z.enum([
  'kickoff', 'active', 'in-review', 'handover', 'closed', 'on-hold', 'cancelled',
]);
export type WorkspaceStatus = z.infer<typeof WorkspaceStatus>;

export const MilestoneStatus = z.enum(['pending', 'in-progress', 'submitted', 'accepted', 'rejected']);
export type MilestoneStatus = z.infer<typeof MilestoneStatus>;

export const DeliverableStatus = z.enum(['pending', 'submitted', 'accepted', 'changes-requested']);
export type DeliverableStatus = z.infer<typeof DeliverableStatus>;

export const HandoverChecklistKind = z.enum([
  'credentials-rotated', 'access-revoked', 'assets-transferred',
  'docs-handed-over', 'final-report-signed-off', 'retainer-confirmed',
]);
export type HandoverChecklistKind = z.infer<typeof HandoverChecklistKind>;

export const ListWorkspacesSchema = z.object({
  projectId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  status: z.array(WorkspaceStatus).max(8).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});

export const CreateFromContractSchema = z.object({
  contractId: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().trim().min(2).max(255),
  milestones: z.array(z.object({
    title: z.string().trim().min(2).max(255),
    amountCents: z.number().int().min(0),
    dueAt: z.string().datetime().nullable().optional(),
  })).min(1).max(40),
  parties: z.array(z.object({
    partyId: z.string().min(2).max(120),
    role: z.enum(['client', 'provider', 'observer']),
    displayName: z.string().trim().min(1).max(255),
  })).min(2).max(20),
  idempotencyKey: z.string().min(8).max(120),
});

export const UpdateMilestoneStatusSchema = z.object({
  workspaceId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  toStatus: MilestoneStatus,
  note: z.string().trim().max(2000).optional(),
  expectedVersion: z.number().int().min(1),
});

export const SubmitDeliverableSchema = z.object({
  workspaceId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  title: z.string().trim().min(2).max(255),
  url: z.string().url().max(2048),
  notes: z.string().trim().max(4000).optional(),
  idempotencyKey: z.string().min(8).max(120),
});

export const ReviewDeliverableSchema = z.object({
  workspaceId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  decision: z.enum(['accepted', 'changes-requested']),
  feedback: z.string().trim().max(4000).optional(),
});

export const StartHandoverSchema = z.object({
  workspaceId: z.string().uuid(),
});

export const CompleteChecklistItemSchema = z.object({
  workspaceId: z.string().uuid(),
  itemId: z.string().uuid(),
  note: z.string().trim().max(2000).optional(),
});

export const CloseWorkspaceSchema = z.object({
  workspaceId: z.string().uuid(),
  finalReportMd: z.string().trim().min(20).max(20_000),
  idempotencyKey: z.string().min(8).max(120),
});

export const HoldOrCancelSchema = z.object({
  workspaceId: z.string().uuid(),
  reason: z.string().trim().min(2).max(2000),
});
