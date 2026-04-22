/**
 * FD-12 — Shared moderation client used in the write path.
 *
 * Lives in the global ML bridge module so feed/comment/inbox/profile/group
 * services can hard-block or hold content before it ever reaches the DB.
 *
 * Behaviour:
 *   • Calls /moderation/text on apps/ml-python via MlClient (timeout 800 ms,
 *     1 retry, circuit-broken, Zod-validated).
 *   • Falls back to the local deterministic backstop when the service is down.
 *   • Honours a kill-switch env (`MODERATION_ENFORCE=0`) so ops can disable
 *     hard-block without redeploying — verdicts are still logged.
 *   • Always returns a stable verdict so callers never crash.
 */
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from './ml-client';

export type ModerationAction = 'approve' | 'hold' | 'reject';
export interface ModerationVerdictV2 {
  action: ModerationAction;
  score: number;
  reasons: string[];
  model: string;
  version: string;
  fallback: boolean;
  enforced: boolean;
  surface: string;
  id: string;
}

const Schema = z.object({
  data: z.object({
    id: z.string(),
    surface: z.string(),
    action: z.enum(['approve', 'hold', 'reject']),
    score: z.number(),
    reasons: z.array(z.string()),
    model: z.string(),
    version: z.string(),
  }),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number() }),
});

const TOXIC = new Set(['scam', 'fraud', 'phishing', 'garbage', 'trash', 'incompetent', 'thief', 'bitly', 'buy now', 'click here', 'limited offer', 'dm me']);
const URL_RE = /https?:\/\/\S+/g;

@Injectable()
export class ModerationClient {
  private readonly log = new Logger('ModerationClient');
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  private readonly enforce = process.env.MODERATION_ENFORCE !== '0';

  constructor(private readonly ml: MlClient) {}

  isEnforcing(): boolean { return this.enforce; }

  async classify(input: { id: string; text: string; surface: string }, requestId?: string): Promise<ModerationVerdictV2> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'moderation.text',
        url: `${this.base}/moderation/text`,
        body: { id: input.id, text: input.text ?? '', surface: input.surface ?? 'generic' },
        schema: Schema,
        timeoutMs: 800,
        requestId,
      },
      () => {
        const text = (input.text ?? '').toLowerCase();
        const toxicHits = [...TOXIC].filter((w) => text.includes(w)).length;
        const urls = (input.text ?? '').match(URL_RE)?.length ?? 0;
        const score = Math.min(1, 0.30 * Math.min(1, toxicHits / 2) + 0.20 * Math.min(1, urls / 2));
        const action: ModerationAction = score >= 0.65 ? 'reject' : score >= 0.30 ? 'hold' : 'approve';
        return {
          data: {
            id: input.id, surface: input.surface, action, score: Number(score.toFixed(3)),
            reasons: toxicHits || urls ? [`toxic_terms:${toxicHits}`, `urls:${urls}`] : ['clean'],
            model: 'moderation-deterministic', version: '1.0',
          },
          meta: { model: 'moderation-deterministic', version: '1.0', latency_ms: 0 },
        };
      },
    );
    const d = (r.data as any).data ?? r.data;
    return {
      id: d.id, surface: d.surface, action: d.action, score: d.score, reasons: d.reasons,
      model: d.model, version: d.version,
      fallback: r.meta.fallback,
      enforced: this.enforce,
    };
  }

  /**
   * Convenience wrapper used in write paths. Throws when enforce=true and the
   * verdict is `reject`. Returns the verdict in all other cases so the caller
   * can attach `held_for_review=true` to the row, queue moderation events, etc.
   */
  async guard(input: { id: string; text: string; surface: string }, requestId?: string): Promise<ModerationVerdictV2> {
    const verdict = await this.classify(input, requestId);
    if (verdict.action === 'reject' && this.enforce) {
      this.log.warn(`moderation.reject surface=${verdict.surface} id=${verdict.id} score=${verdict.score} model=${verdict.model}`);
      const err = new Error('content rejected by moderation') as Error & { status?: number; verdict?: ModerationVerdictV2 };
      err.status = 422;
      err.verdict = verdict;
      throw err;
    }
    return verdict;
  }
}
