import { Injectable, Logger } from '@nestjs/common';
import type { MediaAsset } from './dto';

/**
 * Bridge to the Python analytics service for Domain 20.
 * Endpoint: /media/insights
 * Provides operational summaries and anomaly hints with deterministic fallback.
 */
@Injectable()
export class MediaViewerAnalyticsService {
  private readonly log = new Logger('MediaViewerAnalytics');
  private readonly base = process.env.ANALYTICS_PYTHON_URL || 'http://localhost:8090';

  async insights(assets: MediaAsset[]) {
    try {
      const r = await fetch(`${this.base}/media/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: assets.map(a => ({
            id: a.id, kind: a.kind, status: a.status,
            views: a.views, downloads: a.downloads, likes: a.likes, comments: a.comments,
            sizeBytes: a.sizeBytes, moderation: a.moderation.verdict,
          })),
        }),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.log.warn(`fallback insights: ${(e as Error).message}`); }
    const total = assets.length;
    const byKind = assets.reduce<Record<string, number>>((acc, a) => { acc[a.kind] = (acc[a.kind] ?? 0) + 1; return acc; }, {});
    const totalViews = assets.reduce((s, a) => s + a.views, 0);
    const totalDownloads = assets.reduce((s, a) => s + a.downloads, 0);
    const stuckProcessing = assets.filter(a => a.status === 'processing').length;
    const failed = assets.filter(a => a.status === 'failed').length;
    const moderationReview = assets.filter(a => a.moderation.verdict === 'review' || a.moderation.verdict === 'blocked').length;
    const anomalies: { code: string; severity: 'info' | 'warning' | 'critical'; message: string }[] = [];
    if (stuckProcessing >= 3) anomalies.push({ code: 'processing-backlog', severity: 'warning', message: `${stuckProcessing} assets stuck in processing.` });
    if (failed > 0) anomalies.push({ code: 'transcode-failed', severity: 'critical', message: `${failed} transcoding failures need retry.` });
    if (moderationReview > 0) anomalies.push({ code: 'moderation-review', severity: 'warning', message: `${moderationReview} assets pending moderator review.` });
    return {
      summary: { total, byKind, totalViews, totalDownloads, stuckProcessing, failed, moderationReview },
      topPerformers: [...assets].sort((a, b) => (b.views + b.likes * 3) - (a.views + a.likes * 3)).slice(0, 5).map(a => ({ id: a.id, title: a.title ?? a.filename, views: a.views, likes: a.likes })),
      anomalies,
      source: 'fallback',
      generatedAt: new Date().toISOString(),
    };
  }
}
