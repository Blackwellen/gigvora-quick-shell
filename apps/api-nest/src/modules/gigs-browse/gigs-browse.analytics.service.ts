/**
 * Operational analytics for Domain 41 — Gigs Browse.
 *
 * Returns summary cards + insight commentary surfaced in the right rail of
 * the browse page and the seller analytics workspace. Backed by ranking
 * signals + view events tables in production; in-memory roll-ups here.
 */
import { Injectable } from '@nestjs/common';
import { GigsBrowseRepository } from './gigs-browse.repository';

@Injectable()
export class GigsBrowseAnalyticsService {
  constructor(private readonly repo: GigsBrowseRepository) {}

  insights(_ownerId?: string) {
    const all = this.repo.list();
    const active = all.filter((g) => g.status === 'active');
    const featured = active.filter((g) => g.isFeatured).length;
    const proSellers = active.filter((g) => g.isProSeller).length;
    const fastDelivery = active.filter((g) => g.hasFastDelivery).length;
    const avgRating = active.length
      ? active.reduce((s, g) => s + g.ratingAvg, 0) / active.length / 100
      : 0;
    const avgPrice = active.length
      ? active.reduce((s, g) => s + g.pricingFromCents, 0) / active.length
      : 0;
    const topCategories = (() => {
      const m = new Map<string, number>();
      active.forEach((g) => m.set(g.category, (m.get(g.category) ?? 0) + 1));
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([category, count]) => ({ category, count }));
    })();
    const trending = [...active].sort((a, b) => b.orders - a.orders).slice(0, 5).map((g) => ({
      id: g.id, title: g.title, orders: g.orders, ratingAvg: g.ratingAvg / 100,
    }));
    return {
      totals: { active: active.length, featured, proSellers, fastDelivery },
      averages: { rating: Math.round(avgRating * 100) / 100, priceFromCents: Math.round(avgPrice) },
      topCategories,
      trending,
      commentary: this.commentary(active.length, featured, proSellers),
      generatedAt: new Date().toISOString(),
    };
  }

  private commentary(active: number, featured: number, proSellers: number): string[] {
    const out: string[] = [];
    if (active < 20) out.push('Catalogue is still small — promote new sellers to widen choice.');
    if (featured / Math.max(1, active) < 0.05) out.push('Less than 5% of gigs are featured — consider rotating editorial picks.');
    if (proSellers / Math.max(1, active) > 0.3) out.push('Strong Pro Seller density — surface "Trusted by enterprises" rail.');
    if (!out.length) out.push('Marketplace mix is healthy across price, delivery, and seller bands.');
    return out;
  }
}
