/** Domain 16 — Trust analytics bridge.
 * Hardened via shared MlClient (Group 2): zod-validated envelope + deterministic
 * fallback so the TrustPage scorecard never blanks if the Python service is
 * cold or unreachable.
 */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export interface TrustScore {
  overall: number;
  band: 'platinum' | 'gold' | 'silver' | 'bronze' | 'new';
  dimensions: { key: string; label: string; score: number; trend: 'up' | 'down' | 'neutral' }[];
}

const Schema = z.object({
  data: z.object({
    overall: z.number(),
    band: z.enum(['platinum', 'gold', 'silver', 'bronze', 'new']),
    dimensions: z.array(z.object({
      key: z.string(), label: z.string(), score: z.number(),
      trend: z.enum(['up', 'down', 'neutral']),
    })),
  }),
  meta: z.object({ source: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

const FALLBACK: TrustScore = {
  overall: 78, band: 'silver',
  dimensions: [
    { key: 'delivery',       label: 'Delivery Reliability', score: 80, trend: 'neutral' },
    { key: 'communication',  label: 'Communication',         score: 78, trend: 'neutral' },
    { key: 'quality',        label: 'Quality of Work',       score: 82, trend: 'neutral' },
    { key: 'professionalism',label: 'Professionalism',       score: 76, trend: 'neutral' },
    { key: 'timeliness',     label: 'Timeliness',            score: 74, trend: 'neutral' },
  ],
};

@Injectable()
export class TrustAnalyticsService {
  private readonly base = process.env.ANALYTICS_PY_URL ?? 'http://localhost:8002';
  constructor(private readonly ml: MlClient) {}

  async score(input: {
    subjectKind: string; subjectId: string;
    reviewCount: number; avgRating: number; verifications: number; badges: number;
  }, requestId?: string): Promise<TrustScore> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'trust.score',
        url: `${this.base}/trust/score`,
        body: input,
        schema: Schema,
        requestId,
      },
      () => ({ data: FALLBACK, meta: { source: 'fallback-static', latency_ms: 0, fallback: true } }),
    );
    return (r as any).data ?? FALLBACK;
  }
}
