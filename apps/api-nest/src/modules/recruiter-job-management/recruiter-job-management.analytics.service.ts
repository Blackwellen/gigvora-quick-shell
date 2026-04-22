/**
 * Analytics for Domain 26 — recruiter dashboard insights.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { RecruiterJobManagementRepository } from './recruiter-job-management.repository';

@Injectable()
export class RecruiterJobManagementAnalyticsService {
  constructor(
    private readonly repo: RecruiterJobManagementRepository,
    @Optional() @Inject('ANALYTICS_CLIENT') private readonly analytics?: { post: (p: string, b: any) => Promise<any> },
  ) {}

  async dashboard(tenantId: string) {
    const reqs = this.repo.list(tenantId, {});
    const jobs = this.repo.listJobs(tenantId, {});
    const counts = reqs.reduce<Record<string, number>>((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {});
    const openCount = (counts['opened'] ?? 0) + (counts['paused'] ?? 0);
    const pendingApprovals = counts['pending_approval'] ?? 0;
    const totalApplicants = jobs.reduce((s, j) => s + j.applicantsTotal, 0);
    const newApplicants = jobs.reduce((s, j) => s + j.applicantsNew, 0);
    const fallback = {
      tenantId, counts, openCount, pendingApprovals,
      totalApplicants, newApplicants,
      avgDaysOpen: jobs.length ? Math.round(jobs.reduce((s, j) => s + j.daysOpen, 0) / jobs.length) : 0,
      anomalyNote: pendingApprovals >= 3 ? 'Approval backlog growing — check approver workload.' : null,
      mode: 'fallback' as const, generatedAt: new Date().toISOString(),
    };
    if (!this.analytics) return fallback;
    try {
      const out = await this.analytics.post('/recruiter-jobs/dashboard', { tenantId, counts, openCount });
      return { ...fallback, ...out, mode: 'analytics' as const };
    } catch { return fallback; }
  }
}
