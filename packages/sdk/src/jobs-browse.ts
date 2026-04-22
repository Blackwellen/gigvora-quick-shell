/**
 * Typed SDK surface for Domain 23 — Jobs Browse / Discovery / Saved Search.
 * Used by the web hooks, the Flutter client (via codegen later), and any
 * connector consuming the same contracts.
 */
export interface JobBrowseFilters {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: 'relevance' | 'newest' | 'salary_desc' | 'salary_asc' | 'match';
  remote?: 'any' | 'remote' | 'hybrid' | 'onsite';
  type?: ('full-time' | 'part-time' | 'contract' | 'internship' | 'temporary')[];
  seniority?: ('intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal')[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: 'USD' | 'EUR' | 'GBP';
  location?: string;
  radiusKm?: number;
  companyIds?: string[];
  skills?: string[];
  industries?: string[];
  postedWithinDays?: number;
  visaSponsorship?: boolean;
  diversityFlag?: boolean;
  facetMode?: 'none' | 'compact' | 'full';
}

export interface JobBrowseResult {
  id: string; title: string;
  company: { id: string; name: string; logoUrl: string | null };
  location: string; remote: 'remote' | 'hybrid' | 'onsite';
  salary: { min: number | null; max: number | null; currency: string };
  type: string; postedAt: string; applicants: number;
  matchScore: number | null; skills: string[];
  status: 'draft' | 'active' | 'paused' | 'archived' | 'closed';
  saved: boolean; source: 'internal' | 'imported' | 'syndicated';
}

export interface JobBrowseEnvelope {
  results: JobBrowseResult[]; total: number; page: number; pageSize: number;
  facets: null | {
    type: { value: string; count: number }[];
    remote: { value: string; count: number }[];
    seniority: { value: string; count: number }[];
    industries: { value: string; count: number }[];
    topSkills: { value: string; count: number }[];
  };
  rankingMode: 'ml' | 'fallback' | 'recency';
  generatedAt: string;
}

export interface SavedSearch {
  id?: string; label: string; filters: JobBrowseFilters;
  alertsEnabled: boolean;
  alertCadence: 'off' | 'realtime' | 'daily' | 'weekly';
  pinned: boolean;
  channel: 'inapp' | 'email' | 'inapp+email';
}

export interface JobsBrowseClient {
  search(f: JobBrowseFilters): Promise<JobBrowseEnvelope>;
  insights(): Promise<{ totalActive: number; newToday: number; remoteShare: number; avgSalary: number; hotSkills: string[]; anomalyNote: string | null; generatedAt: string; mode: string }>;
  listSaved(): Promise<SavedSearch[]>;
  upsertSaved(s: SavedSearch): Promise<SavedSearch>;
  removeSaved(id: string): Promise<{ removed: boolean }>;
  toggleBookmark(jobId: string): Promise<{ jobId: string; saved: boolean }>;
  bookmarks(): Promise<string[]>;
}

export const createJobsBrowseClient = (fetcher: typeof fetch, base = '/api/v1/jobs-browse'): JobsBrowseClient => {
  const j = async (path: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`jobs-browse ${path} ${r.status}`);
    return r.json();
  };
  const qs = (f: JobBrowseFilters) => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v !== undefined && (Array.isArray(v) ? v.forEach((x) => p.append(k, String(x))) : p.set(k, String(v))));
    return p.toString();
  };
  return {
    search: (f) => j(`/search?${qs(f)}`),
    insights: () => j('/insights'),
    listSaved: () => j('/saved'),
    upsertSaved: (s) => j('/saved', { method: 'POST', body: JSON.stringify(s) }),
    removeSaved: (id) => j(`/saved/${id}`, { method: 'DELETE' }),
    toggleBookmark: (jobId) => j(`/jobs/${jobId}/save`, { method: 'POST' }),
    bookmarks: () => j('/bookmarks'),
  };
};
