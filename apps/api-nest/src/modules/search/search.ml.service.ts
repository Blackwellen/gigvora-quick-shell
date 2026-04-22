/**
 * Domain 5 — Search ML bridge.
 * Refactored to delegate to the shared MlClient (Group 2 hardening): single
 * code path for timeout, jittered retry, circuit breaker, Zod boundary,
 * metrics, and request-id propagation. Fallback remains recency-only ordering.
 */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export interface RankDoc {
  id: string;
  title?: string;
  body?: string;
  tags?: string[];
  kind?: 'post' | 'profile' | 'company' | 'gig' | 'service' | 'event' | 'group';
  recency_days?: number;
  boost?: number;
}
export interface RankedHit { id: string; kind: string; score: number; }
export interface MlEnvelope<T> {
  data: T;
  meta: { model: string; version: string; latency_ms: number; fallback?: boolean };
}

const RankSchema = z.object({
  data: z.array(z.object({ id: z.string(), kind: z.string(), score: z.number() })),
  meta: z.object({
    model: z.string(),
    version: z.string(),
    latency_ms: z.number(),
    fallback: z.boolean().optional(),
  }),
});

@Injectable()
export class SearchMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';

  constructor(private readonly ml: MlClient) {}

  async rank(
    query: string,
    docs: RankDoc[],
    intent?: string,
    limit = 50,
    requestId?: string,
  ): Promise<MlEnvelope<RankedHit[]>> {
    const result = await this.ml.withFallback(
      {
        endpoint: 'search.rank',
        url: `${this.base}/search/rank`,
        body: { query, docs, intent, limit },
        schema: RankSchema,
        requestId,
      },
      () =>
        [...docs]
          .sort((a, b) => (a.recency_days ?? 365) - (b.recency_days ?? 365))
          .slice(0, limit)
          .map((d) => ({ id: d.id, kind: d.kind ?? 'post', score: 0 })),
    );

    if (result.meta.fallback) {
      return {
        data: result.data as RankedHit[],
        meta: { model: 'fallback-recency', version: '0', latency_ms: result.meta.latency_ms, fallback: true },
      };
    }
    return result.data as MlEnvelope<RankedHit[]>;
  }
}
