/**
 * D36 repository — Contracts, parties, immutable signature ledger, snapshots,
 * and event log. In-memory store with seeded fixtures matching the rest of
 * the monorepo. The signature ledger is append-only and each entry is fingerprinted
 * with a SHA-256 hash chained over the previous hash, so tampering is detectable.
 *
 * State machine:
 *   draft → sent → partially-signed → signed → active
 *                                  ↘ rejected | cancelled | expired
 *   active → superseded (when an amendment mints a successor)
 */
import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import type { ContractStatus, PartyRole } from './dto';

export type PartyRow = {
  id: string;
  contractId: string;
  partyId: string;
  role: PartyRole;
  displayName: string;
  email: string | null;
  signOrder: number;
  hasSigned: boolean;
  signedAt: string | null;
};

export type ContractRow = {
  id: string;
  tenantId: string;
  projectId: string;
  proposalId: string;
  awardId: string;
  title: string;
  governingLaw: 'UK' | 'US-DE' | 'US-CA' | 'EU' | 'OTHER';
  status: ContractStatus;
  expiresAt: string;
  amendsContractId: string | null;
  supersededByContractId: string | null;
  contentHash: string;          // hash over the immutable snapshot body
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
  closedAt: string | null;
  version: number;
};

export type SnapshotRow = {
  id: string;
  contractId: string;
  proposalId: string;
  capturedAt: string;
  scopeMd: string;
  milestones: { id: string; title: string; amountCents: number; dueAt: string | null }[];
  totalAmountCents: number;
  currency: string;
  termsVersion: string;
  bodyHash: string;
};

export type SignatureRow = {
  id: string;
  contractId: string;
  partyRowId: string;
  partyId: string;
  typedName: string;
  capturedIp: string;
  capturedUa: string;
  capturedAt: string;
  prevHash: string | null;
  hash: string;             // sha256(prevHash || partyId || typedName || ts || ip || ua || contentHash)
  acceptedTos: boolean;
  acceptedScope: boolean;
};

export type ContractEventRow = {
  id: string;
  contractId: string;
  kind: string;
  actor: string;
  detail: any;
  at: string;
};

@Injectable()
export class ContractsSowAcceptanceRepository {
  private readonly log = new Logger('csa.repo');
  private contracts = new Map<string, ContractRow>();
  private parties = new Map<string, PartyRow[]>();        // contractId → parties
  private snapshots = new Map<string, SnapshotRow>();     // contractId → snapshot
  private signatures = new Map<string, SignatureRow[]>(); // contractId → signature ledger
  private events = new Map<string, ContractEventRow[]>(); // contractId → events
  private idemMint = new Map<string, string>();           // idem → contractId
  private idemSign = new Map<string, string>();           // idem → signatureId
  private idemAmend = new Map<string, string>();          // idem → newContractId

  constructor() { this.seed(); }

  private seed() {
    const now = new Date();
    const seedContractId = 'csa-seed-contract-1';
    const expires = new Date(now.getTime() + 14 * 86_400_000).toISOString();
    const snapshotBody = JSON.stringify({
      scope: 'Design + ship the ops dashboard MVP across 4 milestones.',
      milestones: [
        { title: 'Discovery + wireframes', amountCents: 6_000_00 },
        { title: 'Build sprint 1',        amountCents: 8_000_00 },
        { title: 'Build sprint 2',        amountCents: 8_000_00 },
        { title: 'Launch + handover',     amountCents: 6_000_00 },
      ],
    });
    const bodyHash = createHash('sha256').update(snapshotBody).digest('hex');
    const contract: ContractRow = {
      id: seedContractId,
      tenantId: 'tenant-demo',
      projectId: '11111111-1111-1111-1111-111111111111',
      proposalId: '22222222-2222-2222-2222-222222222222',
      awardId: 'award-seed-1',
      title: 'Ops Dashboard MVP — SoW',
      governingLaw: 'UK',
      status: 'sent',
      expiresAt: expires,
      amendsContractId: null,
      supersededByContractId: null,
      contentHash: bodyHash,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      activatedAt: null,
      closedAt: null,
      version: 1,
    };
    this.contracts.set(seedContractId, contract);
    this.parties.set(seedContractId, [
      { id: randomUUID(), contractId: seedContractId, partyId: 'client-acme',  role: 'client',   displayName: 'Acme Buyer',     email: 'buyer@acme.test',     signOrder: 1, hasSigned: false, signedAt: null },
      { id: randomUUID(), contractId: seedContractId, partyId: 'provider-sc', role: 'provider', displayName: 'Sarah Chen Studio', email: 'sarah@studio.test', signOrder: 2, hasSigned: false, signedAt: null },
    ]);
    this.snapshots.set(seedContractId, {
      id: randomUUID(),
      contractId: seedContractId,
      proposalId: contract.proposalId,
      capturedAt: now.toISOString(),
      scopeMd: 'Design + ship the ops dashboard MVP across 4 milestones.',
      milestones: [
        { id: randomUUID(), title: 'Discovery + wireframes', amountCents: 6_000_00, dueAt: null },
        { id: randomUUID(), title: 'Build sprint 1',        amountCents: 8_000_00, dueAt: null },
        { id: randomUUID(), title: 'Build sprint 2',        amountCents: 8_000_00, dueAt: null },
        { id: randomUUID(), title: 'Launch + handover',     amountCents: 6_000_00, dueAt: null },
      ],
      totalAmountCents: 28_000_00,
      currency: 'GBP',
      termsVersion: 'gigvora-terms@2025-04-01',
      bodyHash,
    });
    this.signatures.set(seedContractId, []);
    this.events.set(seedContractId, [
      { id: randomUUID(), contractId: seedContractId, kind: 'contract.minted', actor: 'system', detail: { fromAward: 'award-seed-1' }, at: now.toISOString() },
      { id: randomUUID(), contractId: seedContractId, kind: 'contract.sent',   actor: 'system', detail: {},                              at: now.toISOString() },
    ]);
    this.log.log(`seeded contract ${seedContractId}`);
  }

  // ---- read ----
  byId(id: string) { return this.contracts.get(id); }
  byProposal(proposalId: string) {
    return Array.from(this.contracts.values()).find((c) => c.proposalId === proposalId && c.status !== 'superseded');
  }
  list(tenantId: string, filter: { projectId?: string; proposalId?: string; status?: ContractStatus[] }) {
    let rows = Array.from(this.contracts.values()).filter((r) => r.tenantId === tenantId);
    if (filter.projectId) rows = rows.filter((r) => r.projectId === filter.projectId);
    if (filter.proposalId) rows = rows.filter((r) => r.proposalId === filter.proposalId);
    if (filter.status?.length) rows = rows.filter((r) => filter.status!.includes(r.status));
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  partiesFor(contractId: string) { return this.parties.get(contractId) ?? []; }
  snapshotFor(contractId: string) { return this.snapshots.get(contractId); }
  signaturesFor(contractId: string) { return this.signatures.get(contractId) ?? []; }
  eventsFor(contractId: string) { return this.events.get(contractId) ?? []; }
  idemMintHit(idem: string) { const id = this.idemMint.get(idem); return id ? this.contracts.get(id) : undefined; }
  idemSignHit(idem: string) { return this.idemSign.get(idem); }
  idemAmendHit(idem: string) { const id = this.idemAmend.get(idem); return id ? this.contracts.get(id) : undefined; }

  // ---- write ----
  mint(args: {
    tenantId: string; projectId: string; proposalId: string; awardId: string;
    title: string; governingLaw: ContractRow['governingLaw']; expiresInDays: number;
    snapshot: { scopeMd: string; milestones: { title: string; amountCents: number; dueAt: string | null }[]; totalAmountCents: number; currency: string; termsVersion: string };
    parties: { partyId: string; role: PartyRole; displayName: string; email?: string; signOrder: number }[];
    idempotencyKey: string;
    actor: string;
  }): ContractRow {
    const hit = this.idemMintHit(args.idempotencyKey);
    if (hit) return hit;
    const id = randomUUID();
    const now = new Date();
    const expires = new Date(now.getTime() + args.expiresInDays * 86_400_000).toISOString();
    const bodyJson = JSON.stringify({
      title: args.title,
      scope: args.snapshot.scopeMd,
      milestones: args.snapshot.milestones,
      total: args.snapshot.totalAmountCents,
      currency: args.snapshot.currency,
      terms: args.snapshot.termsVersion,
      governingLaw: args.governingLaw,
    });
    const contentHash = createHash('sha256').update(bodyJson).digest('hex');
    const contract: ContractRow = {
      id, tenantId: args.tenantId, projectId: args.projectId, proposalId: args.proposalId,
      awardId: args.awardId, title: args.title, governingLaw: args.governingLaw,
      status: 'draft', expiresAt: expires, amendsContractId: null, supersededByContractId: null,
      contentHash, createdAt: now.toISOString(), updatedAt: now.toISOString(),
      activatedAt: null, closedAt: null, version: 1,
    };
    this.contracts.set(id, contract);
    this.parties.set(id, args.parties.map((p) => ({
      id: randomUUID(), contractId: id, partyId: p.partyId, role: p.role,
      displayName: p.displayName, email: p.email ?? null, signOrder: p.signOrder,
      hasSigned: false, signedAt: null,
    })));
    this.snapshots.set(id, {
      id: randomUUID(), contractId: id, proposalId: args.proposalId,
      capturedAt: now.toISOString(),
      scopeMd: args.snapshot.scopeMd,
      milestones: args.snapshot.milestones.map((m) => ({ id: randomUUID(), title: m.title, amountCents: m.amountCents, dueAt: m.dueAt })),
      totalAmountCents: args.snapshot.totalAmountCents,
      currency: args.snapshot.currency,
      termsVersion: args.snapshot.termsVersion,
      bodyHash: contentHash,
    });
    this.signatures.set(id, []);
    this.events.set(id, [{ id: randomUUID(), contractId: id, kind: 'contract.minted', actor: args.actor, detail: { fromAward: args.awardId }, at: now.toISOString() }]);
    this.idemMint.set(args.idempotencyKey, id);
    return contract;
  }

  setStatus(contractId: string, status: ContractStatus, actor: string, detail: any = {}): ContractRow {
    const c = this.contracts.get(contractId); if (!c) throw new Error('not_found');
    c.status = status;
    c.updatedAt = new Date().toISOString();
    c.version += 1;
    if (status === 'active') c.activatedAt = c.activatedAt ?? c.updatedAt;
    if (status === 'rejected' || status === 'cancelled' || status === 'expired' || status === 'superseded') {
      c.closedAt = c.updatedAt;
    }
    this.appendEvent(contractId, `contract.${status}`, actor, detail);
    return c;
  }

  /** Append a signature row to the immutable ledger. Throws on out-of-order signing. */
  appendSignature(args: {
    contractId: string; partyId: string; typedName: string;
    capturedIp: string; capturedUa: string;
    acceptedTos: boolean; acceptedScope: boolean;
    idempotencyKey: string; actor: string;
  }): { signature: SignatureRow; contract: ContractRow; allSigned: boolean } {
    const existing = this.idemSignHit(args.idempotencyKey);
    if (existing) {
      const ledger = this.signaturesFor(args.contractId);
      const sig = ledger.find((s) => s.id === existing);
      if (sig) {
        const c = this.contracts.get(args.contractId)!;
        const allSigned = (this.parties.get(args.contractId) ?? []).every((p) => p.hasSigned);
        return { signature: sig, contract: c, allSigned };
      }
    }
    const c = this.contracts.get(args.contractId);
    if (!c) throw new Error('not_found');
    if (c.status === 'rejected' || c.status === 'cancelled' || c.status === 'expired' || c.status === 'superseded') {
      throw new Error(`contract_${c.status}`);
    }
    const parties = this.parties.get(args.contractId) ?? [];
    const party = parties.find((p) => p.partyId === args.partyId);
    if (!party) throw new Error('party_not_on_contract');
    if (party.hasSigned) throw new Error('party_already_signed');

    // Sequenced signing: every party with a smaller signOrder must already have signed.
    const blocking = parties.find((p) => p.signOrder < party.signOrder && !p.hasSigned);
    if (blocking) throw new Error('out_of_order_signature');

    const ledger = this.signatures.get(args.contractId) ?? [];
    const prevHash = ledger.length ? ledger[ledger.length - 1].hash : null;
    const capturedAt = new Date().toISOString();
    const hashInput = [prevHash ?? '', args.partyId, args.typedName, capturedAt, args.capturedIp, args.capturedUa, c.contentHash].join('|');
    const hash = createHash('sha256').update(hashInput).digest('hex');
    const sig: SignatureRow = {
      id: randomUUID(),
      contractId: args.contractId,
      partyRowId: party.id,
      partyId: args.partyId,
      typedName: args.typedName,
      capturedIp: args.capturedIp,
      capturedUa: args.capturedUa,
      capturedAt,
      prevHash,
      hash,
      acceptedTos: args.acceptedTos,
      acceptedScope: args.acceptedScope,
    };
    ledger.push(sig);
    this.signatures.set(args.contractId, ledger);
    party.hasSigned = true;
    party.signedAt = capturedAt;
    this.idemSign.set(args.idempotencyKey, sig.id);

    const allSigned = parties.every((p) => p.hasSigned);
    if (allSigned) {
      c.status = 'signed';
    } else {
      c.status = 'partially-signed';
    }
    c.updatedAt = capturedAt;
    c.version += 1;
    this.appendEvent(args.contractId, 'signature.captured', args.actor, { partyId: args.partyId, hash });
    return { signature: sig, contract: c, allSigned };
  }

  amend(prevContractId: string, args: {
    changeSummary: string; newExpiresInDays?: number; idempotencyKey: string; actor: string;
  }): ContractRow {
    const hit = this.idemAmendHit(args.idempotencyKey);
    if (hit) return hit;
    const prev = this.contracts.get(prevContractId);
    if (!prev) throw new Error('not_found');
    const prevSnapshot = this.snapshots.get(prevContractId);
    if (!prevSnapshot) throw new Error('snapshot_missing');
    const prevParties = this.parties.get(prevContractId) ?? [];
    const successor = this.mint({
      tenantId: prev.tenantId, projectId: prev.projectId, proposalId: prev.proposalId,
      awardId: prev.awardId, title: `${prev.title} (amended)`,
      governingLaw: prev.governingLaw, expiresInDays: args.newExpiresInDays ?? 30,
      snapshot: {
        scopeMd: `${prevSnapshot.scopeMd}\n\n--- AMENDMENT ---\n${args.changeSummary}`,
        milestones: prevSnapshot.milestones.map((m) => ({ title: m.title, amountCents: m.amountCents, dueAt: m.dueAt })),
        totalAmountCents: prevSnapshot.totalAmountCents,
        currency: prevSnapshot.currency,
        termsVersion: prevSnapshot.termsVersion,
      },
      parties: prevParties.map((p) => ({ partyId: p.partyId, role: p.role, displayName: p.displayName, email: p.email ?? undefined, signOrder: p.signOrder })),
      idempotencyKey: `amend-${args.idempotencyKey}`,
      actor: args.actor,
    });
    successor.amendsContractId = prevContractId;
    prev.supersededByContractId = successor.id;
    this.setStatus(prevContractId, 'superseded', args.actor, { successor: successor.id });
    this.idemAmend.set(args.idempotencyKey, successor.id);
    return successor;
  }

  /** Recompute the chain hash and report tampering. */
  verifyHash(contractId: string): { ok: boolean; expectedTip: string | null; actualTip: string | null; details: { index: number; ok: boolean }[] } {
    const c = this.contracts.get(contractId);
    if (!c) return { ok: false, expectedTip: null, actualTip: null, details: [] };
    const ledger = this.signaturesFor(contractId);
    const details: { index: number; ok: boolean }[] = [];
    let prev: string | null = null;
    let expected: string | null = null;
    for (let i = 0; i < ledger.length; i++) {
      const s = ledger[i];
      const recomputed = createHash('sha256').update([prev ?? '', s.partyId, s.typedName, s.capturedAt, s.capturedIp, s.capturedUa, c.contentHash].join('|')).digest('hex');
      details.push({ index: i, ok: recomputed === s.hash && s.prevHash === prev });
      expected = recomputed;
      prev = s.hash;
    }
    const actualTip = ledger.length ? ledger[ledger.length - 1].hash : null;
    const ok = details.every((d) => d.ok);
    return { ok, expectedTip: expected, actualTip, details };
  }

  appendEvent(contractId: string, kind: string, actor: string, detail: any) {
    const arr = this.events.get(contractId) ?? [];
    arr.push({ id: randomUUID(), contractId, kind, actor, detail, at: new Date().toISOString() });
    this.events.set(contractId, arr);
  }
}
