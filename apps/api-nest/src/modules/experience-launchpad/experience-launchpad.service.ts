import { Injectable } from '@nestjs/common';
import { ExperienceLaunchpadRepository } from './experience-launchpad.repository';

@Injectable()
export class ExperienceLaunchpadService {
  constructor(private readonly repo: ExperienceLaunchpadRepository) {}

  /**
   * Deterministic mentor-fit scoring for "discover" view.
   * Combines expertise overlap (Jaccard) + status bias + rating.
   * The ML service can override this; the service stays online if ML is down.
   */
  rankMentors(seed: { interests: string[] }, mentors: any[]) {
    const seedSet = new Set((seed.interests ?? []).map((s) => s.toLowerCase()));
    return mentors
      .map((m) => {
        const tags = new Set<string>([...(m.expertise ?? []), ...(m.industries ?? [])].map((s: string) => s.toLowerCase()));
        const inter = [...tags].filter((t) => seedSet.has(t)).length;
        const union = new Set([...seedSet, ...tags]).size || 1;
        const jaccard = inter / union;
        const statusBias = m.status === 'available' ? 0.15 : m.status === 'waitlist' ? 0.05 : 0;
        const rating = Number(m.rating ?? 0) / 5;
        const score = Math.round((jaccard * 0.55 + rating * 0.3 + statusBias) * 100);
        return { ...m, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  async overview(identityId: string) {
    const [enrollments, bookings, opportunities, challenges] = await Promise.all([
      this.repo.myEnrollments(identityId),
      this.repo.myMentorBookings(identityId),
      this.repo.listOpportunities({ limit: 50 }),
      this.repo.listChallenges('open'),
    ]);
    const active = enrollments.filter((e: any) => e.status === 'active').length;
    const completed = enrollments.filter((e: any) => e.status === 'completed').length;
    return {
      data: {
        totals: {
          enrollments: enrollments.length,
          active_pathways: active,
          completed_pathways: completed,
          upcoming_sessions: bookings.filter((b: any) => new Date(b.scheduled_for) > new Date()).length,
          open_opportunities: opportunities.length,
          open_challenges: challenges.length,
        },
        next_sessions: bookings.slice(0, 5),
        recent_opportunities: opportunities.slice(0, 8),
      },
      meta: { computed_at: new Date().toISOString() },
    };
  }
}
