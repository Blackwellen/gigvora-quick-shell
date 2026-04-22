import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ModeratorDashboardRepository } from './moderator-dashboard.repository';
import { ITEM_TRANSITIONS, QUEUE_BY_STATUS } from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE        = process.env.ML_PYTHON_URL        ?? 'http://localhost:8088';

type Meta = { ip?: string; userAgent?: string };

/**
 * Domain 70 — Moderator Dashboard.
 * Role ladder: viewer < moderator < senior_moderator < trust_safety_admin.
 *  - viewer: read KPIs/queues
 *  - moderator: claim + transition + warn/hide/dismiss
 *  - senior_moderator: remove/suspend, review messaging incidents
 *  - trust_safety_admin: ban, escalate_legal, restore, override
 */
@Injectable()
export class ModeratorDashboardService {
  private readonly logger = new Logger(ModeratorDashboardService.name);
  constructor(private readonly repo: ModeratorDashboardRepository) {}

  async overview(role: string) {
    this.assertRead(role);
    const [kpis, triage, review, escalation, incidents] = await Promise.all([
      this.repo.kpis(),
      this.repo.listItems({ queue: 'triage',     pageSize: 10, page: 1 }),
      this.repo.listItems({ queue: 'review',     pageSize: 10, page: 1 }),
      this.repo.listItems({ queue: 'escalation', pageSize: 10, page: 1 }),
      this.repo.listIncidents({ status: 'pending', pageSize: 10, page: 1 }),
    ]);
    const [insights, riskScore] = await Promise.all([
      this.fetchInsights(kpis).catch(() => this.fallbackInsights(kpis)),
      this.scoreRisk(kpis).catch(()    => this.fallbackRisk(kpis)),
    ]);
    return {
      kpis,
      queues: { triage: triage.items, review: review.items, escalation: escalation.items },
      messagingIncidents: incidents.items,
      insights, riskScore, computedAt: new Date().toISOString(),
    };
  }
  async listItems(role: string, filter: any) {
    this.assertRead(role);
    const r = await this.repo.listItems(filter);
    return { items: r.items, total: r.total, meta: { source: 'moderator-dashboard', role, page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 } };
  }
  async itemDetail(role: string, id: string) {
    this.assertRead(role);
    const r = await this.repo.itemDetail(id);
    if (!r) throw new NotFoundException({ code: 'item_not_found' });
    return r;
  }

  async createItem(actorId: string, role: string, dto: any, meta: Meta) {
    // Reports can be filed by any authenticated user.
    const ml = await this.scoreContent(dto).catch(() => this.fallbackContentScore(dto));
    const item = await this.repo.createItem(dto, ml);
    await this.repo.logEvent(item.id, null, actorId, 'item.create', null, 'open',
      { reasonCode: dto.reasonCode, severity: dto.severity, mlScore: ml.score, ip: meta.ip });
    return item;
  }
  async transition(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertModerator(role);
    const before = await this.repo.itemById(dto.itemId);
    if (!before) throw new NotFoundException({ code: 'item_not_found' });
    const allowed = ITEM_TRANSITIONS[before.status] ?? [];
    if (!allowed.includes(dto.to)) {
      throw new BadRequestException({ code: 'bad_transition', from: before.status, to: dto.to });
    }
    if ((dto.to === 'escalated' || dto.to === 'closed') && !this.isSenior(role)) {
      throw new ForbiddenException({ code: 'senior_required' });
    }
    const queue = QUEUE_BY_STATUS[dto.to] ?? before.queue;
    const after = await this.repo.transitionItem(dto.itemId, dto.to, queue);
    await this.repo.logEvent(after.id, null, actorId, 'item.transition', before.status, dto.to, { note: dto.note ?? null, queue });
    return after;
  }
  async assign(actorId: string, role: string, dto: any) {
    this.assertModerator(role);
    const before = await this.repo.itemById(dto.itemId);
    if (!before) throw new NotFoundException({ code: 'item_not_found' });
    const after = await this.repo.assignItem(dto.itemId, dto.assigneeId, dto.queue);
    await this.repo.logEvent(after.id, null, actorId, 'item.assign', before.assigned_to, dto.assigneeId, { queue: dto.queue ?? before.queue });
    return after;
  }
  async claimNext(actorId: string, role: string, queue: string) {
    this.assertModerator(role);
    const c = await this.repo.claimNext(queue, actorId);
    if (!c) return { claimed: null };
    await this.repo.logEvent(c.id, null, actorId, 'item.claim', null, c.status, { queue });
    return { claimed: c };
  }
  async act(actorId: string, role: string, dto: any) {
    this.assertModerator(role);
    const before = await this.repo.itemById(dto.itemId);
    if (!before) throw new NotFoundException({ code: 'item_not_found' });
    const seniorOnly = ['remove','suspend','quarantine'];
    const adminOnly  = ['ban','escalate_legal','restore'];
    if (seniorOnly.includes(dto.action) && !this.isSenior(role)) throw new ForbiddenException({ code: 'senior_required' });
    if (adminOnly.includes(dto.action)  && role !== 'trust_safety_admin') throw new ForbiddenException({ code: 'ts_admin_required' });

    const a = await this.repo.recordAction({ ...dto, actorId });
    const nextStatus = dto.action === 'dismiss' ? 'dismissed'
                    : dto.action === 'restore'  ? 'closed'
                    : dto.action === 'escalate_legal' || dto.action === 'escalate_trust_safety' ? 'escalated'
                    : 'actioned';
    const queue = QUEUE_BY_STATUS[nextStatus] ?? before.queue;
    const after = await this.repo.transitionItem(before.id, nextStatus, queue);
    await this.repo.logEvent(before.id, null, actorId, 'item.act', before.status, nextStatus,
      { action: dto.action, durationH: dto.durationH ?? null, appealable: dto.appealable });
    return { action: a, item: after };
  }
  async bulkAct(actorId: string, role: string, dto: { itemIds: string[]; action: string; rationale: string }) {
    this.assertModerator(role);
    const out: any[] = [];
    for (const id of dto.itemIds) {
      try {
        const r = await this.act(actorId, role, { itemId: id, action: dto.action, rationale: dto.rationale, appealable: 'yes' });
        out.push({ id, ok: true, status: r.item.status });
      } catch (e: any) {
        out.push({ id, ok: false, error: e?.response?.code ?? 'failed' });
      }
    }
    return { results: out, count: out.length };
  }

  async listIncidents(role: string, filter: any) {
    this.assertRead(role);
    const r = await this.repo.listIncidents(filter);
    return { items: r.items, total: r.total, meta: { source: 'moderator-dashboard', role, page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 } };
  }
  async reviewIncident(actorId: string, role: string, dto: any) {
    if (!this.isSenior(role)) throw new ForbiddenException({ code: 'senior_required' });
    const after = await this.repo.reviewIncident(dto.incidentId, dto.to, actorId);
    if (!after) throw new NotFoundException({ code: 'incident_not_found' });
    await this.repo.logEvent(null, after.id, actorId, 'incident.review', null, dto.to, { rationale: dto.rationale ?? null });
    return after;
  }
  macros(role: string) { this.assertRead(role); return this.repo.macros(); }

  // ── ML & analytics ────────────────────────────────
  private async scoreContent(payload: any) {
    try {
      const r = await fetch(`${ML_BASE}/moderator-dashboard/score`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml down: ${(e as Error).message}`); }
    return this.fallbackContentScore(payload);
  }
  private fallbackContentScore(p: any) {
    const sev = { low: 20, normal: 40, high: 70, critical: 90 }[p.severity ?? 'normal'] ?? 40;
    const reasonBoost = ['csam','illegal','self_harm','hate'].includes(p.reasonCode) ? 25
                      : ['harassment','impersonation','scam','phishing'].includes(p.reasonCode) ? 15 : 0;
    const score = Math.min(100, sev + reasonBoost);
    const band = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'elevated' : 'normal';
    return { score, band, reasons: [`reason:${p.reasonCode}`, `severity:${p.severity ?? 'normal'}`] };
  }
  private async scoreRisk(kpis: any) {
    try {
      const r = await fetch(`${ML_BASE}/moderator-dashboard/risk`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals: kpis }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml risk down: ${(e as Error).message}`); }
    return this.fallbackRisk(kpis);
  }
  private fallbackRisk(k: any) {
    const open      = (k.byStatus?.open ?? 0) + (k.byStatus?.triaging ?? 0) + (k.byStatus?.holding ?? 0);
    const escalated = k.byStatus?.escalated ?? 0;
    const breached  = k.slaBreached ?? 0;
    const incidents = k.messagingByStatus?.pending ?? 0;
    let score = 10 + Math.min(40, open * 2) + Math.min(25, escalated * 8) + Math.min(15, breached * 5) + Math.min(10, incidents * 3);
    score = Math.min(100, score);
    const band = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'elevated' : 'normal';
    return { score, band, model: 'deterministic-v1', factors: { open, escalated, slaBreached: breached, pendingIncidents: incidents } };
  }
  private async fetchInsights(kpis: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/moderator-dashboard/insights`, {
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
    const incidents = k.messagingByStatus?.pending ?? 0;
    if (breached)  out.push({ id: 'sla_breached',     severity: 'critical', title: `${breached} items past SLA — work them now.` });
    if (escalated) out.push({ id: 'escalations',      severity: 'warn',     title: `${escalated} items escalated for senior review.` });
    if (triage > 10) out.push({ id: 'triage_backlog', severity: 'warn',     title: `${triage} items waiting in triage.` });
    if (incidents) out.push({ id: 'messaging_incidents', severity: 'warn',  title: `${incidents} messaging incidents pending review.` });
    if (!out.length) out.push({ id: 'mod_healthy',    severity: 'success',  title: 'Moderation desk healthy.' });
    return out;
  }

  // ── Helpers ───────────────────────────────────────
  private isReader(role: string)    { return ['viewer','moderator','senior_moderator','trust_safety_admin'].includes(role); }
  private isModerator(role: string) { return ['moderator','senior_moderator','trust_safety_admin'].includes(role); }
  private isSenior(role: string)    { return ['senior_moderator','trust_safety_admin'].includes(role); }
  private assertRead(role: string)      { if (!this.isReader(role))    throw new ForbiddenException({ code: 'mod_read_required' }); }
  private assertModerator(role: string) { if (!this.isModerator(role)) throw new ForbiddenException({ code: 'mod_required' }); }
}
