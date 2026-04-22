import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { AdsManagerBuilderRepository } from './ads-manager-builder.repository';
import {
  CAMPAIGN_TRANSITIONS, CREATIVE_TRANSITIONS, ADGROUP_TRANSITIONS,
  CampaignStatus, CreativeStatus, AdGroupStatus,
} from './dto';

const ML_BASE = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';
const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';

@Injectable()
export class AdsManagerBuilderService {
  private readonly logger = new Logger(AdsManagerBuilderService.name);
  constructor(private readonly repo: AdsManagerBuilderRepository) {}

  // ─── Overview ────────────────────────────────────────
  async overview(ownerId: string) {
    const list = await this.repo.listCampaigns(ownerId, { page: 1, pageSize: 100, sort: 'createdAt', dir: 'desc' });
    const totals = await Promise.all(list.items.slice(0, 5).map(async (c: any) => ({
      campaignId: c.id, name: c.name, status: c.status, totals: await this.repo.campaignTotals(c.id),
    })));
    const insights = await this.fetchInsights(ownerId, {
      campaigns: list.items.length,
      active: list.items.filter((c: any) => c.status === 'active').length,
      paused: list.items.filter((c: any) => c.status === 'paused').length,
      inReview: list.items.filter((c: any) => c.status === 'in_review').length,
      rejected: list.items.filter((c: any) => c.status === 'rejected').length,
    }).catch(() => this.fallbackInsights(list.items));
    return {
      kpis: {
        total: list.items.length,
        active: list.items.filter((c: any) => c.status === 'active').length,
        paused: list.items.filter((c: any) => c.status === 'paused').length,
        inReview: list.items.filter((c: any) => c.status === 'in_review').length,
        rejected: list.items.filter((c: any) => c.status === 'rejected').length,
        spentMinor: list.items.reduce((s: number, c: any) => s + (c.spentMinor ?? 0), 0),
        budgetMinor: list.items.reduce((s: number, c: any) => s + (c.budgetMinor ?? 0), 0),
      },
      recentCampaigns: list.items.slice(0, 10),
      topByPerformance: totals,
      insights,
      computedAt: new Date().toISOString(),
    };
  }
  private async fetchInsights(ownerId: string, signals: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/ads-manager-builder/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ owner_id: ownerId, signals }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights([]);
  }
  private fallbackInsights(items: any[]) {
    const out: any[] = [];
    const review = items.filter((c) => c.status === 'in_review').length;
    const rejected = items.filter((c) => c.status === 'rejected').length;
    if (review > 0) out.push({ id: 'review', severity: 'info', title: `${review} campaign(s) awaiting review` });
    if (rejected > 0) out.push({ id: 'rejected', severity: 'warn', title: `${rejected} campaign(s) rejected — fix and resubmit` });
    if (!out.length) out.push({ id: 'healthy', severity: 'success', title: 'Ads pipeline healthy' });
    return out;
  }

  // ─── Campaigns ───────────────────────────────────────
  async listCampaigns(ownerId: string, q: any) { return this.repo.listCampaigns(ownerId, q); }
  async getCampaign(ownerId: string, id: string, opts: { admin?: boolean } = {}) {
    const c = await this.repo.getCampaign(id);
    if (!c) throw new NotFoundException('campaign not found');
    if (!opts.admin && c.ownerIdentityId !== ownerId) throw new ForbiddenException('not your campaign');
    return c;
  }
  async createCampaign(ownerId: string, dto: any, actorId: string, req?: any) {
    const row = await this.repo.createCampaign({
      ownerIdentityId: ownerId, status: 'draft', spentMinor: 0,
      name: dto.name, objective: dto.objective,
      budgetMinor: dto.budgetMinor, dailyBudgetMinor: dto.dailyBudgetMinor ?? 0,
      currency: dto.currency, startAt: dto.startAt ? new Date(dto.startAt) : null,
      endAt: dto.endAt ? new Date(dto.endAt) : null,
      routingRules: dto.routingRules ?? {},
    });
    await this.indexCampaign(row);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'campaign.created', { type: 'campaign', id: row.id }, dto, req);
    return row;
  }
  async updateCampaign(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    const c = await this.getCampaign(ownerId, id);
    if (c.status !== 'draft' && c.status !== 'rejected' && c.status !== 'paused') {
      throw new BadRequestException(`cannot edit a ${c.status} campaign`);
    }
    const row = await this.repo.updateCampaign(id, {
      ...dto,
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
    });
    await this.indexCampaign(row);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'campaign.updated', { type: 'campaign', id }, dto, req);
    return row;
  }
  async transitionCampaign(ownerId: string, id: string, status: CampaignStatus, reason: string | undefined, actorId: string, actorRole: string, req?: any) {
    const isAdmin = actorRole === 'admin' || actorRole === 'operator' || actorRole === 'moderator';
    const c = await this.getCampaign(ownerId, id, { admin: isAdmin });
    const allowed = CAMPAIGN_TRANSITIONS[c.status as CampaignStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${c.status} → ${status}`);
    // Approve/reject restricted to moderator/admin/operator.
    if ((status === 'approved' || status === 'rejected') && !isAdmin) {
      throw new ForbiddenException('moderator/admin only');
    }
    const patch: any = { status };
    if (status === 'approved') { patch.approvedByIdentityId = actorId; patch.approvedAt = new Date(); patch.rejectionReason = null; }
    if (status === 'rejected') { patch.rejectionReason = reason; }
    if (status === 'in_review') {
      // Run ML pre-screen, deterministic fallback if unavailable.
      const score = await this.preScreen(c).catch(() => 0.5);
      patch.qualityScore = score;
    }
    const row = await this.repo.updateCampaign(id, patch);
    await this.indexCampaign(row);
    await this.repo.recordAudit(c.ownerIdentityId, actorId, actorRole, `campaign.${status}`, { type: 'campaign', id }, { from: c.status, to: status, reason }, req);
    return row;
  }
  private async preScreen(c: any): Promise<number> {
    try {
      const r = await fetch(`${ML_BASE}/ads-manager-builder/quality-score`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: c.name, objective: c.objective, budget_minor: c.budgetMinor, routing_rules: c.routingRules ?? {} }),
        signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return Number((await r.json()).score ?? 0.5);
    } catch (e) { this.logger.warn(`ML down: ${(e as Error).message}`); }
    return 0.5;
  }

  // ─── Creatives ──────────────────────────────────────
  listCreatives(ownerId: string, opts: any) { return this.repo.listCreatives(ownerId, opts); }
  async getCreative(ownerId: string, id: string, opts: { admin?: boolean } = {}) {
    const c = await this.repo.getCreative(id);
    if (!c) throw new NotFoundException('creative not found');
    if (!opts.admin && c.ownerIdentityId !== ownerId) throw new ForbiddenException('not your creative');
    return c;
  }
  async createCreative(ownerId: string, dto: any, actorId: string, req?: any) {
    const row = await this.repo.createCreative({ ownerIdentityId: ownerId, status: 'draft', ...dto });
    await this.indexCreative(row);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'creative.created', { type: 'creative', id: row.id }, dto, req);
    return row;
  }
  async updateCreative(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    const c = await this.getCreative(ownerId, id);
    if (c.status !== 'draft' && c.status !== 'rejected') throw new BadRequestException(`cannot edit a ${c.status} creative`);
    const row = await this.repo.updateCreative(id, dto);
    await this.indexCreative(row);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'creative.updated', { type: 'creative', id }, dto, req);
    return row;
  }
  async transitionCreative(ownerId: string, id: string, status: CreativeStatus, reason: string | undefined, actorId: string, actorRole: string, req?: any) {
    const isAdmin = actorRole === 'admin' || actorRole === 'operator' || actorRole === 'moderator';
    const c = await this.getCreative(ownerId, id, { admin: isAdmin });
    const allowed = CREATIVE_TRANSITIONS[c.status as CreativeStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${c.status} → ${status}`);
    if ((status === 'approved' || status === 'rejected') && !isAdmin) throw new ForbiddenException('moderator/admin only');
    const patch: any = { status };
    if (status === 'in_review') {
      const moderation = await this.moderateCreative(c).catch(() => ({ score: 0.5, flags: [] }));
      patch.moderationScore = moderation.score;
      patch.moderationFlags = moderation.flags;
    }
    if (status === 'rejected') patch.rejectionReason = reason;
    const row = await this.repo.updateCreative(id, patch);
    await this.indexCreative(row);
    await this.repo.recordAudit(c.ownerIdentityId, actorId, actorRole, `creative.${status}`, { type: 'creative', id }, { from: c.status, to: status, reason }, req);
    return row;
  }
  private async moderateCreative(c: any): Promise<{ score: number; flags: string[] }> {
    try {
      const r = await fetch(`${ML_BASE}/ads-manager-builder/moderate-creative`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ format: c.format, headline: c.headline ?? '', body: c.body ?? '', cta: c.cta ?? '' }),
        signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ML moderate down: ${(e as Error).message}`); }
    // Deterministic fallback: simple keyword scan.
    const text = `${c.headline ?? ''} ${c.body ?? ''} ${c.cta ?? ''}`.toLowerCase();
    const banned = ['guaranteed', 'miracle', 'click here now', 'free money', 'hate', 'weapon'];
    const flags = banned.filter((w) => text.includes(w));
    return { score: flags.length ? 0.2 : 0.7, flags };
  }

  // ─── Ad groups ──────────────────────────────────────
  async listAdGroups(ownerId: string, campaignId: string) {
    await this.getCampaign(ownerId, campaignId);
    return this.repo.listAdGroups(campaignId);
  }
  async createAdGroup(ownerId: string, campaignId: string, dto: any, actorId: string, req?: any) {
    await this.getCampaign(ownerId, campaignId);
    const row = await this.repo.createAdGroup({ campaignId, status: 'draft', ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'ad_group.created', { type: 'ad_group', id: row.id }, dto, req);
    return row;
  }
  async transitionAdGroup(ownerId: string, id: string, status: AdGroupStatus, reason: string | undefined, actorId: string, actorRole: string, req?: any) {
    const ag = await this.repo.getAdGroup(id);
    if (!ag) throw new NotFoundException('ad group not found');
    const c = await this.getCampaign(ownerId, ag.campaignId);
    void c;
    const allowed = ADGROUP_TRANSITIONS[ag.status as AdGroupStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${ag.status} → ${status}`);
    const row = await this.repo.updateAdGroup(id, { status });
    await this.repo.recordAudit(ownerId, actorId, actorRole, `ad_group.${status}`, { type: 'ad_group', id }, { from: ag.status, to: status, reason }, req);
    return row;
  }

  async listAdGroupCreatives(ownerId: string, campaignId: string, adGroupId: string) {
    const ag = await this.repo.getAdGroup(adGroupId);
    if (!ag || ag.campaignId !== campaignId) throw new NotFoundException('ad group not found');
    await this.getCampaign(ownerId, campaignId);
    return this.repo.listAdGroupCreatives(adGroupId);
  }
  async attachCreative(ownerId: string, campaignId: string, adGroupId: string, dto: any, actorId: string, req?: any) {
    const ag = await this.repo.getAdGroup(adGroupId);
    if (!ag || ag.campaignId !== campaignId) throw new NotFoundException('ad group not found');
    await this.getCampaign(ownerId, campaignId);
    const cr = await this.repo.getCreative(dto.creativeId);
    if (!cr || cr.ownerIdentityId !== ownerId) throw new ForbiddenException('creative not yours');
    if (cr.status !== 'approved') throw new BadRequestException('creative must be approved before attaching');
    const row = await this.repo.attachCreative(adGroupId, dto.creativeId, dto.weight);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'creative.attached', { type: 'ad_group', id: adGroupId }, dto, req);
    return row;
  }
  async detachCreative(ownerId: string, campaignId: string, adGroupId: string, creativeId: string, actorId: string, req?: any) {
    const ag = await this.repo.getAdGroup(adGroupId);
    if (!ag || ag.campaignId !== campaignId) throw new NotFoundException('ad group not found');
    await this.getCampaign(ownerId, campaignId);
    await this.repo.detachCreative(adGroupId, creativeId);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'creative.detached', { type: 'ad_group', id: adGroupId }, { creativeId }, req);
  }

  // ─── Routing rules ──────────────────────────────────
  async listRoutingRules(ownerId: string, campaignId: string) {
    await this.getCampaign(ownerId, campaignId);
    return this.repo.listRoutingRules(campaignId);
  }
  async createRoutingRule(ownerId: string, campaignId: string, dto: any, actorId: string, req?: any) {
    await this.getCampaign(ownerId, campaignId);
    const row = await this.repo.createRoutingRule({ campaignId, ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'routing.created', { type: 'campaign', id: campaignId }, dto, req);
    return row;
  }
  async deleteRoutingRule(ownerId: string, campaignId: string, ruleId: string, actorId: string, req?: any) {
    await this.getCampaign(ownerId, campaignId);
    await this.repo.deleteRoutingRule(ruleId);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'routing.deleted', { type: 'campaign', id: campaignId }, { ruleId }, req);
  }

  // ─── Metrics ─────────────────────────────────────────
  async metrics(ownerId: string, campaignId: string, fromDate?: string, toDate?: string) {
    await this.getCampaign(ownerId, campaignId);
    const [series, totals] = await Promise.all([
      this.repo.metricsForCampaign(campaignId, fromDate, toDate),
      this.repo.campaignTotals(campaignId),
    ]);
    return { series, totals };
  }

  // ─── Search index ───────────────────────────────────
  search(ownerId: string, q: any) { return this.repo.search(ownerId, q); }
  private async indexCampaign(c: any) {
    await this.repo.upsertSearch({
      subjectType: 'campaign', subjectId: c.id, ownerIdentityId: c.ownerIdentityId,
      searchText: `${c.name} ${c.objective} ${c.status}`.toLowerCase(),
      facets: { status: c.status, objective: c.objective, geos: (c.routingRules?.geos ?? []) },
      rankingScore: c.status === 'active' ? 1.0 : c.status === 'approved' ? 0.8 : 0.5,
    });
  }
  private async indexCreative(c: any) {
    await this.repo.upsertSearch({
      subjectType: 'creative', subjectId: c.id, ownerIdentityId: c.ownerIdentityId,
      searchText: `${c.name} ${c.format} ${c.status} ${c.headline ?? ''} ${c.body ?? ''}`.toLowerCase(),
      facets: { status: c.status, format: c.format },
      rankingScore: c.status === 'approved' ? 1.0 : 0.5,
    });
  }

  // ─── Moderation queue ───────────────────────────────
  listModeration(subjectType: string, subjectId: string) { return this.repo.listModeration(subjectType, subjectId); }
  async recordModerationDecision(actorId: string, actorRole: string, dto: any, req?: any) {
    if (actorRole !== 'admin' && actorRole !== 'operator' && actorRole !== 'moderator') {
      throw new ForbiddenException('moderator/admin only');
    }
    const row = await this.repo.appendModeration({
      subjectType: dto.subjectType, subjectId: dto.subjectId,
      reviewerIdentityId: actorId, decision: dto.decision,
      rationale: dto.rationale, flags: dto.flags ?? [],
    });
    await this.repo.recordAudit(null, actorId, actorRole, `moderation.${dto.decision}`, { type: dto.subjectType, id: dto.subjectId }, dto, req);
    return row;
  }

  // ─── Audit ──────────────────────────────────────────
  audit(ownerId: string, limit = 200) { return this.repo.listAudit(ownerId, limit); }

  // ─── Webhooks (provider impression/click pings) ─────
  async handleWebhook(provider: string, evt: { id: string; type: string; data: any }, signatureValid: boolean, req?: any) {
    if (await this.repo.hasWebhook(provider, evt.id)) return { status: 'duplicate' };
    if (!signatureValid) {
      await this.repo.recordWebhook({ provider, eventId: evt.id, eventType: evt.type, signatureValid: false, status: 'failed', payload: evt });
      throw new ForbiddenException('invalid webhook signature');
    }
    let outcome: 'processed' | 'skipped' = 'skipped';
    try {
      const obj = evt.data?.object ?? {};
      if (evt.type === 'metrics.snapshot' && obj.campaign_id && obj.date) {
        await this.repo.appendMetric({
          campaignId: obj.campaign_id, adGroupId: obj.ad_group_id ?? null, creativeId: obj.creative_id ?? null,
          date: obj.date, impressions: obj.impressions ?? 0, clicks: obj.clicks ?? 0,
          conversions: obj.conversions ?? 0, spendMinor: obj.spend_minor ?? 0, meta: obj.meta ?? {},
        });
        if (obj.spend_minor) {
          const c = await this.repo.getCampaign(obj.campaign_id);
          if (c) await this.repo.updateCampaign(c.id, { spentMinor: (c.spentMinor ?? 0) + obj.spend_minor });
        }
        outcome = 'processed';
      }
    } finally {
      await this.repo.recordWebhook({ provider, eventId: evt.id, eventType: evt.type, signatureValid: true, status: outcome, payload: evt });
    }
    return { status: outcome };
  }
}
