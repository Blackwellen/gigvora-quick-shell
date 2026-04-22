export type SearchScope = 'all' | 'users' | 'jobs' | 'projects' | 'gigs' | 'services' | 'companies' | 'startups' | 'media' | 'groups' | 'events' | 'podcasts' | 'webinars' | 'posts';

export interface SearchFilters {
  tags?: string[];
  salaryMin?: number;
  salaryMax?: number;
  seniority?: string[];
  employmentType?: string[];
  remoteMode?: string[];
  location?: string;
  locationRadiusKm?: number;
  postedWithinDays?: number;
  mustHaveSkills?: string[];
  excludedSkills?: string[];
  companySize?: string[];
  visaSponsorship?: boolean;
  category?: string[];
  priceMin?: number;
  priceMax?: number;
  availability?: string[];
  region?: string[];
  startAfter?: string;
  startBefore?: string;
  format?: string[];
}

export interface SearchResult {
  id: string;
  indexName: string;
  title: string;
  body?: string;
  tags?: string[];
  url?: string;
  rank?: number;
  meta?: Record<string, unknown>;
  reason?: string | null;
}

export interface SearchEnvelope {
  source: 'opensearch' | 'postgres';
  ms: number;
  query: string;
  scope: SearchScope;
  items: SearchResult[];
  total: number;
  limit: number;
  hasMore: boolean;
  rerank?: { model: string; version: string; fallback?: boolean };
}

export interface SearchFacetEnvelope {
  query: string;
  counts: Record<string, number>;
  total: number;
}

export interface SearchAutocompleteItem {
  id: string;
  indexName: string;
  title: string;
  url?: string;
}

export interface SearchSavedItem {
  id: string;
  name: string;
  query: string;
  scope: SearchScope;
  filters: Record<string, unknown>;
  pinned: boolean;
  notify: boolean;
  lastRunAt?: string | null;
  lastCount?: number;
  createdAt?: string;
}

export interface SearchLinkItem {
  relation: string;
  weight: number;
  meta?: Record<string, unknown>;
  id: string;
  indexName: string;
  title: string;
  url?: string;
}

export interface SearchAdminReconcileResult {
  scanned: number;
  enqueued: number;
  mode: string;
}

export interface SearchClient {
  search(input: { q: string; scope?: SearchScope; tags?: string[]; filters?: SearchFilters; limit?: number; offset?: number }): Promise<SearchEnvelope>;
  facets(q: string): Promise<SearchFacetEnvelope>;
  autocomplete(input: { q: string; scope?: SearchScope; limit?: number }): Promise<{ items: SearchAutocompleteItem[]; total: number; limit: number; hasMore: boolean }>;
  track(input: { query: string; clickedId: string; clickedIndex: string; scope?: SearchScope }): Promise<unknown>;
  trending(): Promise<{ items: Array<{ query: string; c: number }>; total: number; limit: number; hasMore: boolean }>;
  recent(): Promise<{ items: Array<{ query: string; scope: string; createdAt: string }>; total: number; limit: number; hasMore: boolean }>;
  listSaved(): Promise<{ items: SearchSavedItem[]; total: number; limit: number; hasMore: boolean }>;
  createSaved(input: { name: string; query: string; scope?: SearchScope; filters?: Record<string, unknown>; pinned?: boolean; notify?: boolean }): Promise<SearchSavedItem>;
  archiveSaved(id: string): Promise<SearchSavedItem>;
  paletteActions(input?: { roles?: string[]; entitlements?: string[] }): Promise<{ items: unknown[]; total: number; limit: number; hasMore: boolean }>;
  shortcuts(): Promise<{ items: unknown[]; total: number; limit: number; hasMore: boolean }>;
  upsertShortcut(input: { actionId: string; keybind: string; disabled?: boolean }): Promise<unknown>;
  links(indexName: string, id: string): Promise<SearchLinkItem[]>;
  createLink(input: { sourceIndex: string; sourceId: string; targetIndex: string; targetId: string; relation: string; weight?: number; meta?: Record<string, unknown> }): Promise<unknown>;
  adminIndex(input: Record<string, unknown>): Promise<unknown>;
  adminBulkIndex(input: { docs: Record<string, unknown>[] }): Promise<{ accepted: number }>;
  adminReconcile(input?: { limit?: number }): Promise<SearchAdminReconcileResult>;
}

export const createSearchClient = (fetcher: typeof fetch, base = '/api/v1/search'): SearchClient => {
  const j = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const r = await fetcher(`${base}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!r.ok) throw new Error(`search ${path} ${r.status}`);
    return r.json() as Promise<T>;
  };

  const qs = (input: Record<string, unknown>) => {
    const p = new URLSearchParams();
    Object.entries(input).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((entry) => p.append(key, String(entry)));
      } else if (typeof value === 'object') {
        p.set(key, JSON.stringify(value));
      } else {
        p.set(key, String(value));
      }
    });
    const out = p.toString();
    return out ? `?${out}` : '';
  };

  return {
    search: (input) => j(`${qs(input)}`),
    facets: (q) => j(`/facets${qs({ q })}`),
    autocomplete: (input) => j(`/autocomplete${qs(input)}`),
    track: (input) => j('/track', { method: 'POST', body: JSON.stringify(input) }),
    trending: () => j('/trending'),
    recent: () => j('/recent'),
    listSaved: () => j('/saved'),
    createSaved: (input) => j('/saved', { method: 'POST', body: JSON.stringify(input) }),
    archiveSaved: (id) => j(`/saved/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    paletteActions: (input = {}) => j(`/palette/actions${qs({ roles: input.roles?.join(','), entitlements: input.entitlements?.join(',') })}`),
    shortcuts: () => j('/shortcuts'),
    upsertShortcut: (input) => j('/shortcuts', { method: 'POST', body: JSON.stringify(input) }),
    links: (indexName, id) => j(`/links/${encodeURIComponent(indexName)}/${encodeURIComponent(id)}`),
    createLink: (input) => j('/links', { method: 'POST', body: JSON.stringify(input) }),
    adminIndex: (input) => j('/admin/index', { method: 'POST', body: JSON.stringify(input) }),
    adminBulkIndex: (input) => j('/admin/bulk-index', { method: 'POST', body: JSON.stringify(input) }),
    adminReconcile: (input = {}) => j('/admin/reconcile', { method: 'POST', body: JSON.stringify(input) }),
  };
};