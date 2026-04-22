/**
 * Domain 41 application service — Gigs Browse, Search, Marketplace Discovery.
 *
 * Surface used by the controller, the SDK, the Flutter client, and the
 * saved-search alert worker. Emits Socket.IO events through the
 * NotificationsGateway so saved-search counters and bookmark toggles
 * reflect on every connected client.
 */
import { Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { GigsBrowseRepository, type GigRow } from './gigs-browse.repository';
import { GigsBrowseMlService } from './gigs-browse.ml.service';
import { GigsBrowseAnalyticsService } from './gigs-browse.analytics.service';
import type { GigBrowseFilters, GigSavedSearch } from './dto';

@Injectable()
export class GigsBrowseService {
  private readonly log = new Logger('GigsBrowseService');
  constructor(
    private readonly repo: GigsBrowseRepository,
    private readonly ml: GigsBrowseMlService,
    private readonly analytics: GigsBrowseAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
    },
    @Optional() @Inject('INDEXING_QUEUE') private readonly indexQueue?: {
      add: (name: string, data: any) => Promise<unknown>;
    },
  ) {}

  async search(filters: GigBrowseFilters, ownerId?: string) {
    const t0 = Date.now();
    const { rows, mode } = await this.ml.rank(filters, ownerId);
    const start = (filters.page - 1) * filters.pageSize;
    const page = rows.slice(start, start + filters.pageSize).map((g, idx) => this.toResult(g, ownerId, mode, idx + start));
    const facets = filters.facetMode === 'none' ? null : this.repo.computeFacets(rows);
    this.log.debug(`search ${rows.length} rows in ${Date.now() - t0}ms via ${mode}`);
    return {
      results: page, total: rows.length, page: filters.page, pageSize: filters.pageSize,
      facets, rankingMode: mode, generatedAt: new Date().toISOString(),
    };
  }

  insights(ownerId?: string) { return this.analytics.insights(ownerId); }

  detail(idOrSlug: string, ownerId?: string) {
    const g = this.repo.getById(idOrSlug) ?? this.repo.getBySlug(idOrSlug);
    if (!g) throw new NotFoundException('Gig not found');
    this.repo.recordView(g.id);
    return {
      ...this.toResult(g, ownerId, 'fallback', 0),
      description: `Productized ${g.category} service from ${g.sellerName}.`,
      seller: {
        id: g.ownerId, name: g.sellerName, avatarUrl: g.sellerAvatar,
        isProSeller: g.isProSeller, level: g.sellerLevel,
        responseTimeHours: 4, completedOrders: g.orders,
      },
      packages: this.derivePackages(g),
      addOns: this.deriveAddons(g),
      gallery: [{ kind: 'image', url: g.thumbnailUrl ?? '/placeholder.svg', position: 0, scanStatus: 'clean' }],
    };
  }

  listSaved(ownerId: string) { return this.repo.listSaved(ownerId); }
  upsertSaved(ownerId: string, payload: GigSavedSearch) {
    const row = this.repo.upsertSaved(ownerId, payload);
    this.gateway?.emitToUser(ownerId, 'gigs-browse.saved-search.upserted', { id: row.id, label: row.label });
    return row;
  }
  removeSaved(ownerId: string, id: string) {
    const ok = this.repo.removeSaved(ownerId, id);
    if (ok) this.gateway?.emitToUser(ownerId, 'gigs-browse.saved-search.removed', { id });
    return ok;
  }

  toggleBookmark(ownerId: string, gigId: string) {
    const g = this.repo.getById(gigId);
    if (!g) throw new NotFoundException('Gig not found');
    const bookmarked = this.repo.toggleBookmark(ownerId, gigId);
    this.gateway?.emitToUser(ownerId, 'gigs-browse.bookmark.toggled', { gigId, bookmarked });
    // Best-effort search-indexer push so popularity boosts apply on the next search.
    void this.indexQueue?.add('gigs', { op: 'upsert', index: 'gigs', doc: { id: g.id, bookmarks: 1 } })
      .catch(() => {/* ignore — indexer optional */});
    return { gigId, bookmarked };
  }
  bookmarkIds(ownerId: string) { return this.repo.bookmarkIds(ownerId); }

  private toResult(g: GigRow, ownerId: string | undefined, mode: string, position: number) {
    return {
      id: g.id, title: g.title, slug: g.slug,
      category: g.category, subcategory: g.subcategory,
      thumbnailUrl: g.thumbnailUrl,
      seller: {
        id: g.ownerId, name: g.sellerName, avatarUrl: g.sellerAvatar,
        isProSeller: g.isProSeller, level: g.sellerLevel,
      },
      pricing: { fromCents: g.pricingFromCents, currency: g.currency },
      delivery: { minDays: g.deliveryDaysMin, maxDays: g.deliveryDaysMax },
      rating: { avg: Math.round(g.ratingAvg) / 100, count: g.ratingCount },
      orders: g.orders,
      status: g.status, visibility: g.visibility,
      isFeatured: g.isFeatured, hasFastDelivery: g.hasFastDelivery, acceptsRevisions: g.acceptsRevisions,
      skills: g.skills, languages: g.languages, industries: g.industries,
      matchScore: mode === 'ml' ? Math.max(50, Math.min(99, 95 - position * 2)) : null,
      bookmarked: this.repo.isBookmarked(ownerId, g.id),
      publishedAt: g.publishedAt,
    };
  }

  private derivePackages(g: GigRow) {
    return [
      { tier: 'basic',    name: 'Basic',    priceCents: g.pricingFromCents,            deliveryDays: g.deliveryDaysMin,           revisions: 1, features: ['1 concept', 'Source files'], isPopular: false },
      { tier: 'standard', name: 'Standard', priceCents: Math.round(g.pricingFromCents * 2),  deliveryDays: g.deliveryDaysMin + 1,       revisions: 3, features: ['3 concepts', 'Source files', 'Priority queue'], isPopular: true },
      { tier: 'premium',  name: 'Premium',  priceCents: Math.round(g.pricingFromCents * 4),  deliveryDays: g.deliveryDaysMax,           revisions: 5, features: ['5 concepts', 'Source files', 'Priority queue', 'Brand guidelines'], isPopular: false },
    ];
  }
  private deriveAddons(g: GigRow) {
    return [
      { name: '24h fast delivery', priceCents: 2500, extraDeliveryDays: -1 },
      { name: 'Extra revision',     priceCents: 1500, extraDeliveryDays: 0 },
      { name: 'Source files',       priceCents: 2000, extraDeliveryDays: 0 },
    ].filter(() => g.acceptsRevisions);
  }
}
