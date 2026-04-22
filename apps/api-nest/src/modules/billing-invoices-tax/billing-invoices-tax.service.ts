import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { BillingInvoicesTaxRepository } from './billing-invoices-tax.repository';
import {
  INVOICE_TRANSITIONS, SUB_TRANSITIONS, DISPUTE_TRANSITIONS,
  InvoiceStatus, SubStatus, DisputeStatus,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE        = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';

@Injectable()
export class BillingInvoicesTaxService {
  private readonly logger = new Logger(BillingInvoicesTaxService.name);
  constructor(private readonly repo: BillingInvoicesTaxRepository) {}

  // ─── Overview ────────────────────────────────
  async overview(ownerId: string) {
    const [profile, invoices, aging, subs] = await Promise.all([
      this.repo.getProfile(ownerId),
      this.repo.listInvoices(ownerId, { page: 1, pageSize: 50 }),
      this.repo.aging(ownerId),
      this.repo.listSubscriptions(ownerId),
    ]);
    const open = invoices.items.filter((i: any) => i.status === 'open' || i.status === 'partially_paid');
    const outstanding = open.reduce((s: number, i: any) => s + (i.totalMinor - i.paidMinor), 0);
    const mrr = subs.filter((s: any) => s.status === 'active' || s.status === 'trialing')
      .reduce((sum: number, s: any) => {
        const factor = s.interval === 'year' ? 1/12 : s.interval === 'week' ? 4 : s.interval === 'day' ? 30 : 1;
        return sum + Math.round((s.amountMinor / s.intervalCount) * factor);
      }, 0);

    const insights = await this.fetchInsights(ownerId, {
      outstandingMinor: outstanding,
      overdueMinor: Number(aging.d0_30) + Number(aging.d31_60) + Number(aging.d61_plus),
      pastDueSubs: subs.filter((s: any) => s.status === 'past_due').length,
      activeSubs: subs.filter((s: any) => s.status === 'active').length,
      mrrMinor: mrr,
    }).catch(() => this.fallbackInsights({ outstanding, aging, subs }));

    return {
      profile, kpis: { outstandingMinor: outstanding, overdueMinor: Number(aging.d61_plus), mrrMinor: mrr,
                       openInvoices: open.length, activeSubscriptions: subs.filter((s: any) => s.status === 'active').length },
      aging, recentInvoices: invoices.items.slice(0, 10), subscriptions: subs.slice(0, 10),
      insights, computedAt: new Date().toISOString(),
    };
  }
  private async fetchInsights(ownerId: string, signals: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/billing-invoices-tax/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ owner_id: ownerId, signals }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(signals);
  }
  private fallbackInsights(s: any) {
    const out: any[] = [];
    if (Number(s.aging?.d61_plus ?? 0) > 0) out.push({ id: '61-plus', severity: 'error', title: 'Invoices 60+ days overdue', body: 'Escalate to collection or write off as uncollectible.' });
    if ((s.subs ?? []).some((x: any) => x.status === 'past_due')) out.push({ id: 'past-due-sub', severity: 'warn', title: 'Past-due subscriptions', body: 'Trigger dunning or pause access.' });
    if (!out.length) out.push({ id: 'healthy', severity: 'success', title: 'Billing healthy', body: 'No overdue invoices or past-due subscriptions.' });
    return out;
  }

  // ─── Commercial profile ─────────────────────
  async getProfile(ownerId: string) {
    return (await this.repo.getProfile(ownerId)) ?? null;
  }
  async saveProfile(ownerId: string, dto: any, actorId: string, req?: any) {
    const before = await this.repo.getProfile(ownerId);
    const after = await this.repo.upsertProfile(ownerId, dto);
    await this.repo.recordAudit(ownerId, actorId, before ? 'profile.updated' : 'profile.created',
      { type: 'commercial_profile', id: after.id }, { before, after }, req);
    return after;
  }

  // ─── Tax ────────────────────────────────────
  listTaxRates(ownerId: string) { return this.repo.listTaxRates(ownerId); }
  async createTaxRate(ownerId: string, dto: any, actorId: string, req?: any) {
    const row = await this.repo.createTaxRate(ownerId, dto);
    await this.repo.recordAudit(ownerId, actorId, 'tax_rate.created', { type: 'tax_rate', id: row.id }, dto, req);
    return row;
  }
  async computeTax(ownerId: string, dto: any) {
    if (dto.reverseCharge) return { source: 'rule', taxMinor: 0, rateBp: 0, reverseCharge: true };
    const rate = await this.repo.getActiveRate(ownerId, dto.jurisdiction, dto.category);
    const rateBp = rate?.rateBp ?? 0;
    return { source: rate ? 'lookup' : 'fallback', taxMinor: Math.round(dto.subtotalMinor * rateBp / 10_000), rateBp, reverseCharge: false };
  }

  // ─── Invoices ───────────────────────────────
  listInvoices(ownerId: string, q: any) { return this.repo.listInvoices(ownerId, q); }
  listMyInvoices(customerId: string) { return this.repo.listCustomerInvoices(customerId); }
  async getInvoice(ownerId: string, id: string, opts: { ownerOrCustomer?: 'owner' | 'customer'; viewerId?: string } = { ownerOrCustomer: 'owner' }) {
    const inv = await this.repo.getInvoice(id);
    if (!inv) throw new NotFoundException('invoice not found');
    if (opts.ownerOrCustomer === 'owner' && inv.ownerIdentityId !== ownerId) throw new ForbiddenException('not your invoice');
    if (opts.ownerOrCustomer === 'customer' && inv.customerIdentityId !== opts.viewerId) throw new ForbiddenException('not your invoice');
    const [lines, payments, events, disputes, dunning, credits] = await Promise.all([
      this.repo.listLines(id), this.repo.listPayments(id), this.repo.listEvents(id),
      this.repo.listDisputes(inv.ownerIdentityId), this.repo.listDunning(id), this.repo.listCreditNotes(id),
    ]);
    return { ...inv, lines, payments, events, dunning, creditNotes: credits, disputes: (disputes as any[]).filter((d) => d.invoice_id === id || d.invoiceId === id) };
  }
  async createInvoice(ownerId: string, dto: any, actorId: string, req?: any) {
    const profile = await this.repo.getProfile(ownerId);
    if (!profile) throw new BadRequestException('commercial profile required before issuing invoices');

    let subtotal = 0, tax = 0;
    const taxJurisdiction = dto.taxJurisdiction ?? 'GB';
    const lineRows = await Promise.all((dto.lines as any[]).map(async (l) => {
      const amount = Math.round(l.quantity * l.unitPriceMinor);
      let lineTax = 0;
      if (!dto.reverseCharge && l.taxRateBp > 0) lineTax = Math.round(amount * l.taxRateBp / 10_000);
      else if (!dto.reverseCharge) {
        const t = await this.computeTax(ownerId, { jurisdiction: taxJurisdiction, category: 'standard', subtotalMinor: amount, reverseCharge: false });
        lineTax = t.taxMinor;
      }
      subtotal += amount; tax += lineTax;
      return { description: l.description, quantity: String(l.quantity), unitPriceMinor: l.unitPriceMinor, taxRateBp: l.taxRateBp, amountMinor: amount, meta: l.meta ?? {} };
    }));

    const seq = await this.repo.incrementInvoiceSeq(ownerId);
    const number = `${profile.invoicePrefix}-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
    const due = dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + profile.paymentTermsDays * 86400_000);

    const invoice = await this.repo.createInvoice({
      ownerIdentityId: ownerId, customerIdentityId: dto.customerIdentityId ?? null,
      customerEmail: dto.customerEmail, customerName: dto.customerName,
      number, currency: dto.currency, subtotalMinor: subtotal, taxMinor: tax, totalMinor: subtotal + tax,
      status: 'draft', issueDate: new Date(), dueDate: due, poNumber: dto.poNumber ?? null, notes: dto.notes ?? null,
      reverseCharge: !!dto.reverseCharge, taxJurisdiction, subscriptionId: dto.subscriptionId ?? null,
    });
    await this.repo.replaceLines(invoice.id, lineRows);
    await this.repo.appendEvent({ invoiceId: invoice.id, kind: 'created', actorIdentityId: actorId, amountMinor: invoice.totalMinor, currency: invoice.currency, diff: { number, subtotal, tax } });
    await this.repo.recordAudit(ownerId, actorId, 'invoice.created', { type: 'invoice', id: invoice.id }, { number, total: invoice.totalMinor }, req);
    return invoice;
  }
  async updateInvoice(ownerId: string, id: string, patch: any, actorId: string, req?: any) {
    const before = await this.getInvoice(ownerId, id);
    if (before.status !== 'draft') throw new BadRequestException(`only draft invoices can be edited (current: ${before.status})`);
    const merged: any = {};
    for (const k of ['customerIdentityId','customerEmail','customerName','currency','poNumber','notes','reverseCharge','taxJurisdiction','dueDate']) {
      if (patch[k] !== undefined) merged[k] = k === 'dueDate' ? new Date(patch[k]) : patch[k];
    }
    let row = await this.repo.updateInvoice(id, merged);
    if (Array.isArray(patch.lines)) {
      let subtotal = 0, tax = 0;
      const lineRows = await Promise.all(patch.lines.map(async (l: any) => {
        const amount = Math.round(l.quantity * l.unitPriceMinor);
        let lineTax = 0;
        if (!row.reverseCharge && l.taxRateBp > 0) lineTax = Math.round(amount * l.taxRateBp / 10_000);
        subtotal += amount; tax += lineTax;
        return { description: l.description, quantity: String(l.quantity), unitPriceMinor: l.unitPriceMinor, taxRateBp: l.taxRateBp, amountMinor: amount, meta: l.meta ?? {} };
      }));
      await this.repo.replaceLines(id, lineRows);
      row = await this.repo.updateInvoice(id, { subtotalMinor: subtotal, taxMinor: tax, totalMinor: subtotal + tax });
    }
    await this.repo.appendEvent({ invoiceId: id, kind: 'status_changed', actorIdentityId: actorId, diff: { before, after: row } });
    await this.repo.recordAudit(ownerId, actorId, 'invoice.updated', { type: 'invoice', id }, { before, after: row }, req);
    return row;
  }
  async transitionInvoice(ownerId: string, id: string, status: InvoiceStatus, reason: string | undefined, actorId: string, req?: any) {
    const inv = await this.getInvoice(ownerId, id);
    const allowed = INVOICE_TRANSITIONS[inv.status as InvoiceStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${inv.status} → ${status}`);
    const patch: any = { status };
    if (status === 'void') patch.voidedAt = new Date();
    if (status === 'paid') patch.paidAt = new Date();
    const row = await this.repo.updateInvoice(id, patch);
    await this.repo.appendEvent({ invoiceId: id, kind: status === 'paid' ? 'paid' : 'status_changed', actorIdentityId: actorId, diff: { from: inv.status, to: status, reason } });
    await this.repo.recordAudit(ownerId, actorId, `invoice.${status}`, { type: 'invoice', id }, { from: inv.status, to: status, reason }, req);
    return row;
  }
  async recordPayment(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    const inv = await this.getInvoice(ownerId, id);
    if (inv.status !== 'open' && inv.status !== 'partially_paid' && inv.status !== 'draft') {
      throw new BadRequestException(`cannot record payment in status ${inv.status}`);
    }
    const remaining = inv.totalMinor - inv.paidMinor;
    if (dto.amountMinor > remaining) throw new BadRequestException(`payment exceeds remaining (${remaining})`);
    await this.repo.addPayment({
      invoiceId: id, provider: dto.provider, providerRef: dto.providerRef ?? null,
      amountMinor: dto.amountMinor, currency: inv.currency,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
    });
    const newPaid = inv.paidMinor + dto.amountMinor;
    const newStatus = newPaid >= inv.totalMinor ? 'paid' : 'partially_paid';
    const row = await this.repo.updateInvoice(id, { paidMinor: newPaid, status: newStatus, paidAt: newStatus === 'paid' ? new Date() : null });
    await this.repo.appendEvent({ invoiceId: id, kind: newStatus === 'paid' ? 'paid' : 'partially_paid', actorIdentityId: actorId, amountMinor: dto.amountMinor, currency: inv.currency, reference: dto.providerRef ?? null });
    await this.repo.recordAudit(ownerId, actorId, 'invoice.payment_recorded', { type: 'invoice', id }, { amount: dto.amountMinor, provider: dto.provider }, req);
    return row;
  }
  async refundInvoice(ownerId: string, id: string, amountMinor: number, reason: string, actorId: string, req?: any) {
    const inv = await this.getInvoice(ownerId, id);
    if (inv.status !== 'paid' && inv.status !== 'partially_refunded' && inv.status !== 'partially_paid') {
      throw new BadRequestException(`cannot refund invoice in status ${inv.status}`);
    }
    const refundable = inv.paidMinor - inv.refundedMinor;
    if (amountMinor > refundable) throw new BadRequestException(`refund exceeds refundable (${refundable})`);
    const newRefunded = inv.refundedMinor + amountMinor;
    const newStatus = newRefunded >= inv.paidMinor ? 'refunded' : 'partially_refunded';
    const row = await this.repo.updateInvoice(id, { refundedMinor: newRefunded, status: newStatus });
    const cnSeq = Date.now().toString(36);
    await this.repo.createCreditNote({ invoiceId: id, number: `CN-${new Date().getFullYear()}-${cnSeq}`, amountMinor, currency: inv.currency, reason, status: 'issued' });
    await this.repo.appendEvent({ invoiceId: id, kind: 'refunded', actorIdentityId: actorId, amountMinor: -amountMinor, currency: inv.currency, diff: { reason } });
    await this.repo.recordAudit(ownerId, actorId, 'invoice.refunded', { type: 'invoice', id }, { amountMinor, reason }, req);
    return row;
  }
  async sendReminder(ownerId: string, id: string, actorId: string, req?: any) {
    const inv = await this.getInvoice(ownerId, id);
    const next = (await this.repo.listDunning(id)).length + 1;
    const att = await this.repo.scheduleDunning({ invoiceId: id, attemptNumber: next, status: 'scheduled', scheduledFor: new Date(Date.now() + 60_000) });
    await this.repo.appendEvent({ invoiceId: id, kind: 'reminded', actorIdentityId: actorId, diff: { attempt: next } });
    await this.repo.recordAudit(ownerId, actorId, 'invoice.reminder_scheduled', { type: 'invoice', id }, { attempt: next }, req);
    return att;
  }

  // ─── Subscriptions ──────────────────────────
  listSubscriptions(ownerId: string, status?: string) { return this.repo.listSubscriptions(ownerId, status); }
  listMySubscriptions(customerId: string) { return this.repo.listCustomerSubscriptions(customerId); }
  async createSubscription(ownerId: string, dto: any, actorId: string, req?: any) {
    const now = new Date();
    const periodEnd = new Date(now); periodEnd.setMonth(periodEnd.getMonth() + (dto.interval === 'month' ? dto.intervalCount : dto.interval === 'year' ? dto.intervalCount * 12 : 1));
    const sub = await this.repo.createSubscription({
      ownerIdentityId: ownerId, customerIdentityId: dto.customerIdentityId, productKey: dto.productKey,
      planName: dto.planName, amountMinor: dto.amountMinor, currency: dto.currency, interval: dto.interval, intervalCount: dto.intervalCount,
      status: dto.trialDays > 0 ? 'trialing' : 'active',
      trialEndsAt: dto.trialDays > 0 ? new Date(Date.now() + dto.trialDays * 86400_000) : null,
      currentPeriodStart: now, currentPeriodEnd: periodEnd,
    });
    await this.repo.recordAudit(ownerId, actorId, 'subscription.created', { type: 'subscription', id: sub.id }, dto, req);
    return sub;
  }
  async transitionSubscription(ownerId: string, id: string, status: SubStatus, reason: string | undefined, actorId: string, req?: any) {
    const sub = await this.repo.getSubscription(id);
    if (!sub) throw new NotFoundException('subscription not found');
    if (sub.ownerIdentityId !== ownerId) throw new ForbiddenException('not your subscription');
    const allowed = SUB_TRANSITIONS[sub.status as SubStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${sub.status} → ${status}`);
    const patch: any = { status };
    if (status === 'cancelled') patch.cancelledAt = new Date();
    if (status === 'paused') patch.pausedAt = new Date();
    const row = await this.repo.updateSubscription(id, patch);
    await this.repo.recordAudit(ownerId, actorId, `subscription.${status}`, { type: 'subscription', id }, { from: sub.status, to: status, reason }, req);
    return row;
  }

  // ─── Disputes ───────────────────────────────
  listDisputes(ownerId: string) { return this.repo.listDisputes(ownerId); }
  async openDispute(ownerId: string, dto: any, actorId: string, req?: any) {
    const inv = await this.getInvoice(ownerId, dto.invoiceId);
    if (dto.amountMinor > inv.totalMinor) throw new BadRequestException('dispute exceeds invoice total');
    const row = await this.repo.openDispute({ invoiceId: dto.invoiceId, amountMinor: dto.amountMinor, reason: dto.reason, evidenceUrl: dto.evidenceUrl ?? null });
    await this.repo.appendEvent({ invoiceId: dto.invoiceId, kind: 'disputed', actorIdentityId: actorId, amountMinor: dto.amountMinor, diff: { reason: dto.reason } });
    await this.repo.recordAudit(ownerId, actorId, 'dispute.opened', { type: 'dispute', id: row.id }, dto, req);
    return row;
  }
  async transitionDispute(ownerId: string, id: string, status: DisputeStatus, reason: string | undefined, actorId: string, req?: any) {
    const dispute = await this.repo.getDispute(id);
    if (!dispute) throw new NotFoundException('dispute not found');
    const allowed = DISPUTE_TRANSITIONS[dispute.status as DisputeStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${dispute.status} → ${status}`);
    const row = await this.repo.updateDispute(id, { status, resolvedAt: ['won','lost','accepted'].includes(status) ? new Date() : null });
    await this.repo.recordAudit(ownerId, actorId, `dispute.${status}`, { type: 'dispute', id }, { from: dispute.status, to: status, reason }, req);
    return row;
  }

  // ─── Risk score (assistive ML) ──────────────
  async assessInvoice(ownerId: string, invoiceId: string) {
    try {
      const inv = await this.getInvoice(ownerId, invoiceId);
      const r = await fetch(`${ML_BASE}/billing-invoices-tax/risk-score`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          total_minor: inv.totalMinor,
          days_outstanding: inv.dueDate ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400_000) : 0,
          customer_history: { invoices: 1 },
        }),
        signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml down: ${(e as Error).message}`); }
    const inv = await this.getInvoice(ownerId, invoiceId);
    const overdue = inv.dueDate ? Math.max(0, Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400_000)) : 0;
    const score = Math.min(1, 0.05 + overdue * 0.02 + (inv.totalMinor > 1000_00 ? 0.2 : 0));
    return { source: 'fallback', riskScore: score, action: score > 0.6 ? 'manual_review' : 'allow' };
  }

  // ─── Audit ──────────────────────────────────
  audit(ownerId: string, limit = 100) { return this.repo.listAudit(ownerId, limit); }

  // ─── Webhooks ───────────────────────────────
  async handleWebhook(provider: string, evt: { id: string; type: string; data: any }, signatureValid: boolean, req?: any) {
    if (await this.repo.hasWebhook(provider, evt.id)) return { status: 'duplicate' };
    if (!signatureValid) {
      await this.repo.recordWebhook({ provider, eventId: evt.id, eventType: evt.type, signatureValid: 'false', status: 'failed', payload: evt });
      throw new ForbiddenException('invalid webhook signature');
    }
    let outcome: 'processed' | 'skipped' = 'skipped';
    try {
      const obj = evt.data?.object ?? {};
      if (evt.type === 'invoice.payment_succeeded' && obj.invoice_id && obj.amount) {
        const inv = await this.repo.getInvoice(obj.invoice_id);
        if (inv && (inv.status === 'open' || inv.status === 'partially_paid')) {
          await this.recordPayment(inv.ownerIdentityId, inv.id, { amountMinor: Number(obj.amount), provider, providerRef: obj.id }, 'webhook', req);
          outcome = 'processed';
        }
      }
      if (evt.type === 'charge.dispute.created' && obj.invoice_id) {
        const inv = await this.repo.getInvoice(obj.invoice_id);
        if (inv) {
          await this.openDispute(inv.ownerIdentityId, { invoiceId: inv.id, amountMinor: Number(obj.amount ?? inv.totalMinor), reason: obj.reason ?? 'provider_dispute' }, 'webhook', req);
          outcome = 'processed';
        }
      }
    } finally {
      await this.repo.recordWebhook({ provider, eventId: evt.id, eventType: evt.type, signatureValid: 'true', status: outcome, payload: evt });
    }
    return { status: outcome };
  }
}
