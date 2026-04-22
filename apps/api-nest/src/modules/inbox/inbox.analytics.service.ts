/** Domain 17 — Inbox analytics bridge.
 * Calls analytics-python /inbox/insights to produce prioritisation cards
 * (overdue replies, urgent threads, mention backlog). Deterministic fallback.
 */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export type InboxInsightCard = { key: string; priority: 'low' | 'medium' | 'high'; title: string; action: string };

const Schema = z.object({
  data: z.object({
    cards: z.array(z.object({
      key: z.string(), priority: z.enum(['low', 'medium', 'high']),
      title: z.string(), action: z.string(),
    })),
    count: z.number(),
  }),
  meta: z.object({ source: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class InboxAnalyticsService {
  private readonly base = process.env.ANALYTICS_PY_URL ?? 'http://localhost:8002';
  constructor(private readonly ml: MlClient) {}

  async insights(input: {
    unreadTotal: number; mentionTotal: number; urgentThreads: number;
    avgResponseHours: number; oldestUnreadHours: number;
  }, requestId?: string): Promise<InboxInsightCard[]> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'inbox.insights',
        url: `${this.base}/inbox/insights`,
        body: input,
        schema: Schema,
        requestId,
      },
      () => {
        const cards: InboxInsightCard[] = [];
        if (input.urgentThreads > 0) cards.push({ key: 'urgent', priority: 'high', title: `${input.urgentThreads} urgent thread${input.urgentThreads > 1 ? 's' : ''} waiting`, action: 'Open queue' });
        if (input.mentionTotal > 0)  cards.push({ key: 'mentions', priority: 'high', title: `${input.mentionTotal} unread mention${input.mentionTotal > 1 ? 's' : ''}`, action: 'Open mentions' });
        if (input.oldestUnreadHours > 24) cards.push({ key: 'stale', priority: 'medium', title: `Oldest unread is ${Math.round(input.oldestUnreadHours)}h old`, action: 'Sweep inbox' });
        return { data: { cards, count: cards.length }, meta: { source: 'fallback', latency_ms: 0, fallback: true } };
      },
    );
    return (r as any).data.cards;
  }
}
