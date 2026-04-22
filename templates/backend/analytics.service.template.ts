/**
 * Reusable bridge template — copy to apps/api-nest/src/modules/<domain>/<domain>.analytics.service.ts
 *
 * Calls the Python analytics service for <domain> with timeout + retry + deterministic fallback.
 * The Python service owns time-bucketed aggregations against the production schema.
 *
 * Required env: ANALYTICS_PY_URL (default http://localhost:8002)
 * Required Python endpoint: GET {ANALYTICS_PY_URL}/<domain>/<metric>?window=7d&tz=Europe/London
 * Required envelope: { data, meta: { window, computed_at, tz } }
 */
import { Injectable, Logger } from '@nestjs/common';

export interface AnalyticsEnvelope<T> {
  data: T;
  meta: { window: string; computed_at: string; tz: string; fallback?: boolean };
}

@Injectable()
export class DomainAnalyticsService {
  private readonly log = new Logger('DomainAnalyticsService');
  private readonly base = process.env.ANALYTICS_PY_URL ?? 'http://localhost:8002';
  private readonly timeoutMs = 2000;
  private readonly retries = 1;

  async query<TOut>(metric: string, params: Record<string, string>, fallback: () => TOut): Promise<AnalyticsEnvelope<TOut>> {
    const qs = new URLSearchParams(params).toString();
    const url = `${this.base}/<domain>/${metric}?${qs}`;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) throw new Error(`analytics ${res.status}`);
        return (await res.json()) as AnalyticsEnvelope<TOut>;
      } catch (e) {
        this.log.warn(`analytics ${metric} attempt ${attempt} failed: ${(e as Error).message}`);
      }
    }
    return {
      data: fallback(),
      meta: { window: params.window ?? '7d', computed_at: new Date().toISOString(), tz: params.tz ?? 'UTC', fallback: true },
    };
  }
}
