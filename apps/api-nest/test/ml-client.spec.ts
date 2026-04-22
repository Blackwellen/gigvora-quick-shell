/**
 * Group 2 — Enterprise QA matrix for the shared MlClient.
 *
 * Covers every code path used by the 10 bridge services:
 *   • happy   — 2xx + valid Zod envelope → counters bump, fallback NOT used
 *   • timeout — AbortError after timeoutMs → 1 retry, fallback used
 *   • non-2xx — http_error → 1 retry, fallback used
 *   • bad-shape — Zod parse fails → no retry, fallback used
 *   • payload cap — body > 50 KB → rejected without network call
 *   • circuit breaker — 5 consecutive failures → opens; subsequent call
 *     short-circuits with circuit_open outcome
 *   • metrics — request-id propagated, latency histogram populated,
 *     fallback counter increments only on fallback
 *
 * Does NOT spin up Nest — exercises the class directly with the global
 * fetch mocked. Fast, deterministic, isolates the abstraction.
 */
import { MlClient } from '../src/infra/ml-client';
import { MlMetricsService } from '../src/infra/ml-metrics.service';
import { z } from 'zod';

const Schema = z.object({
  data: z.array(z.object({ id: z.string(), score: z.number() })),
  meta: z.object({
    model: z.string(),
    version: z.string(),
    latency_ms: z.number(),
    fallback: z.boolean().optional(),
  }),
});

const okBody = {
  data: [{ id: 'x', score: 0.9 }],
  meta: { model: 'm', version: '1', latency_ms: 5 },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('MlClient', () => {
  let metrics: MlMetricsService;
  let client: MlClient;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    metrics = new MlMetricsService();
    client = new MlClient(metrics);
    fetchSpy = jest.spyOn(globalThis, 'fetch' as never);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // ----------------------------- happy path -----------------------------

  it('returns parsed data on a 200 response and increments the ok counter', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(okBody) as never);

    const r = await client.call({
      endpoint: 'test.ok',
      url: 'http://stub/ok',
      body: { q: 'hi' },
      schema: Schema,
    });

    expect(r.ok).toBe(true);
    expect(r.outcome).toBe('ok');
    expect(r.data?.data?.[0]?.id).toBe('x');
    expect(metrics.count('test.ok', 'ok')).toBe(1);
    expect(metrics.fallbackCount('test.ok')).toBe(0);
  });

  it('propagates a request-id header when provided', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(okBody) as never);

    await client.call({
      endpoint: 'test.rid',
      url: 'http://stub/ok',
      body: {},
      schema: Schema,
      requestId: 'rid-abc-123',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['x-request-id']).toBe('rid-abc-123');
  });

  // ------------------------------ timeout -------------------------------

  it('treats AbortError as a timeout, retries once, then fails out', async () => {
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' });
    fetchSpy.mockRejectedValueOnce(abortErr as never).mockRejectedValueOnce(abortErr as never);

    const r = await client.call({
      endpoint: 'test.timeout',
      url: 'http://stub/slow',
      body: {},
      schema: Schema,
      timeoutMs: 5,
    });

    expect(r.ok).toBe(false);
    expect(r.outcome).toBe('timeout');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(metrics.count('test.timeout', 'timeout')).toBe(1);
  });

  // ------------------------------- non-2xx -------------------------------

  it('treats a 5xx response as http_error and retries once', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse({ err: 'boom' }, 500) as never)
      .mockResolvedValueOnce(jsonResponse({ err: 'boom' }, 500) as never);

    const r = await client.call({
      endpoint: 'test.5xx',
      url: 'http://stub/5xx',
      body: {},
      schema: Schema,
    });

    expect(r.ok).toBe(false);
    expect(r.outcome).toBe('http_error');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  // ----------------------------- Zod boundary ----------------------------

  it('rejects a 200 response with the wrong shape and does NOT retry', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ totally: 'wrong' }) as never);

    const r = await client.call({
      endpoint: 'test.badshape',
      url: 'http://stub/wrong',
      body: {},
      schema: Schema,
    });

    expect(r.ok).toBe(false);
    expect(r.outcome).toBe('error');
    expect(r.error).toMatch(/schema/);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // ----------------------------- payload cap -----------------------------

  it('rejects an oversized body before opening a socket', async () => {
    const huge = { blob: 'x'.repeat(60_000) };

    const r = await client.call({
      endpoint: 'test.huge',
      url: 'http://stub/huge',
      body: huge,
      schema: Schema,
    });

    expect(r.ok).toBe(false);
    expect(r.outcome).toBe('error');
    expect(r.error).toMatch(/exceeds/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // -------------------------- circuit breaker ----------------------------

  it('opens the circuit after 5 consecutive failures and short-circuits', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ err: 'down' }, 500) as never);

    // 5 calls, 1 retry each = 10 fetches; circuit should open after the 5th failure (10th fetch).
    for (let i = 0; i < 5; i++) {
      await client.call({
        endpoint: 'test.circuit',
        url: 'http://stub/down',
        body: {},
        schema: Schema,
        retries: 0, // 1 attempt each so we hit threshold cleanly
      });
    }

    fetchSpy.mockClear();

    const r = await client.call({
      endpoint: 'test.circuit',
      url: 'http://stub/down',
      body: {},
      schema: Schema,
      retries: 0,
    });

    expect(r.ok).toBe(false);
    expect(r.outcome).toBe('circuit_open');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // ---------------------------- withFallback -----------------------------

  it('withFallback runs the fallback closure and bumps the fallback counter', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ err: 'down' }, 500) as never);

    const result = await client.withFallback(
      {
        endpoint: 'test.fallback',
        url: 'http://stub/down',
        body: {},
        schema: Schema,
      },
      () => [{ id: 'fb', score: 0 }],
    );

    expect(result.meta.fallback).toBe(true);
    expect(result.data).toEqual([{ id: 'fb', score: 0 }]);
    expect(metrics.fallbackCount('test.fallback')).toBe(1);
  });

  it('withFallback returns the upstream payload when the call succeeds', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(okBody) as never);

    const result = await client.withFallback(
      {
        endpoint: 'test.fb_ok',
        url: 'http://stub/ok',
        body: {},
        schema: Schema,
      },
      () => [{ id: 'fb', score: 0 }],
    );

    expect(result.meta.fallback).toBe(false);
    // data is the validated envelope
    expect((result.data as typeof okBody).data[0].id).toBe('x');
    expect(metrics.fallbackCount('test.fb_ok')).toBe(0);
  });

  // ------------------------------- metrics --------------------------------

  it('exposes a Prometheus-formatted scrape with histogram + counters', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(okBody) as never);
    await client.call({
      endpoint: 'test.scrape',
      url: 'http://stub/ok',
      body: {},
      schema: Schema,
    });

    const text = metrics.scrape();
    expect(text).toContain('ml_bridge_requests_total{endpoint="test.scrape",outcome="ok"} 1');
    expect(text).toContain('ml_bridge_latency_ms_count{endpoint="test.scrape"}');
    expect(text).toContain('ml_bridge_circuit_state{endpoint="test.scrape"} 0');
  });
});
