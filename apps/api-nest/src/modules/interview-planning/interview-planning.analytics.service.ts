/**
 * Analytics for Domain 29 — interview workbench dashboard.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { InterviewPlanningRepository } from './interview-planning.repository';

@Injectable()
export class InterviewPlanningAnalyticsService {
  constructor(
    private readonly repo: InterviewPlanningRepository,
    @Optional() @Inject('ANALYTICS_CLIENT') private readonly analytics?: { post: (p: string, b: any) => Promise<any> },
  ) {}

  async dashboard(tenantId: string) {
    const interviews = this.repo.listInterviews(tenantId, {});
    const scorecards = this.repo.listScorecards(tenantId, {});
    const calibrations = this.repo.listCalibrations(tenantId, {});

    const upcoming = interviews
      .filter((i) => i.status === 'scheduled' || i.status === 'confirmed')
      .filter((i) => +new Date(i.startAt) >= Date.now() - 86_400_000);
    const completed = interviews.filter((i) => i.status === 'completed');
    const cancelled = interviews.filter((i) => i.status === 'cancelled' || i.status === 'no_show');
    const overdueScorecards = scorecards.filter((s) =>
      (s.status === 'pending' || s.status === 'in_progress') && +new Date(s.dueAt) < Date.now(),
    );
    const conflicts = interviews.filter((i) => i.conflictFlags.length > 0);

    const submitted = scorecards.filter((s) => s.status === 'submitted' || s.status === 'calibrated');
    const avgScore = submitted.length
      ? Math.round((submitted.reduce((a, s) => a + (s.averageScore ?? 0), 0) / submitted.length) * 100) / 100
      : null;

    const completionRate = scorecards.length
      ? Math.round((submitted.length / scorecards.length) * 100)
      : 0;

    const noShowRate = interviews.length
      ? Math.round((interviews.filter((i) => i.status === 'no_show').length / interviews.length) * 100)
      : 0;

    let anomalyNote: string | null = null;
    if (overdueScorecards.length >= 3) anomalyNote = 'Multiple scorecards overdue — chase interviewers.';
    else if (conflicts.length >= 2) anomalyNote = 'Scheduling conflicts detected — review interviewer availability.';
    else if (noShowRate >= 15) anomalyNote = `No-show rate at ${noShowRate}% — review reminder cadence.`;

    const fallback = {
      tenantId,
      counts: {
        scheduled: upcoming.length,
        completed: completed.length,
        cancelled: cancelled.length,
        openCalibrations: calibrations.filter((c) => c.status === 'open').length,
      },
      overdueScorecards: overdueScorecards.length,
      conflicts: conflicts.length,
      avgScore,
      completionRate,
      noShowRate,
      anomalyNote,
      recommendedActions: [
        overdueScorecards.length ? 'Send scorecard reminders' : 'Confirm next-day interviews',
        conflicts.length ? 'Resolve scheduling conflicts' : 'Open calibration sessions for completed loops',
      ],
      mode: 'fallback' as const,
      generatedAt: new Date().toISOString(),
    };

    if (!this.analytics) return fallback;
    try {
      const out = await this.analytics.post('/interview-planning/dashboard', {
        tenantId, counts: fallback.counts, overdue: overdueScorecards.length, conflicts: conflicts.length,
      });
      return { ...fallback, ...out, mode: 'analytics' as const };
    } catch { return fallback; }
  }
}
