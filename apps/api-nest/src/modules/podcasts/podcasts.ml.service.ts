/**
 * Podcasts ML bridge.
 * FD-12: canonical MlClient.withFallback + Zod envelope across the 3 endpoints.
 */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

const RankedSchema = z.object({
  data: z.object({ ranked: z.array(z.object({ id: z.string(), score: z.number() })), reason: z.string().optional() }),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});
const ScoreSchema = z.object({
  data: z.object({ score: z.number(), band: z.enum(['low', 'medium', 'high']), reason: z.string().optional() }),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class PodcastsMlService {
  private readonly base = process.env.ML_PY_URL ?? process.env.ML_PYTHON_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async rankDiscovery(input: { shows: Array<{ id: string; subscribers: number; rating: number; updatedAt: string; tags: string[] }>; userTags?: string[] }) {
    const r = await this.ml.withFallback(
      { endpoint: 'podcasts.rank-discovery', url: `${this.base}/podcasts/rank-discovery`, body: input, schema: RankedSchema },
      () => {
        const userTags = new Set((input.userTags ?? []).map((t) => t.toLowerCase()));
        const ranked = [...input.shows]
          .map((s) => {
            const tagOverlap = s.tags.filter((t) => userTags.has(t.toLowerCase())).length;
            const score = Math.log10(1 + s.subscribers) * 30 + s.rating * 8 + tagOverlap * 10;
            return { id: s.id, score: Math.round(score) };
          })
          .sort((a, b) => b.score - a.score);
        return { ranked, reason: 'fallback:subscribers+rating+tags' };
      },
    );
    return r.meta.fallback ? { ...(r.data as any), source: 'fallback', fallback: true } : { ...((r.data as any).data), source: 'ml', fallback: false };
  }

  async recommendNext(input: { episodes: Array<{ id: string; showId: string; plays: number; publishedAt?: string; access: string }>; recentShowIds?: string[] }) {
    const r = await this.ml.withFallback(
      { endpoint: 'podcasts.recommend-next', url: `${this.base}/podcasts/recommend-next`, body: input, schema: RankedSchema },
      () => {
        const ranked = [...input.episodes]
          .sort((a, b) => (b.plays - a.plays) + (a.publishedAt && b.publishedAt ? b.publishedAt.localeCompare(a.publishedAt) : 0))
          .map((e) => ({ id: e.id, score: Math.round(Math.log10(1 + e.plays) * 25) }));
        return { ranked, reason: 'fallback:recency-plays' };
      },
    );
    return r.meta.fallback ? { ...(r.data as any), source: 'fallback', fallback: true } : { ...((r.data as any).data), source: 'ml', fallback: false };
  }

  async scoreRecording(input: { durationSec: number; sizeBytes?: number; tags?: string[] }) {
    const r = await this.ml.withFallback(
      { endpoint: 'podcasts.score-recording', url: `${this.base}/podcasts/score-recording`, body: input, schema: ScoreSchema },
      () => {
        const dur = Math.min(1, input.durationSec / 1800);
        const score = Math.round(40 + dur * 50 + Math.min(10, (input.tags?.length ?? 0) * 2));
        return { score, band: (score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low') as 'low' | 'medium' | 'high', reason: 'fallback' };
      },
    );
    return r.meta.fallback ? { ...(r.data as any), source: 'fallback', fallback: true } : { ...((r.data as any).data), source: 'ml', fallback: false };
  }
}
