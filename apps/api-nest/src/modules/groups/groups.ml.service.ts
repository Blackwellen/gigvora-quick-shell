/** Domain 14 — Groups moderation ML bridge. Hardened via shared MlClient (Group 2). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export interface GroupPostDoc {
  id: string;
  body?: string;
  author_id?: string | null;
  author_trust?: number;
  reports?: number;
  age_minutes?: number;
}
export interface ModerationDecision {
  id: string;
  score: number;
  action: 'remove' | 'review' | 'watch' | 'allow';
  signals?: Record<string, number>;
}
export interface MlEnvelope<T> { data: T; meta: { model: string; version: string; latency_ms: number; fallback?: boolean }; }

const Schema = z.object({
  data: z.array(z.object({
    id: z.string(),
    score: z.number(),
    action: z.enum(['remove', 'review', 'watch', 'allow']),
    signals: z.record(z.number()).optional(),
  })),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

const TOXIC = ['spam', 'scam', 'phishing', 'hate', 'abuse'];

@Injectable()
export class GroupsMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async moderate(posts: GroupPostDoc[], limit = 100, requestId?: string): Promise<MlEnvelope<ModerationDecision[]>> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'groups.moderate',
        url: `${this.base}/groups/moderate`,
        body: { posts, limit },
        schema: Schema,
        requestId,
      },
      () =>
        posts
          .map((p): ModerationDecision => {
            const lower = (p.body ?? '').toLowerCase();
            const toxic = TOXIC.filter((w) => lower.includes(w)).length;
            const reports = p.reports ?? 0;
            const score = Math.min(1, toxic * 0.4 + reports * 0.15);
            const action: ModerationDecision['action'] =
              score >= 0.7 ? 'remove' : score >= 0.45 || reports >= 3 ? 'review' : score >= 0.2 ? 'watch' : 'allow';
            return { id: p.id, score, action };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, limit),
    );
    if (r.meta.fallback) return { data: r.data as ModerationDecision[], meta: { model: 'fallback-keyword', version: '0', latency_ms: r.meta.latency_ms, fallback: true } };
    return r.data as MlEnvelope<ModerationDecision[]>;
  }
}
