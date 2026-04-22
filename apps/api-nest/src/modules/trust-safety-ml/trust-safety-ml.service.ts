import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TrustSafetyMlRepository } from './trust-safety-ml.repository';
import { CASE_TRANSITIONS, QUEUE_BY_STATUS } from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE        = process.env.ML_PYTHON_URL        ?? 'http://localhost:8088';

type Meta = { ip?: string; userAgent?: string };

/**
 * Domain 71 — Trust & Safety / ML / Fraud / Risk decisions.
 * Role ladder: viewer < ts_analyst < ts_lead < ts_admin.
 *  - viewer: read KPIs, signals, cases
 *  - ts_analyst: claim, transition, decide non-destructive (allow, friction, step_up, dismiss, hold/release funds)
 *  - ts_lead: + restrict, suspend, refund, chargeback dispute, escalate_compliance, watchlist add/remove
 *  - ts_admin: + ban, blacklist, escalate_legal, override
 */
@Injectable()
export class TrustSafetyMlService {
  private readonly logger = new Logger(TrustSafetyMlService.name);
  constructor(private readonly repo: TrustSafetyMlRepository) {}

  async overview(role: string) {
    this.assertRead(role);
    const [kpis, triage, review, escalation, signals, watchlist] = await Promise.all([
      this.repo.kpis(),
      this.repo.listCases({ queue: 'triage',     pageSize: 10, page: 1 }),
      this.repo.listCases({ queue: 'review',     pageSize: 10, page: 1 }),
      this.repo.listCases({ queue: 'escalation', pageSize: 10, page: 1 }),
      this.repo.listSignals({ status: 'open', pageSize: 10, page: 1 }),
      this.repo.listWatchlist({}),
    ]);
    const [insights, riskScore] = await Promise.all([
      this.fetchInsights(kpis).catch(() => this.fallbackInsights(kpis)),
      this.scoreDeskRisk(kpis).catch(() => this.fallbackDeskRisk(kpis)),
    ]);
    return {
      kpis,
      queues: { triage: triage.items, review: review.items, escalation: escalation.items },
      openSignals: signals.items,
      watchlist,
      insights, riskScore, computedAt: new Date().toISOString(),
    };
  }

  // ── Signals ───────────────────────────────────────────
  async listSignals(role: string, filter: any) {
    this.assertRead(role);
    const r = await this.repo.listSignals(filter);
    return { items: r.items, total: r.total, meta: { source: 'tsml', role, page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 } };
  }
  async createSignal(actorId: string, role: string, dto: any, meta: Meta) {
    // External webhooks/automation may file signals; analyst+ to file manually.
    if (dto.source === 'manual') this.assertAnalyst(role);
    const ml = await this.scoreSignal(dto).catch(() => this.fallbackSignalScore(dto));
    const signal = await this.repo.createSignal(dto, ml);
    await this.repo.logEvent(null, signal.id, actorId, 'signal.create', null, 'open',
      { source: dto.source, severity: dto.severity, mlScore: ml.score, ip: meta.ip });
    return signal;
  }

  // ── Cases ─────────────────────────────────────────────
  async listCases(role: string, filter: any) {
    this.assertRead(role);
    const r = await this.repo.listCases(filter);
    return { items: r.items, total: r.total, meta: { source: 'tsml', role, page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 } };
  }
  async caseDetail(role: string, id: string) {
    this.assertRead(role);
    const r = await this.repo.caseDetail(id);
    if (!r) throw new NotFoundException({ code: 'case_not_found' });
    return r;
  }
  async createCase(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertAnalyst(role);
    const signals = dto.signalIds?.length ? await this.repo.signalsByIds(dto.signalIds) : [];
    const ml = await this.scoreCase(dto, signals).catch(() => this.fallbackCaseScore(dto, signals));
    const c = await this.repo.createCase(dto, ml, signals);
    await this.repo.recordMlReview(c.id, 'fraud-risk-v1', ml.score, ml.band, ml.reasons);
    await this.repo.logEvent(c.id, null, actorId, 'case.create', null, 'open',
      { caseKind: dto.caseKind, riskScore: ml.score, signals: signals.length, ip: meta.ip });
    return c;
  }
  async transition(actorId: string, role: string, dto: any) {
    this.assertAnalyst(role);
    const before = await this.repo.caseById(dto.caseId);
    if (!before) throw new NotFoundException({ code: 'case_not_found' });
    const allowed = CASE_TRANSITIONS[before.status] ?? [];
    if (!allowed.includes(dto.to)) {
      throw new BadRequestException({ code: 'bad_transition', from: before.status, to: dto.to });
    }
    if ((dto.to === 'escalated' || dto.to === 'closed') && !this.isLead(role)) {
      throw new ForbiddenException({ code: 'lead_required' });
    }
    const queue = QUEUE_BY_STATUS[dto.to] ?? before.queue;
    const after = await this.repo.transitionCase(dto.caseId, dto.to, queue);
    await this.repo.logEvent(after.id, null, actorId, 'case.transition', before.status, dto.to, { note: dto.note ?? null, queue });
    return after;
  }
  async assign(actorId: string, role: string, dto: any) {
    this.assertAnalyst(role);
    const before = await this.repo.caseById(dto.caseId);
    if (!before) throw new NotFoundException({ code: 'case_not_found' });
    const after = await this.repo.assignCase(dto.caseId, dto.assigneeId, dto.queue);
    await this.repo.logEvent(after.id, null, actorId, 'case.assign', before.assigned_to, dto.assigneeId, { queue: dto.queue ?? before.queue });
    return after;
  }
  async claimNext(actorId: string, role: string, queue: string) {
    this.assertAnalyst(role);
    const c = await this.repo.claimNext(queue, actorId);
    if (!c) return { claimed: null };
    await this.repo.logEvent(c.id, null, actorId, 'case.claim', null, c.status, { queue });
    return { claimed: c };
  }
  async decide(actorId: string, role: string, dto: any) {
    this.assertAnalyst(role);
    const before = await this.repo.caseById(dto.caseId);
    if (!before) throw new NotFoundException({ code: 'case_not_found' });
    const leadOnly  = ['restrict_account','suspend','refund','chargeback_dispute','chargeback_accept','escalate_compliance','blacklist','whitelist'];
    const adminOnly = ['ban','escalate_legal'];
    if (leadOnly.includes(dto.decision)  && !this.isLead(role))   throw new ForbiddenException({ code: 'lead_required' });
    if (adminOnly.includes(dto.decision) && role !== 'ts_admin') throw new ForbiddenException({ code: 'ts_admin_required' });

    const d = await this.repo.recordDecision({ ...dto, actorId });
    const nextStatus =
      dto.decision === 'dismiss' ? 'closed' :
      dto.decision === 'escalate_legal' || dto.decision === 'escalate_compliance' ? 'escalated' :
      'decided';
    const queue = QUEUE_BY_STATUS[nextStatus] ?? before.queue;
    const after = await this.repo.transitionCase(before.id, nextStatus, queue);
    await this.repo.logEvent(before.id, null, actorId, 'case.decide', before.status, nextStatus,
      { decision: dto.decision, durationH: dto.durationH ?? null, appealable: dto.appealable });
    return { decision: d, case: after };
  }

  // ── ML review (operator agrees / overrides model) ─────
  async mlReview(actorId: string, role: string, dto: any) {
    this.assertAnalyst(role);
    const c = await this.repo.caseById(dto.caseId);
    if (!c) throw new NotFoundException({ code: 'case_not_found' });
    const r = await this.repo.recordMlReview(c.id, 'fraud-risk-v1', c.risk_score, c.risk_band, c.reasons ?? [], actorId, dto.agreed);
    await this.repo.logEvent(c.id, null, actorId, 'ml.review', null, null, { agreed: dto.agreed, note: dto.note ?? null });
    return r;
  }

  // ── Watchlists ────────────────────────────────────────
  async listWatchlist(role: string, filter: any) { this.assertRead(role); return this.repo.listWatchlist(filter ?? {}); }
  async addWatchlist(actorId: string, role: string, dto: any) {
    if (!this.isLead(role)) throw new ForbiddenException({ code: 'lead_required' });
    const w = await this.repo.addWatchlist(dto, actorId);
    await this.repo.logEvent(null, null, actorId, 'watchlist.upsert', null, dto.listKind, { subjectKind: dto.subjectKind, subjectId: dto.subjectId });
    return w;
  }
  async removeWatchlist(actorId: string, role: string, id: string) {
    if (!this.isLead(role)) throw new ForbiddenException({ code: 'lead_required' });
    await this.repo.removeWatchlist(id);
    await this.repo.logEvent(null, null, actorId, 'watchlist.remove', id, null, {});
    return { ok: true };
  }

  // ── ML + analytics ────────────────────────────────────
  private async scoreSignal(p: any) {
    try {
      const r = await fetch(`${ML_BASE}/trust-safety-ml/signal-score`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(p), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml signal down: ${(e as Error).message}`); }
    return this.fallbackSignalScore(p);
  }
  private fallbackSignalScore(p: any) {
    const sev = { low: 20, normal: 40, high: 70, critical: 90 }[p.severity ?? 'normal'] ?? 40;
    const codeBoost: Record<string, number> = {
      impossible_travel: 25, known_fraud_finger: 30, velocity_spike: 15,
      kyc_mismatch: 18, phishing_pattern: 18, disposable_email: 8,
    };
    const score = Math.min(100, sev + (codeBoost[p.signalCode] ?? 0));
    const band = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'elevated' : 'normal';
    return { score, band, reasons: [`code:${p.signalCode}`, `severity:${p.severity ?? 'normal'}`] };
  }
  private async scoreCase(p: any, signals: any[]) {
    try {
      const r = await fetch(`${ML_BASE}/trust-safety-ml/case-score`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...p, signals }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml case down: ${(e as Error).message}`); }
    return this.fallbackCaseScore(p, signals);
  }
  private fallbackCaseScore(p: any, signals: any[]) {
    const kindBase: Record<string, number> = {
      fraud: 60, payment_risk: 55, identity: 50, abuse: 45, content: 35, compliance: 40, other: 30,
    };
    const sigMax = signals.reduce((m, s: any) => Math.max(m, Number(s.ml_score) || 0), 0);
    const sigCount = signals.length;
    let score = (kindBase[p.caseKind] ?? 35) + Math.min(20, sigMax / 5) + Math.min(15, sigCount * 3);
    score = Math.min(100, Math.round(score));
    const band = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'elevated' : 'normal';
    return {
      score, band, model: 'fraud-risk-deterministic-v1',
      reasons: [`kind:${p.caseKind}`, `signals:${sigCount}`, `max_signal_score:${sigMax}`],
    };
  }
  private async scoreDeskRisk(kpis: any) {
    try {
      const r = await fetch(`${ML_BASE}/trust-safety-ml/desk-risk`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals: kpis }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml desk down: ${(e as Error).message}`); }
    return this.fallbackDeskRisk(kpis);
  }
  private fallbackDeskRisk(k: any) {
    const open       = (k.casesByStatus?.open ?? 0) + (k.casesByStatus?.reviewing ?? 0) + (k.casesByStatus?.holding ?? 0);
    const escalated  = k.casesByStatus?.escalated ?? 0;
    const breached   = k.slaBreached ?? 0;
    const critSig    = k.signalsByBand?.critical ?? 0;
    const highSig    = k.signalsByBand?.high ?? 0;
    let score = 10 + Math.min(35, open * 2) + Math.min(25, escalated * 8) + Math.min(15, breached * 5)
              + Math.min(10, critSig * 4) + Math.min(5, highSig);
    score = Math.min(100, score);
    const band = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'elevated' : 'normal';
    return { score, band, model: 'desk-risk-deterministic-v1',
             factors: { open, escalated, slaBreached: breached, criticalSignals: critSig, highSignals: highSig } };
  }
  private async fetchInsights(kpis: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/trust-safety-ml/insights`, {
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
    const escalated = k.casesByStatus?.escalated ?? 0;
    const triage    = k.casesByQueue?.triage ?? 0;
    const critSig   = k.signalsByBand?.critical ?? 0;
    if (breached)  out.push({ id: 'sla_breached',     severity: 'critical', title: `${breached} cases past SLA — work them now.` });
    if (escalated) out.push({ id: 'escalations',      severity: 'warn',     title: `${escalated} cases escalated.` });
    if (triage > 10) out.push({ id: 'triage_backlog', severity: 'warn',     title: `${triage} cases waiting in triage.` });
    if (critSig)   out.push({ id: 'critical_signals', severity: 'critical', title: `${critSig} critical signals open.` });
    if (!out.length) out.push({ id: 'tsml_healthy',   severity: 'success',  title: 'Trust & Safety desk healthy.' });
    return out;
  }

  // ── Helpers ───────────────────────────────────────────
  private isReader(r: string)  { return ['viewer','ts_analyst','ts_lead','ts_admin'].includes(r); }
  private isAnalyst(r: string) { return ['ts_analyst','ts_lead','ts_admin'].includes(r); }
  private isLead(r: string)    { return ['ts_lead','ts_admin'].includes(r); }
  private assertRead(r: string)    { if (!this.isReader(r))  throw new ForbiddenException({ code: 'tsml_read_required' }); }
  private assertAnalyst(r: string) { if (!this.isAnalyst(r)) throw new ForbiddenException({ code: 'tsml_analyst_required' }); }
}
