/**
 * Domain 41 — Gigs Browse repository.
 *
 * In-memory + seeded data backing the browse, search, and marketplace
 * discovery surfaces. Real persistence lives in packages/db migration
 * 0041_gigs_browse.sql; this repository keeps a denormalised cache for
 * fast facet computation and ML scoring while writes go to Postgres
 * via Drizzle in production.
 *
 * State machine for gigs:
 *   draft → pending_review → active ↔ paused → archived
 *   active → escalated → active|archived
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { GigBrowseFilters, GigSavedSearch } from './dto';

export type GigRow = {
  id: string; ownerId: string; sellerName: string; sellerAvatar: string | null;
  isProSeller: boolean; sellerLevel: string;
  title: string; slug: string; category: string; subcategory: string | null;
  thumbnailUrl: string | null;
  pricingFromCents: number; currency: string;
  deliveryDaysMin: number; deliveryDaysMax: number;
  ratingAvg: number; ratingCount: number; orders: number;
  status: 'draft' | 'pending_review' | 'active' | 'paused' | 'archived' | 'escalated';
  visibility: 'public' | 'unlisted' | 'private';
  isFeatured: boolean; hasFastDelivery: boolean; acceptsRevisions: boolean;
  skills: string[]; languages: string[]; industries: string[];
  publishedAt: string | null; createdAt: string;
};

const SELLER_NAMES = ['Aria K.', 'Jordan M.', 'Priya R.', 'Lena S.', 'Marcus T.', 'Yuki H.', 'Sofia C.', 'Noah B.', 'Mei L.', 'Diego P.'];
const CATEGORIES = [
  { c: 'design', sub: ['logo', 'branding', 'web-ui', 'illustration'] },
  { c: 'development', sub: ['react', 'mobile', 'wordpress', 'api'] },
  { c: 'writing', sub: ['copy', 'seo', 'editing', 'technical'] },
  { c: 'video', sub: ['edit', 'motion', 'voiceover', 'animation'] },
  { c: 'marketing', sub: ['social', 'ads', 'email', 'growth'] },
];
const SKILL_POOL = ['figma', 'react', 'typescript', 'node', 'python', 'aws', 'seo', 'copywriting', 'illustrator', 'after-effects', 'tiktok', 'meta-ads', 'sql', 'webflow'];
const LANG_POOL = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese', 'Mandarin', 'Hindi'];

@Injectable()
export class GigsBrowseRepository {
  private readonly log = new Logger('GigsBrowseRepository');
  private gigs: GigRow[] = [];
  private savedSearches = new Map<string, GigSavedSearch & { id: string; ownerId: string; updatedAt: string }>();
  private bookmarks = new Map<string, Set<string>>();           // ownerId -> gigIds
  private viewCounts = new Map<string, number>();               // gigId -> views

  constructor() { this.seed(); }

  private seed() {
    for (let i = 0; i < 80; i++) {
      const cat = CATEGORIES[i % CATEGORIES.length];
      const seller = SELLER_NAMES[i % SELLER_NAMES.length];
      const ownerId = `00000000-0000-0000-0000-${String(1000 + i).padStart(12, '0')}`;
      this.gigs.push({
        id: randomUUID(),
        ownerId,
        sellerName: seller,
        sellerAvatar: null,
        isProSeller: i % 5 === 0,
        sellerLevel: ['new', 'level-1', 'level-2', 'top-rated'][i % 4],
        title: `${cat.c[0].toUpperCase()}${cat.c.slice(1)} expert: ${cat.sub[i % cat.sub.length]} that converts`,
        slug: `gig-${cat.c}-${cat.sub[i % cat.sub.length]}-${i}`,
        category: cat.c,
        subcategory: cat.sub[i % cat.sub.length],
        thumbnailUrl: null,
        pricingFromCents: (10 + (i * 7) % 240) * 100,
        currency: 'GBP',
        deliveryDaysMin: 1 + (i % 3),
        deliveryDaysMax: 3 + (i % 7),
        ratingAvg: 380 + ((i * 17) % 120), // ×100
        ratingCount: 5 + (i * 13) % 800,
        orders: 10 + (i * 11) % 900,
        status: 'active',
        visibility: 'public',
        isFeatured: i % 11 === 0,
        hasFastDelivery: i % 4 === 0,
        acceptsRevisions: i % 3 !== 0,
        skills: SKILL_POOL.slice(i % 8, (i % 8) + 3),
        languages: [LANG_POOL[i % LANG_POOL.length], 'English'].filter((v, idx, a) => a.indexOf(v) === idx),
        industries: [['Software', 'Media', 'Fintech', 'Health', 'Education'][i % 5]],
        publishedAt: new Date(Date.now() - i * 1000 * 60 * 60 * 6).toISOString(),
        createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 8).toISOString(),
      });
    }
    this.log.log(`seeded ${this.gigs.length} gig fixtures`);
  }

  list(): GigRow[] { return this.gigs; }

  /** Deterministic fallback ranking when ML is unavailable. */
  fallbackRank(filters: GigBrowseFilters, ownerId?: string): GigRow[] {
    const now = Date.now();
    return [...this.gigs]
      .filter((g) => this.matchesFilters(g, filters))
      .sort((a, b) => {
        switch (filters.sort) {
          case 'newest':     return +new Date(b.createdAt) - +new Date(a.createdAt);
          case 'price_asc':  return a.pricingFromCents - b.pricingFromCents;
          case 'price_desc': return b.pricingFromCents - a.pricingFromCents;
          case 'rating':     return b.ratingAvg - a.ratingAvg;
          case 'orders':     return b.orders - a.orders;
          case 'fastest':    return a.deliveryDaysMin - b.deliveryDaysMin;
          default: {
            const score = (g: GigRow) => {
              const ageDays = (now - +new Date(g.createdAt)) / 86_400_000;
              return (g.ratingAvg / 100) * 6
                + Math.log1p(g.orders) * 2
                + (g.isFeatured ? 4 : 0)
                + (g.isProSeller ? 2 : 0)
                + Math.max(0, 5 - ageDays * 0.05);
            };
            return score(b) - score(a);
          }
        }
      });
  }

  matchesFilters(g: GigRow, f: GigBrowseFilters): boolean {
    if (g.status !== 'active' || g.visibility !== 'public') return false;
    if (f.q) {
      const hay = `${g.title} ${g.category} ${g.skills.join(' ')} ${g.sellerName}`.toLowerCase();
      if (!hay.includes(f.q.toLowerCase())) return false;
    }
    if (f.category && g.category !== f.category) return false;
    if (f.subcategory && g.subcategory !== f.subcategory) return false;
    if (f.priceMin && g.pricingFromCents < f.priceMin) return false;
    if (f.priceMax && g.pricingFromCents > f.priceMax) return false;
    if (f.deliveryDaysMax && g.deliveryDaysMin > f.deliveryDaysMax) return false;
    if (f.ratingMin && g.ratingAvg / 100 < f.ratingMin) return false;
    if (f.proSellerOnly && !g.isProSeller) return false;
    if (f.fastDeliveryOnly && !g.hasFastDelivery) return false;
    if (f.acceptsRevisionsOnly && !g.acceptsRevisions) return false;
    if (f.skills?.length && !f.skills.some((s) => g.skills.includes(s.toLowerCase()))) return false;
    if (f.languages?.length && !f.languages.some((l) => g.languages.includes(l))) return false;
    if (f.industries?.length && !f.industries.some((ind) => g.industries.includes(ind))) return false;
    return true;
  }

  computeFacets(rows: GigRow[]) {
    const tally = (key: keyof GigRow | 'topSkills' | 'topLanguages') => {
      const m = new Map<string, number>();
      rows.forEach((r) => {
        const v: any = key === 'topSkills' ? r.skills : key === 'topLanguages' ? r.languages : (r as any)[key];
        (Array.isArray(v) ? v : [v]).forEach((x) => x && m.set(String(x), (m.get(String(x)) ?? 0) + 1));
      });
      return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    };
    const buckets = [
      { value: '<£50', test: (g: GigRow) => g.pricingFromCents < 5000 },
      { value: '£50–£150', test: (g: GigRow) => g.pricingFromCents >= 5000 && g.pricingFromCents < 15000 },
      { value: '£150–£500', test: (g: GigRow) => g.pricingFromCents >= 15000 && g.pricingFromCents < 50000 },
      { value: '£500+', test: (g: GigRow) => g.pricingFromCents >= 50000 },
    ];
    return {
      category: tally('category'),
      delivery: tally('deliveryDaysMin'),
      topSkills: tally('topSkills'),
      topLanguages: tally('topLanguages'),
      priceBuckets: buckets.map((b) => ({ value: b.value, count: rows.filter(b.test).length })),
    };
  }

  // Saved searches
  listSaved(ownerId: string) { return [...this.savedSearches.values()].filter((s) => s.ownerId === ownerId); }
  upsertSaved(ownerId: string, payload: GigSavedSearch) {
    const id = payload.id ?? randomUUID();
    const row = { ...payload, id, ownerId, updatedAt: new Date().toISOString() };
    this.savedSearches.set(id, row);
    return row;
  }
  removeSaved(ownerId: string, id: string) {
    const row = this.savedSearches.get(id);
    if (!row || row.ownerId !== ownerId) return false;
    this.savedSearches.delete(id); return true;
  }

  // Bookmarks
  toggleBookmark(ownerId: string, gigId: string) {
    const set = this.bookmarks.get(ownerId) ?? new Set<string>();
    set.has(gigId) ? set.delete(gigId) : set.add(gigId);
    this.bookmarks.set(ownerId, set);
    return set.has(gigId);
  }
  bookmarkIds(ownerId: string) { return [...(this.bookmarks.get(ownerId) ?? [])]; }
  isBookmarked(ownerId: string | undefined, gigId: string) {
    return ownerId ? !!this.bookmarks.get(ownerId)?.has(gigId) : false;
  }

  // Telemetry
  recordView(gigId: string) { this.viewCounts.set(gigId, (this.viewCounts.get(gigId) ?? 0) + 1); }
  getById(id: string) { return this.gigs.find((g) => g.id === id) ?? null; }
  getBySlug(slug: string) { return this.gigs.find((g) => g.slug === slug) ?? null; }
}
