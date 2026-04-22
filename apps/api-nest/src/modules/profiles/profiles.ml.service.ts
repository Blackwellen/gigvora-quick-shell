/** Domain 11 — Profiles ML bridge. Hardened via shared MlClient (Group 2). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export interface ProfileDoc {
  id: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  industries?: string[];
  seniority?: number;
}
export interface SimilarProfile { id: string; score: number; reasons?: Record<string, number>; }
export interface MlEnvelope<T> { data: T; meta: { model: string; version: string; latency_ms: number; fallback?: boolean }; }

const SimSchema = z.object({
  data: z.array(z.object({ id: z.string(), score: z.number(), reasons: z.record(z.number()).optional() })),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class ProfilesMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';

  constructor(private readonly ml: MlClient) {}

  async similar(target: ProfileDoc, candidates: ProfileDoc[], limit = 20, requestId?: string): Promise<MlEnvelope<SimilarProfile[]>> {
    const result = await this.ml.withFallback(
      {
        endpoint: 'profiles.similar',
        url: `${this.base}/profiles/similar`,
        body: { target, candidates, limit },
        schema: SimSchema,
        requestId,
      },
      () => {
        const ts = new Set((target.skills ?? []).map((s) => s.toLowerCase()));
        return candidates
          .filter((c) => c.id !== target.id)
          .map((c) => {
            const cs = new Set((c.skills ?? []).map((s) => s.toLowerCase()));
            const inter = [...ts].filter((s) => cs.has(s)).length;
            const union = new Set([...ts, ...cs]).size || 1;
            return { id: c.id, score: inter / union };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      },
    );
    if (result.meta.fallback) {
      return { data: result.data as SimilarProfile[], meta: { model: 'fallback-skill-jaccard', version: '0', latency_ms: result.meta.latency_ms, fallback: true } };
    }
    return result.data as MlEnvelope<SimilarProfile[]>;
  }
}
