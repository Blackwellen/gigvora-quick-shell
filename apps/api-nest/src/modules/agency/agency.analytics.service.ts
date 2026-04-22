/** Domain 13 — Agency analytics bridge. Hardened via shared MlClient (Group 2). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export interface AnalyticsEnvelope<T> { data: T; meta: { source: string; latency_ms: number; fallback?: boolean }; }
export interface AgencySummary {
  pipeline_open: number;
  pipeline_value_cents: number;
  inbound_leads_7d: number;
  proposal_win_rate_pct: number;
  avg_response_hours: number;
}

const Schema = z.object({
  data: z.object({
    pipeline_open: z.number(),
    pipeline_value_cents: z.number(),
    inbound_leads_7d: z.number(),
    proposal_win_rate_pct: z.number(),
    avg_response_hours: z.number(),
  }),
  meta: z.object({ source: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

const ZERO: AgencySummary = {
  pipeline_open: 0, pipeline_value_cents: 0, inbound_leads_7d: 0,
  proposal_win_rate_pct: 0, avg_response_hours: 0,
};

@Injectable()
export class AgencyAnalyticsService {
  private readonly base = process.env.ANALYTICS_PY_URL ?? 'http://localhost:8002';
  constructor(private readonly ml: MlClient) {}

  async summary(agencyId: string, requestId?: string): Promise<AnalyticsEnvelope<AgencySummary>> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'agency.summary',
        url: `${this.base}/agency/summary?agency_id=${encodeURIComponent(agencyId)}`,
        body: {},
        schema: Schema,
        requestId,
      },
      () => ({ data: ZERO, meta: { source: 'fallback-zero', latency_ms: 0, fallback: true } }),
    );
    if (r.meta.fallback) {
      return { data: ZERO, meta: { source: 'fallback-zero', latency_ms: r.meta.latency_ms, fallback: true } };
    }
    return r.data as AnalyticsEnvelope<AgencySummary>;
  }
}
