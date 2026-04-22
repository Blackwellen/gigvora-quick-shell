import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { EnterpriseDashboardRepository } from './enterprise-dashboard.repository';
import {
  REQUISITION_TRANSITIONS, PO_TRANSITIONS, TASK_TRANSITIONS,
  RequisitionStatus, PurchaseOrderStatus, TaskStatus,
  TransitionRequisitionDto, TransitionPurchaseOrderDto, TransitionTaskDto,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';

@Injectable()
export class EnterpriseDashboardService {
  private readonly logger = new Logger(EnterpriseDashboardService.name);
  constructor(private readonly repo: EnterpriseDashboardRepository) {}

  async overview(entId: string, windowDays = 30) {
    const [reqsPage, pos, members, tasks, spendByCat, poTotalsRaw] = await Promise.all([
      this.repo.listRequisitions(entId, { page: 1, pageSize: 50 }),
      this.repo.listPurchaseOrders(entId, {}),
      this.repo.listTeamMembers(entId, {}),
      this.repo.listTasks(entId, {}),
      this.repo.spendByCategory(entId, windowDays).catch(() => []),
      this.repo.poTotals(entId).catch(() => []),
    ]);

    const reqs = reqsPage.items;
    const openReqs = reqs.filter((r: any) => r.status === 'open').length;
    const onHoldReqs = reqs.filter((r: any) => r.status === 'on_hold').length;
    const totalApplicants = reqs.reduce((s: number, r: any) => s + (r.applicants || 0), 0);

    const poTotals: Record<string, { count: number; totalCents: number }> = {};
    for (const r of (poTotalsRaw as any[]) ?? []) {
      poTotals[r.status] = { count: Number(r.count ?? 0), totalCents: Number(r.total_cents ?? r.totalCents ?? 0) };
    }
    const pendingApprovals = pos.filter((p: any) => p.status === 'submitted').length;

    const totalSpendCents = (spendByCat as any[]).reduce((s, r) => s + Number(r.total_cents ?? 0), 0);

    const blockedTasks = tasks.filter((t: any) => t.status === 'blocked').length;
    const overdueTasks = tasks.filter((t: any) => t.status !== 'done' && t.dueAt && new Date(t.dueAt) < new Date()).length;

    const insights = await this.fetchInsights(entId, {
      openReqs, onHoldReqs, pendingApprovals, blockedTasks, overdueTasks,
      totalSpendCents, headcount: members.length,
      onboarding: members.filter((m: any) => m.status === 'onboarding').length,
    }).catch(() => this.fallbackInsights({ openReqs, pendingApprovals, blockedTasks, overdueTasks }));

    return {
      windowDays,
      kpis: {
        openRequisitions: openReqs,
        onHoldRequisitions: onHoldReqs,
        totalApplicants,
        pendingPoApprovals: pendingApprovals,
        totalSpendCents,
        headcount: members.length,
        onboarding: members.filter((m: any) => m.status === 'onboarding').length,
        blockedTasks,
        overdueTasks,
      },
      requisitions: reqs.slice(0, 8),
      purchaseOrders: pos.slice(0, 8),
      members: members.slice(0, 12),
      tasks: tasks.slice(0, 12),
      spendByCategory: spendByCat,
      poTotals,
      insights,
      computedAt: new Date().toISOString(),
    };
  }

  private async fetchInsights(entId: string, signals: any) {
    try {
      const res = await fetch(`${ANALYTICS_BASE}/enterprise-dashboard/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enterprise_id: entId, signals }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return (await res.json()).insights ?? [];
    } catch (e) {
      this.logger.warn(`analytics unavailable: ${(e as Error).message}`);
    }
    return this.fallbackInsights(signals);
  }

  private fallbackInsights(s: { openReqs: number; pendingApprovals: number; blockedTasks: number; overdueTasks: number }) {
    const out: any[] = [];
    if (s.pendingApprovals > 0) out.push({ id: 'po-pending', severity: 'warn', title: `${s.pendingApprovals} PO(s) awaiting approval`, body: 'Open Procurement to clear the queue.' });
    if (s.blockedTasks > 0) out.push({ id: 'blocked', severity: 'warn', title: `${s.blockedTasks} blocked task(s)`, body: 'Resolve blockers in Team Operations.' });
    if (s.overdueTasks > 0) out.push({ id: 'overdue', severity: 'warn', title: `${s.overdueTasks} overdue task(s)`, body: 'Reschedule or escalate.' });
    if (s.openReqs > 5) out.push({ id: 'reqs-volume', severity: 'info', title: `${s.openReqs} open requisitions`, body: 'High hiring load — review pipeline.' });
    if (!out.length) out.push({ id: 'all-clear', severity: 'success', title: 'Enterprise cockpit healthy', body: 'No outstanding signals.' });
    return out;
  }

  // Requisitions
  listRequisitions(entId: string, q: any) { return this.repo.listRequisitions(entId, q); }

  async transitionRequisition(entId: string, id: string, dto: TransitionRequisitionDto, actorId: string) {
    const current = await this.repo.getRequisition(entId, id);
    if (!current) throw new NotFoundException('requisition not found');
    const allowed = REQUISITION_TRANSITIONS[current.status as RequisitionStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`invalid transition: ${current.status} → ${dto.status}`);
    }
    const row = await this.repo.updateRequisitionStatus(id, dto.status);
    await this.repo.recordEvent(entId, actorId, `requisition.${dto.status}`, { type: 'requisition', id }, { from: current.status, to: dto.status, reason: dto.reason });
    return row;
  }

  // Purchase orders + ML risk scoring
  async listPurchaseOrders(entId: string, q: any) {
    const items = await this.repo.listPurchaseOrders(entId, q);
    if (items.length) {
      try {
        const scored = await this.scorePurchaseOrders(items);
        const byId = new Map(scored.map((r: any) => [r.id, r.riskScore]));
        return items.map((p: any) => ({ ...p, riskScore: byId.get(p.id) ?? null }));
      } catch { /* keep raw */ }
    }
    return items;
  }

  private async scorePurchaseOrders(items: any[]): Promise<{ id: string; riskScore: number }[]> {
    try {
      const res = await fetch(`${ML_BASE}/enterprise-dashboard/score-purchase-orders`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }), signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return (await res.json()).scores ?? [];
    } catch { /* fall through */ }
    return items.map((p) => {
      let score = 0;
      if ((p.amountCents ?? 0) > 5_000_000) score += 0.4;
      else if ((p.amountCents ?? 0) > 1_000_000) score += 0.2;
      if (p.status === 'submitted') score += 0.15;
      if (!p.vendorIdentityId) score += 0.1; // unknown vendor
      return { id: p.id, riskScore: Math.min(1, Math.round(score * 1000) / 1000) };
    });
  }

  async transitionPurchaseOrder(entId: string, id: string, dto: TransitionPurchaseOrderDto, actorId: string) {
    const current = await this.repo.getPurchaseOrder(entId, id);
    if (!current) throw new NotFoundException('purchase order not found');
    const allowed = PO_TRANSITIONS[current.status as PurchaseOrderStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`invalid PO transition: ${current.status} → ${dto.status}`);
    }
    const row = await this.repo.updatePurchaseOrderStatus(id, dto.status, { receivedOn: dto.receivedOn });
    await this.repo.recordEvent(entId, actorId, `po.${dto.status}`, { type: 'po', id }, { from: current.status, to: dto.status, reason: dto.reason });
    return row;
  }

  // Team
  listTeamMembers(entId: string, q: any) { return this.repo.listTeamMembers(entId, q); }
  listTasks(entId: string, q: any) { return this.repo.listTasks(entId, q); }

  async transitionTask(entId: string, id: string, dto: TransitionTaskDto, actorId: string) {
    const current = await this.repo.getTask(entId, id);
    if (!current) throw new NotFoundException('task not found');
    const allowed = TASK_TRANSITIONS[current.status as TaskStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`invalid task transition: ${current.status} → ${dto.status}`);
    }
    const row = await this.repo.updateTaskStatus(id, dto.status, { blockedReason: dto.blockedReason });
    await this.repo.recordEvent(entId, actorId, `task.${dto.status}`, { type: 'task', id }, { from: current.status, to: dto.status, blockedReason: dto.blockedReason, note: dto.note });
    return row;
  }

  // Spend
  spend(entId: string, q: any) { return this.repo.spend(entId, q); }
  spendByCategory(entId: string, windowDays: number) { return this.repo.spendByCategory(entId, windowDays); }
}
