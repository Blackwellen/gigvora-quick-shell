import { Injectable, Logger } from '@nestjs/common';
import { PodcastsRepository } from './podcasts.repository';

@Injectable()
export class PodcastsAnalyticsService {
  private readonly log = new Logger('PodcastsAnalytics');
  private readonly base = process.env.ANALYTICS_PYTHON_URL ?? 'http://analytics-python:8081';

  constructor(private readonly repo: PodcastsRepository) {}

  async insights(actor: string) {
    const totals = this.repo.totals();
    const topShows = this.repo.listShows({}).slice(0, 5).map((s) => ({ id: s.id, title: s.title, subscribers: s.subscribers, rating: s.rating, plays: s.totalPlays }));
    const recentEpisodes = this.repo.listEpisodes({}).slice(0, 5).map((e) => ({ id: e.id, title: e.title, plays: e.plays, status: e.status }));
    const purchases = this.repo.listPurchases(actor).slice(0, 5);

    let remote: any = null;
    try {
      const res = await fetch(`${this.base}/podcasts/insights`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ totals, topShows, recentEpisodes }),
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) remote = await res.json();
    } catch (e: any) { this.log.warn(`analytics fallback: ${e?.message}`); }

    return {
      generatedAt: new Date().toISOString(),
      totals,
      topShows,
      recentEpisodes,
      purchases,
      summary: remote?.summary ?? `${totals.shows} shows · ${totals.episodes} episodes · ${totals.totalPlays.toLocaleString()} plays`,
      anomalies: remote?.anomalies ?? [],
      revenueBands: remote?.revenueBands ?? [
        { band: 'subscriptions', cents: Math.round(totals.revenueCents * 0.6) },
        { band: 'one-off',       cents: Math.round(totals.revenueCents * 0.3) },
        { band: 'donations',     cents: Math.round(totals.revenueCents * 0.1) },
      ],
    };
  }
}
