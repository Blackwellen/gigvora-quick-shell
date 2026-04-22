import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MarketingAdminRepository } from './marketing-admin.repository';
import { MarketingAdminMlService } from './marketing-admin.ml.service';

const ROLE_READ  = ['marketing-admin','ads-ops','super-admin','viewer'];
const ROLE_WRITE = ['marketing-admin','ads-ops','super-admin'];

type Meta = { ip?: string; userAgent?: string };

const STATUS_FOR_DECISION: Record<string, string> = {
  approve: 'approved', reject: 'rejected', flag: 'flagged', needs_changes: 'needs_changes',
};

@Injectable()
export class MarketingAdminService {
  constructor(
    private readonly repo: MarketingAdminRepository,
    private readonly ml: MarketingAdminMlService,
  ) {}

  private assertRead(role: string)  { if (!ROLE_READ.includes(role))  throw new ForbiddenException({ code: 'mkt_read_required' }); }
  private assertWrite(role: string) { if (!ROLE_WRITE.includes(role)) throw new ForbiddenException({ code: 'mkt_write_required' }); }

  // ── Ads ─────
  listAds(role: string, f: any) { this.assertRead(role); return this.repo.listAds(f).then(r => ({ ...r, meta: { source: 'marketing-admin', role, ...f } })); }

  async scoreAndUpsertAd(role: string, actor: string | null, dto: any, meta: Meta) {
    this.assertWrite(role);
    const ml = await this.ml.scoreCreative(dto);
    const before = dto.id ? await this.repo.adById(dto.id) : null;
    const after = await this.repo.upsertAd(dto, ml);
    await this.repo.audit('ads_creative', after.id, actor, before ? 'rescore' : 'submit', before, after, meta.ip, meta.userAgent);
    return { ad: after, ml: { score: ml.score, risk: ml.risk, flags: ml.flags, model: ml.model } };
  }

  async decideAds(role: string, actor: string | null, dto: { ids: string[]; action: string; reason: string }, meta: Meta) {
    this.assertWrite(role);
    const status = STATUS_FOR_DECISION[dto.action];
    const rows = await this.repo.decideAds(dto.ids, status, dto.reason, actor);
    for (const row of rows) await this.repo.audit('ads_creative', row.id, actor, `decision.${dto.action}`, null, row, meta.ip, meta.userAgent);
    return { decided: rows.length, status, rows };
  }

  // ── Traffic ─────
  async traffic(role: string, f: { windowHours: number; source?: string; country?: string }) {
    this.assertRead(role);
    const [kpis, sources, pages, countries] = await Promise.all([
      this.repo.trafficKpis(f.windowHours),
      this.repo.trafficSources(f.windowHours),
      this.repo.trafficPages(f.windowHours),
      this.repo.trafficCountries(f.windowHours),
    ]);
    // Funnel commentary via analytics-python
    const conversions = Number(kpis.conversions ?? 0);
    const visitors    = Number(kpis.visitors ?? 0);
    const summary = await this.ml.funnelSummary({
      impressions: visitors, clicks: visitors, leads: conversions, conversions,
    });
    return { kpis, sources, pages, countries, funnel: summary, meta: { source: 'analytics-python', windowHours: f.windowHours } };
  }

  // ── IP intel ─────
  listIps(role: string, f: any) { this.assertRead(role); return this.repo.listIps(f); }
  async ipAct(role: string, actor: string | null, dto: { ips: string[]; action: 'watch'|'block'|'clear'; note?: string }, meta: Meta) {
    this.assertWrite(role);
    const status = dto.action === 'block' ? 'blocked' : dto.action === 'watch' ? 'watch' : 'clean';
    const rows = await this.repo.ipAct(dto.ips, status, actor);
    for (const row of rows) await this.repo.audit('ip_intel', row.ip, actor, `ip.${dto.action}`, null, row, meta.ip, meta.userAgent);
    return { updated: rows.length, status, rows };
  }
  scoreIp(role: string, body: any) { this.assertRead(role); return this.ml.scoreIp(body); }

  // ── Tasks ─────
  listTasks(role: string, f: any) { this.assertRead(role); return this.repo.listTasks(f); }
  createTask(role: string, actor: string | null, dto: any, meta: Meta) {
    this.assertWrite(role);
    return this.repo.createTask(dto, actor).then(async (t) => {
      await this.repo.audit('marketing_task', t.id, actor, 'create', null, t, meta.ip, meta.userAgent);
      return t;
    });
  }
  async updateTask(role: string, actor: string | null, dto: { taskId: string; patch: any }, meta: Meta) {
    this.assertWrite(role);
    const after = await this.repo.updateTask(dto.taskId, dto.patch);
    if (!after) throw new NotFoundException({ code: 'task_not_found' });
    await this.repo.audit('marketing_task', after.id, actor, 'update', null, after, meta.ip, meta.userAgent);
    return after;
  }

  // ── Notices ─────
  listNotices(role: string, f: any) { this.assertRead(role); return this.repo.listNotices(f); }
  async upsertNotice(role: string, actor: string | null, dto: any, meta: Meta) {
    this.assertWrite(role);
    const after = await this.repo.upsertNotice(dto, actor);
    await this.repo.audit('marketing_notice', after.id, actor, dto.id ? 'update' : 'create', null, after, meta.ip, meta.userAgent);
    return after;
  }
}
