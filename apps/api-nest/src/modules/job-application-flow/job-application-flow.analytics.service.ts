/**
 * Analytics for Domain 25 — recruiter pipeline insights:
 *   funnel counts, time-in-stage, drop-off note, source effectiveness.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { JobApplicationFlowRepository } from './job-application-flow.repository';

@Injectable()
export class JobApplicationFlowAnalyticsService {
  constructor(
    private readonly repo: JobApplicationFlowRepository,
    @Optional() @Inject('ANALYTICS_CLIENT') private readonly analytics?: { post: (p: string, b: any) => Promise<any> },
  ) {}

  async insights(tenantId: string, jobId?: string) {
    const apps = this.repo.listApplications(tenantId, { jobId });
    const counts = apps.reduce<Record<string, number>>((acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc; }, {});
    const total = apps.length;
    const advancing = (counts['under_review'] ?? 0) + (counts['interview'] ?? 0) + (counts['offered'] ?? 0);
    const conversionPct = total ? Math.round((advancing / total) * 1000) / 10 : 0;
    const fallback = {
      tenantId, jobId: jobId ?? null, total,
      counts, conversionPct,
      avgQuality: total ? Math.round(apps.reduce((s, a) => s + (a.qualityScore ?? 0), 0) / total) : 0,
      anomalyNote: null as string | null,
      mode: 'fallback' as const, generatedAt: new Date().toISOString(),
    };
    if (!this.analytics) return fallback;
    try {
      const out = await this.analytics.post('/job-applications/insights', { tenantId, jobId, counts, total });
      return { ...fallback, ...out, mode: 'analytics' as const };
    } catch { return fallback; }
  }
}
