/**
 * Domain 20 — Media viewer ML bridge.
 * FD-12: canonical MlClient.withFallback + Zod envelope across all 3 endpoints.
 */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

const QualitySchema = z.object({
  data: z.object({ assetId: z.string(), score: z.number(), factors: z.record(z.string(), z.number()).optional() }),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});
const RankSchema = z.object({
  data: z.object({ items: z.array(z.object({ id: z.string(), rank: z.number(), score: z.number() })) }),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});
const ModSchema = z.object({
  data: z.object({ assetId: z.string(), verdict: z.enum(['clean', 'review', 'block']), confidence: z.number() }),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class MediaViewerMlService {
  private readonly base = process.env.ML_PY_URL ?? process.env.ML_PYTHON_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async scoreQuality(input: { assetId: string; kind: string; sizeBytes: number; width?: number; height?: number; durationSec?: number; bitrateKbps?: number }) {
    const r = await this.ml.withFallback(
      { endpoint: 'media.score-quality', url: `${this.base}/media/score-quality`, body: input, schema: QualitySchema },
      () => {
        const resPx = (input.width ?? 0) * (input.height ?? 0);
        const resScore = Math.min(50, Math.log2(Math.max(2, resPx)) * 2.4);
        const sizeMb = input.sizeBytes / 1_000_000;
        const sizePenalty = sizeMb > 50 ? Math.min(20, (sizeMb - 50) / 4) : 0;
        const bitrateScore = input.bitrateKbps ? Math.min(30, input.bitrateKbps / 200) : 18;
        const score = Math.max(0, Math.min(100, Math.round(resScore + bitrateScore + 30 - sizePenalty)));
        return { assetId: input.assetId, score, source: 'fallback', factors: { resScore, bitrateScore, sizePenalty } };
      },
    );
    return r.meta.fallback ? { ...(r.data as any), source: 'fallback', fallback: true } : { ...((r.data as any).data), source: 'ml', fallback: false };
  }

  async rankGallery(input: { items: { id: string; kind: string; views: number; likes: number; downloads: number }[] }) {
    const r = await this.ml.withFallback(
      { endpoint: 'media.rank-gallery', url: `${this.base}/media/rank-gallery`, body: input, schema: RankSchema },
      () => {
        const ranked = [...input.items]
          .map((i) => ({ ...i, _score: i.views * 0.4 + i.likes * 1.6 + i.downloads * 1.1 + (i.kind === 'video' ? 6 : 0) }))
          .sort((a, b) => b._score - a._score)
          .map((i, idx) => ({ id: i.id, rank: idx + 1, score: Math.round(i._score) }));
        return { items: ranked };
      },
    );
    return r.meta.fallback ? { ...(r.data as any), source: 'fallback', fallback: true } : { ...((r.data as any).data), source: 'ml', fallback: false };
  }

  async moderationHint(input: { assetId: string; mimeType: string; tags?: string[]; filename?: string }) {
    const r = await this.ml.withFallback(
      { endpoint: 'media.moderation-hint', url: `${this.base}/media/moderation-hint`, body: input, schema: ModSchema },
      () => {
        const flagged = (input.tags ?? []).some((t) => /nsfw|adult|violence|weapon/i.test(t)) || /(nsfw|adult|leak|password)/i.test(input.filename ?? '');
        return { assetId: input.assetId, verdict: flagged ? 'review' as const : 'clean' as const, confidence: flagged ? 0.74 : 0.92 };
      },
    );
    return r.meta.fallback ? { ...(r.data as any), source: 'fallback', fallback: true } : { ...((r.data as any).data), source: 'ml', fallback: false };
  }
}
