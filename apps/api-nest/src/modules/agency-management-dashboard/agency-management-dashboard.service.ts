import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { AgencyManagementDashboardRepository } from './agency-management-dashboard.repository';
import {
  ENGAGEMENT_TRANSITIONS, DELIVERABLE_TRANSITIONS, INVOICE_TRANSITIONS,
  EngagementStatus, DeliverableStatus, InvoiceStatus,
  TransitionEngagementDto, TransitionDeliverableDto, TransitionInvoiceDto,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';

@Injectable()
export class AgencyManagementDashboardService {
  private readonly logger = new Logger(AgencyManagementDashboardService.name);
  constructor(private readonly repo: AgencyManagementDashboardRepository) {}

  async overview(agencyId: string, windowDays = 30) {
    const [engagementsPage, deliverables, utilSummary, invoiceTotalsRaw] = await Promise.all([
      this.repo.listEngagements(agencyId, { page: 1, pageSize: 50 }),
      this.repo.listDeliverables(agencyId, {}),
      this.repo.utilizationSummary(agencyId, windowDays).catch(() => []),
      this.repo.invoiceTotals(agencyId).catch(() => []),
    ]);

    const engagements = engagementsPage.items;
    const active = engagements.filter((e: any) => e.status === 'active');
    const atRisk = engagements.filter((e: any) => e.status === 'at_risk');
    const totalBudget = engagements.reduce((s: number, e: any) => s + (e.budgetCents || 0), 0);
    const totalSpent = engagements.reduce((s: number, e: any) => s + (e.spentCents || 0), 0);

    const totals: Record<string, { count: number; totalCents: number }> = {};
    for (const r of (invoiceTotalsRaw as any[]) ?? []) {
      totals[r.status] = { count: Number(r.count ?? 0), totalCents: Number(r.total_cents ?? r.totalCents ?? 0) };
    }
    const arOutstandingCents = (totals.sent?.totalCents ?? 0) + (totals.overdue?.totalCents ?? 0);

    const avgUtil = utilSummary.length
      ? Math.round((utilSummary.reduce((s: number, r: any) => s + Number(r.avg_utilization || 0), 0) / utilSummary.length) * 1000) / 10
      : 0;

    const blockedDeliverables = deliverables.filter((d: any) => d.status === 'blocked').length;
    const overdueDeliverables = deliverables.filter((d: any) => d.status !== 'done' && d.dueAt && new Date(d.dueAt) < new Date()).length;

    const insights = await this.fetchInsights(agencyId, {
      atRisk: atRisk.length, blockedDeliverables, overdueDeliverables, arOutstandingCents,
      avgUtilization: avgUtil, totalSpent, totalBudget,
    }).catch(() => this.fallbackInsights({ atRisk: atRisk.length, blockedDeliverables, overdueDeliverables, avgUtilization: avgUtil }));

    return {
      windowDays,
      kpis: {
        activeEngagements: active.length,
        atRiskEngagements: atRisk.length,
        totalEngagements: engagements.length,
        totalBudgetCents: totalBudget,
        totalSpentCents: totalSpent,
        arOutstandingCents,
        avgUtilization: avgUtil,
        blockedDeliverables,
        overdueDeliverables,
      },
      engagements: engagements.slice(0, 8),
      deliverables: deliverables.slice(0, 12),
      utilization: utilSummary,
      invoiceTotals: totals,
      insights,
      computedAt: new Date().toISOString(),
    };
  }

  private async fetchInsights(agencyId: string, signals: any) {
    try {
      const res = await fetch(`${ANALYTICS_BASE}/agency-management-dashboard/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agency_id: agencyId, signals }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return (await res.json()).insights ?? [];
    } catch (e) {
      this.logger.warn(`analytics unavailable: ${(e as Error).message}`);
    }
    return this.fallbackInsights(signals);
  }

  private fallbackInsights(s: { atRisk: number; blockedDeliverables: number; overdueDeliverables: number; avgUtilization: number }) {
    const out: any[] = [];
    if (s.atRisk > 0) out.push({ id: 'at-risk', severity: 'warn', title: `${s.atRisk} at-risk engagement(s)`, body: 'Open the portfolio rail to triage.' });
    if (s.blockedDeliverables > 0) out.push({ id: 'blocked', severity: 'warn', title: `${s.blockedDeliverables} blocked deliverable(s)`, body: 'Resolve blockers in the delivery board.' });
    if (s.overdueDeliverables > 0) out.push({ id: 'overdue', severity: 'warn', title: `${s.overdueDeliverables} overdue deliverable(s)`, body: 'Reschedule or escalate.' });
    if (s.avgUtilization > 90) out.push({ id: 'overutil', severity: 'warn', title: `Utilization ${s.avgUtilization}%`, body: 'Team is over capacity — check burn-out risk.' });
    else if (s.avgUtilization > 0 && s.avgUtilization < 55) out.push({ id: 'underutil', severity: 'info', title: `Utilization ${s.avgUtilization}%`, body: 'Capacity available for new pitches.' });
    if (!out.length) out.push({ id: 'all-clear', severity: 'success', title: 'Agency cockpit healthy', body: 'No outstanding signals.' });
    return out;
  }

  // Engagements
  listEngagements(agencyId: string, q: any) { return this.repo.listEngagements(agencyId, q); }

  async transitionEngagement(agencyId: string, id: string, dto: TransitionEngagementDto, actorId: string) {
    const current = await this.repo.getEngagement(agencyId, id);
    if (!current) throw new NotFoundException('engagement not found');
    const allowed = ENGAGEMENT_TRANSITIONS[current.status as EngagementStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`invalid transition: ${current.status} → ${dto.status}`);
    }
    const row = await this.repo.updateEngagementStatus(id, dto.status);
    await this.repo.recordEvent(agencyId, actorId, `engagement.${dto.status}`, { type: 'engagement', id }, { from: current.status, to: dto.status, reason: dto.reason });
    return row;
  }

  // Deliverables + ML risk scoring
  async listDeliverables(agencyId: string, q: any) {
    const items = await this.repo.listDeliverables(agencyId, q);
    if (items.length) {
      try {
        const scored = await this.scoreDeliverables(items);
        const byId = new Map(scored.map((r: any) => [r.id, r.riskScore]));
        return items.map((d: any) => ({ ...d, riskScore: byId.get(d.id) ?? null }));
      } catch { /* keep raw */ }
    }
    return items;
  }

  private async scoreDeliverables(items: any[]): Promise<{ id: string; riskScore: number }[]> {
    try {
      const res = await fetch(`${ML_BASE}/agency-management-dashboard/score-deliverables`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }), signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return (await res.json()).scores ?? [];
    } catch { /* fall through */ }
    // Deterministic fallback
    return items.map((d) => {
      let score = 0;
      if (d.status === 'blocked') score += 0.5;
      if (d.priority === 'urgent') score += 0.25;
      else if (d.priority === 'high') score += 0.1;
      if (d.dueAt && new Date(d.dueAt) < new Date() && d.status !== 'done') score += 0.3;
      return { id: d.id, riskScore: Math.min(1, Math.round(score * 1000) / 1000) };
    });
  }

  async transitionDeliverable(agencyId: string, id: string, dto: TransitionDeliverableDto, actorId: string) {
    const current = await this.repo.getDeliverable(agencyId, id);
    if (!current) throw new NotFoundException('deliverable not found');
    const allowed = DELIVERABLE_TRANSITIONS[current.status as DeliverableStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`invalid deliverable transition: ${current.status} → ${dto.status}`);
    }
    const row = await this.repo.updateDeliverableStatus(id, dto.status, { blockedReason: dto.blockedReason });
    await this.repo.recordEvent(agencyId, actorId, `deliverable.${dto.status}`, { type: 'deliverable', id }, { from: current.status, to: dto.status, blockedReason: dto.blockedReason, note: dto.note });
    return row;
  }

  // Utilization
  utilization(agencyId: string, q: any) { return this.repo.utilization(agencyId, q); }
  utilizationSummary(agencyId: string, windowDays: number) { return this.repo.utilizationSummary(agencyId, windowDays); }

  // Invoices
  listInvoices(agencyId: string, q: any) { return this.repo.listInvoices(agencyId, q); }

  async transitionInvoice(agencyId: string, id: string, dto: TransitionInvoiceDto, actorId: string) {
    const current = await this.repo.getInvoice(agencyId, id);
    if (!current) throw new NotFoundException('invoice not found');
    const allowed = INVOICE_TRANSITIONS[current.status as InvoiceStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`invalid invoice transition: ${current.status} → ${dto.status}`);
    }
    const row = await this.repo.updateInvoiceStatus(id, dto.status, dto.paidOn);
    await this.repo.recordEvent(agencyId, actorId, `invoice.${dto.status}`, { type: 'invoice', id }, { from: current.status, to: dto.status, note: dto.note });
    return row;
  }
}
