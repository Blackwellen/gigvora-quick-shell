import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FinanceAdminRepository } from './finance-admin.repository';
import { REFUND_TRANSITIONS } from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE        = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';

type Meta = { ip?: string; userAgent?: string };

/**
 * Domain 68 — Finance Admin.
 * Role ladder: viewer < operator < finance_admin < super_admin.
 *  - viewer/operator: read-only KPIs, refund/hold lists
 *  - finance_admin: create/transition refunds, manage holds, set controls
 *  - super_admin: dual-approval overrides + reversal
 *
 * FCA-safe posture: dual-approval threshold + payout_pause/billing_freeze
 * controls + immutable ledger + audit on every write.
 */
@Injectable()
export class FinanceAdminService {
  private readonly logger = new Logger(FinanceAdminService.name);
  constructor(private readonly repo: FinanceAdminRepository) {}

  // ── Dashboard ─────────────────────────────────────
  async overview(role: string) {
    this.assertRead(role);
    const [kpis, controls, recentRefunds, holds] = await Promise.all([
      this.repo.kpis(),
      this.repo.listControls(),
      this.repo.listRefunds({ pageSize: 10, page: 1, status: 'pending' }),
      this.repo.listHolds('active'),
    ]);
    const [insights, riskScore] = await Promise.all([
      this.fetchInsights(kpis).catch(() => this.fallbackInsights(kpis)),
      this.scoreRisk(kpis).catch(() => this.fallbackRisk(kpis)),
    ]);
    return {
      kpis, controls, recentRefunds: recentRefunds.items, holds,
      insights, riskScore, computedAt: new Date().toISOString(),
    };
  }

  // ── Refunds ───────────────────────────────────────
  async listRefunds(role: string, filter: any) {
    this.assertRead(role);
    const r = await this.repo.listRefunds(filter);
    return { items: r.items, total: r.total, meta: { source: 'finance-admin', role, page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 } };
  }
  async refundDetail(role: string, id: string) {
    this.assertRead(role);
    const r = await this.repo.refundById(id);
    if (!r) throw new NotFoundException({ code: 'refund_not_found' });
    return r;
  }
  async createRefund(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertWrite(role);
    const controls = await this.controlMap();
    if (controls.billing_freeze?.value === true) {
      throw new BadRequestException({ code: 'billing_frozen' });
    }
    const refund = await this.repo.createRefund(dto, actorId);
    await this.repo.audit(actorId, 'refund.create', 'refund', refund.id, { amountMinor: refund.amount_minor, category: refund.category }, meta);

    // Auto-approve under threshold.
    const autoUnder = Number(controls.refund_auto_approve_under_minor?.value ?? 0);
    if (autoUnder > 0 && refund.amount_minor <= autoUnder) {
      const approved = await this.repo.transitionRefund(refund.id, 'approved', actorId);
      await this.repo.audit(actorId, 'refund.transition.auto', 'refund', approved.id, { from: 'pending', to: 'approved', auto: true }, meta);
      return approved;
    }
    return refund;
  }
  async transitionRefund(actorId: string, role: string, dto: { refundId: string; to: string; note?: string }, meta: Meta) {
    this.assertWrite(role);
    const before = await this.repo.refundById(dto.refundId);
    if (!before) throw new NotFoundException({ code: 'refund_not_found' });
    const allowed = REFUND_TRANSITIONS[before.status] ?? [];
    if (!allowed.includes(dto.to)) {
      throw new BadRequestException({ code: 'bad_transition', from: before.status, to: dto.to });
    }
    // Dual-approval gate.
    const controls = await this.controlMap();
    const dualThreshold = Number(controls.refund_dual_approval_over_minor?.value ?? 0);
    if (dto.to === 'approved' && dualThreshold > 0 && before.amount_minor >= dualThreshold) {
      if (role !== 'super_admin' && before.requested_by === actorId) {
        throw new ForbiddenException({ code: 'dual_approval_required' });
      }
    }
    if (dto.to === 'reversed' && role !== 'super_admin') {
      throw new ForbiddenException({ code: 'super_admin_required' });
    }
    const after = await this.repo.transitionRefund(dto.refundId, dto.to, actorId);
    await this.repo.audit(actorId, 'refund.transition', 'refund', after.id, { from: before.status, to: dto.to, note: dto.note ?? null }, meta);
    // Ledger entries on terminal states.
    if (dto.to === 'succeeded') {
      await this.repo.writeLedger({
        account: 'refunds', ownerId: after.customer_id, refKind: 'refund', refId: after.id,
        direction: 'debit', amountMinor: after.amount_minor, currency: after.currency,
        description: `Refund ${after.reference} succeeded`, actorId,
      });
    }
    if (dto.to === 'reversed') {
      await this.repo.writeLedger({
        account: 'refunds', ownerId: after.customer_id, refKind: 'refund', refId: after.id,
        direction: 'credit', amountMinor: after.amount_minor, currency: after.currency,
        description: `Refund ${after.reference} reversed`, actorId,
      });
    }
    return after;
  }

  // ── Holds ─────────────────────────────────────────
  async listHolds(role: string, status?: string) {
    this.assertRead(role);
    return { items: await this.repo.listHolds(status) };
  }
  async createHold(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertWrite(role);
    const h = await this.repo.createHold(dto);
    await this.repo.audit(actorId, 'hold.create', 'hold', h.id, { reason: h.reason, amountMinor: h.amount_minor }, meta);
    return h;
  }
  async releaseHold(actorId: string, role: string, dto: { holdId: string; note?: string }, meta: Meta) {
    this.assertWrite(role);
    const h = await this.repo.releaseHold(dto.holdId, actorId);
    if (!h) throw new BadRequestException({ code: 'hold_not_active' });
    await this.repo.audit(actorId, 'hold.release', 'hold', h.id, { note: dto.note ?? null }, meta);
    return h;
  }

  // ── Controls ──────────────────────────────────────
  async listControls(role: string) {
    this.assertRead(role);
    return { items: await this.repo.listControls() };
  }
  async setControl(actorId: string, role: string, dto: any, meta: Meta) {
    if (role !== 'finance_admin' && role !== 'super_admin') {
      throw new ForbiddenException({ code: 'finance_admin_required' });
    }
    // Sensitive controls require super_admin.
    if (['payout_pause','billing_freeze'].includes(dto.controlKey) && role !== 'super_admin') {
      throw new ForbiddenException({ code: 'super_admin_required' });
    }
    const c = await this.repo.setControl(dto, actorId);
    await this.repo.audit(actorId, 'control.set', 'control', c.id, { key: dto.controlKey, value: dto.value, enabled: dto.enabled }, meta);
    return c;
  }

  // ── Ledger ────────────────────────────────────────
  async ledger(role: string, account?: string) {
    this.assertRead(role);
    return { items: await this.repo.ledger(account, 200) };
  }

  // ── ML risk score (deterministic fallback) ────────
  private async scoreRisk(kpis: any) {
    try {
      const r = await fetch(`${ML_BASE}/finance-admin/score`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals: kpis }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml down: ${(e as Error).message}`); }
    return this.fallbackRisk(kpis);
  }
  private fallbackRisk(k: any) {
    const pendingRefunds = (k.refunds?.pending?.count ?? 0) + (k.refunds?.processing?.count ?? 0);
    const failedRefunds  = k.refunds?.failed?.count ?? 0;
    const activeHolds    = k.holds?.active?.count ?? 0;
    let score = 10 + Math.min(40, pendingRefunds * 4) + Math.min(30, failedRefunds * 6) + Math.min(20, activeHolds * 3);
    score = Math.min(100, score);
    const band = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'elevated' : 'normal';
    return { score, band, model: 'deterministic-v1', factors: { pendingRefunds, failedRefunds, activeHolds } };
  }

  // ── Insights ──────────────────────────────────────
  private async fetchInsights(kpis: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/finance-admin/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals: kpis }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(kpis);
  }
  private fallbackInsights(k: any) {
    const out: any[] = [];
    const pending = k.refunds?.pending?.count ?? 0;
    if (pending > 25) out.push({ id: 'refund_backlog', severity: 'critical', title: `${pending} refunds pending — work the queue.` });
    else if (pending > 5) out.push({ id: 'refund_warn', severity: 'warn', title: `${pending} refunds pending review.` });
    const failed = k.refunds?.failed?.count ?? 0;
    if (failed > 0) out.push({ id: 'refund_failed', severity: 'warn', title: `${failed} refunds failed at provider.` });
    const activeHolds = k.holds?.active?.count ?? 0;
    if (activeHolds > 0) out.push({ id: 'holds_active', severity: 'info', title: `${activeHolds} active holds — review ageing.` });
    if (!out.length) out.push({ id: 'fin_healthy', severity: 'success', title: 'Finance posture healthy.' });
    return out;
  }

  // ── Helpers ───────────────────────────────────────
  private async controlMap() {
    const items = await this.repo.listControls();
    const map: Record<string, any> = {};
    for (const c of items) if (c.scope === 'global' && c.scope_key === '*') map[c.control_key] = { value: c.value?.value, enabled: c.enabled };
    return map;
  }
  private isReader(role: string)   { return ['viewer','operator','finance_admin','super_admin'].includes(role); }
  private isWriter(role: string)   { return ['finance_admin','super_admin'].includes(role); }
  private assertRead(role: string) { if (!this.isReader(role)) throw new ForbiddenException({ code: 'finance_read_required' }); }
  private assertWrite(role: string){ if (!this.isWriter(role)) throw new ForbiddenException({ code: 'finance_write_required' }); }
}
