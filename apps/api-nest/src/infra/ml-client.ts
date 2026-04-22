/**
 * Group 2 — Shared ML/Analytics HTTP client.
 *
 * Every domain bridge (`<domain>.ml.service.ts`, `<domain>.analytics.service.ts`)
 * delegates to `MlClient.call()` so we have **one** code path for:
 *   • per-endpoint timeout (default 1500 ms)
 *   • jittered exponential retry (max 1 retry → bounded p99)
 *   • per-endpoint circuit breaker (5 failures in 30 s → open for 15 s)
 *   • Zod boundary validation on the response envelope
 *   • metrics recording (MlMetricsService)
 *   • request-id propagation for cross-service tracing
 *   • deterministic fallback hand-off when the call fails
 *
 * Bridges become 5-line wrappers — the entire enterprise posture is owned
 * here so we can change the timeout, retry policy, or circuit thresholds in
 * one place rather than ten.
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { z, ZodTypeAny } from 'zod';
import { MlMetricsService } from './ml-metrics.service';

interface CircuitState {
  failures: number;
  windowStart: number;
  openedAt: number | null;
}

export interface CallOptions<TSchema extends ZodTypeAny> {
  endpoint: string; // metric label, e.g. "search.rank"
  url: string;
  body: unknown;
  schema: TSchema; // zod schema for the response envelope
  timeoutMs?: number; // default 1500
  retries?: number; // default 1
  requestId?: string; // propagated as x-request-id
}

export interface CallResult<T> {
  ok: boolean;
  data?: T;
  fallback?: true;
  error?: string;
  outcome: 'ok' | 'fallback' | 'timeout' | 'http_error' | 'circuit_open' | 'error';
  latencyMs: number;
}

const FAILURE_THRESHOLD = 5;
const FAILURE_WINDOW_MS = 30_000;
const OPEN_FOR_MS = 15_000;
const MAX_BODY_BYTES = 50_000; // mirrors the Python service cap

@Injectable()
export class MlClient {
  private readonly log = new Logger('MlClient');
  private readonly circuits = new Map<string, CircuitState>();

  constructor(private readonly metrics: MlMetricsService) {}

  async call<TSchema extends ZodTypeAny>(
    opts: CallOptions<TSchema>,
  ): Promise<CallResult<z.infer<TSchema>>> {
    const start = Date.now();
    const timeoutMs = opts.timeoutMs ?? 1500;
    const retries = opts.retries ?? 1;
    const requestId = opts.requestId ?? randomUUID();

    if (this.isOpen(opts.endpoint)) {
      const latencyMs = Date.now() - start;
      this.metrics.record(opts.endpoint, 'circuit_open', latencyMs);
      return { ok: false, outcome: 'circuit_open', latencyMs };
    }

    const serialized = JSON.stringify(opts.body);
    if (serialized.length > MAX_BODY_BYTES) {
      const latencyMs = Date.now() - start;
      this.metrics.record(opts.endpoint, 'error', latencyMs);
      return {
        ok: false,
        outcome: 'error',
        latencyMs,
        error: `payload exceeds ${MAX_BODY_BYTES}B cap`,
      };
    }

    let lastError: string | undefined;
    let lastOutcome: CallResult<unknown>['outcome'] = 'error';

    for (let attempt = 0; attempt <= retries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(opts.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-request-id': requestId,
          },
          body: serialized,
          signal: ctrl.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          lastError = `http ${res.status}`;
          lastOutcome = 'http_error';
          this.recordFailure(opts.endpoint);
          if (attempt < retries) {
            await this.jitterDelay(attempt);
            continue;
          }
          break;
        }

        const json = await res.json();
        const parsed = opts.schema.safeParse(json);
        if (!parsed.success) {
          lastError = `schema: ${parsed.error.issues[0]?.message ?? 'invalid envelope'}`;
          lastOutcome = 'error';
          this.recordFailure(opts.endpoint);
          break; // don't retry schema errors — they will fail the same way
        }

        this.recordSuccess(opts.endpoint);
        const latencyMs = Date.now() - start;
        this.metrics.record(opts.endpoint, 'ok', latencyMs);
        return { ok: true, outcome: 'ok', latencyMs, data: parsed.data };
      } catch (err) {
        clearTimeout(timer);
        const e = err as Error;
        const aborted = e.name === 'AbortError';
        lastError = aborted ? 'timeout' : e.message;
        lastOutcome = aborted ? 'timeout' : 'error';
        this.recordFailure(opts.endpoint);
        this.log.warn(
          `${opts.endpoint} attempt ${attempt} failed (${lastError}) [rid=${requestId}]`,
        );
        if (attempt < retries) {
          await this.jitterDelay(attempt);
          continue;
        }
      }
    }

    const latencyMs = Date.now() - start;
    this.metrics.record(opts.endpoint, lastOutcome, latencyMs);
    return { ok: false, outcome: lastOutcome, latencyMs, error: lastError };
  }

  /** Bridge convention: wrap the result. If the call failed, run the fallback. */
  async withFallback<T, TSchema extends ZodTypeAny>(
    opts: CallOptions<TSchema>,
    fallback: () => T,
  ): Promise<{ data: T; meta: { source: string; latency_ms: number; fallback: boolean } }> {
    const r = await this.call(opts);
    if (r.ok && r.data) {
      return {
        data: r.data as T,
        meta: { source: opts.endpoint, latency_ms: r.latencyMs, fallback: false },
      };
    }
    const data = fallback();
    this.metrics.record(opts.endpoint, 'fallback', r.latencyMs);
    return {
      data,
      meta: { source: `${opts.endpoint}:fallback`, latency_ms: r.latencyMs, fallback: true },
    };
  }

  // ------------------------ circuit breaker ------------------------

  private getCircuit(endpoint: string): CircuitState {
    let c = this.circuits.get(endpoint);
    if (!c) {
      c = { failures: 0, windowStart: Date.now(), openedAt: null };
      this.circuits.set(endpoint, c);
      this.metrics.setCircuitState(endpoint, 'closed');
    }
    return c;
  }

  private isOpen(endpoint: string): boolean {
    const c = this.getCircuit(endpoint);
    if (c.openedAt === null) return false;
    if (Date.now() - c.openedAt >= OPEN_FOR_MS) {
      // half-open: allow one probe
      c.openedAt = null;
      c.failures = 0;
      c.windowStart = Date.now();
      this.metrics.setCircuitState(endpoint, 'half_open');
      return false;
    }
    return true;
  }

  private recordFailure(endpoint: string): void {
    const c = this.getCircuit(endpoint);
    if (Date.now() - c.windowStart > FAILURE_WINDOW_MS) {
      c.windowStart = Date.now();
      c.failures = 0;
    }
    c.failures += 1;
    if (c.failures >= FAILURE_THRESHOLD && c.openedAt === null) {
      c.openedAt = Date.now();
      this.metrics.setCircuitState(endpoint, 'open');
      this.log.error(`circuit OPEN for ${endpoint} after ${c.failures} failures`);
    }
  }

  private recordSuccess(endpoint: string): void {
    const c = this.getCircuit(endpoint);
    c.failures = 0;
    c.openedAt = null;
    this.metrics.setCircuitState(endpoint, 'closed');
  }

  private async jitterDelay(attempt: number): Promise<void> {
    // 50ms × 2^attempt with ±25% jitter, capped at 250ms.
    const base = Math.min(250, 50 * Math.pow(2, attempt));
    const jitter = base * 0.25 * (Math.random() * 2 - 1);
    await new Promise((r) => setTimeout(r, base + jitter));
  }

  // -------- test helpers (not exposed in production wiring) --------
  __resetCircuits(): void {
    this.circuits.clear();
  }
}
