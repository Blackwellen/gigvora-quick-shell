/**
 * D31 analytics — operational summaries: profile health, signal funnel,
 * invitation outcomes. Bridges to apps/analytics-python/app/availability_matching.py
 * with deterministic local fallback.
 */
import { Injectable, Logger } from '@nestjs/common';
import type {
  InvitationRow, ProfileRow, SignalRow, WindowRow,
} from './candidate-availability-matching.repository';

export interface CamInsights {
  profiles: { active: number; paused: number; draft: number; archived: number };
  signalFunnel: { new: number; viewed: number; saved: number; dismissed: number; converted: number };
  invitations: { pending: number; accepted: number; declined: number; expired: number; acceptanceRate: number | null };
  avgScore: number | null;
  upcomingWindows: number;
  source: 'analytics' | 'fallback';
}

@Injectable()
export class CandidateAvailabilityMatchingAnalyticsService {
  private readonly log = new Logger('CamAnalytics');
  private readonly base = process.env.ANALYTICS_PYTHON_URL ?? '';
  private readonly enabled = !!this.base;

  async insights(input: {
    profiles: ProfileRow[]; signals: SignalRow[];
    invitations: InvitationRow[]; windows: WindowRow[];
  }): Promise<CamInsights> {
    if (this.enabled) {
      try {
        const res = await fetch(`${this.base}/analytics/availability-matching/insights`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input), signal: AbortSignal.timeout(2500),
        });
        if (res.ok) return { ...(await res.json()) as CamInsights, source: 'analytics' };
      } catch (e) { this.log.warn(`analytics.insights fell back: ${(e as Error).message}`); }
    }
    return this.local(input);
  }

  private local(input: { profiles: ProfileRow[]; signals: SignalRow[]; invitations: InvitationRow[]; windows: WindowRow[] }): CamInsights {
    const profiles = { active: 0, paused: 0, draft: 0, archived: 0 };
    for (const p of input.profiles) (profiles as any)[p.status]++;
    const funnel = { new: 0, viewed: 0, saved: 0, dismissed: 0, converted: 0 };
    for (const s of input.signals) (funnel as any)[s.status]++;
    const inv = { pending: 0, accepted: 0, declined: 0, expired: 0, acceptanceRate: null as number | null };
    for (const i of input.invitations) (inv as any)[i.status]++;
    const decided = inv.accepted + inv.declined;
    inv.acceptanceRate = decided > 0 ? Number((inv.accepted / decided).toFixed(2)) : null;
    const avgScore = input.signals.length ? Number((input.signals.reduce((a, s) => a + s.score, 0) / input.signals.length).toFixed(1)) : null;
    const now = Date.now();
    const upcomingWindows = input.windows.filter((w) => w.status !== 'cancelled' && Date.parse(w.endsAt) > now).length;
    return { profiles, signalFunnel: funnel, invitations: inv, avgScore, upcomingWindows, source: 'fallback' };
  }
}
