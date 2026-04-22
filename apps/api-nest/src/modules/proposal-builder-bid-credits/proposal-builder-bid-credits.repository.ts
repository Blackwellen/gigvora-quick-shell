/**
 * D34 repository — Proposals + Bid Credit ledger + Escrow ledger.
 *
 * In-memory store with seeded fixtures + immutable ledger rows for every
 * commercial state change (per spec: "immutable ledger-style or audit-linked
 * tables for commercial state changes, provider references, reconciliation
 * markers, and reversal history").
 *
 * State machines:
 *   proposal: draft → submitted → shortlisted → revised → accepted | rejected | withdrawn | expired
 *   credit-purchase: pending → paid | failed → refunded
 *   escrow: pending → held → released | refunded | (partial-released)*
 *
 * Idempotency keys are tracked per-action (submit, confirm, hold, release,
 * refund) to keep checkouts replay-safe.
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ProposalDraft, ProposalStatus } from './dto';

export type ProposalRow = {
  id: string; tenantId: string; ownerId: string; ownerName: string;
  projectId: string;
  coverLetter: string;
  pricingMode: 'fixed' | 'hourly' | 'milestone' | 'retainer';
  bidAmountCents: number | null;
  hourlyRateCents: number | null;
  estimatedHours: number | null;
  currency: string;
  timelineWeeks: number | null;
  scope: string;
  deliverables: string[]; assumptions: string[]; exclusions: string[];
  attachmentIds: string[];
  milestones: { id: string; title: string; description: string; amountCents: number; durationDays?: number; position: number }[];
  screeningAnswers: string[];
  boostEnabled: boolean;
  status: ProposalStatus;
  scopeLocked: boolean;
  submittedAt: string | null; expiresAt: string | null;
  shortlistedAt: string | null; acceptedAt: string | null; rejectedAt: string | null; withdrawnAt: string | null;
  competitorRangeCents: { min: number; max: number; mid: number } | null;
  shortlistPosition: number | null;
  creditCost: number; boostCost: number;
  createdAt: string; updatedAt: string; version: number;
};

export type CreditPack = { id: string; label: string; credits: number; bonusCredits: number; priceCents: number; currency: 'GBP' };
export const CREDIT_PACKS: CreditPack[] = [
  { id: 'credits_starter_15',     label: 'Starter · 15 credits',         credits: 15,  bonusCredits: 0,  priceCents:  4_900, currency: 'GBP' },
  { id: 'credits_pro_50',         label: 'Pro · 50 credits',             credits: 50,  bonusCredits: 5,  priceCents: 14_900, currency: 'GBP' },
  { id: 'credits_enterprise_200', label: 'Enterprise · 200 credits',     credits: 200, bonusCredits: 30, priceCents: 49_900, currency: 'GBP' },
  { id: 'boost_pack_10',          label: 'Boost pack · 10 boost charges',credits: 0,   bonusCredits: 10, priceCents:  9_900, currency: 'GBP' },
];

export const PROPOSAL_COST = 2;
export const BOOST_COST = 3;

export type CreditPurchaseRow = {
  id: string; tenantId: string; buyerId: string; packId: string;
  credits: number; bonusCredits: number; isBoostPack: boolean;
  amountCents: number; currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string; confirmedAt: string | null; refundedAt: string | null;
  receiptUrl: string | null; reason: string | null;
};

export type EscrowRow = {
  id: string; tenantId: string; payerId: string; payeeId: string;
  proposalId: string; projectId: string;
  amountHeldCents: number; amountReleasedCents: number; amountRefundedCents: number;
  currency: string;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'partial-released';
  paymentMethod: 'card' | 'invoice' | 'wallet';
  createdAt: string; heldAt: string | null; closedAt: string | null;
};

export type LedgerRow = {
  id: string; tenantId: string;
  kind: 'credit' | 'boost' | 'escrow';
  delta: number; balanceAfter: number;
  reason: string; ref: string | null; reversalOf: string | null;
  at: string;
};

export type AuditRow = {
  id: string; tenantId: string; entityType: 'proposal' | 'credit-purchase' | 'escrow';
  entityId: string; actor: string; action: string; diff: any; at: string;
};

@Injectable()
export class ProposalBuilderBidCreditsRepository {
  private readonly log = new Logger('ProposalBuilderBidCreditsRepo');
  private proposals: ProposalRow[] = [];
  private purchases: CreditPurchaseRow[] = [];
  private escrows: EscrowRow[] = [];
  private ledger: LedgerRow[] = [];
  private audit: AuditRow[] = [];
  private creditBalance = new Map<string, number>();
  private boostBalance = new Map<string, number>();
  private idempotencyKeys = new Map<string, string>();

  constructor() { this.seed(); }

  private seed() {
    const tenantId = 'tenant-demo';
    this.creditBalance.set(tenantId, 18);
    this.boostBalance.set(tenantId, 4);
    this.ledger.push(
      { id: randomUUID(), tenantId, kind: 'credit', delta: 25, balanceAfter: 25, reason: 'seed', ref: null, reversalOf: null, at: new Date(Date.now() - 7 * 86_400_000).toISOString() },
      { id: randomUUID(), tenantId, kind: 'credit', delta: -PROPOSAL_COST, balanceAfter: 23, reason: 'proposal:seed-1', ref: null, reversalOf: null, at: new Date(Date.now() - 5 * 86_400_000).toISOString() },
      { id: randomUUID(), tenantId, kind: 'credit', delta: -PROPOSAL_COST, balanceAfter: 21, reason: 'proposal:seed-2', ref: null, reversalOf: null, at: new Date(Date.now() - 3 * 86_400_000).toISOString() },
      { id: randomUUID(), tenantId, kind: 'credit', delta: -PROPOSAL_COST, balanceAfter: 19, reason: 'proposal:seed-3', ref: null, reversalOf: null, at: new Date(Date.now() - 1 * 86_400_000).toISOString() },
      { id: randomUUID(), tenantId, kind: 'credit', delta: -1, balanceAfter: 18, reason: 'boost:seed', ref: null, reversalOf: null, at: new Date(Date.now() - 86_400_000).toISOString() },
      { id: randomUUID(), tenantId, kind: 'boost', delta: 5, balanceAfter: 5, reason: 'seed', ref: null, reversalOf: null, at: new Date(Date.now() - 7 * 86_400_000).toISOString() },
      { id: randomUUID(), tenantId, kind: 'boost', delta: -1, balanceAfter: 4, reason: 'boost:seed', ref: null, reversalOf: null, at: new Date(Date.now() - 86_400_000).toISOString() },
    );
    const seedNow = new Date().toISOString();
    const projectIds: string[] = [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID()];
    const titles = [
      ['SaaS Platform Development', 'TechVentures Inc.', 'TV', 28_000_00, 10, 'shortlisted', 2, true],
      ['Mobile App Redesign',       'DesignCo',          'DC', 12_000_00,  6, 'submitted',   null, false],
      ['Data Pipeline Architecture','DataFlow Labs',     'DL', 35_000_00, 12, 'accepted',    null, true],
      ['E-commerce Integration',    'ShopFront',         'SF',  8_000_00,  4, 'rejected',    null, false],
      ['API Gateway Setup',         'CloudFirst',        'CF', 15_000_00,  8, 'draft',       null, false],
    ] as const;
    titles.forEach((t, i) => {
      const isDraft = t[5] === 'draft';
      this.proposals.push({
        id: randomUUID(), tenantId, ownerId: 'demo-user', ownerName: 'You',
        projectId: projectIds[i],
        coverLetter: `Proposal seed for ${t[0]}.`,
        pricingMode: 'fixed', bidAmountCents: t[3], hourlyRateCents: null, estimatedHours: null, currency: 'GBP',
        timelineWeeks: t[4],
        scope: `Full-cycle delivery for ${t[0]} with weekly status syncs.`,
        deliverables: ['Discovery', 'Design', 'Build', 'QA', 'Launch'],
        assumptions: ['Client provides brand assets', 'Weekly approval cadence'],
        exclusions: ['Hosting fees', 'Third-party plugin licences'],
        attachmentIds: [], milestones: [
          { id: randomUUID(), title: 'Discovery & spec', description: 'Workshops + acceptance criteria', amountCents: Math.round(Number(t[3]) * 0.2), durationDays: 14, position: 0 },
          { id: randomUUID(), title: 'Build phase 1',    description: 'Core features',                  amountCents: Math.round(Number(t[3]) * 0.5), durationDays: 28, position: 1 },
          { id: randomUUID(), title: 'Launch + handover',description: 'QA, training, go-live',          amountCents: Math.round(Number(t[3]) * 0.3), durationDays: 14, position: 2 },
        ],
        screeningAnswers: ['Delivered three similar projects.', 'Available 30 hrs/week.'],
        boostEnabled: !!t[7], status: t[5] as ProposalStatus,
        scopeLocked: !isDraft,
        submittedAt: isDraft ? null : seedNow, expiresAt: null,
        shortlistedAt: t[5] === 'shortlisted' || t[5] === 'accepted' ? seedNow : null,
        acceptedAt: t[5] === 'accepted' ? seedNow : null,
        rejectedAt: t[5] === 'rejected' ? seedNow : null,
        withdrawnAt: null,
        competitorRangeCents: { min: Math.round(Number(t[3]) * 0.7), max: Math.round(Number(t[3]) * 1.4), mid: Math.round(Number(t[3]) * 1.05) },
        shortlistPosition: t[6] as number | null,
        creditCost: PROPOSAL_COST, boostCost: t[7] ? BOOST_COST : 0,
        createdAt: seedNow, updatedAt: seedNow, version: 1,
      });
    });
    this.log.log(`seeded ${this.proposals.length} proposals + ${this.ledger.length} ledger rows`);
  }

  // ─── Proposals ───────────────────────────────────────────────────────
  list(tenantId: string, filters?: { status?: ProposalStatus[]; projectId?: string }) {
    let rows = this.proposals.filter((p) => p.tenantId === tenantId);
    if (filters?.status?.length) rows = rows.filter((p) => filters.status!.includes(p.status));
    if (filters?.projectId) rows = rows.filter((p) => p.projectId === filters.projectId);
    return rows.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }
  byId(id: string) { return this.proposals.find((p) => p.id === id) ?? null; }
  byProject(projectId: string) { return this.proposals.filter((p) => p.projectId === projectId); }

  draft(tenantId: string, ownerId: string, ownerName: string, draft: ProposalDraft): ProposalRow {
    const now = new Date().toISOString();
    const row: ProposalRow = {
      id: randomUUID(), tenantId, ownerId, ownerName,
      projectId: draft.projectId,
      coverLetter: draft.coverLetter,
      pricingMode: draft.pricingMode,
      bidAmountCents: draft.bidAmountCents ?? null,
      hourlyRateCents: draft.hourlyRateCents ?? null,
      estimatedHours: draft.estimatedHours ?? null,
      currency: draft.currency,
      timelineWeeks: draft.timelineWeeks ?? null,
      scope: draft.scope, deliverables: draft.deliverables,
      assumptions: draft.assumptions, exclusions: draft.exclusions,
      attachmentIds: draft.attachmentIds,
      milestones: draft.milestones.map((m, i) => ({ id: m.id ?? randomUUID(), title: m.title, description: m.description, amountCents: m.amountCents, durationDays: m.durationDays, position: m.position ?? i })),
      screeningAnswers: draft.screeningAnswers,
      boostEnabled: draft.boostEnabled,
      status: 'draft', scopeLocked: false,
      submittedAt: null, expiresAt: null,
      shortlistedAt: null, acceptedAt: null, rejectedAt: null, withdrawnAt: null,
      competitorRangeCents: null, shortlistPosition: null,
      creditCost: PROPOSAL_COST, boostCost: draft.boostEnabled ? BOOST_COST : 0,
      createdAt: now, updatedAt: now, version: 1,
    };
    this.proposals.push(row);
    this.audit.push({ id: randomUUID(), tenantId, entityType: 'proposal', entityId: row.id, actor: ownerId, action: 'proposal.drafted', diff: { projectId: draft.projectId }, at: now });
    return row;
  }

  update(id: string, expectedVersion: number, patch: Partial<ProposalDraft>, actor: string): ProposalRow {
    const row = this.byId(id); if (!row) throw new Error('not_found');
    if (row.scopeLocked) throw new Error('scope_locked');
    if (row.version !== expectedVersion) throw new Error('version_conflict');
    Object.assign(row, patch, { updatedAt: new Date().toISOString(), version: row.version + 1 });
    if (patch.boostEnabled !== undefined) row.boostCost = patch.boostEnabled ? BOOST_COST : 0;
    this.audit.push({ id: randomUUID(), tenantId: row.tenantId, entityType: 'proposal', entityId: id, actor, action: 'proposal.updated', diff: { fields: Object.keys(patch) }, at: row.updatedAt });
    return row;
  }

  setStatus(id: string, next: ProposalStatus, actor: string, extras?: Partial<ProposalRow>): ProposalRow {
    const row = this.byId(id); if (!row) throw new Error('not_found');
    row.status = next; row.updatedAt = new Date().toISOString();
    if (extras) Object.assign(row, extras);
    if (next === 'submitted' && !row.submittedAt) row.submittedAt = row.updatedAt;
    if (next === 'shortlisted') row.shortlistedAt = row.updatedAt;
    if (next === 'accepted') row.acceptedAt = row.updatedAt;
    if (next === 'rejected') row.rejectedAt = row.updatedAt;
    if (next === 'withdrawn') row.withdrawnAt = row.updatedAt;
    this.audit.push({ id: randomUUID(), tenantId: row.tenantId, entityType: 'proposal', entityId: id, actor, action: `proposal.${next}`, diff: extras ?? {}, at: row.updatedAt });
    return row;
  }

  lockScope(id: string, actor: string) {
    const row = this.byId(id); if (!row) throw new Error('not_found');
    row.scopeLocked = true; row.updatedAt = new Date().toISOString();
    this.audit.push({ id: randomUUID(), tenantId: row.tenantId, entityType: 'proposal', entityId: id, actor, action: 'proposal.scope-locked', diff: {}, at: row.updatedAt });
    return row;
  }

  // ─── Credit ledger ───────────────────────────────────────────────────
  creditBalanceOf(tenantId: string) { return this.creditBalance.get(tenantId) ?? 0; }
  boostBalanceOf(tenantId: string) { return this.boostBalance.get(tenantId) ?? 0; }

  consumeCredits(tenantId: string, kind: 'credit' | 'boost', amount: number, reason: string, ref: string | null) {
    const balanceMap = kind === 'credit' ? this.creditBalance : this.boostBalance;
    const current = balanceMap.get(tenantId) ?? 0;
    if (current < amount) throw new Error('insufficient_credits');
    const next = current - amount;
    balanceMap.set(tenantId, next);
    const entry: LedgerRow = { id: randomUUID(), tenantId, kind, delta: -amount, balanceAfter: next, reason, ref, reversalOf: null, at: new Date().toISOString() };
    this.ledger.push(entry);
    return entry;
  }

  refundCredits(tenantId: string, kind: 'credit' | 'boost', amount: number, reason: string, ref: string | null, reversalOf: string | null) {
    const balanceMap = kind === 'credit' ? this.creditBalance : this.boostBalance;
    const current = balanceMap.get(tenantId) ?? 0;
    const next = current + amount;
    balanceMap.set(tenantId, next);
    const entry: LedgerRow = { id: randomUUID(), tenantId, kind, delta: amount, balanceAfter: next, reason, ref, reversalOf, at: new Date().toISOString() };
    this.ledger.push(entry);
    return entry;
  }

  ledgerFor(tenantId: string) { return this.ledger.filter((l) => l.tenantId === tenantId).slice(-200); }

  // ─── Credit-pack purchases ───────────────────────────────────────────
  createPurchase(tenantId: string, buyerId: string, packId: string): CreditPurchaseRow {
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) throw new Error('unknown_pack');
    const isBoostPack = packId === 'boost_pack_10';
    const row: CreditPurchaseRow = {
      id: randomUUID(), tenantId, buyerId, packId,
      credits: pack.credits, bonusCredits: pack.bonusCredits, isBoostPack,
      amountCents: pack.priceCents, currency: pack.currency,
      status: 'pending', createdAt: new Date().toISOString(),
      confirmedAt: null, refundedAt: null, receiptUrl: null, reason: null,
    };
    this.purchases.push(row);
    return row;
  }

  confirmPurchase(purchaseId: string, idempotencyKey: string, actor: string): CreditPurchaseRow {
    const idemHit = this.idempotencyKeys.get(`pbb-confirm:${idempotencyKey}`);
    if (idemHit) { const ex = this.purchases.find((p) => p.id === idemHit); if (ex) return ex; }
    const p = this.purchases.find((x) => x.id === purchaseId); if (!p) throw new Error('not_found');
    if (p.status === 'paid') return p;
    p.status = 'paid'; p.confirmedAt = new Date().toISOString();
    p.receiptUrl = `https://receipts.gigvora.example/${p.id}.pdf`;
    if (p.isBoostPack) {
      this.refundCredits(p.tenantId, 'boost', p.bonusCredits, `purchase:${p.id}`, p.id, null);
    } else {
      const totalCredits = p.credits + p.bonusCredits;
      this.refundCredits(p.tenantId, 'credit', totalCredits, `purchase:${p.id}`, p.id, null);
    }
    this.audit.push({ id: randomUUID(), tenantId: p.tenantId, entityType: 'credit-purchase', entityId: p.id, actor, action: 'credit-purchase.confirmed', diff: { kind: p.isBoostPack ? 'boost' : 'credit' }, at: p.confirmedAt });
    this.idempotencyKeys.set(`pbb-confirm:${idempotencyKey}`, p.id);
    return p;
  }

  refundPurchase(purchaseId: string, reason: string, actor: string): CreditPurchaseRow {
    const p = this.purchases.find((x) => x.id === purchaseId); if (!p) throw new Error('not_found');
    if (p.status !== 'paid') throw new Error('not_paid');
    p.status = 'refunded'; p.refundedAt = new Date().toISOString(); p.reason = reason;
    if (p.isBoostPack) {
      this.consumeCredits(p.tenantId, 'boost', p.bonusCredits, `refund:${p.id}`, p.id);
    } else {
      this.consumeCredits(p.tenantId, 'credit', p.credits + p.bonusCredits, `refund:${p.id}`, p.id);
    }
    this.audit.push({ id: randomUUID(), tenantId: p.tenantId, entityType: 'credit-purchase', entityId: p.id, actor, action: 'credit-purchase.refunded', diff: { reason }, at: p.refundedAt });
    return p;
  }

  purchasesFor(tenantId: string) { return this.purchases.filter((p) => p.tenantId === tenantId); }

  // ─── Escrow ──────────────────────────────────────────────────────────
  holdEscrow(tenantId: string, payerId: string, payeeId: string, proposalId: string, projectId: string, amountCents: number, currency: string, paymentMethod: 'card' | 'invoice' | 'wallet', idempotencyKey: string): EscrowRow {
    const idemHit = this.idempotencyKeys.get(`pbb-escrow-hold:${idempotencyKey}`);
    if (idemHit) { const ex = this.escrows.find((e) => e.id === idemHit); if (ex) return ex; }
    const now = new Date().toISOString();
    const row: EscrowRow = {
      id: randomUUID(), tenantId, payerId, payeeId, proposalId, projectId,
      amountHeldCents: amountCents, amountReleasedCents: 0, amountRefundedCents: 0,
      currency, status: 'held', paymentMethod, createdAt: now, heldAt: now, closedAt: null,
    };
    this.escrows.push(row);
    this.ledger.push({ id: randomUUID(), tenantId, kind: 'escrow', delta: amountCents, balanceAfter: amountCents, reason: `escrow:hold:${row.id}`, ref: row.id, reversalOf: null, at: now });
    this.audit.push({ id: randomUUID(), tenantId, entityType: 'escrow', entityId: row.id, actor: payerId, action: 'escrow.held', diff: { amountCents }, at: now });
    this.idempotencyKeys.set(`pbb-escrow-hold:${idempotencyKey}`, row.id);
    return row;
  }

  releaseEscrow(escrowId: string, amountCents: number | undefined, milestoneId: string | undefined, idempotencyKey: string, actor: string): EscrowRow {
    const idemHit = this.idempotencyKeys.get(`pbb-escrow-release:${idempotencyKey}`);
    if (idemHit) { const ex = this.escrows.find((e) => e.id === idemHit); if (ex) return ex; }
    const e = this.escrows.find((x) => x.id === escrowId); if (!e) throw new Error('not_found');
    if (e.status === 'released' || e.status === 'refunded') return e;
    const remaining = e.amountHeldCents - e.amountReleasedCents - e.amountRefundedCents;
    const release = Math.min(amountCents ?? remaining, remaining);
    if (release <= 0) throw new Error('nothing_to_release');
    e.amountReleasedCents += release;
    const fullyReleased = e.amountReleasedCents + e.amountRefundedCents >= e.amountHeldCents;
    e.status = fullyReleased ? 'released' : 'partial-released';
    if (fullyReleased) e.closedAt = new Date().toISOString();
    this.ledger.push({ id: randomUUID(), tenantId: e.tenantId, kind: 'escrow', delta: -release, balanceAfter: e.amountHeldCents - e.amountReleasedCents - e.amountRefundedCents, reason: milestoneId ? `escrow:release:${e.id}:${milestoneId}` : `escrow:release:${e.id}`, ref: e.id, reversalOf: null, at: new Date().toISOString() });
    this.audit.push({ id: randomUUID(), tenantId: e.tenantId, entityType: 'escrow', entityId: e.id, actor, action: 'escrow.released', diff: { release, milestoneId }, at: new Date().toISOString() });
    this.idempotencyKeys.set(`pbb-escrow-release:${idempotencyKey}`, e.id);
    return e;
  }

  refundEscrow(escrowId: string, amountCents: number | undefined, reason: string, idempotencyKey: string, actor: string): EscrowRow {
    const idemHit = this.idempotencyKeys.get(`pbb-escrow-refund:${idempotencyKey}`);
    if (idemHit) { const ex = this.escrows.find((e) => e.id === idemHit); if (ex) return ex; }
    const e = this.escrows.find((x) => x.id === escrowId); if (!e) throw new Error('not_found');
    if (e.status === 'released' || e.status === 'refunded') return e;
    const remaining = e.amountHeldCents - e.amountReleasedCents - e.amountRefundedCents;
    const refund = Math.min(amountCents ?? remaining, remaining);
    if (refund <= 0) throw new Error('nothing_to_refund');
    e.amountRefundedCents += refund;
    const fullyClosed = e.amountReleasedCents + e.amountRefundedCents >= e.amountHeldCents;
    e.status = fullyClosed ? 'refunded' : 'partial-released';
    if (fullyClosed) e.closedAt = new Date().toISOString();
    this.ledger.push({ id: randomUUID(), tenantId: e.tenantId, kind: 'escrow', delta: -refund, balanceAfter: e.amountHeldCents - e.amountReleasedCents - e.amountRefundedCents, reason: `escrow:refund:${e.id}`, ref: e.id, reversalOf: null, at: new Date().toISOString() });
    this.audit.push({ id: randomUUID(), tenantId: e.tenantId, entityType: 'escrow', entityId: e.id, actor, action: 'escrow.refunded', diff: { refund, reason }, at: new Date().toISOString() });
    this.idempotencyKeys.set(`pbb-escrow-refund:${idempotencyKey}`, e.id);
    return e;
  }

  escrowsFor(tenantId: string) { return this.escrows.filter((e) => e.tenantId === tenantId); }
  escrowById(id: string) { return this.escrows.find((e) => e.id === id) ?? null; }

  consumeIdempotency(scope: string, key: string, value: string) {
    const k = `${scope}:${key}`;
    const hit = this.idempotencyKeys.get(k);
    if (hit) return hit;
    this.idempotencyKeys.set(k, value);
    return value;
  }

  auditFor(entityType: 'proposal' | 'credit-purchase' | 'escrow', entityId: string) {
    return this.audit.filter((a) => a.entityType === entityType && a.entityId === entityId);
  }
}
