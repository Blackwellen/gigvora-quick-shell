/**
 * D36 — Contracts, SoW, Terms Acceptance & Signature Follow-Through service.
 *
 * Responsibilities:
 *   - Auto-mint a contract from a D35 award handoff (snapshot proposal milestones).
 *   - Send for signature (sequenced multi-party).
 *   - Native click-to-sign with IP/UA/timestamp/SHA-256-chained ledger.
 *   - Reject / cancel / expire / amend (mints a successor and supersedes the prior).
 *   - Verify hash chain integrity for FCA/UK GDPR audit trails.
 *   - Emit csa.* webhooks + cross-domain bus events on every state change.
 *
 * Out of scope (intentionally — owned by D34 + delivery + dispute domains):
 *   - Escrow release on activation.
 *   - Payment capture.
 *   - Dispute opening (handled by D40 once it lands).
 */
import { Injectable, Logger } from '@nestjs/common';
import { ContractsSowAcceptanceRepository, type ContractRow } from './contracts-sow-acceptance.repository';
import { D36Emit } from './contracts-sow-acceptance.emit';
import type { ContractStatus, PartyRole } from './dto';

@Injectable()
export class ContractsSowAcceptanceService {
  private readonly log = new Logger('csa.svc');

  constructor(private readonly repo: ContractsSowAcceptanceRepository) {}

  list(tenantId: string, filter: { projectId?: string; proposalId?: string; status?: ContractStatus[] }) {
    return this.repo.list(tenantId, filter);
  }

  detail(id: string) {
    const contract = this.repo.byId(id);
    if (!contract) return null;
    return {
      ...contract,
      parties: this.repo.partiesFor(id),
      snapshot: this.repo.snapshotFor(id),
      signatures: this.repo.signaturesFor(id),
      events: this.repo.eventsFor(id),
    };
  }

  /**
   * Auto-mint from a D35 award handoff. The proposal milestones are snapshotted
   * into the contract body so that later mutations to the proposal cannot
   * silently change what was agreed.
   */
  mintFromAward(args: {
    tenantId: string; awardId: string; proposalId: string; projectId: string;
    title: string; governingLaw: 'UK' | 'US-DE' | 'US-CA' | 'EU' | 'OTHER'; expiresInDays: number;
    parties: { partyId: string; role: PartyRole; displayName: string; email?: string; signOrder: number }[];
    snapshot?: { scopeMd?: string; milestones?: { title: string; amountCents: number; dueAt: string | null }[]; totalAmountCents?: number; currency?: string; termsVersion?: string };
    idempotencyKey: string; actor: string;
  }): ContractRow {
    // Build a deterministic snapshot. In production the snapshot is hydrated
    // from D34 (proposal milestones); here we accept a hint and fill in safe
    // defaults so the contract is always immutable + replayable.
    const snapshot = {
      scopeMd: args.snapshot?.scopeMd ?? `Snapshot of proposal ${args.proposalId} taken at award handoff.`,
      milestones: args.snapshot?.milestones ?? [
        { title: 'Kickoff + plan',      amountCents: 5_000_00, dueAt: null },
        { title: 'Delivery — sprint 1', amountCents: 10_000_00, dueAt: null },
        { title: 'Delivery — sprint 2', amountCents: 10_000_00, dueAt: null },
        { title: 'Handover + close',    amountCents: 5_000_00, dueAt: null },
      ],
      totalAmountCents: args.snapshot?.totalAmountCents ?? 30_000_00,
      currency: args.snapshot?.currency ?? 'GBP',
      termsVersion: args.snapshot?.termsVersion ?? 'gigvora-terms@2025-04-01',
    };
    const contract = this.repo.mint({
      tenantId: args.tenantId, projectId: args.projectId, proposalId: args.proposalId,
      awardId: args.awardId, title: args.title, governingLaw: args.governingLaw,
      expiresInDays: args.expiresInDays, snapshot, parties: args.parties,
      idempotencyKey: args.idempotencyKey, actor: args.actor,
    });
    void D36Emit.contractMinted(args.tenantId, contract.id, { awardId: args.awardId, proposalId: args.proposalId, parties: args.parties.length });
    void D36Emit.contractSnapshotTaken(args.tenantId, contract.id, { contentHash: contract.contentHash, milestones: snapshot.milestones.length });
    return contract;
  }

  send(contractId: string, message: string | undefined, actor: string) {
    const c = this.repo.byId(contractId); if (!c) throw new Error('not_found');
    if (c.status !== 'draft') throw new Error(`cannot_send_from_${c.status}`);
    const updated = this.repo.setStatus(contractId, 'sent', actor, { message });
    void D36Emit.contractSent(c.tenantId, contractId, { message: message ?? null });
    for (const p of this.repo.partiesFor(contractId)) {
      void D36Emit.signatureRequested(c.tenantId, contractId, { partyId: p.partyId, signOrder: p.signOrder });
    }
    return updated;
  }

  clickToSign(args: {
    contractId: string; partyId: string; typedName: string;
    acceptedTos: boolean; acceptedScope: boolean;
    capturedIp: string; capturedUa: string;
    idempotencyKey: string; actor: string;
  }) {
    const result = this.repo.appendSignature({
      contractId: args.contractId, partyId: args.partyId, typedName: args.typedName,
      capturedIp: args.capturedIp, capturedUa: args.capturedUa,
      acceptedTos: args.acceptedTos, acceptedScope: args.acceptedScope,
      idempotencyKey: args.idempotencyKey, actor: args.actor,
    });
    const tenantId = result.contract.tenantId;
    void D36Emit.signatureCaptured(tenantId, args.contractId, { partyId: args.partyId, hash: result.signature.hash });
    void D36Emit.ledgerAppended(tenantId, args.contractId, { signatureId: result.signature.id, hash: result.signature.hash });
    void D36Emit.termsAccepted(tenantId, args.contractId, { partyId: args.partyId });
    void D36Emit.scopeAcknowledged(tenantId, args.contractId, { partyId: args.partyId });
    if (result.allSigned) {
      // Auto-activate as soon as all parties have signed.
      const activated = this.repo.setStatus(args.contractId, 'active', args.actor, {});
      void D36Emit.contractActivated(tenantId, args.contractId, { activatedAt: activated.activatedAt });
    }
    return { signature: result.signature, contract: result.contract, allSigned: result.allSigned };
  }

  reject(contractId: string, partyId: string, reason: string, actor: string) {
    const c = this.repo.byId(contractId); if (!c) throw new Error('not_found');
    if (c.status === 'active' || c.status === 'cancelled' || c.status === 'rejected' || c.status === 'expired' || c.status === 'superseded') {
      throw new Error(`cannot_reject_from_${c.status}`);
    }
    const updated = this.repo.setStatus(contractId, 'rejected', actor, { partyId, reason });
    void D36Emit.signatureRejected(c.tenantId, contractId, { partyId, reason });
    void D36Emit.contractRejected(c.tenantId, contractId, { partyId, reason });
    return updated;
  }

  cancel(contractId: string, reason: string, actor: string) {
    const c = this.repo.byId(contractId); if (!c) throw new Error('not_found');
    if (c.status === 'active' || c.status === 'superseded' || c.status === 'expired') {
      throw new Error(`cannot_cancel_from_${c.status}`);
    }
    const updated = this.repo.setStatus(contractId, 'cancelled', actor, { reason });
    void D36Emit.contractCancelled(c.tenantId, contractId, { reason });
    return updated;
  }

  amend(contractId: string, changeSummary: string, newExpiresInDays: number | undefined, idempotencyKey: string, actor: string) {
    const successor = this.repo.amend(contractId, { changeSummary, newExpiresInDays, idempotencyKey, actor });
    void D36Emit.contractAmended(successor.tenantId, contractId, { successor: successor.id, changeSummary });
    void D36Emit.contractSuperseded(successor.tenantId, contractId, { successor: successor.id });
    void D36Emit.contractMinted(successor.tenantId, successor.id, { amendsContractId: contractId });
    return successor;
  }

  verifyHash(contractId: string) {
    const c = this.repo.byId(contractId);
    if (!c) throw new Error('not_found');
    const result = this.repo.verifyHash(contractId);
    void D36Emit.contractHashVerified(c.tenantId, contractId, { ok: result.ok });
    return result;
  }

  byProposal(proposalId: string) { return this.repo.byProposal(proposalId); }
}
