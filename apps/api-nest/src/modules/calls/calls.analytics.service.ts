import { Injectable, Logger } from '@nestjs/common';
import { CallRecord } from './dto';

/**
 * Optional Python analytics enrichment for Domain 18.
 * Produces deterministic operational summaries with safe local fallback
 * when the Python bridge is unavailable.
 */
@Injectable()
export class CallsAnalyticsService {
  private readonly log = new Logger(CallsAnalyticsService.name);
  private base = process.env.ANALYTICS_PY_URL ?? 'http://localhost:9090';

  async insights(calls: CallRecord[]) {
    try {
      const r = await fetch(`${this.base}/calls/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ calls }), signal: AbortSignal.timeout(1500),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.log.debug(`analytics offline: ${(e as Error).message}`); }
    return this.fallback(calls);
  }

  private fallback(calls: CallRecord[]) {
    const total = calls.length;
    const completed = calls.filter(c => c.status === 'completed').length;
    const missed = calls.filter(c => c.status === 'missed' || c.status === 'declined').length;
    const failed = calls.filter(c => c.status === 'failed').length;
    const avgDuration = calls.filter(c => c.durationSeconds).reduce((a, c) => a + (c.durationSeconds ?? 0), 0) / Math.max(1, completed);
    const cards = [
      { id: 'completion', title: 'Completion rate', value: total ? Math.round((completed / total) * 100) : 0, unit: '%', trend: completed >= missed ? 'up' : 'down' },
      { id: 'avg_dur', title: 'Avg call duration', value: Math.round(avgDuration / 60), unit: 'min', trend: 'neutral' },
      { id: 'missed', title: 'Missed / declined', value: missed, unit: '', trend: missed > 0 ? 'down' : 'up' },
    ];
    const anomalies = failed > 0 ? [`${failed} failed connections detected — review network/provider health.`] : [];
    return { source: 'fallback', cards, anomalies, generatedAt: new Date().toISOString() };
  }
}
