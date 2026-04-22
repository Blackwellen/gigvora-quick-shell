/**
 * Analytics for Domain 24 — recruiter studio insights:
 * fill rate, time-to-fill estimate, credit burn, pending approvals.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { JobPostingStudioRepository } from './job-posting-studio.repository';

@Injectable()
export class JobPostingStudioAnalyticsService {
  constructor(
    private readonly repo: JobPostingStudioRepository,
    @Optional() @Inject('ANALYTICS_CLIENT') private readonly analytics?: { post: (p: string, b: any) => Promise<any> },
  ) {}

  async insights(tenantId: string) {
    const jobs = this.repo.list(tenantId);
    const active = jobs.filter((j) => j.status === 'active').length;
    const apps = jobs.reduce((s, j) => s + j.applications, 0);
    const impressions = jobs.reduce((s, j) => s + j.impressions, 0);
    const fallback = {
      tenantId,
      activePostings: active,
      pendingApprovals: this.repo.approvalQueue(tenantId).length,
      totalApplications: apps,
      totalImpressions: impressions,
      conversionPct: impressions ? Math.round((apps / impressions) * 1000) / 10 : 0,
      creditBalance: this.repo.balance(tenantId),
      avgTimeToFillDays: 18,
      anomalyNote: null as string | null,
      mode: 'fallback' as const,
      generatedAt: new Date().toISOString(),
    };
    if (!this.analytics) return fallback;
    try {
      const out = await this.analytics.post('/jobs-studio/insights', { tenantId });
      return { ...fallback, ...out, mode: 'analytics' as const };
    } catch { return fallback; }
  }
}
