import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AdsOpsRepository } from './ads-ops.repository';
import { PR_TRANSITIONS, QUEUE_BY_STATUS } from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE        = process.env.ML_PYTHON_URL        ?? 'http://localhost:8088';

type Meta = { ip?: string; userAgent?: string };

/**
 * Domain 72 — Ads Ops / Policy Review / Geo+Keyword Moderation / Campaign Controls.
 * Role ladder: viewer < ads_reviewer < ads_lead < ads_admin.
 *  - viewer: read everything
 *  - ads_reviewer: claim, transition non-destructive, approve/reject creative,
 *    request_changes, hold, dismiss
 *  - ads_lead: + escalate, geo_restrict, keyword_restrict, geo/keyword rule add,
 *    pause_campaign, resume_campaign, disable_creative
 *  - ads_admin: + global rules, override blocks
 */
@Injectable()
export class AdsOpsService {
  private readonly logger = new Logger(AdsOpsService.name);
  constructor(private readonly repo: AdsOpsRepository) {}

  async overview(role: string) {
    this.assertRead(role);
    const [kpis, triage, review, escalation, controls] = await Promise.all([
      this.repo.kpis(),
      this.repo.listReviews({ queue: 'triage',     pageSize: 10, page: 1 }),
      this.repo.listReviews({ queue: 'review',     pageSize: 10, page: 1 }),
      this.repo.listReviews({ queue: 'escalation', pageSize: 10, page: 1 }),
      this.repo.listCampaignControls(),
    ]);
    const insights = await this.fetchInsights(kpis).catch(() => this.fallbackInsights(kpis));
    return {
      kpis,
      queues: { triage: triage.items, review: review.items, escalation: escalation.items },
      campaignControls: controls,
      insights, computedAt: new Date().toISOString(),
    };
  }

  async listReviews(role: string, filter: any) {
    this.assertRead(role);
    const r = await this.repo.listReviews(filter);
    return { items: r.items, total: r.total, meta: { source: 'ads_ops', role, page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 } };
  }
  async reviewDetail(role: string, id: string) {
    this.assertRead(role);
    const r = await this.repo.reviewDetail(id);
    if (!r) throw new NotFoundException({ code: 'review_not_found' });
    return r;
  }
  async createReview(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertReviewer(role);
    const ml = await this.scoreCreative(dto).catch(() => this.fallbackCreativeScore(dto));
    const r = await this.repo.createReview(dto, ml);
    await this.repo.logEvent(r.id, dto.campaignId, actorId, 'review.create', null, 'pending',
      { score: ml.score, band: ml.band, flags: ml.flags?.length ?? 0, ip: meta.ip });
    return r;
  }
  async transition(actorId: string, role: string, dto: any) {
    this.assertReviewer(role);
    const before = await this.repo.reviewById(dto.reviewId);
    if (!before) throw new NotFoundException({ code: 'review_not_found' });
    const allowed = PR_TRANSITIONS[before.status] ?? [];
    if (!allowed.includes(dto.to)) {
      throw new BadRequestException({ code: 'bad_transition', from: before.status, to: dto.to });
    }
    if (dto.to === 'escalated' && !this.isLead(role)) {
      throw new ForbiddenException({ code: 'lead_required' });
    }
    const queue = QUEUE_BY_STATUS[dto.to] ?? before.queue;
    const after = await this.repo.transitionReview(dto.reviewId, dto.to, queue);
    await this.repo.logEvent(after.id, before.campaign_id, actorId, 'review.transition', before.status, dto.to, { note: dto.note ?? null, queue });
    return after;
  }
  async assign(actorId: string, role: string, dto: any) {
    this.assertReviewer(role);
    const before = await this.repo.reviewById(dto.reviewId);
    if (!before) throw new NotFoundException({ code: 'review_not_found' });
    const after = await this.repo.assignReview(dto.reviewId, dto.assigneeId, dto.queue);
    await this.repo.logEvent(after.id, before.campaign_id, actorId, 'review.assign', before.assigned_to, dto.assigneeId, { queue: dto.queue ?? before.queue });
    return after;
  }
  async claimNext(actorId: string, role: string, queue: string) {
    this.assertReviewer(role);
    const r = await this.repo.claimNext(queue, actorId);
    if (!r) return { claimed: null };
    await this.repo.logEvent(r.id, r.campaign_id, actorId, 'review.claim', null, r.status, { queue });
    return { claimed: r };
  }
  async decide(actorId: string, role: string, dto: any) {
    this.assertReviewer(role);
    const before = await this.repo.reviewById(dto.reviewId);
    if (!before) throw new NotFoundException({ code: 'review_not_found' });

    const leadOnly  = ['escalate','geo_restrict','keyword_restrict','pause_campaign','resume_campaign','disable_creative'];
    if (leadOnly.includes(dto.decision) && !this.isLead(role)) {
      throw new ForbiddenException({ code: 'lead_required' });
    }

    const d = await this.repo.recordDecision({ ...dto, actorId });

    // Map decision → review status.
    const nextStatus =
      dto.decision === 'approve' || dto.decision === 'approve_with_edits' ? 'approved' :
      dto.decision === 'reject' || dto.decision === 'disable_creative'    ? 'rejected' :
      dto.decision === 'hold'                                              ? 'holding'  :
      dto.decision === 'escalate'                                          ? 'escalated':
      dto.decision === 'request_changes'                                   ? 'reviewing':
      dto.decision === 'dismiss'                                           ? 'archived' :
      before.status;
    const queue = QUEUE_BY_STATUS[nextStatus] ?? before.queue;
    const after = await this.repo.transitionReview(before.id, nextStatus, queue);

    // Side-effects on the campaign overlay.
    if (dto.decision === 'pause_campaign' || dto.decision === 'disable_creative') {
      await this.repo.upsertCampaignControl(before.campaign_id, dto.decision === 'pause_campaign' ? 'paused' : 'disabled', dto.rationale, actorId);
    } else if (dto.decision === 'resume_campaign') {
      await this.repo.upsertCampaignControl(before.campaign_id, 'active', dto.rationale, actorId);
    } else if (dto.decision === 'geo_restrict' || dto.decision === 'keyword_restrict') {
      await this.repo.upsertCampaignControl(before.campaign_id, 'restricted', dto.rationale, actorId);
    }

    await this.repo.logEvent(before.id, before.campaign_id, actorId, 'review.decide', before.status, nextStatus,
      { decision: dto.decision, edits: dto.edits ?? {}, appealable: dto.appealable });
    return { decision: d, review: after };
  }

  // ── Campaign controls ────────────────────────────────
  async listCampaignControls(role: string) { this.assertRead(role); return this.repo.listCampaignControls(); }
  async setCampaignControl(actorId: string, role: string, dto: any) {
    if (!this.isLead(role)) throw new ForbiddenException({ code: 'lead_required' });
    const before = await this.repo.listCampaignControls();
    const r = await this.repo.upsertCampaignControl(dto.campaignId, dto.status, dto.reason, actorId);
    const prev = before.find((b: any) => b.campaign_id === dto.campaignId)?.status ?? null;
    await this.repo.logEvent(null, dto.campaignId, actorId, 'campaign.control.set', prev, dto.status, { reason: dto.reason });
    return r;
  }

  // ── Geo rules ────────────────────────────────────────
  async listGeoRules(role: string, filter: any) { this.assertRead(role); return this.repo.listGeoRules(filter ?? {}); }
  async addGeoRule(actorId: string, role: string, dto: any) {
    if (!this.isLead(role) && dto.scope !== 'campaign') throw new ForbiddenException({ code: 'lead_required' });
    if (dto.scope === 'global' && role !== 'ads_admin') throw new ForbiddenException({ code: 'ads_admin_required' });
    const r = await this.repo.addGeoRule(dto, actorId);
    await this.repo.logEvent(null, dto.scope === 'campaign' ? dto.scopeId : null, actorId, 'georule.upsert', null, dto.rule,
      { scope: dto.scope, geoCode: dto.geoCode, category: dto.category });
    return r;
  }
  async removeGeoRule(actorId: string, role: string, id: string) {
    if (!this.isLead(role)) throw new ForbiddenException({ code: 'lead_required' });
    await this.repo.removeGeoRule(id);
    await this.repo.logEvent(null, null, actorId, 'georule.remove', id, null, {});
    return { ok: true };
  }

  // ── Keyword rules ───────────────────────────────────
  async listKeywordRules(role: string, filter: any) { this.assertRead(role); return this.repo.listKeywordRules(filter ?? {}); }
  async addKeywordRule(actorId: string, role: string, dto: any) {
    if (!this.isLead(role) && dto.scope !== 'campaign') throw new ForbiddenException({ code: 'lead_required' });
    if (dto.scope === 'global' && role !== 'ads_admin') throw new ForbiddenException({ code: 'ads_admin_required' });
    const r = await this.repo.addKeywordRule(dto, actorId);
    await this.repo.logEvent(null, dto.scope === 'campaign' ? dto.scopeId : null, actorId, 'kwrule.upsert', null, dto.rule,
      { scope: dto.scope, keyword: dto.keyword, match: dto.match, severity: dto.severity });
    return r;
  }
  async removeKeywordRule(actorId: string, role: string, id: string) {
    if (!this.isLead(role)) throw new ForbiddenException({ code: 'lead_required' });
    await this.repo.removeKeywordRule(id);
    await this.repo.logEvent(null, null, actorId, 'kwrule.remove', id, null, {});
    return { ok: true };
  }

  // ── ML + analytics ──────────────────────────────────
  private async scoreCreative(p: any) {
    try {
      const r = await fetch(`${ML_BASE}/ads-ops/score-creative`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(p), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml ads-ops down: ${(e as Error).message}`); }
    return this.fallbackCreativeScore(p);
  }
  private fallbackCreativeScore(p: any) {
    const text = `${p.headline ?? ''} ${p.body ?? ''} ${p.landingUrl ?? ''} ${(p.keywords ?? []).join(' ')}`.toLowerCase();
    const flags: any[] = []; const reasons: string[] = []; let score = 10;
    const patterns: Array<[RegExp, string, string, number]> = [
      [/\b(bitcoin\s+doubler|free\s+btc|crypto\s+giveaway)\b/, 'crypto_scam',       'critical', 60],
      [/\b(miracle\s+pill|lose\s+\d{1,3}\s*kg|burn\s+fat\s+fast)\b/, 'misleading_health','critical', 50],
      [/\b(guaranteed\s+win|sports?\s+betting|gambling)\b/, 'gambling',            'high',     30],
      [/\b(cbd|cannabis|marijuana)\b/,                       'controlled_substance','high',    25],
      [/\b(adult|xxx|nsfw)\b/,                               'adult_content',       'high',     35],
      [/\b(weapon|firearm|ammo)\b/,                          'weapons',             'critical', 40],
    ];
    for (const [re, code, sev, w] of patterns) {
      if (re.test(text)) { flags.push({ code, severity: sev, source: 'keyword' }); reasons.push(`pattern:${code}`); score += w; }
    }
    try {
      if (p.landingUrl) {
        const u = new URL(p.landingUrl);
        if (!u.hostname.match(/\.(com|org|net|io|co|uk|de|fr)$/i)) {
          flags.push({ code: 'unverified_url', severity: 'high', source: 'url' });
          reasons.push('url_unverified_tld'); score += 15;
        }
      }
    } catch { flags.push({ code: 'invalid_url', severity: 'critical', source: 'url' }); score += 25; }
    score = Math.min(100, score);
    const band = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'elevated' : 'normal';
    return { score, band, flags, reasons, model: 'ads-ops-policy-v1' };
  }
  private async fetchInsights(kpis: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/ads-ops/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals: kpis }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics ads-ops down: ${(e as Error).message}`); }
    return this.fallbackInsights(kpis);
  }
  private fallbackInsights(k: any) {
    const out: any[] = [];
    const breached  = k.slaBreached ?? 0;
    const critical  = k.reviewsByBand?.critical ?? 0;
    const triage    = k.reviewsByQueue?.triage ?? 0;
    const escalated = k.reviewsByStatus?.escalated ?? 0;
    if (breached)    out.push({ id: 'sla_breached',     severity: 'critical', title: `${breached} reviews past SLA — work them now.` });
    if (critical)    out.push({ id: 'critical_reviews', severity: 'critical', title: `${critical} critical-band reviews open.` });
    if (escalated)   out.push({ id: 'escalations',      severity: 'warn',     title: `${escalated} reviews escalated.` });
    if (triage > 10) out.push({ id: 'triage_backlog',   severity: 'warn',     title: `${triage} reviews waiting in triage.` });
    if (!out.length) out.push({ id: 'ads_ops_healthy',  severity: 'success',  title: 'Ads Ops desk healthy.' });
    return out;
  }

  // ── Helpers ─────────────────────────────────────────
  private isReader(r: string)   { return ['viewer','ads_reviewer','ads_lead','ads_admin'].includes(r); }
  private isReviewer(r: string) { return ['ads_reviewer','ads_lead','ads_admin'].includes(r); }
  private isLead(r: string)     { return ['ads_lead','ads_admin'].includes(r); }
  private assertRead(r: string)     { if (!this.isReader(r))   throw new ForbiddenException({ code: 'ads_ops_read_required' }); }
  private assertReviewer(r: string) { if (!this.isReviewer(r)) throw new ForbiddenException({ code: 'ads_reviewer_required' }); }
}
