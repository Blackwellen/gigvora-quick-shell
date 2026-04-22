/**
 * Reusable bridge template — copy to apps/api-nest/src/modules/<domain>/<domain>.ml.service.ts
 *
 * Calls the Python ML service for <domain> with timeout + retry + deterministic fallback.
 * The Python service MUST own the deterministic primary path; this bridge only mediates.
 *
 * Required env: ML_PY_URL (default http://localhost:8001)
 * Required Python endpoint: POST {ML_PY_URL}/<domain>/<operation>
 * Required envelope: { data, meta: { model, version, latency_ms } }
 */
import { Injectable, Logger } from '@nestjs/common';

export interface MlEnvelope<T> {
  data: T;
  meta: { model: string; version: string; latency_ms: number; fallback?: boolean };
}

@Injectable()
export class DomainMlService {
  private readonly log = new Logger('DomainMlService');
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  private readonly timeoutMs = 1500;
  private readonly retries = 1;

  async call<TIn, TOut>(operation: string, body: TIn, fallback: () => TOut): Promise<MlEnvelope<TOut>> {
    const url = `${this.base}/<domain>/${operation}`;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (!res.ok) throw new Error(`ml ${res.status}`);
        return (await res.json()) as MlEnvelope<TOut>;
      } catch (e) {
        this.log.warn(`ml ${operation} attempt ${attempt} failed: ${(e as Error).message}`);
      }
    }
    return {
      data: fallback(),
      meta: { model: 'fallback', version: '0', latency_ms: 0, fallback: true },
    };
  }
}
