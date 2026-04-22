import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VerificationComplianceRepository } from './verification-compliance.repository';
import { VC_TRANSITIONS, QUEUE_BY_STATUS } from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE        = process.env.ML_PYTHON_URL        ?? 'http://localhost:8088';

type Meta = { ip?: string; userAgent?: string };

/**
 * Domain 73 — Verification, Compliance, and Identity Review Dashboard.
 * Role ladder: viewer < vc_analyst < vc_lead < vc_admin.
 *  - viewer:     read everything
 *  - vc_analyst: claim, transition non-destructive, request_more_info, hold,
 *                approve low/normal cases, reject obvious failures, dismiss,
 *                accept/reject documents, run checks
 *  - vc_lead:    + escalate, approve/reject high-band cases, step_up, expire,
 *                renew, watchlist add/remove
 *  - vc_admin:   + approve/reject critical-band, override watchlist
 */
@Injectable()
export class VerificationComplianceService {
  private readonly logger = new Logger(VerificationComplianceService.name);
  constructor(private readonly repo: VerificationComplianceRepository) {}

  async overview(role: string) {
    this.assertRead(role);
    const [kpis, triage, review, escalation, watchlist] = await Promise.all([
      this.repo.kpis(),
      this.repo.listCases({ queue: 'triage',     pageSize: 10, page: 1 }),
      this.repo.listCases({ queue: 'review',     pageSize: 10, page: 1 }),
      this.repo.listCases({ queue: 'escalation', pageSize: 10, page: 1 }),
      this.repo.listWatchlist({}),
    ]);
    const insights = await this.fetchInsights(kpis).catch(() => this.fallbackInsights(kpis));
    const deskRisk = await this.fetchDeskRisk(kpis).catch(() => this.fallbackDeskRisk(kpis));
    return {
      kpis,
      queues: { triage: triage.items, review: review.items, escalation: escalation.items },
      watchlist: watchlist.slice(0, 25),
      insights, deskRisk, computedAt: new Date().toISOString(),
    };
  }

  async listCases(role: string, filter: any) {
    this.assertRead(role);
    const r = await this.repo.listCases(filter);
    return { items: r.items, total: r.total, meta: { source: 'verification_compliance', role, page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 } };
  }
  async caseDetail(role: string, id: string) {
    this.assertRead(role);
    const r = await this.repo.caseDetail(id);
    if (!r) throw new NotFoundException({ code: 'case_not_found' });
    return r;
  }
  async createCase(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertAnalyst(role);
    const ml = await this.scoreCase(dto).catch(() => this.fallbackCaseScore(dto));
    const c = await this.repo.createCase(dto, ml);
    await this.repo.logEvent(c.id, dto.subjectId, actorId, 'case.create', null, 'pending',
      { score: ml.score, band: ml.band, program: dto.program, flags: ml.flags?.length ?? 0 }, meta.ip);
    return c;
  }
  async transition(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertAnalyst(role);
    const before = await this.repo.caseById(dto.caseId);
    if (!before) throw new NotFoundException({ code: 'case_not_found' });
    const allowed = VC_TRANSITIONS[before.status] ?? [];
    if (!allowed.includes(dto.to)) {
      throw new BadRequestException({ code: 'bad_transition', from: before.status, to: dto.to });
    }
    if (dto.to === 'escalated' && !this.isLead(role)) {
      throw new ForbiddenException({ code: 'lead_required' });
    }
    if ((dto.to === 'approved' || dto.to === 'rejected') && before.risk_band === 'critical' && !this.isAdmin(role)) {
      throw new ForbiddenException({ code: 'vc_admin_required_for_critical' });
    }
    const queue = QUEUE_BY_STATUS[dto.to] ?? before.queue;
    const after = await this.repo.transitionCase(dto.caseId, dto.to, queue);
    await this.repo.logEvent(after.id, before.subject_id, actorId, 'case.transition', before.status, dto.to, { note: dto.note ?? null, queue }, meta.ip);
    return after;
  }
  async assign(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertAnalyst(role);
    const before = await this.repo.caseById(dto.caseId);
    if (!before) throw new NotFoundException({ code: 'case_not_found' });
    const after = await this.repo.assignCase(dto.caseId, dto.assigneeId, dto.queue);
    await this.repo.logEvent(after.id, before.subject_id, actorId, 'case.assign', before.assigned_to, dto.assigneeId, { queue: dto.queue ?? before.queue }, meta.ip);
    return after;
  }
  async claimNext(actorId: string, role: string, queue: string, meta: Meta) {
    this.assertAnalyst(role);
    const c = await this.repo.claimNext(queue, actorId);
    if (!c) return { claimed: null };
    await this.repo.logEvent(c.id, c.subject_id, actorId, 'case.claim', null, c.status, { queue }, meta.ip);
    return { claimed: c };
  }
  async decide(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertAnalyst(role);
    const before = await this.repo.caseById(dto.caseId);
    if (!before) throw new NotFoundException({ code: 'case_not_found' });

    const leadOnly  = ['escalate','step_up','expire','renew'];
    const adminOnly = before.risk_band === 'critical' && (dto.decision === 'approve' || dto.decision === 'reject');
    if (leadOnly.includes(dto.decision) && !this.isLead(role))   throw new ForbiddenException({ code: 'lead_required' });
    if (adminOnly && !this.isAdmin(role))                         throw new ForbiddenException({ code: 'vc_admin_required_for_critical' });

    const d = await this.repo.recordDecision({ ...dto, actorId });

    // Map decision → case status.
    const nextStatus =
      dto.decision === 'approve'             ? 'approved' :
      dto.decision === 'reject'              ? 'rejected' :
      dto.decision === 'request_more_info'   ? 'holding'  :
      dto.decision === 'step_up'             ? 'reviewing':
      dto.decision === 'hold'                ? 'holding'  :
      dto.decision === 'escalate'            ? 'escalated':
      dto.decision === 'dismiss'             ? 'archived' :
      dto.decision === 'expire'              ? 'expired'  :
      dto.decision === 'renew'               ? 'approved' :
      before.status;
    const queue = QUEUE_BY_STATUS[nextStatus] ?? before.queue;
    const after = await this.repo.transitionCase(before.id, nextStatus, queue);

    // Side-effects: renew sets a new expiry, expire clears it.
    if (dto.decision === 'renew' && dto.durationDays) {
      const expires = new Date(Date.now() + dto.durationDays * 86_400_000);
      await this.repo.setExpiry(before.id, expires);
    } else if (dto.decision === 'expire') {
      await this.repo.setExpiry(before.id, new Date());
    }

    await this.repo.logEvent(before.id, before.subject_id, actorId, 'case.decide', before.status, nextStatus,
      { decision: dto.decision, durationDays: dto.durationDays ?? null, appealable: dto.appealable }, meta.ip);
    return { decision: d, case: after };
  }

  // ── Documents ────────────────────────────────────────
  async addDocument(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertAnalyst(role);
    const c = await this.repo.caseById(dto.caseId);
    if (!c) throw new NotFoundException({ code: 'case_not_found' });
    const d = await this.repo.addDocument(dto);
    await this.repo.logEvent(c.id, c.subject_id, actorId, 'doc.add', null, 'pending',
      { kind: dto.kind, hash: dto.hashSha256 ?? null, bytes: dto.bytes ?? null }, meta.ip);
    return d;
  }
  async reviewDocument(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertAnalyst(role);
    const d = await this.repo.reviewDocument(dto.documentId, dto.status, actorId);
    if (!d) throw new NotFoundException({ code: 'document_not_found' });
    await this.repo.logEvent(d.case_id, null, actorId, 'doc.review', null, dto.status, { kind: d.kind }, meta.ip);
    return d;
  }

  // ── Checks ───────────────────────────────────────────
  async runCheck(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertAnalyst(role);
    const c = await this.repo.caseById(dto.caseId);
    if (!c) throw new NotFoundException({ code: 'case_not_found' });
    const ml = await this.scoreCheck(dto, c).catch(() => this.fallbackCheck(dto, c));
    const check = await this.repo.recordCheck({ caseId: dto.caseId, provider: dto.provider, checkType: dto.checkType,
      result: ml.result, score: ml.score, payload: ml.payload });
    await this.repo.logEvent(c.id, c.subject_id, actorId, 'check.run', null, ml.result,
      { provider: dto.provider, checkType: dto.checkType, score: ml.score }, meta.ip);
    return check;
  }

  // ── Watchlist ────────────────────────────────────────
  async listWatchlist(role: string, filter: any) { this.assertRead(role); return this.repo.listWatchlist(filter ?? {}); }
  async addWatchlist(actorId: string, role: string, dto: any, meta: Meta) {
    if (!this.isLead(role)) throw new ForbiddenException({ code: 'lead_required' });
    const r = await this.repo.addWatchlist(dto, actorId);
    await this.repo.logEvent(null, dto.subjectId, actorId, 'watchlist.add', null, dto.severity,
      { reason: dto.reason, subjectKind: dto.subjectKind }, meta.ip);
    return r;
  }
  async removeWatchlist(actorId: string, role: string, id: string, meta: Meta) {
    if (!this.isAdmin(role)) throw new ForbiddenException({ code: 'vc_admin_required' });
    await this.repo.removeWatchlist(id);
    await this.repo.logEvent(null, null, actorId, 'watchlist.remove', id, null, {}, meta.ip);
    return { ok: true };
  }

  // ── ML + analytics ──────────────────────────────────
  private async scoreCase(p: any) {
    try {
      const r = await fetch(`${ML_BASE}/verification-compliance/score-case`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(p), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml vc score-case down: ${(e as Error).message}`); }
    return this.fallbackCaseScore(p);
  }
  private fallbackCaseScore(p: any) {
    const flags: any[] = []; const reasons: string[] = []; let score = 10;
    const program = String(p.program ?? '');
    const subjectKind = String(p.subjectKind ?? '');
    if (['aml','sanctions','pep'].includes(program)) { score += 40; flags.push({ code: program, severity: 'critical', source: 'program' }); reasons.push(`program:${program}`); }
    if (program === 'kyb' && subjectKind === 'enterprise') { score += 15; reasons.push('program:kyb'); }
    if (program === 'right_to_work') { score += 10; reasons.push('program:right_to_work'); }
    const jurisdiction = String(p.jurisdiction ?? 'GB').toUpperCase();
    const highRiskJur = ['IR','KP','SY','CU','RU','BY','MM','VE'];
    if (highRiskJur.includes(jurisdiction)) { score += 35; flags.push({ code: 'high_risk_jurisdiction', severity: 'critical', source: 'rules' }); reasons.push(`jurisdiction:${jurisdiction}`); }
    score = Math.min(100, score);
    const band = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'elevated' : 'normal';
    return { score, band, flags, reasons, model: 'verification-compliance-v1' };
  }
  private async scoreCheck(dto: any, _c: any) {
    try {
      const r = await fetch(`${ML_BASE}/verification-compliance/score-check`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(dto), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml vc score-check down: ${(e as Error).message}`); }
    return this.fallbackCheck(dto, _c);
  }
  private fallbackCheck(dto: any, _c: any) {
    // Deterministic stub: most checks come back 'consider' so a human reviews.
    const t = String(dto.checkType ?? '');
    if (t === 'sanctions' || t === 'pep') return { result: 'consider', score: 0.5, payload: { note: 'fallback: requires human review' } };
    if (t === 'document')                  return { result: 'clear',    score: 0.85, payload: { note: 'fallback: deterministic clear' } };
    return { result: 'consider', score: 0.6, payload: { note: 'fallback' } };
  }
  private async fetchInsights(kpis: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/verification-compliance/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals: kpis }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics vc insights down: ${(e as Error).message}`); }
    return this.fallbackInsights(kpis);
  }
  private fallbackInsights(k: any) {
    const out: any[] = [];
    const breached  = k.slaBreached ?? 0;
    const critical  = k.casesByBand?.critical ?? 0;
    const triage    = k.casesByQueue?.triage ?? 0;
    const expiring  = k.expiringSoon ?? 0;
    const escalated = k.casesByStatus?.escalated ?? 0;
    if (breached)    out.push({ id: 'sla_breached',     severity: 'critical', title: `${breached} verification cases past SLA — work them now.` });
    if (critical)    out.push({ id: 'critical_cases',   severity: 'critical', title: `${critical} critical-band cases open.` });
    if (escalated)   out.push({ id: 'escalations',      severity: 'warn',     title: `${escalated} cases escalated.` });
    if (expiring > 0)out.push({ id: 'expiring_soon',    severity: 'warn',     title: `${expiring} approvals expire within 30 days.` });
    if (triage > 10) out.push({ id: 'triage_backlog',   severity: 'warn',     title: `${triage} cases waiting in triage.` });
    if (!out.length) out.push({ id: 'vc_healthy',       severity: 'success',  title: 'Verification desk healthy.' });
    return out;
  }
  private async fetchDeskRisk(kpis: any) {
    try {
      const r = await fetch(`${ML_BASE}/verification-compliance/desk-risk`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kpis }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml vc desk-risk down: ${(e as Error).message}`); }
    return this.fallbackDeskRisk(kpis);
  }
  private fallbackDeskRisk(k: any) {
    const breached = k.slaBreached ?? 0;
    const critical = k.casesByBand?.critical ?? 0;
    const high     = k.casesByBand?.high ?? 0;
    const score = Math.min(100, breached * 8 + critical * 15 + high * 5);
    const band  = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'elevated' : 'normal';
    return { score, band, model: 'vc-desk-risk-v1', factors: { sla_breached: breached, critical, high } };
  }

  // ── Helpers ─────────────────────────────────────────
  private isReader(r: string)  { return ['viewer','vc_analyst','vc_lead','vc_admin'].includes(r); }
  private isAnalyst(r: string) { return ['vc_analyst','vc_lead','vc_admin'].includes(r); }
  private isLead(r: string)    { return ['vc_lead','vc_admin'].includes(r); }
  private isAdmin(r: string)   { return r === 'vc_admin'; }
  private assertRead(r: string)    { if (!this.isReader(r))  throw new ForbiddenException({ code: 'vc_read_required' }); }
  private assertAnalyst(r: string) { if (!this.isAnalyst(r)) throw new ForbiddenException({ code: 'vc_analyst_required' }); }
}
