import { Injectable, ForbiddenException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { ClientDashboardRepository } from './client-dashboard.repository';
import {
  PROPOSAL_TRANSITIONS, OVERSIGHT_TRANSITIONS,
  ProposalStatus, OversightStatus,
  TransitionProposalDto, TransitionOversightDto,
  ApproveDto, SaveItemDto,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';

@Injectable()
export class ClientDashboardService {
  private readonly logger = new Logger(ClientDashboardService.name);

  constructor(private readonly repo: ClientDashboardRepository) {}

  // ---- Overview composition
  async overview(clientId: string, windowDays = 30) {
    const [spendTotalsRaw, proposalsList, oversightList, approvals] = await Promise.all([
      this.repo.spendTotals(clientId, windowDays).catch(() => []),
      this.repo.listProposals(clientId, { page: 1, pageSize: 50 }),
      this.repo.listOversight(clientId, { page: 1, pageSize: 50 }),
      this.repo.listApprovals(clientId, 'pending'),
    ]);

    const spendByCategory: Record<string, number> = {};
    let spendCleared = 0, spendPending = 0;
    for (const row of (spendTotalsRaw as any[]) ?? []) {
      const cleared = Number(row.cleared_cents ?? row.clearedCents ?? 0);
      const pending = Number(row.pending_cents ?? row.pendingCents ?? 0);
      spendByCategory[row.category] = cleared;
      spendCleared += cleared;
      spendPending += pending;
    }

    const oversight = oversightList.items;
    const atRisk = oversight.filter((p: any) => p.status === 'at_risk').length;
    const active = oversight.filter((p: any) => ['active', 'at_risk'].includes(p.status)).length;
    const totalBudget = oversight.reduce((s: number, p: any) => s + (p.budgetCents || 0), 0);
    const totalSpent = oversight.reduce((s: number, p: any) => s + (p.spentCents || 0), 0);

    const insights = await this.fetchInsights(clientId, { spendCleared, spendPending, atRisk, pendingApprovals: approvals.length, windowDays })
      .catch(() => this.fallbackInsights({ atRisk, pendingApprovals: approvals.length }));

    return {
      windowDays,
      kpis: {
        spendClearedCents: spendCleared,
        spendPendingCents: spendPending,
        activeProjects: active,
        atRiskProjects: atRisk,
        pendingApprovals: approvals.length,
        openProposals: proposalsList.items.filter((p: any) => ['received', 'shortlisted'].includes(p.status)).length,
        budgetUtilisation: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0,
      },
      spendByCategory,
      proposals: proposalsList.items.slice(0, 8),
      oversight: oversight.slice(0, 8),
      pendingApprovals: approvals.slice(0, 8),
      insights,
      computedAt: new Date().toISOString(),
    };
  }

  private async fetchInsights(clientId: string, signals: any) {
    try {
      const res = await fetch(`${ANALYTICS_BASE}/client-dashboard/insights`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, signals }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return (await res.json()).insights ?? [];
    } catch (e) {
      this.logger.warn(`analytics insights unavailable: ${(e as Error).message}`);
    }
    return this.fallbackInsights(signals);
  }

  private fallbackInsights(signals: { atRisk: number; pendingApprovals: number }) {
    const out: any[] = [];
    if (signals.atRisk > 0) {
      out.push({ id: 'at-risk', severity: 'warn', title: `${signals.atRisk} project(s) at risk`, body: 'Review timelines and budget burn before they escalate.' });
    }
    if (signals.pendingApprovals > 0) {
      out.push({ id: 'approvals', severity: 'info', title: `${signals.pendingApprovals} approval(s) waiting`, body: 'Decide to keep delivery moving.' });
    }
    if (!out.length) {
      out.push({ id: 'all-clear', severity: 'success', title: 'All clear', body: 'No outstanding actions on your buyer dashboard.' });
    }
    return out;
  }

  // ---- Spend
  spendList(clientId: string, q: any) { return this.repo.listSpend(clientId, q); }
  spendTotals(clientId: string, windowDays: number) { return this.repo.spendTotals(clientId, windowDays); }

  // ---- Proposals
  async listProposals(clientId: string, q: any) {
    const page = await this.repo.listProposals(clientId, q);
    if (page.items.length) {
      // Best-effort ML enrichment of match scores; deterministic fallback if unavailable.
      try {
        const ranked = await this.rankProposals(page.items);
        await this.repo.setProposalScores(ranked.map(r => ({ id: r.id, matchScore: r.score })));
        const byId = new Map(ranked.map(r => [r.id, r.score]));
        page.items = page.items.map((p: any) => ({ ...p, matchScore: byId.get(p.id) ?? p.matchScore }));
      } catch { /* keep stored scores */ }
    }
    return page;
  }

  private async rankProposals(items: any[]): Promise<{ id: string; score: number }[]> {
    try {
      const res = await fetch(`${ML_BASE}/client-dashboard/rank-proposals`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        return data.ranked ?? [];
      }
    } catch { /* fall through */ }
    // Deterministic fallback: amount-normalised + duration penalty.
    const maxAmt = Math.max(1, ...items.map(i => i.amountCents || 0));
    return items.map(i => {
      const amtScore = 1 - (i.amountCents || 0) / maxAmt;
      const durPenalty = Math.min(0.3, ((i.durationDays || 14) - 14) / 200);
      const score = Math.max(0, Math.min(1, 0.6 + amtScore * 0.3 - durPenalty));
      return { id: i.id, score: Math.round(score * 1000) / 1000 };
    });
  }

  async transitionProposal(clientId: string, id: string, dto: TransitionProposalDto, actorId: string) {
    const current = await this.repo.getProposal(clientId, id);
    if (!current) throw new NotFoundException('proposal not found');
    const allowed = PROPOSAL_TRANSITIONS[current.status as ProposalStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`invalid transition: ${current.status} → ${dto.status}`);
    }
    const row = await this.repo.updateProposalStatus(id, dto.status, dto.reason);
    await this.repo.recordEvent(clientId, actorId, `proposal.${dto.status}`, { type: 'proposal', id }, { from: current.status, to: dto.status, reason: dto.reason });
    return row;
  }

  // ---- Oversight
  listOversight(clientId: string, q: any) { return this.repo.listOversight(clientId, q); }

  async transitionOversight(clientId: string, id: string, dto: TransitionOversightDto, actorId: string) {
    const current = await this.repo.getOversight(clientId, id);
    if (!current) throw new NotFoundException('project not found');
    const allowed = OVERSIGHT_TRANSITIONS[current.status as OversightStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`invalid transition: ${current.status} → ${dto.status}`);
    }
    const row = await this.repo.updateOversightStatus(id, dto.status);
    await this.repo.recordEvent(clientId, actorId, `oversight.${dto.status}`, { type: 'project', id }, { from: current.status, to: dto.status, note: dto.note });
    return row;
  }

  // ---- Saved
  listSaved(clientId: string) { return this.repo.listSaved(clientId); }
  async saveItem(clientId: string, dto: SaveItemDto, actorId: string) {
    const row = await this.repo.saveItem(clientId, dto);
    await this.repo.recordEvent(clientId, actorId, 'saved.add', { type: dto.itemType, id: dto.itemId });
    return row ?? { ok: true, deduped: true };
  }
  async unsaveItem(clientId: string, id: string, actorId: string) {
    await this.repo.recordEvent(clientId, actorId, 'saved.remove', { type: 'saved', id });
    return this.repo.unsaveItem(clientId, id);
  }

  // ---- Approvals
  listApprovals(clientId: string, status?: string) { return this.repo.listApprovals(clientId, status); }

  async decideApproval(clientId: string, id: string, dto: ApproveDto, actorId: string) {
    const current = await this.repo.getApproval(clientId, id);
    if (!current) throw new NotFoundException('approval not found');
    if (current.status !== 'pending') throw new ForbiddenException('approval already decided');
    const row = await this.repo.decideApproval(id, dto.decision, dto.note);
    await this.repo.recordEvent(clientId, actorId, `approval.${dto.decision}`, { type: current.kind, id: current.referenceId }, { note: dto.note });
    return row;
  }
}
