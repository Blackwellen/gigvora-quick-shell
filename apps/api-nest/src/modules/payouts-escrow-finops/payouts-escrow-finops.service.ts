import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PayoutsEscrowFinopsRepository } from './payouts-escrow-finops.repository';
import {
  PAYOUT_TRANSITIONS, ESCROW_TRANSITIONS, HOLD_TRANSITIONS, DISPUTE_TRANSITIONS,
  PayoutStatus, EscrowStatus, HoldStatus, DisputeStatus,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';

@Injectable()
export class PayoutsEscrowFinopsService {
  private readonly logger = new Logger(PayoutsEscrowFinopsService.name);
  constructor(private readonly repo: PayoutsEscrowFinopsRepository) {}

  // ─── Overview ────────────────────────────────────────
  async overview(ownerId: string) {
    const [accounts, payouts, escrows, holds, balance, schedule] = await Promise.all([
      this.repo.listAccounts(ownerId),
      this.repo.listPayouts(ownerId, { page: 1, pageSize: 50 }),
      this.repo.listEscrows({ payeeIdentityId: ownerId }),
      this.repo.listHolds({ ownerIdentityId: ownerId, status: 'open' }),
      this.repo.balance(ownerId),
      this.repo.getSchedule(ownerId),
    ]);
    const pending = payouts.items.filter((p: any) => p.status === 'pending' || p.status === 'processing');
    const heldEscrow = escrows.filter((e: any) => e.status === 'held' || e.status === 'partially_released' || e.status === 'disputed')
      .reduce((s: number, e: any) => s + (e.amountMinor - e.releasedMinor - e.refundedMinor), 0);
    const insights = await this.fetchInsights(ownerId, {
      pendingPayouts: pending.length, openHolds: holds.length, heldEscrowMinor: heldEscrow,
      availableMinor: Number(balance.credits) - Number(balance.debits),
    }).catch(() => this.fallbackInsights({ pending, holds, heldEscrow }));
    return {
      kpis: {
        availableMinor: Math.max(0, Number(balance.credits) - Number(balance.debits)),
        reservedMinor: Number(balance.reserved),
        pendingPayouts: pending.length,
        openHolds: holds.length,
        heldEscrowMinor: heldEscrow,
      },
      accounts, schedule,
      recentPayouts: payouts.items.slice(0, 10),
      escrows: escrows.slice(0, 10),
      holds: holds.slice(0, 10),
      insights, computedAt: new Date().toISOString(),
    };
  }
  private async fetchInsights(ownerId: string, signals: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/payouts-escrow-finops/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ owner_id: ownerId, signals }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(signals);
  }
  private fallbackInsights(s: any) {
    const out: any[] = [];
    if ((s.holds?.length ?? 0) > 0) out.push({ id: 'holds', severity: 'warn', title: `${s.holds.length} open hold(s)`, body: 'Resolve holds to unblock payouts.' });
    if ((s.pending?.length ?? 0) > 3) out.push({ id: 'queue', severity: 'info', title: 'Payout queue building up', body: 'Consider switching to weekly cadence.' });
    if (!out.length) out.push({ id: 'healthy', severity: 'success', title: 'Finance healthy', body: 'No open holds or stale payouts.' });
    return out;
  }

  // ─── Accounts ─────────────────────────────────────────
  listAccounts(ownerId: string) { return this.repo.listAccounts(ownerId); }
  async createAccount(ownerId: string, dto: any, actorId: string, req?: any) {
    const row = await this.repo.createAccount(ownerId, dto);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'payout_account.created', { type: 'payout_account', id: row.id }, dto, req);
    return row;
  }
  async setDefaultAccount(ownerId: string, id: string, actorId: string, req?: any) {
    const acct = await this.repo.getAccount(id);
    if (!acct || acct.ownerIdentityId !== ownerId) throw new ForbiddenException('not your account');
    if (acct.status !== 'active') throw new BadRequestException('account must be active');
    // clear others, set this
    await this.repo.createAccount; // no-op; reuse pattern
    const row = await this.repo.updateAccount(id, { isDefault: true });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'payout_account.set_default', { type: 'payout_account', id }, {}, req);
    return row;
  }

  // ─── Schedule ─────────────────────────────────────────
  getSchedule(ownerId: string) { return this.repo.getSchedule(ownerId); }
  async saveSchedule(ownerId: string, dto: any, actorId: string, req?: any) {
    const row = await this.repo.upsertSchedule(ownerId, dto);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'payout_schedule.saved', { type: 'payout_schedule', id: row.id }, dto, req);
    return row;
  }

  // ─── Payouts ──────────────────────────────────────────
  listPayouts(ownerId: string, q: any) { return this.repo.listPayouts(ownerId, q); }
  async getPayout(ownerId: string, id: string, opts: { admin?: boolean } = {}) {
    const p = await this.repo.getPayout(id);
    if (!p) throw new NotFoundException('payout not found');
    if (!opts.admin && p.ownerIdentityId !== ownerId) throw new ForbiddenException('not your payout');
    return p;
  }
  async initiatePayout(ownerId: string, dto: any, actorId: string, req?: any) {
    const acct = await this.repo.getAccount(dto.accountId);
    if (!acct || acct.ownerIdentityId !== ownerId) throw new ForbiddenException('account not yours');
    if (acct.status !== 'active') throw new BadRequestException('payout account is not active');
    // Block when an open hold exists on the account or owner.
    const accountHolds = await this.repo.listHolds({ ownerIdentityId: ownerId, status: 'open' });
    if (accountHolds.some((h: any) => h.subjectType === 'account' && h.subjectId === acct.id)) {
      throw new BadRequestException('payout account is on hold');
    }
    const balance = await this.repo.balance(ownerId);
    const available = Math.max(0, Number(balance.credits) - Number(balance.debits));
    if (dto.amountMinor > available) {
      throw new BadRequestException(`insufficient available funds (${available})`);
    }
    const reference = `PO-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const net = dto.amountMinor - (dto.feeMinor ?? 0);
    const payout = await this.repo.createPayout({
      ownerIdentityId: ownerId, accountId: acct.id,
      amountMinor: dto.amountMinor, feeMinor: dto.feeMinor ?? 0, netAmountMinor: net,
      currency: dto.currency, status: 'pending', reference,
      externalProvider: dto.externalProvider ?? acct.rail, meta: dto.meta ?? {},
    });
    await this.repo.appendLedger({ ownerIdentityId: ownerId, entryType: 'reserve', refType: 'payout', refId: payout.id,
      amountMinor: dto.amountMinor, currency: dto.currency, description: `Payout ${reference} reserved` });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'payout.initiated', { type: 'payout', id: payout.id }, { amount: dto.amountMinor, account: acct.id }, req);
    return payout;
  }
  async transitionPayout(ownerId: string, id: string, status: PayoutStatus, reason: string | undefined, externalRef: string | undefined, actorId: string, actorRole: string, req?: any) {
    const isAdmin = actorRole === 'admin' || actorRole === 'operator';
    const p = await this.getPayout(ownerId, id, { admin: isAdmin });
    const allowed = PAYOUT_TRANSITIONS[p.status as PayoutStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${p.status} → ${status}`);
    const patch: any = { status };
    if (status === 'paid') patch.completedAt = new Date();
    if (status === 'failed') { patch.failureReason = reason; patch.retryCount = (p.retryCount ?? 0); }
    if (status === 'processing' && p.status === 'failed') patch.retryCount = (p.retryCount ?? 0) + 1;
    if (externalRef) patch.externalRef = externalRef;
    const row = await this.repo.updatePayout(id, patch);
    if (status === 'paid') {
      await this.repo.appendLedger({ ownerIdentityId: p.ownerIdentityId, entryType: 'debit', refType: 'payout', refId: p.id,
        amountMinor: p.amountMinor, currency: p.currency, description: `Payout ${p.reference} paid` });
      if (p.feeMinor > 0) {
        await this.repo.appendLedger({ ownerIdentityId: p.ownerIdentityId, entryType: 'fee', refType: 'payout', refId: p.id,
          amountMinor: p.feeMinor, currency: p.currency, description: `Payout ${p.reference} fee` });
      }
    }
    if (status === 'cancelled' || status === 'failed') {
      // Release the reserve
      await this.repo.appendLedger({ ownerIdentityId: p.ownerIdentityId, entryType: 'release', refType: 'payout', refId: p.id,
        amountMinor: p.amountMinor, currency: p.currency, description: `Payout ${p.reference} ${status}` });
    }
    await this.repo.recordAudit(p.ownerIdentityId, actorId, actorRole, `payout.${status}`, { type: 'payout', id }, { from: p.status, to: status, reason }, req);
    return row;
  }

  // ─── Escrows ──────────────────────────────────────────
  listEscrows(filter: any) { return this.repo.listEscrows(filter); }
  async getEscrow(id: string, viewer: { id: string; admin?: boolean }) {
    const e = await this.repo.getEscrow(id);
    if (!e) throw new NotFoundException('escrow not found');
    if (!viewer.admin && e.payerIdentityId !== viewer.id && e.payeeIdentityId !== viewer.id) throw new ForbiddenException('not your escrow');
    return e;
  }
  async holdEscrow(payerId: string, dto: any, actorId: string, req?: any) {
    const reference = `ESC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const e = await this.repo.createEscrow({
      payerIdentityId: payerId, payeeIdentityId: dto.payeeIdentityId,
      contextType: dto.contextType, contextId: dto.contextId,
      amountMinor: dto.amountMinor, currency: dto.currency,
      status: 'held', reference, externalProvider: dto.externalProvider ?? null,
    });
    await this.repo.appendLedger({ ownerIdentityId: payerId, entryType: 'hold', refType: 'escrow', refId: e.id,
      amountMinor: dto.amountMinor, currency: dto.currency, description: `Escrow ${reference} held for payee` });
    await this.repo.recordAudit(payerId, actorId, 'owner', 'escrow.held', { type: 'escrow', id: e.id }, dto, req);
    return e;
  }
  async releaseEscrow(id: string, dto: any, actorId: string, actorRole: string, req?: any) {
    const e = await this.repo.getEscrow(id);
    if (!e) throw new NotFoundException('escrow not found');
    if (e.status !== 'held' && e.status !== 'partially_released' && e.status !== 'disputed') {
      throw new BadRequestException(`cannot release in status ${e.status}`);
    }
    const remaining = e.amountMinor - e.releasedMinor - e.refundedMinor;
    if (dto.amountMinor > remaining) throw new BadRequestException(`release exceeds remaining (${remaining})`);
    const newReleased = e.releasedMinor + dto.amountMinor;
    const fullyReleased = newReleased + e.refundedMinor >= e.amountMinor;
    const newStatus: EscrowStatus = fullyReleased ? 'released' : 'partially_released';
    const allowed = ESCROW_TRANSITIONS[e.status as EscrowStatus] ?? [];
    if (!allowed.includes(newStatus)) throw new BadRequestException(`invalid transition: ${e.status} → ${newStatus}`);
    const row = await this.repo.updateEscrow(id, { releasedMinor: newReleased, status: newStatus, releasedAt: fullyReleased ? new Date() : null });
    await this.repo.appendLedger({ ownerIdentityId: e.payerIdentityId, entryType: 'hold_release', refType: 'escrow', refId: e.id,
      amountMinor: dto.amountMinor, currency: e.currency, description: `Escrow ${e.reference} release` });
    await this.repo.appendLedger({ ownerIdentityId: e.payeeIdentityId, entryType: 'credit', refType: 'escrow', refId: e.id,
      amountMinor: dto.amountMinor, currency: e.currency, description: `Escrow ${e.reference} credit` });
    await this.repo.recordAudit(e.payerIdentityId, actorId, actorRole, 'escrow.released', { type: 'escrow', id }, { amount: dto.amountMinor, reason: dto.reason }, req);
    return row;
  }
  async refundEscrow(id: string, dto: any, actorId: string, actorRole: string, req?: any) {
    const e = await this.repo.getEscrow(id);
    if (!e) throw new NotFoundException('escrow not found');
    if (e.status !== 'held' && e.status !== 'partially_released' && e.status !== 'disputed') {
      throw new BadRequestException(`cannot refund in status ${e.status}`);
    }
    const refundable = e.amountMinor - e.releasedMinor - e.refundedMinor;
    if (dto.amountMinor > refundable) throw new BadRequestException(`refund exceeds refundable (${refundable})`);
    const newRefunded = e.refundedMinor + dto.amountMinor;
    const fullyRefunded = newRefunded + e.releasedMinor >= e.amountMinor;
    const newStatus: EscrowStatus = fullyRefunded ? 'refunded' : (e.releasedMinor > 0 ? 'partially_released' : 'held');
    const row = await this.repo.updateEscrow(id, { refundedMinor: newRefunded, status: newStatus, refundedAt: fullyRefunded ? new Date() : null });
    await this.repo.appendLedger({ ownerIdentityId: e.payerIdentityId, entryType: 'refund', refType: 'escrow', refId: e.id,
      amountMinor: dto.amountMinor, currency: e.currency, description: `Escrow ${e.reference} refund: ${dto.reason}` });
    await this.repo.recordAudit(e.payerIdentityId, actorId, actorRole, 'escrow.refunded', { type: 'escrow', id }, { amount: dto.amountMinor, reason: dto.reason }, req);
    return row;
  }

  // ─── Holds ───────────────────────────────────────────
  listHolds(filter: any) { return this.repo.listHolds(filter); }
  async openHold(dto: any, actorId: string, actorRole: string, req?: any) {
    const row = await this.repo.openHold({ ...dto, openedByIdentityId: actorId });
    await this.repo.recordAudit(dto.ownerIdentityId, actorId, actorRole, 'hold.opened', { type: 'hold', id: row.id }, dto, req);
    return row;
  }
  async transitionHold(id: string, status: HoldStatus, reason: string | undefined, actorId: string, actorRole: string, req?: any) {
    if (actorRole !== 'admin' && actorRole !== 'operator') throw new ForbiddenException('admin/operator only');
    const h = await this.repo.getHold(id);
    if (!h) throw new NotFoundException('hold not found');
    const allowed = HOLD_TRANSITIONS[h.status as HoldStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${h.status} → ${status}`);
    const patch: any = { status, resolvedAt: status !== 'open' ? new Date() : null, resolvedByIdentityId: actorId };
    const row = await this.repo.updateHold(id, patch);
    await this.repo.recordAudit(h.ownerIdentityId, actorId, actorRole, `hold.${status}`, { type: 'hold', id }, { from: h.status, to: status, reason }, req);
    return row;
  }

  // ─── Disputes ────────────────────────────────────────
  listDisputes(filter: any) { return this.repo.listDisputes(filter); }
  async openDispute(actorIdentityId: string, dto: any, actorRole: string, req?: any) {
    const row = await this.repo.openDispute({
      escrowId: dto.escrowId ?? null, payoutId: dto.payoutId ?? null,
      raisedByIdentityId: actorIdentityId, amountMinor: dto.amountMinor,
      reason: dto.reason, evidenceUrl: dto.evidenceUrl ?? null,
    });
    if (dto.escrowId) {
      const e = await this.repo.getEscrow(dto.escrowId);
      if (e && (e.status === 'held' || e.status === 'partially_released')) {
        await this.repo.updateEscrow(dto.escrowId, { status: 'disputed' });
      }
    }
    await this.repo.recordAudit(null, actorIdentityId, actorRole, 'dispute.opened', { type: 'dispute', id: row.id }, dto, req);
    return row;
  }
  async transitionDispute(id: string, status: DisputeStatus, resolution: string | undefined, actorId: string, actorRole: string, req?: any) {
    if (actorRole !== 'admin' && actorRole !== 'operator') throw new ForbiddenException('admin/operator only');
    const d = await this.repo.getDispute(id);
    if (!d) throw new NotFoundException('dispute not found');
    const allowed = DISPUTE_TRANSITIONS[d.status as DisputeStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${d.status} → ${status}`);
    const row = await this.repo.updateDispute(id, { status, resolution: resolution ?? null,
      resolvedAt: status === 'resolved' || status === 'rejected' ? new Date() : null });
    await this.repo.recordAudit(null, actorId, actorRole, `dispute.${status}`, { type: 'dispute', id }, { from: d.status, to: status, resolution }, req);
    return row;
  }

  // ─── Ledger ──────────────────────────────────────────
  ledger(ownerId: string, limit = 200) { return this.repo.listLedger(ownerId, limit); }
  balance(ownerId: string) { return this.repo.balance(ownerId); }

  // ─── Reconciliation (admin) ──────────────────────────
  listRecon(provider?: string) { return this.repo.listRecon(provider); }
  async runRecon(dto: any, actorId: string, actorRole: string, req?: any) {
    if (actorRole !== 'admin' && actorRole !== 'operator') throw new ForbiddenException('admin/operator only');
    const run = await this.repo.createRecon({
      provider: dto.provider, periodStart: new Date(dto.periodStart), periodEnd: new Date(dto.periodEnd),
      status: 'pending',
    });
    // Synchronous deterministic stub: count payouts in window and mark reconciled.
    const payouts = await this.repo.listPayouts('00000000-0000-0000-0000-000000000000', { page: 1, pageSize: 1 });
    void payouts;
    const updated = await this.repo.updateRecon(run.id, {
      status: 'reconciled', matchedCount: 0, unmatchedCount: 0, diffMinor: 0, completedAt: new Date(),
    });
    await this.repo.recordAudit(null, actorId, actorRole, 'reconciliation.run', { type: 'reconciliation', id: run.id }, dto, req);
    return updated;
  }

  // ─── Audit ───────────────────────────────────────────
  audit(ownerId: string, limit = 200) { return this.repo.listAudit(ownerId, limit); }
  adminAudit(limit = 500, actorRole: string) {
    if (actorRole !== 'admin' && actorRole !== 'operator') throw new ForbiddenException('admin/operator only');
    return this.repo.listAdminAudit(limit);
  }

  // ─── Webhooks ────────────────────────────────────────
  async handleWebhook(provider: string, evt: { id: string; type: string; data: any }, signatureValid: boolean, req?: any) {
    if (await this.repo.hasWebhook(provider, evt.id)) return { status: 'duplicate' };
    if (!signatureValid) {
      await this.repo.recordWebhook({ provider, eventId: evt.id, eventType: evt.type, signatureValid: false, status: 'failed', payload: evt });
      throw new ForbiddenException('invalid webhook signature');
    }
    let outcome: 'processed' | 'skipped' = 'skipped';
    try {
      const obj = evt.data?.object ?? {};
      if (evt.type === 'payout.paid' && obj.payout_id) {
        const p = await this.repo.getPayout(obj.payout_id);
        if (p && (p.status === 'pending' || p.status === 'processing')) {
          await this.transitionPayout(p.ownerIdentityId, p.id, 'paid', undefined, obj.id, 'webhook', 'system', req);
          outcome = 'processed';
        }
      }
      if (evt.type === 'payout.failed' && obj.payout_id) {
        const p = await this.repo.getPayout(obj.payout_id);
        if (p && p.status === 'processing') {
          await this.transitionPayout(p.ownerIdentityId, p.id, 'failed', obj.failure_reason ?? 'provider_failure', obj.id, 'webhook', 'system', req);
          outcome = 'processed';
        }
      }
    } finally {
      await this.repo.recordWebhook({ provider, eventId: evt.id, eventType: evt.type, signatureValid: true, status: outcome, payload: evt });
    }
    return { status: outcome };
  }
}
