import { Injectable, Logger } from '@nestjs/common';
import { Appointment } from './dto';

/**
 * Optional Python analytics enrichment for Domain 19.
 * Operational summaries with deterministic local fallback.
 */
@Injectable()
export class BookingAnalyticsService {
  private readonly log = new Logger(BookingAnalyticsService.name);
  private base = process.env.ANALYTICS_PY_URL ?? 'http://localhost:9090';

  async insights(appts: Appointment[]) {
    try {
      const r = await fetch(`${this.base}/booking/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ appointments: appts }),
        signal: AbortSignal.timeout(1500),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.log.debug(`analytics offline: ${(e as Error).message}`); }
    return this.fallback(appts);
  }

  private fallback(appts: Appointment[]) {
    const total = appts.length;
    const confirmed = appts.filter(a => a.status === 'confirmed' || a.status === 'completed').length;
    const cancelled = appts.filter(a => a.status === 'cancelled').length;
    const noShow = appts.filter(a => a.status === 'no_show').length;
    const reschedules = appts.reduce((a, x) => a + (x.rescheduleCount ?? 0), 0);
    const cards = [
      { id: 'confirmation', title: 'Confirmation rate', value: total ? Math.round((confirmed / total) * 100) : 0, unit: '%', trend: confirmed >= cancelled ? 'up' : 'down' },
      { id: 'cancel', title: 'Cancellations', value: cancelled, unit: '', trend: cancelled > 0 ? 'down' : 'up' },
      { id: 'noshow', title: 'No-shows', value: noShow, unit: '', trend: noShow > 0 ? 'down' : 'neutral' },
      { id: 'reschedules', title: 'Reschedules', value: reschedules, unit: '', trend: 'neutral' },
    ];
    const anomalies: string[] = [];
    if (noShow > 0) anomalies.push(`${noShow} no-shows detected — consider stricter reminders.`);
    if (cancelled > confirmed && total > 3) anomalies.push('Cancellations exceed confirmations — review availability or pricing.');
    return { source: 'fallback', cards, anomalies, generatedAt: new Date().toISOString() };
  }
}
