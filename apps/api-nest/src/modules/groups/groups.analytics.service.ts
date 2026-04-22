/** Domain 14 — Groups analytics bridge. Hardened via shared MlClient (Group 2). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export interface AnalyticsEnvelope<T> { data: T; meta: { source: string; latency_ms: number; fallback?: boolean }; }
export interface GroupsSummary {
  active_members_7d: number;
  posts_7d: number;
  comments_7d: number;
  approval_queue_depth: number;
  growth_rate_pct: number;
}

const Schema = z.object({
  data: z.object({
    active_members_7d: z.number(),
    posts_7d: z.number(),
    comments_7d: z.number(),
    approval_queue_depth: z.number(),
    growth_rate_pct: z.number(),
  }),
  meta: z.object({ source: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

const ZERO: GroupsSummary = {
  active_members_7d: 0, posts_7d: 0, comments_7d: 0,
  approval_queue_depth: 0, growth_rate_pct: 0,
};

@Injectable()
export class GroupsAnalyticsService {
  private readonly base = process.env.ANALYTICS_PY_URL ?? 'http://localhost:8002';
  constructor(private readonly ml: MlClient) {}

  async summary(groupId: string, requestId?: string): Promise<AnalyticsEnvelope<GroupsSummary>> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'groups.summary',
        url: `${this.base}/groups/summary?group_id=${encodeURIComponent(groupId)}`,
        body: {},
        schema: Schema,
        requestId,
      },
      () => ({ data: ZERO, meta: { source: 'fallback-zero', latency_ms: 0, fallback: true } }),
    );
    if (r.meta.fallback) {
      return { data: ZERO, meta: { source: 'fallback-zero', latency_ms: r.meta.latency_ms, fallback: true } };
    }
    return r.data as AnalyticsEnvelope<GroupsSummary>;
  }
}
