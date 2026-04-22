/** Domain 23 — Jobs Browse ML bridge. Refactored (FD-12). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import { JobsBrowseRepository } from './jobs-browse.repository';
import type { JobBrowseFilters } from './dto';

const Schema = z.object({ ranked: z.array(z.object({ id: z.string() }).passthrough()) }).passthrough();

@Injectable()
export class JobsBrowseMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(
    private readonly repo: JobsBrowseRepository,
    private readonly ml: MlClient,
  ) {}

  async rank(filters: JobBrowseFilters, identityId?: string) {
    const baseline = this.repo.fallbackRank(filters, identityId);
    const isMl = filters.sort === 'relevance' || filters.sort === 'match';
    if (!isMl) return { rows: baseline, mode: filters.sort === 'newest' ? 'recency' as const : 'fallback' as const };

    const r = await this.ml.withFallback(
      { endpoint: 'jobs-browse.rank', url: `${this.base}/jobs-browse/rank`, body: { identityId, filters, candidates: baseline.slice(0, 200) }, schema: Schema, timeoutMs: 600 },
      () => ({ ranked: baseline.map((b) => ({ id: (b as any).id })) }),
    );
    if (r.meta.fallback) return { rows: baseline, mode: 'fallback' as const };
    const ids = (r.data as any).ranked?.map((x: any) => x.id) ?? [];
    if (!ids.length) return { rows: baseline, mode: 'fallback' as const };
    const byId = new Map(baseline.map((b: any) => [b.id, b] as const));
    const reordered = ids.map((id: string) => byId.get(id)).filter(Boolean);
    const seen = new Set(reordered.map((g: any) => g.id));
    return { rows: [...reordered, ...baseline.filter((b: any) => !seen.has(b.id))], mode: 'ml' as const };
  }
}
