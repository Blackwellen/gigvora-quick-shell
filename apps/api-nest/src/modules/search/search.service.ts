import { Injectable, NotFoundException } from '@nestjs/common';
import { SearchRepository } from './search.repository';
import { SearchRouter } from '../../infra/search-router';
import { SearchMlService } from './search.ml.service';
import { SearchIndexingAdminService } from './search-indexing.admin.service';
import { BooleanParserService } from './boolean-parser.service';
import { SearchFilters, INDEX_WEIGHTS, buildOpenSearchFilters } from './search.filters';

@Injectable()
export class SearchService {
  constructor(
    private readonly repo: SearchRepository,
    private readonly router: SearchRouter,
    private readonly ml: SearchMlService,
    private readonly admin: SearchIndexingAdminService,
    private readonly booleanParser: BooleanParserService,
  ) {}

  async search(d: { q: string; scope?: string; tags?: string[]; filters?: SearchFilters; limit?: number; offset?: number }, identityId: string | null) {
    const t0 = Date.now();
    const scope = d.scope ?? 'all';
    const limit = d.limit ?? 20;
    const offset = d.offset ?? 0;
    const filters = d.filters ?? {};
    let results: any[] = [];
    let source: 'opensearch' | 'postgres' = 'postgres';

    if (this.router.shouldUseOpenSearch()) {
      try {
        results = await this.searchOpenSearch(d.q, scope, d.tags, filters, limit, offset);
        source = 'opensearch';
      } catch {
        this.router.recordPostgres(true);
      }
    } else {
      this.router.recordPostgres(this.router.shouldUseOpenSearch() === false && !!process.env.OPENSEARCH_URL);
    }
    if (source === 'postgres') {
      results = await this.repo.search(d.q, scope, d.tags, filters, identityId, limit, offset);
    }

    let rerank: { model: string; version: string; fallback?: boolean } | undefined;
    if (results.length > 1 && d.q.trim()) {
      const ranked = await this.ml.rank(
        d.q,
        results.map((item, index) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          tags: item.tags,
          kind: item.indexName,
          recency_days: index,
          boost: Number(item.rank ?? 0),
        })),
        scope,
        limit,
      ).catch(() => null);

      if (ranked) {
        const scoreMap = new Map(ranked.data.map((item) => [item.id, item.score]));
        results = [...results].sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
        rerank = {
          model: ranked.meta.model,
          version: ranked.meta.version,
          fallback: ranked.meta.fallback,
        };
      }
    }

    const ms = Date.now() - t0;
    await this.repo.logHistory(identityId, d.q, scope, results.length, ms).catch(() => {});
    return { source, ms, query: d.q, scope, items: results, total: results.length, limit, hasMore: results.length === limit, rerank };
  }

  async facets(q: string, identityId: string | null) {
    const counts = await this.repo.countByIndex(q, identityId);
    return { query: q, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
  }

  async autocomplete(d: { q: string; scope?: string; limit?: number }) {
    if (!d.q || d.q.length < 1) return { items: [], total: 0, limit: d.limit ?? 8, hasMore: false };
    const items = await this.repo.autocomplete(d.q, d.scope ?? 'all', d.limit ?? 8);
    return { items, total: items.length, limit: d.limit ?? 8, hasMore: false };
  }

  trackClick(d: { query: string; clickedId: string; clickedIndex: string; scope?: string }, identityId: string | null) {
    return this.repo.logClick(identityId, d.query, d.scope ?? 'all', d.clickedId, d.clickedIndex);
  }

  async recent(identityId: string) {
    const items = await this.repo.recentForIdentity(identityId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }
  async trending() {
    const items = await this.repo.trending();
    return { items, total: items.length, limit: items.length, hasMore: false };
  }

  async listSaved(identityId: string) {
    const items = await this.repo.listSaved(identityId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }
  createSaved(identityId: string, d: any) { return this.repo.createSaved(identityId, d); }
  async archiveSaved(identityId: string, id: string) {
    const r = await this.repo.archiveSaved(identityId, id);
    if (!r) throw new NotFoundException('saved_search_not_found');
    return r;
  }

  async listActions(roles: string[], entitlements: string[]) { const items = await this.repo.listActions(roles, entitlements); return { items, total: items.length, limit: items.length, hasMore: false }; }
  async listShortcuts(identityId: string) { const items = await this.repo.listShortcuts(identityId); return { items, total: items.length, limit: items.length, hasMore: false }; }
  upsertShortcut(identityId: string, actionId: string, keybind: string, disabled?: boolean) {
    return this.repo.upsertShortcut(identityId, actionId, keybind, disabled);
  }

  linksFor(indexName: string, id: string) { return this.repo.linksFor(indexName, id); }
  createLink(d: any, createdBy: string|null) { return this.repo.createLink(d, createdBy); }
  upsertDocument(d: any) { return this.repo.upsertDocument(d); }
  bulkIndex(docs: Array<Record<string, unknown>>) { return this.admin.bulkIndex(docs as Array<Record<string, any>>); }
  reconcile(limit?: number) { return this.admin.reconcile(limit); }
  parseBoolean(query: string) { return this.booleanParser.parse(query); }

  private async searchOpenSearch(q: string, scope: string, tags: string[] | undefined, filters: SearchFilters, limit: number, offset: number) {
    const indices = scope === 'all'
      ? ['users','jobs','projects','gigs','services','companies','startups','media','groups','events','podcasts','webinars','posts']
      : [scope];
    const firstIndex = indices[0] ?? 'posts';
    const queryBody = q.match(/\b(AND|OR|NOT)\b/i)
      ? this.parseBoolean(q)
      : { multi_match: { query: q, fields: INDEX_WEIGHTS[firstIndex] ?? ['title^3', 'tags^2', 'body'], fuzziness: 'AUTO' } };
    const body = {
      from: offset, size: limit,
      query: {
        bool: {
          must: q ? [queryBody] : [{ match_all: {} }],
          filter: [
            ...(tags?.length ? [{ terms: { tags } }] : []),
            ...buildOpenSearchFilters(filters),
            { term: { visibility: 'public' } },
          ],
        },
      },
    };
    const j = await this.router.query<any>(indices, body);
    return (j.hits?.hits ?? []).map((h: any) => ({
      id: h._id, indexName: h._index.replace(/_v\d+$/, '').replace(/_read$/, ''),
      title: h._source?.title, body: h._source?.body,
      tags: h._source?.tags ?? [], url: h._source?.url, rank: h._score,
      meta: h._source?.meta ?? {},
      reason: h._source?.meta?.reason ?? null,
    }));
  }

  routingSnapshot() { return this.router.snapshot(); }
}