import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { AdsAnalyticsPerformanceRepository } from './ads-analytics-performance.repository';
import {
  ALERT_TRANSITIONS, EXPORT_TRANSITIONS, SAVED_REPORT_TRANSITIONS, computeDerived,
} from './dto';

const ML_BASE = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';
const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';

@Injectable()
export class AdsAnalyticsPerformanceService {
  private readonly logger = new Logger(AdsAnalyticsPerformanceService.name);
  constructor(private readonly repo: AdsAnalyticsPerformanceRepository) {}

  // ─── Overview / KPIs ─────────────────────────────────
  async overview(ownerId: string) {
    const today = new Date(); const to = today.toISOString().slice(0, 10);
    const fromDate = new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10);
    const series = await this.repo.ownerTotalsByDate(ownerId, fromDate, to);
    const totals = series.reduce((acc: any, r: any) => ({
      impressions: acc.impressions + Number(r.impressions),
      clicks: acc.clicks + Number(r.clicks),
      installs: acc.installs + Number(r.installs),
      conversions: acc.conversions + Number(r.conversions),
      spend_minor: acc.spend_minor + Number(r.spend_minor),
      revenue_minor: acc.revenue_minor + Number(r.revenue_minor),
    }), { impressions: 0, clicks: 0, installs: 0, conversions: 0, spend_minor: 0, revenue_minor: 0 });
    const derived = computeDerived(totals);
    const insights = await this.fetchInsights(ownerId, { totals, derived }).catch(() => this.fallbackInsights(totals, derived));
    return { kpis: { ...totals, ...derived }, series, insights, computedAt: new Date().toISOString() };
  }
  private async fetchInsights(ownerId: string, signals: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/ads-analytics-performance/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ owner_id: ownerId, signals }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(signals.totals, signals.derived);
  }
  private fallbackInsights(totals: any, derived: any) {
    const out: any[] = [];
    if (totals.impressions === 0) out.push({ id: 'no_data', severity: 'info', title: 'No impressions in the last 30 days yet' });
    if (derived.ctr > 0 && derived.ctr < 0.005) out.push({ id: 'low_ctr', severity: 'warn', title: `CTR ${(derived.ctr*100).toFixed(2)}% below benchmark`, body: 'Refresh creatives or tighten targeting.' });
    if (derived.roas > 0 && derived.roas < 1) out.push({ id: 'low_roas', severity: 'warn', title: `ROAS ${derived.roas.toFixed(2)} below 1×`, body: 'Spend is outpacing revenue.' });
    if (!out.length) out.push({ id: 'healthy', severity: 'success', title: 'Performance steady' });
    return out;
  }

  // ─── Query (aggregated table) ───────────────────────
  async query(ownerId: string, q: any) {
    const r = await this.repo.query(ownerId, q);
    const rows = r.rows.map((row: any) => {
      const norm = {
        impressions: Number(row.impressions), clicks: Number(row.clicks), installs: Number(row.installs),
        conversions: Number(row.conversions), spend_minor: Number(row.spend_minor), revenue_minor: Number(row.revenue_minor),
      };
      return { ...row, ...norm, ...computeDerived(norm) };
    });
    if (q.sort) {
      const dir = q.sort.dir === 'asc' ? 1 : -1;
      const m = q.sort.metric;
      const key = m === 'spend' ? 'spend_minor' : m === 'revenue' ? 'revenue_minor'
        : m === 'cpc' ? 'cpc_minor' : m === 'cpm' ? 'cpm_minor' : m === 'cpi' ? 'cpi_minor' : m === 'cpa' ? 'cpa_minor' : m;
      rows.sort((a: any, b: any) => ((a[key] ?? 0) - (b[key] ?? 0)) * dir);
    }
    return { rows, page: r.page, pageSize: r.pageSize, total: rows.length };
  }

  // ─── Creative scores ────────────────────────────────
  listCreativeScores(ownerId: string, q: any) { return this.repo.listCreativeScores(ownerId, q); }
  async recomputeCreativeScore(ownerId: string, creativeId: string, windowDays: number) {
    const [agg] = await this.repo.rawCreativeWindow(ownerId, creativeId, windowDays);
    const counters = {
      impressions: Number(agg?.impressions ?? 0), clicks: Number(agg?.clicks ?? 0), installs: Number(agg?.installs ?? 0),
      conversions: Number(agg?.conversions ?? 0), spend_minor: Number(agg?.spend_minor ?? 0), revenue_minor: Number(agg?.revenue_minor ?? 0),
    };
    const derived = computeDerived(counters);
    const ml = await this.scoreCreative(counters, derived).catch(() => this.fallbackScore(counters, derived));
    await this.repo.upsertCreativeScore({
      ownerIdentityId: ownerId, creativeId, windowDays,
      ctr: derived.ctr, cvr: derived.cvr,
      cpcMinor: derived.cpc_minor, cpmMinor: derived.cpm_minor, cpiMinor: derived.cpi_minor, cpaMinor: derived.cpa_minor,
      fatigueScore: ml.fatigue, performanceScore: ml.score, band: ml.band, explanation: ml.explanation,
    });
    return { ok: true };
  }
  private async scoreCreative(counters: any, derived: any) {
    try {
      const r = await fetch(`${ML_BASE}/ads-analytics-performance/score-creative`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ counters, derived }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ML score-creative down: ${(e as Error).message}`); }
    return this.fallbackScore(counters, derived);
  }
  private fallbackScore(counters: any, derived: any) {
    let score = 0.5;
    if (derived.ctr >= 0.02) score += 0.2;
    if (derived.cvr >= 0.04) score += 0.15;
    if (derived.roas >= 1.5) score += 0.15;
    if (derived.ctr < 0.005) score -= 0.2;
    score = Math.max(0, Math.min(1, score));
    const band = score >= 0.85 ? 'top' : score >= 0.7 ? 'strong' : score >= 0.5 ? 'average' : score >= 0.3 ? 'weak' : 'poor';
    const fatigue = counters.impressions > 100_000 && derived.ctr < 0.005 ? 0.7 : 0.2;
    return { score, fatigue, band, explanation: { ctr: derived.ctr, cvr: derived.cvr, roas: derived.roas, source: 'fallback' } };
  }

  // ─── Saved reports ──────────────────────────────────
  listSavedReports(ownerId: string, status?: string) { return this.repo.listSavedReports(ownerId, status); }
  async getSavedReport(ownerId: string, id: string) {
    const r = await this.repo.getSavedReport(id);
    if (!r) throw new NotFoundException('saved report not found');
    if (r.ownerIdentityId !== ownerId) throw new ForbiddenException('not your report');
    return r;
  }
  async createSavedReport(ownerId: string, dto: any, actorId: string, req?: any) {
    const r = await this.repo.createSavedReport({ ownerIdentityId: ownerId, status: 'active', ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'saved_report.created', { type: 'saved_report', id: r.id }, dto, req);
    return r;
  }
  async updateSavedReport(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    await this.getSavedReport(ownerId, id);
    const r = await this.repo.updateSavedReport(id, dto);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'saved_report.updated', { type: 'saved_report', id }, dto, req);
    return r;
  }
  async transitionSavedReport(ownerId: string, id: string, status: string, actorId: string, req?: any) {
    const cur = await this.getSavedReport(ownerId, id);
    const allowed = SAVED_REPORT_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const r = await this.repo.updateSavedReport(id, { status });
    await this.repo.recordAudit(ownerId, actorId, 'owner', `saved_report.${status}`, { type: 'saved_report', id }, { from: cur.status, to: status }, req);
    return r;
  }

  // ─── Alerts ─────────────────────────────────────────
  listAlerts(ownerId: string, status?: string) { return this.repo.listAlerts(ownerId, status); }
  async getAlert(ownerId: string, id: string) {
    const a = await this.repo.getAlert(id);
    if (!a) throw new NotFoundException('alert not found');
    if (a.ownerIdentityId !== ownerId) throw new ForbiddenException('not your alert');
    return a;
  }
  async createAlert(ownerId: string, dto: any, actorId: string, req?: any) {
    const a = await this.repo.createAlert({ ownerIdentityId: ownerId, status: 'active', ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'alert.created', { type: 'alert', id: a.id }, dto, req);
    return a;
  }
  async updateAlert(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    await this.getAlert(ownerId, id);
    const a = await this.repo.updateAlert(id, dto);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'alert.updated', { type: 'alert', id }, dto, req);
    return a;
  }
  async transitionAlert(ownerId: string, id: string, status: string, reason: string | undefined, actorId: string, actorRole: string, req?: any) {
    const cur = await this.getAlert(ownerId, id);
    const allowed = ALERT_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const patch: any = { status };
    if (status === 'acknowledged') {
      // Find latest open event; mark acknowledged.
      const events = await this.repo.listAlertEvents(id, 1);
      if (events[0] && !events[0].acknowledgedAt) {
        await this.repo.appendAlertEvent({
          alertId: id, observedValue: events[0].observedValue, threshold: events[0].threshold,
          payload: events[0].payload, acknowledgedByIdentityId: actorId, acknowledgedAt: new Date(),
          triggeredAt: events[0].triggeredAt,
        });
      }
    }
    const a = await this.repo.updateAlert(id, patch);
    await this.repo.recordAudit(ownerId, actorId, actorRole, `alert.${status}`, { type: 'alert', id }, { from: cur.status, to: status, reason }, req);
    return a;
  }
  alertEvents(alertId: string) { return this.repo.listAlertEvents(alertId); }

  // ─── Export jobs (sync stub; queue a job, run inline for tests) ─────
  listExports(ownerId: string, status?: string) { return this.repo.listExports(ownerId, status); }
  async createExport(ownerId: string, dto: any, actorId: string, req?: any) {
    const job = await this.repo.createExport({ ownerIdentityId: ownerId, status: 'queued', format: dto.format, filters: dto.filters });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'export.created', { type: 'export', id: job.id }, dto, req);
    // Inline run — production would dispatch to a background worker.
    void this.runExport(ownerId, job.id, dto).catch((e) => this.logger.error(`export ${job.id} failed: ${e.message}`));
    return job;
  }
  private async runExport(ownerId: string, jobId: string, dto: any) {
    await this.repo.updateExport(jobId, { status: 'running', startedAt: new Date() });
    try {
      const r = await this.query(ownerId, { ...dto, sort: undefined, page: 1, pageSize: 500 });
      const fileUrl = `mem://exports/${jobId}.${dto.format}`; // placeholder; real storage adapter later
      await this.repo.updateExport(jobId, { status: 'succeeded', finishedAt: new Date(), rowCount: r.rows.length, fileUrl });
    } catch (e) {
      await this.repo.updateExport(jobId, { status: 'failed', finishedAt: new Date(), error: (e as Error).message });
    }
  }
  async cancelExport(ownerId: string, id: string, actorId: string, req?: any) {
    const cur = await this.repo.getExport(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('export not found');
    const allowed = EXPORT_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes('cancelled')) throw new BadRequestException(`cannot cancel ${cur.status}`);
    const r = await this.repo.updateExport(id, { status: 'cancelled', finishedAt: new Date() });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'export.cancelled', { type: 'export', id }, {}, req);
    return r;
  }

  // ─── Anomalies ──────────────────────────────────────
  listAnomalies(ownerId: string, status?: string) { return this.repo.listAnomalies(ownerId, status); }
  async transitionAnomaly(ownerId: string, id: string, status: 'acknowledged' | 'resolved', actorId: string, actorRole: string, req?: any) {
    const cur = await this.repo.getAnomaly(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('anomaly not found');
    const patch: any = { status };
    if (status === 'acknowledged') patch.acknowledgedByIdentityId = actorId;
    if (status === 'resolved') patch.resolvedAt = new Date();
    const r = await this.repo.updateAnomaly(id, patch);
    await this.repo.recordAudit(ownerId, actorId, actorRole, `anomaly.${status}`, { type: 'anomaly', id }, { from: cur.status, to: status }, req);
    return r;
  }
  async detectAnomalies(ownerId: string) {
    // Simple z-score over last 14 days, deterministic fallback when ML/analytics unreachable.
    const today = new Date(); const to = today.toISOString().slice(0, 10);
    const fromDate = new Date(today.getTime() - 13 * 86400000).toISOString().slice(0, 10);
    const series = await this.repo.ownerTotalsByDate(ownerId, fromDate, to);
    if (series.length < 5) return { detected: 0 };
    const ctrs = series.map((r: any) => Number(r.impressions) > 0 ? Number(r.clicks) / Number(r.impressions) : 0);
    const mean = ctrs.reduce((a: number, b: number) => a + b, 0) / ctrs.length;
    const sd = Math.sqrt(ctrs.map((v: number) => (v - mean) ** 2).reduce((a: number, b: number) => a + b, 0) / ctrs.length) || 0.0001;
    const last = ctrs[ctrs.length - 1];
    const z = (last - mean) / sd;
    let detected = 0;
    if (Math.abs(z) >= 2) {
      await this.repo.createAnomaly({
        ownerIdentityId: ownerId, scope: { dimension: 'owner_ctr' }, metric: 'ctr',
        observedValue: last, expectedValue: mean, zscore: z,
        severity: Math.abs(z) >= 3 ? 'critical' : 'warn', status: 'open',
        rationale: `Owner-wide CTR z-score ${z.toFixed(2)} on ${to} (mean ${mean.toFixed(4)}, sd ${sd.toFixed(4)})`,
      });
      detected = 1;
    }
    return { detected };
  }

  audit(ownerId: string, limit = 200) { return this.repo.listAudit(ownerId, limit); }
}
