/**
 * Group 2 — Shared ML metrics service.
 *
 * Lives in the global `MlBridgeModule`. Bridges call `record()` after every
 * outbound ML/analytics call and the `/internal/ml-metrics` endpoint scrapes
 * the snapshot in Prometheus text-exposition format.
 *
 * No external dependency: keeps the api-nest image lean. The Python
 * services remain the source of truth for service-side metrics; this is
 * the bridge-side counterpart so we can SLO the network hop independently.
 */
import { Injectable } from '@nestjs/common';

export type Outcome = 'ok' | 'fallback' | 'timeout' | 'http_error' | 'circuit_open' | 'error';

interface Bucket {
  count: number;
  sum: number;
  buckets: Map<number, number>;
}

const LATENCY_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10_000];

@Injectable()
export class MlMetricsService {
  private readonly counters = new Map<string, number>(); // key = `${endpoint}|${outcome}`
  private readonly latency = new Map<string, Bucket>(); // key = `${endpoint}`
  private readonly fallbacks = new Map<string, number>(); // key = endpoint
  private readonly circuitState = new Map<string, 'closed' | 'open' | 'half_open'>();

  record(endpoint: string, outcome: Outcome, latencyMs: number): void {
    const ckey = `${endpoint}|${outcome}`;
    this.counters.set(ckey, (this.counters.get(ckey) ?? 0) + 1);

    let b = this.latency.get(endpoint);
    if (!b) {
      b = { count: 0, sum: 0, buckets: new Map(LATENCY_BUCKETS_MS.map((x) => [x, 0])) };
      this.latency.set(endpoint, b);
    }
    b.count += 1;
    b.sum += latencyMs;
    for (const limit of LATENCY_BUCKETS_MS) {
      if (latencyMs <= limit) b.buckets.set(limit, (b.buckets.get(limit) ?? 0) + 1);
    }

    if (outcome === 'fallback') {
      this.fallbacks.set(endpoint, (this.fallbacks.get(endpoint) ?? 0) + 1);
    }
  }

  setCircuitState(endpoint: string, state: 'closed' | 'open' | 'half_open'): void {
    this.circuitState.set(endpoint, state);
  }

  /** Prometheus text exposition format. */
  scrape(): string {
    const lines: string[] = [];
    lines.push('# HELP ml_bridge_requests_total Bridge requests by endpoint and outcome.');
    lines.push('# TYPE ml_bridge_requests_total counter');
    for (const [k, v] of this.counters.entries()) {
      const [endpoint, outcome] = k.split('|');
      lines.push(`ml_bridge_requests_total{endpoint="${endpoint}",outcome="${outcome}"} ${v}`);
    }

    lines.push('# HELP ml_bridge_fallbacks_total Bridge fallback selections.');
    lines.push('# TYPE ml_bridge_fallbacks_total counter');
    for (const [k, v] of this.fallbacks.entries()) {
      lines.push(`ml_bridge_fallbacks_total{endpoint="${k}"} ${v}`);
    }

    lines.push('# HELP ml_bridge_latency_ms Bridge latency histogram (ms).');
    lines.push('# TYPE ml_bridge_latency_ms histogram');
    for (const [endpoint, bucket] of this.latency.entries()) {
      let cumulative = 0;
      for (const limit of LATENCY_BUCKETS_MS) {
        cumulative = (bucket.buckets.get(limit) ?? 0); // already cumulative because we add to all >= bucket
        lines.push(`ml_bridge_latency_ms_bucket{endpoint="${endpoint}",le="${limit}"} ${cumulative}`);
      }
      lines.push(`ml_bridge_latency_ms_bucket{endpoint="${endpoint}",le="+Inf"} ${bucket.count}`);
      lines.push(`ml_bridge_latency_ms_sum{endpoint="${endpoint}"} ${bucket.sum}`);
      lines.push(`ml_bridge_latency_ms_count{endpoint="${endpoint}"} ${bucket.count}`);
    }

    lines.push('# HELP ml_bridge_circuit_state 0=closed 1=half_open 2=open');
    lines.push('# TYPE ml_bridge_circuit_state gauge');
    const stateNum = (s: string) => (s === 'closed' ? 0 : s === 'half_open' ? 1 : 2);
    for (const [endpoint, state] of this.circuitState.entries()) {
      lines.push(`ml_bridge_circuit_state{endpoint="${endpoint}"} ${stateNum(state)}`);
    }
    return lines.join('\n') + '\n';
  }

  /** Test/maintenance helper. */
  reset(): void {
    this.counters.clear();
    this.latency.clear();
    this.fallbacks.clear();
    this.circuitState.clear();
  }

  /** Read-only accessors for unit tests. */
  count(endpoint: string, outcome: Outcome): number {
    return this.counters.get(`${endpoint}|${outcome}`) ?? 0;
  }
  fallbackCount(endpoint: string): number {
    return this.fallbacks.get(endpoint) ?? 0;
  }
}
