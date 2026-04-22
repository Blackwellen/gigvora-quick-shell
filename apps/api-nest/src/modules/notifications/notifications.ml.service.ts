/** Domain 7 — Notifications ML bridge. Hardened via shared MlClient (Group 2). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export interface Recipient { id: string; follows?: string[]; important_authors?: string[]; }
export interface NotificationDoc {
  id: string;
  type?: string;
  sender_id?: string | null;
  created_hours_ago?: number;
  is_mention?: boolean;
  is_unread?: boolean;
  thread_size?: number;
}
export interface PrioritizedNotif { id: string; score: number; bucket: 'high' | 'normal' | 'low'; }
export interface MlEnvelope<T> { data: T; meta: { model: string; version: string; latency_ms: number; fallback?: boolean }; }

const Schema = z.object({
  data: z.array(z.object({
    id: z.string(),
    score: z.number(),
    bucket: z.enum(['high', 'normal', 'low']),
  })),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class NotificationsMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async prioritise(recipient: Recipient, notifications: NotificationDoc[], limit = 100, requestId?: string): Promise<MlEnvelope<PrioritizedNotif[]>> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'notifications.priority',
        url: `${this.base}/notifications/priority`,
        body: { recipient, notifications, limit },
        schema: Schema,
        requestId,
      },
      () =>
        [...notifications]
          .sort((a, b) => (a.created_hours_ago ?? 0) - (b.created_hours_ago ?? 0))
          .slice(0, limit)
          .map((n) => ({ id: n.id, score: 0, bucket: (n.is_mention ? 'high' : 'normal') as 'high' | 'normal' | 'low' })),
    );
    if (r.meta.fallback) return { data: r.data as PrioritizedNotif[], meta: { model: 'fallback-recency', version: '0', latency_ms: r.meta.latency_ms, fallback: true } };
    return r.data as MlEnvelope<PrioritizedNotif[]>;
  }
}
