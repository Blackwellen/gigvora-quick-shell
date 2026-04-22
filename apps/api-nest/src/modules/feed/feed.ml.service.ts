/** Domain 9 — Feed ML bridge. Hardened via shared MlClient (Group 2). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export interface FeedItem {
  id: string;
  author_id: string;
  created_hours_ago?: number;
  kind?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  tags?: string[];
}
export interface Viewer {
  id: string;
  follows?: string[];
  interests?: string[];
  muted_authors?: string[];
}
export interface RankedFeed { id: string; author_id: string; score: number; }
export interface MlEnvelope<T> { data: T; meta: { model: string; version: string; latency_ms: number; fallback?: boolean }; }

const Schema = z.object({
  data: z.array(z.object({ id: z.string(), author_id: z.string(), score: z.number() })),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class FeedMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async rank(viewer: Viewer, items: FeedItem[], limit = 30, requestId?: string): Promise<MlEnvelope<RankedFeed[]>> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'feed.rank',
        url: `${this.base}/feed/rank`,
        body: { viewer, items, diversify_by: 'author_id', limit },
        schema: Schema,
        requestId,
      },
      () =>
        [...items]
          .sort((a, b) => (a.created_hours_ago ?? 0) - (b.created_hours_ago ?? 0))
          .slice(0, limit)
          .map((i) => ({ id: i.id, author_id: i.author_id, score: 0 })),
    );
    if (r.meta.fallback) return { data: r.data as RankedFeed[], meta: { model: 'fallback-chronological', version: '0', latency_ms: r.meta.latency_ms, fallback: true } };
    return r.data as MlEnvelope<RankedFeed[]>;
  }
}
