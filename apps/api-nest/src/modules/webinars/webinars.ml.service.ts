/** Domain 22 — Webinars ML bridge. Refactored (FD-12). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import type { WebinarRow } from './webinars.repository';
import type { DiscoveryFilters } from './dto';

const RankSchema = z.object({ ranked: z.array(z.object({ id: z.string() }).passthrough()) }).passthrough();
const RecSchema  = z.object({ recommended: z.array(z.object({ id: z.string() }).passthrough()) }).passthrough();

@Injectable()
export class WebinarsMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  private deterministicRank(rows: WebinarRow[], filters: DiscoveryFilters): WebinarRow[] {
    if (filters.sort === 'soonest') return [...rows].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    if (filters.sort === 'newest')  return [...rows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (filters.sort === 'popular') return [...rows].sort((a, b) => b.registrations - a.registrations);
    return [...rows].sort((a, b) => {
      const score = (w: WebinarRow) => (w.status === 'live' ? 100 : 0) + Math.max(0, 50 - Math.abs(+new Date(w.startsAt) - Date.now()) / 86_400_000) + w.registrations / 50;
      return score(b) - score(a);
    });
  }

  async rank(rows: WebinarRow[], filters: DiscoveryFilters, identityId?: string): Promise<{ rows: WebinarRow[]; mode: 'ml' | 'fallback' | 'recency' }> {
    const baseline = this.deterministicRank(rows, filters);
    if (filters.sort !== 'relevance') return { rows: baseline, mode: filters.sort === 'soonest' ? 'recency' : 'fallback' };
    const r = await this.ml.withFallback(
      { endpoint: 'webinars.rank', url: `${this.base}/webinars/rank`, body: { identityId, filters, candidates: rows.slice(0, 200) }, schema: RankSchema, timeoutMs: 600 },
      () => ({ ranked: baseline.map((b) => ({ id: b.id })) }),
    );
    if (r.meta.fallback) return { rows: baseline, mode: 'fallback' };
    const ids: string[] = (r.data as any).ranked?.map((x: any) => x.id) ?? [];
    const byId = new Map(baseline.map((b) => [b.id, b]));
    const reordered = ids.map((id) => byId.get(id)).filter(Boolean) as WebinarRow[];
    const seen = new Set(reordered.map((g) => g.id));
    return { rows: [...reordered, ...baseline.filter((b) => !seen.has(b.id))], mode: 'ml' };
  }

  async recommend(identityId: string | undefined, candidates: WebinarRow[]): Promise<{ rows: WebinarRow[]; mode: 'ml' | 'fallback' }> {
    const fallback = candidates.filter((w) => w.status === 'scheduled' || w.status === 'live').slice(0, 6);
    const r = await this.ml.withFallback(
      { endpoint: 'webinars.recommend', url: `${this.base}/webinars/recommend`, body: { identityId, candidates }, schema: RecSchema, timeoutMs: 600 },
      () => ({ recommended: fallback.map((w) => ({ id: w.id })) }),
    );
    if (r.meta.fallback) return { rows: fallback, mode: 'fallback' };
    const ids = (r.data as any).recommended?.map((x: any) => x.id) ?? [];
    const byId = new Map(candidates.map((c) => [c.id, c]));
    return { rows: ids.map((id: string) => byId.get(id)).filter(Boolean) as WebinarRow[], mode: 'ml' };
  }
}
