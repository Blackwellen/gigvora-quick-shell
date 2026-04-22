/** Domain 16 — Review-moderation ML bridge.
 * Calls ml-python /trust/moderate to score the toxicity / spam / authenticity
 * of a pending review and returns an action recommendation. Deterministic
 * fallback keeps the moderation queue functional offline.
 */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export type ModerationVerdict = {
  action: 'approve' | 'hold' | 'reject';
  score: number;
  reasons: string[];
  confidence: number;
};

const Schema = z.object({
  data: z.object({
    action: z.enum(['approve', 'hold', 'reject']),
    score: z.number(),
    reasons: z.array(z.string()),
    confidence: z.number(),
  }),
  meta: z.object({ source: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class TrustMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async moderate(input: { id: string; title: string; body: string; rating: number; authorTrust?: number }, requestId?: string): Promise<ModerationVerdict> {
    const text = `${input.title}\n\n${input.body}`;
    const r = await this.ml.withFallback(
      {
        endpoint: 'trust.moderate',
        url: `${this.base}/trust/moderate`,
        body: { id: input.id, body: text, rating: input.rating, author_trust: input.authorTrust ?? 0.5 },
        schema: Schema,
        requestId,
      },
      () => {
        // Deterministic fallback: short or 1-star rants get held.
        const len = (input.body ?? '').length;
        if (len < 30 || input.rating <= 1) {
          return { data: { action: 'hold', score: 0.6, reasons: ['fallback:short_or_low_star'], confidence: 0.5 }, meta: { source: 'fallback', latency_ms: 0, fallback: true } };
        }
        return { data: { action: 'approve', score: 0.1, reasons: ['fallback:length_ok'], confidence: 0.4 }, meta: { source: 'fallback', latency_ms: 0, fallback: true } };
      },
    );
    return (r as any).data;
  }
}
