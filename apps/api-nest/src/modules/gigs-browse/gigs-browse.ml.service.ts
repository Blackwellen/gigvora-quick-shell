/** Domain 41 — Gigs Browse ML bridge. Refactored to use MlClient (FD-12). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import { GigsBrowseRepository, type GigRow } from './gigs-browse.repository';
import type { GigBrowseFilters } from './dto';

export type RankingMode = 'ml' | 'fallback' | 'recency' | 'popularity';

const Schema = z.object({
  ranked: z.array(z.object({ id: z.string() }).passthrough()),
}).passthrough();

@Injectable()
export class GigsBrowseMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(
    private readonly repo: GigsBrowseRepository,
    private readonly ml: MlClient,
  ) {}

  async rank(filters: GigBrowseFilters, ownerId?: string): Promise<{ rows: GigRow[]; mode: RankingMode }> {
    const baseline = this.repo.fallbackRank(filters, ownerId);
    if (filters.sort === 'newest') return { rows: baseline, mode: 'recency' };
    if (filters.sort === 'orders') return { rows: baseline, mode: 'popularity' };
    if (filters.sort !== 'relevance') return { rows: baseline, mode: 'fallback' };

    const r = await this.ml.withFallback(
      {
        endpoint: 'gigs-browse.rank',
        url: `${this.base}/gigs-browse/rank`,
        body: {
          ownerId, filters,
          candidates: baseline.slice(0, 200).map((g) => ({
            id: g.id, skills: g.skills, languages: g.languages, category: g.category,
            ratingAvg: g.ratingAvg / 100, orders: g.orders, isProSeller: g.isProSeller,
            isFeatured: g.isFeatured, fastDelivery: g.hasFastDelivery,
            priceCents: g.pricingFromCents, deliveryDaysMin: g.deliveryDaysMin,
            publishedAt: g.publishedAt ?? g.createdAt,
          })),
        },
        schema: Schema,
        timeoutMs: 600,
      },
      () => ({ ranked: baseline.map((g) => ({ id: g.id })) }),
    );
    if (r.meta.fallback) return { rows: baseline, mode: 'fallback' };
    const ids: string[] = (r.data as any).ranked?.map((c: any) => c.id) ?? [];
    if (!ids.length) return { rows: baseline, mode: 'fallback' };
    const byId = new Map(baseline.map((g) => [g.id, g] as const));
    const reordered = ids.map((id) => byId.get(id)).filter(Boolean) as GigRow[];
    const seen = new Set(reordered.map((g) => g.id));
    return { rows: [...reordered, ...baseline.filter((g) => !seen.has(g.id))], mode: 'ml' };
  }
}
