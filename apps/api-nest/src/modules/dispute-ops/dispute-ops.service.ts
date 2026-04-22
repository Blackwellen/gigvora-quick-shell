import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DisputeOpsRepository } from './dispute-ops.repository';
import { CASE_TRANSITIONS, QUEUE_BY_STATUS } from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE        = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';

type Meta = { ip?: string; userAgent?: string };

/**
 * Domain 69 — Dispute Operations.
 * Roles ladder: viewer < operator < mediator < arbitrator < dispute_admin.
 *  - viewer/operator: read KPIs, browse queues
 *  - mediator: assign, transition (mediation/awaiting_response/resolved), post messages, add evidence
 *  - arbitrator: open + decide arbitration, transition to arbitration/resolved
 *  - dispute_admin: escalate, override, close, reverse
 */
@Injectable()
export class DisputeOpsService {
  private readonly logger = new Logger(DisputeOpsService.name);
  constructor(private readonly repo: DisputeOpsRepository) {}

  async overview(role: string) {
    this.assertRead(role);
    const [kpis, triage, mediation, arbitration] = await Promise.all([
      this.repo.kpis(),
      this.repo.listCases({ queue: 'triage',     pageSize: 10, page: 1 }),
      this.repo.listCases({ queue: 'mediation',  pageSize: 10, page: 1 }),
      this.repo.listCases({ queue: 'arbitration',pageSize: 10, page: 1 }),
    ]);
    const [insights, riskScore] = await Promise.all([
      this.fetchInsights(kpis).catch(() => this.fallbackInsights(kpis)),
      this.scoreRisk(kpis).catch(() => this.fallbackRisk(kpis)),
    ]);
    return {
      kpis,
      queues: {
        triage:      triage.items,
        mediation:   mediation.items,
        arbitration: arbitration.items,
      },
      insights, riskScore, computedAt: new Date().toISOString(),
    };
  }

  async listCases(role: string, filter: any) {
    this.assertRead(role);
    const r = await this.repo.listCases(filter);
    return { items: r.items, total: r.total, meta: { source: 'dispute-ops', role, page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 } };
  }
  async caseDetail(role: string, id: string) {
    this.assertRead(role);
    const r = await this.repo.caseDetail(id);
    if (!r) throw new NotFoundException({ code: 'case_not_found' });
    return r;
  }

  async createCase(actorId: string, role: string, dto: any, meta: Meta) {
    // Anyone authenticated can file a dispute (claimant); operator role is for ops.
    const priority = this.computePriority(dto.severity, dto.amountMinor, dto.category);
    const c = await this.repo.createCase(dto, priority);
    await this.repo.logEvent(c.id, actorId, 'case.create', null, 'pending',
      { category: dto.category, severity: dto.severity, amountMinor: dto.amountMinor, ip: meta.ip });
    return c;
  }

  async transition(actorId: string, role: string, dto: { caseId: string; to: string; note?: string }, meta: Meta) {
    this.assertOperator(role);
    const before = await this.repo.caseById(dto.caseId);
    if (!before) throw new NotFoundException({ code: 'case_not_found' });
    const allowed = CASE_TRANSITIONS[before.status] ?? [];
    if (!allowed.includes(dto.to)) {
      throw new BadRequestException({ code: 'bad_transition', from: before.status, to: dto.to });
    }
    if (dto.to === 'arbitration' && !this.isArbitrator(role)) {
      throw new ForbiddenException({ code: 'arbitrator_required' });
    }
    if ((dto.to === 'escalated' || dto.to === 'closed') && role !== 'dispute_admin') {
      throw new ForbiddenException({ code: 'dispute_admin_required' });
    }
    const queue = QUEUE_BY_STATUS[dto.to] ?? before.queue;
    const after = await this.repo.transitionCase(dto.caseId, dto.to, queue);
    await this.repo.logEvent(after.id, actorId, 'case.transition', before.status, dto.to,
      { note: dto.note ?? null, queue });
    return after;
  }

  async assign(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertOperator(role);
    const before = await this.repo.caseById(dto.caseId);
    if (!before) throw new NotFoundException({ code: 'case_not_found' });
    const after = await this.repo.assignCase(dto.caseId, dto.assigneeId, dto.queue);
    await this.repo.logEvent(after.id, actorId, 'case.assign', before.assignee_id, dto.assigneeId,
      { queue: dto.queue ?? before.queue });
    return after;
  }

  async claimNext(actorId: string, role: string, queue: string) {
    this.assertOperator(role);
    const c = await this.repo.claimNext(queue, actorId);
    if (!c) return { claimed: null };
    await this.repo.logEvent(c.id, actorId, 'case.claim', null, c.status, { queue });
    return { claimed: c };
  }

  async postMessage(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertOperator(role);
    const before = await this.repo.caseById(dto.caseId);
    if (!before) throw new NotFoundException({ code: 'case_not_found' });
    if (dto.visibility === 'arbitration' && !this.isArbitrator(role)) {
      throw new ForbiddenException({ code: 'arbitrator_required' });
    }
    const authorRole = this.isArbitrator(role) ? 'arbitrator' : role === 'mediator' ? 'mediator' : 'operator';
    const m = await this.repo.postMessage({ ...dto, authorId: actorId, authorRole });
    await this.repo.logEvent(before.id, actorId, 'message.post', null, null,
      { messageId: m.id, visibility: m.visibility });
    return m;
  }

  async addEvidence(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertOperator(role);
    const before = await this.repo.caseById(dto.caseId);
    if (!before) throw new NotFoundException({ code: 'case_not_found' });
    const e = await this.repo.addEvidence({ ...dto, uploadedBy: actorId });
    await this.repo.logEvent(before.id, actorId, 'evidence.add', null, null, { evidenceId: e.id, kind: e.kind });
    return e;
  }

  async openArbitration(actorId: string, role: string, dto: any, meta: Meta) {
    if (!this.isArbitrator(role)) throw new ForbiddenException({ code: 'arbitrator_required' });
    const before = await this.repo.caseById(dto.caseId);
    if (!before) throw new NotFoundException({ code: 'case_not_found' });
    const a = await this.repo.openArbitration({ caseId: dto.caseId, panel: dto.panel, openedBy: actorId });
    if (before.status !== 'arbitration') {
      await this.repo.transitionCase(dto.caseId, 'arbitration', 'arbitration');
    }
    await this.repo.logEvent(before.id, actorId, 'arbitration.open', before.status, 'arbitration', { panelSize: dto.panel.length });
    return a;
  }
  async decideArbitration(actorId: string, role: string, dto: any, meta: Meta) {
    if (!this.isArbitrator(role)) throw new ForbiddenException({ code: 'arbitrator_required' });
    const decided = await this.repo.decideArbitration({ ...dto, decidedBy: actorId });
    if (!decided) throw new BadRequestException({ code: 'no_open_arbitration' });
    const after = await this.repo.setOutcome(dto.caseId, dto.decision, dto.amountMinor);
    await this.repo.logEvent(dto.caseId, actorId, 'arbitration.decide', 'arbitration', 'resolved',
      { decision: dto.decision, amountMinor: dto.amountMinor ?? null });
    return { arbitration: decided, case: after };
  }

  // ── ML & analytics ────────────────────────────────
  private async scoreRisk(kpis: any) {
    try {
      const r = await fetch(`${ML_BASE}/dispute-ops/score`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals: kpis }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml down: ${(e as Error).message}`); }
    return this.fallbackRisk(kpis);
  }
  private fallbackRisk(k: any) {
    const open      = (k.byStatus?.pending ?? 0) + (k.byStatus?.triaged ?? 0) + (k.byStatus?.mediation ?? 0)
                    + (k.byStatus?.awaiting_response ?? 0) + (k.byStatus?.arbitration ?? 0);
    const escalated = k.byStatus?.escalated ?? 0;
    const breached  = k.slaBreached ?? 0;
    let score = 10 + Math.min(40, open * 2) + Math.min(30, escalated * 8) + Math.min(20, breached * 5);
    score = Math.min(100, score);
    const band = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'elevated' : 'normal';
    return { score, band, model: 'deterministic-v1', factors: { open, escalated, slaBreached: breached } };
  }
  private async fetchInsights(kpis: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/dispute-ops/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals: kpis }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(kpis);
  }
  private fallbackInsights(k: any) {
    const out: any[] = [];
    const breached  = k.slaBreached ?? 0;
    const escalated = k.byStatus?.escalated ?? 0;
    const triage    = k.byQueue?.triage ?? 0;
    const arb       = k.byQueue?.arbitration ?? 0;
    if (breached > 0)  out.push({ id: 'sla_breached', severity: 'critical', title: `${breached} cases past SLA — work them now.` });
    if (escalated > 0) out.push({ id: 'escalations', severity: 'warn', title: `${escalated} escalated cases need admin review.` });
    if (triage > 10)   out.push({ id: 'triage_backlog', severity: 'warn', title: `${triage} cases waiting in triage.` });
    if (arb > 0)       out.push({ id: 'arbitration_open', severity: 'info', title: `${arb} cases under arbitration.` });
    if (!out.length)   out.push({ id: 'dop_healthy', severity: 'success', title: 'Dispute desk healthy.' });
    return out;
  }

  // ── Helpers ───────────────────────────────────────
  private computePriority(severity: string, amountMinor: number, category: string) {
    const sev = { low: 20, normal: 40, high: 70, critical: 90 }[severity] ?? 40;
    const amt = Math.min(20, Math.floor(amountMinor / 100_000)); // +1 per £1k up to £20k
    const cat = ['fraud','chargeback','ip'].includes(category) ? 10 : 0;
    return Math.min(100, sev + amt + cat);
  }
  private isReader(role: string)     { return ['viewer','operator','mediator','arbitrator','dispute_admin'].includes(role); }
  private isOperator(role: string)   { return ['operator','mediator','arbitrator','dispute_admin'].includes(role); }
  private isArbitrator(role: string) { return ['arbitrator','dispute_admin'].includes(role); }
  private assertRead(role: string)     { if (!this.isReader(role))   throw new ForbiddenException({ code: 'dop_read_required' }); }
  private assertOperator(role: string) { if (!this.isOperator(role)) throw new ForbiddenException({ code: 'dop_operator_required' }); }
}
