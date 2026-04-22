/**
 * FD-11 — Search routing contract.
 *
 * Single source of truth for "which backend serves this read":
 *
 *   - **Primary** = OpenSearch (typed mappings, completion suggester,
 *     facets, multi-index queries).
 *   - **Fallback** = Postgres FTS (authoritative mirror in `search_documents`).
 *
 * Routing decision is **explicit**, not "did we get rows back?":
 *   1. If circuit is open OR the OpenSearch URL is unset → Postgres.
 *   2. Otherwise issue the OpenSearch query with a hard timeout. On
 *      success record latency + close the circuit; on failure increment
 *      the breaker and fall through to Postgres.
 *
 * The breaker prevents cascading timeouts when OpenSearch is unhealthy:
 * after `MAX_FAILS` consecutive errors the circuit opens for `OPEN_MS`,
 * during which all reads go straight to Postgres.
 */
import { Injectable, Logger } from '@nestjs/common';

type Outcome = 'opensearch_ok' | 'opensearch_fail' | 'postgres' | 'forced_postgres';

@Injectable()
export class SearchRouter {
  private readonly log = new Logger('SearchRouter');
  private readonly url = process.env.OPENSEARCH_URL ?? '';
  private readonly auth =
    process.env.OPENSEARCH_USERNAME && process.env.OPENSEARCH_PASSWORD
      ? Buffer.from(`${process.env.OPENSEARCH_USERNAME}:${process.env.OPENSEARCH_PASSWORD}`).toString('base64')
      : null;

  // Circuit breaker
  private fails = 0;
  private openedAt = 0;
  private readonly MAX_FAILS = Number(process.env.OPENSEARCH_MAX_FAILS ?? 5);
  private readonly OPEN_MS = Number(process.env.OPENSEARCH_OPEN_MS ?? 30_000);

  // Lightweight rolling metrics (operator-facing only)
  private metrics: Record<Outcome, number> = {
    opensearch_ok: 0, opensearch_fail: 0, postgres: 0, forced_postgres: 0,
  };
  private latencyMsP50 = 0;

  /** Returns true when the next read should go to OpenSearch. */
  shouldUseOpenSearch(): boolean {
    if (!this.url) return false;
    if (this.openedAt && Date.now() - this.openedAt < this.OPEN_MS) return false;
    if (this.openedAt && Date.now() - this.openedAt >= this.OPEN_MS) {
      this.openedAt = 0; this.fails = 0; // half-open: try once
    }
    return true;
  }

  /** Issue an OpenSearch query against `<index>_read` aliases. */
  async query<T = any>(indices: string[], body: unknown, timeoutMs = 1500): Promise<T> {
    const target = indices.map((i) => `${i}_read`).join(',');
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.auth) headers.authorization = `Basic ${this.auth}`;
    const t0 = Date.now();
    try {
      const r = await fetch(`${this.url}/${target}/_search`, {
        method: 'POST', headers, body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!r.ok) throw new Error(`opensearch ${r.status}`);
      const j = (await r.json()) as T;
      this.recordSuccess(Date.now() - t0);
      return j;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  recordSuccess(ms: number) {
    this.metrics.opensearch_ok++;
    this.latencyMsP50 = Math.round((this.latencyMsP50 * 9 + ms) / 10);
    this.fails = 0;
  }
  recordFailure() {
    this.metrics.opensearch_fail++;
    this.fails++;
    if (this.fails >= this.MAX_FAILS) {
      this.openedAt = Date.now();
      this.log.warn(`OpenSearch circuit OPEN — ${this.fails} consecutive failures`);
    }
  }
  recordPostgres(forced = false) {
    this.metrics[forced ? 'forced_postgres' : 'postgres']++;
  }

  /** Operator-facing snapshot for /internal/search-metrics. */
  snapshot() {
    return {
      url: this.url ? `${new URL(this.url).host}` : null,
      circuit: this.openedAt ? 'open' : 'closed',
      openedAt: this.openedAt || null,
      consecutiveFails: this.fails,
      metrics: { ...this.metrics },
      latencyMsP50: this.latencyMsP50,
    };
  }
}
