/**
 * Domain 23 React hooks. Wrap the SDK with TanStack Query, add safe-fetch
 * fallbacks (so the existing UI never breaks when the API is offline), and
 * subscribe to Socket.IO `jobs-browse.*` events for realtime updates.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createJobsBrowseClient, type JobBrowseFilters, type SavedSearch } from '@gigvora/sdk/jobs-browse';
import { realtime, useRealtimeEvent } from '@/lib/realtime/socket';

const client = createJobsBrowseClient(fetch);

const FALLBACK_RESULTS = Array.from({ length: 12 }).map((_, i) => ({
  id: `fb-${i}`, title: ['Senior React Developer', 'Product Designer', 'Data Engineer'][i % 3],
  company: { id: `c-${i}`, name: ['TechFlow', 'Figma', 'Netflix'][i % 3], logoUrl: null },
  location: ['Remote', 'London', 'New York'][i % 3], remote: (['remote', 'hybrid', 'onsite'] as const)[i % 3],
  salary: { min: 80_000 + i * 1000, max: 140_000 + i * 1000, currency: 'GBP' },
  type: 'full-time', postedAt: new Date(Date.now() - i * 3600_000).toISOString(),
  applicants: 10 + i * 3, matchScore: 70 + i, skills: ['react', 'typescript'],
  status: 'active' as const, saved: false, source: 'internal' as const,
}));

export function useJobsBrowseSearch(filters: JobBrowseFilters) {
  const qc = useQueryClient();
  const key = ['jobs-browse', 'search', filters];
  const q = useQuery({
    queryKey: key,
    queryFn: () => client.search(filters).catch(() => ({
      results: FALLBACK_RESULTS, total: FALLBACK_RESULTS.length,
      page: filters.page ?? 1, pageSize: filters.pageSize ?? 20,
      facets: null, rankingMode: 'fallback' as const, generatedAt: new Date().toISOString(),
    })),
    staleTime: 30_000,
  });
  useRealtimeEvent('jobs-browse.bookmark.toggled', () => qc.invalidateQueries({ queryKey: ['jobs-browse'] }));
  useRealtimeEvent('jobs-browse.saved-search.upserted', () => qc.invalidateQueries({ queryKey: ['jobs-browse', 'saved'] }));
  return q;
}

export function useJobsBrowseInsights() {
  return useQuery({
    queryKey: ['jobs-browse', 'insights'],
    queryFn: () => client.insights().catch(() => ({
      totalActive: 1240, newToday: 86, remoteShare: 51, avgSalary: 92_500,
      hotSkills: ['react', 'typescript', 'python'], anomalyNote: null,
      generatedAt: new Date().toISOString(), mode: 'fallback',
    })),
    staleTime: 60_000,
  });
}

export function useSavedSearches() {
  return useQuery({ queryKey: ['jobs-browse', 'saved'], queryFn: () => client.listSaved().catch(() => []) });
}

export function useUpsertSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: SavedSearch) => client.upsertSaved(s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs-browse', 'saved'] }),
  });
}
export function useRemoveSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.removeSaved(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs-browse', 'saved'] }),
  });
}
export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => client.toggleBookmark(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs-browse'] }),
  });
}

export function useJobsBrowseRealtime(identityId: string | undefined) {
  useEffect(() => { if (identityId) realtime.connect(identityId); }, [identityId]);
}
