/** Domain 10 — Network ML bridge. Hardened via shared MlClient (Group 2). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export interface PymkPerson {
  id: string;
  connections?: string[];
  employers?: string[];
  schools?: string[];
  groups?: string[];
  interests?: string[];
  city?: string | null;
}
export interface PymkRec {
  id: string;
  score: number;
  reasons: { mutual: number; employers: number; schools: number; groups: number; interests: number; geo: number };
}
export interface MlEnvelope<T> { data: T; meta: { model: string; version: string; latency_ms: number; fallback?: boolean }; }

const Schema = z.object({
  data: z.array(z.object({
    id: z.string(),
    score: z.number(),
    reasons: z.object({
      mutual: z.number(), employers: z.number(), schools: z.number(),
      groups: z.number(), interests: z.number(), geo: z.number(),
    }),
  })),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class NetworkMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async pymk(viewer: PymkPerson, candidates: PymkPerson[], limit = 20, requestId?: string): Promise<MlEnvelope<PymkRec[]>> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'network.pymk',
        url: `${this.base}/network/pymk`,
        body: { viewer, candidates, exclude_existing: true, limit },
        schema: Schema,
        requestId,
      },
      () => {
        const viewerConns = new Set(viewer.connections ?? []);
        return candidates
          .filter((c) => c.id !== viewer.id && !viewerConns.has(c.id))
          .map((c) => {
            const mutual = (c.connections ?? []).filter((x) => viewerConns.has(x)).length;
            return { id: c.id, score: mutual, reasons: { mutual, employers: 0, schools: 0, groups: 0, interests: 0, geo: 0 } };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      },
    );
    if (r.meta.fallback) return { data: r.data as PymkRec[], meta: { model: 'fallback-mutual-count', version: '0', latency_ms: r.meta.latency_ms, fallback: true } };
    return r.data as MlEnvelope<PymkRec[]>;
  }
}
