import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  req,
  apiConfigured,
} from '@/lib/api/gigvora';

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
  rank?: number;
  url?: string;
  meta?: Record<string, unknown>;
  reason?: string | null;
}

export interface SearchResponse {
  source: 'opensearch' | 'postgres';
  ms: number;
  query: string;
  scope: string;
  items: SearchResult[];
  total: number;
  limit: number;
  hasMore: boolean;
  rerank?: { model: string; version: string; fallback?: boolean };
}

export interface SavedSearchItem {
  id: string;
  name: string;
  query: string;
  scope: string;
  filters: Record<string, unknown>;
  pinned: boolean;
  notify: boolean;
  lastRunAt?: string | null;
  lastCount?: number;
  createdAt?: string;
}

const enabled = () => apiConfigured();

const toQuery = (params: Record<string, unknown>) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((entry) => p.append(key, String(entry)));
    else if (typeof value === 'object') p.set(key, JSON.stringify(value));
    else p.set(key, String(value));
  });
  return p.toString();
};

export function useSearch(query: string, scope?: string, filters?: SearchFilters, limit = 25, offset = 0) {
  return useQuery({
    queryKey: ['search-v2', query, scope, filters, limit, offset],
    enabled: enabled() && query.trim().length >= 2,
    staleTime: 30_000,
    queryFn: () => req<SearchResponse>(`/search?${toQuery({ q: query, scope, filters, limit, offset })}`),
  });
}

export function useSearchAutocomplete(query: string, scope?: string, limit = 8) {
  return useQuery({
    queryKey: ['search-v2', 'autocomplete', query, scope, limit],
    enabled: enabled() && query.trim().length >= 1,
    staleTime: 10_000,
    queryFn: () => req<{ items: Array<{ id: string; indexName: string; title: string; url?: string }>; total: number; limit: number; hasMore: boolean }>(`/search/autocomplete?${toQuery({ q: query, scope, limit })}`),
  });
}

export function useSearchTrending() {
  return useQuery({
    queryKey: ['search-v2', 'trending'],
    enabled: enabled(),
    staleTime: 60_000,
    queryFn: () => req<{ items: Array<{ query: string; c: number }>; total: number; limit: number; hasMore: boolean }>(`/search/trending`),
  });
}

export function useSearchRecent() {
  return useQuery({
    queryKey: ['search-v2', 'recent'],
    enabled: enabled(),
    staleTime: 60_000,
    queryFn: () => req<{ items: Array<{ query: string; scope: string; createdAt: string }>; total: number; limit: number; hasMore: boolean }>(`/search/recent`),
  });
}

export function useSavedSearches() {
  return useQuery({
    queryKey: ['search-v2', 'saved'],
    enabled: enabled(),
    staleTime: 30_000,
    queryFn: () => req<{ items: SavedSearchItem[]; total: number; limit: number; hasMore: boolean }>(`/search/saved`),
  });
}

export function useCreateSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; query: string; scope?: string; filters?: Record<string, unknown>; pinned?: boolean; notify?: boolean }) =>
      req<SavedSearchItem>(`/search/saved`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['search-v2', 'saved'] }),
  });
}

export function useArchiveSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => req(`/search/saved/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['search-v2', 'saved'] }),
  });
}

export function useTrackSearchClick() {
  return useMutation({
    mutationFn: (input: { query: string; clickedId: string; clickedIndex: string; scope?: string }) =>
      req(`/search/track`, { method: 'POST', body: JSON.stringify(input) }),
  });
}

export const searchApiConfigured = enabled;