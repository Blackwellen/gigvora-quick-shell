/** Domain 15 — Events analytics bridge. Hardened via shared MlClient (Group 2). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export interface AnalyticsEnvelope<T> { data: T; meta: { source: string; latency_ms: number; fallback?: boolean }; }
export interface EventsSummary {
  rsvps: number;
  attendees: number;
  attendance_rate_pct: number;
  avg_session_minutes: number;
  engagement_score: number;
}

const Schema = z.object({
  data: z.object({
    rsvps: z.number(),
    attendees: z.number(),
    attendance_rate_pct: z.number(),
    avg_session_minutes: z.number(),
    engagement_score: z.number(),
  }),
  meta: z.object({ source: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

const ZERO: EventsSummary = {
  rsvps: 0, attendees: 0, attendance_rate_pct: 0,
  avg_session_minutes: 0, engagement_score: 0,
};

@Injectable()
export class EventsAnalyticsService {
  private readonly base = process.env.ANALYTICS_PY_URL ?? 'http://localhost:8002';
  constructor(private readonly ml: MlClient) {}

  async summary(eventId: string, requestId?: string): Promise<AnalyticsEnvelope<EventsSummary>> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'events.summary',
        url: `${this.base}/events/summary?event_id=${encodeURIComponent(eventId)}`,
        body: {},
        schema: Schema,
        requestId,
      },
      () => ({ data: ZERO, meta: { source: 'fallback-zero', latency_ms: 0, fallback: true } }),
    );
    if (r.meta.fallback) {
      return { data: ZERO, meta: { source: 'fallback-zero', latency_ms: r.meta.latency_ms, fallback: true } };
    }
    return r.data as AnalyticsEnvelope<EventsSummary>;
  }
}
