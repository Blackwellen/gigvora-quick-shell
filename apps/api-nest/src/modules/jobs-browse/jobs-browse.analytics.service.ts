/**
 * Analytics insights for Jobs Browse (Domain 23).
 * Powers the right-rail "Market signal" widget and the saved-search digest.
 * Calls analytics-python /jobs-browse/insights with safe fallback.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { JobsBrowseRepository } from './jobs-browse.repository';

@Injectable()
export class JobsBrowseAnalyticsService {
  constructor(
    private readonly repo: JobsBrowseRepository,
    @Optional() @Inject('ANALYTICS_CLIENT') private readonly analytics?: { post: (p: string, b: any) => Promise<any> },
  ) {}

  async insights(identityId?: string) {
    const rows = this.repo.list();
    const fallback = {
      totalActive: rows.filter((r) => r.status === 'active').length,
      newToday: rows.filter((r) => Date.now() - +new Date(r.postedAt) < 86_400_000).length,
      remoteShare: Math.round(rows.filter((r) => r.remote === 'remote').length / rows.length * 100),
      avgSalary: Math.round(rows.reduce((s, r) => s + ((r.salaryMin ?? 0) + (r.salaryMax ?? 0)) / 2, 0) / rows.length),
      hotSkills: ['react', 'typescript', 'python'],
      anomalyNote: null as string | null,
      generatedAt: new Date().toISOString(),
      mode: 'fallback' as const,
    };
    if (!this.analytics) return fallback;
    try {
      const out = await this.analytics.post('/jobs-browse/insights', { identityId });
      return { ...fallback, ...out, mode: 'analytics' as const };
    } catch { return fallback; }
  }
}
